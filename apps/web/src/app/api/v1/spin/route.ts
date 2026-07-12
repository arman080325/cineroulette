import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";
import { weightedRandomPick, explainScore } from "@cineroulette/scoring";
import { getRecentlyShown, pushRecentlyShown, getCachedCandidates, setCachedCandidates } from "@/lib/redis";

/**
 * POST /api/v1/spin — Section 17 API design, FR-2/FR-4/FR-6.
 *
 * Section 19 Redis usage, two distinct caches:
 * 1. Per-session "recently shown" list — was a Postgres query on every
 *    spin; now a fast Redis list, since it's ephemeral session state, not
 *    something that needs to live in the durable catalog DB.
 * 2. Hot filter-combo cache — identical filter combos within a short TTL
 *    skip the Prisma query entirely. Scores only change at sync time
 *    (Section 07), so this is safe to cache briefly without going stale
 *    in a way that matters.
 */

interface SpinRequestBody {
  type?: "MOVIE" | "TV_SERIES" | "MINI_SERIES" | "ANIME" | "DOCUMENTARY" | "SHORT_FILM";
  genre?: string[];
  language?: string;
  minRating?: number;
  exclude?: string[];
  sessionId?: string;
  region?: string;
}

interface CandidateForPick {
  score: number;
  componentsJson: unknown;
  title: {
    id: string;
    title: string;
    releaseYear: number | null;
    runtimeMinutes: number | null;
    overview: string | null;
    posterPath: string | null;
    genres: { genre: { name: string } }[];
    ratings: { voteAverage: number | null }[];
    watchProviders: { providerName: string; type: string; link: string }[];
  };
}

const CANDIDATE_POOL_SIZE = 200;

function buildComboKey(body: SpinRequestBody, region: string): string {
  // Deliberately excludes sessionId — the combo cache is shared across all
  // users with the same filters, only the recently-shown exclusion is per-user.
  return JSON.stringify({
    region,
    type: body.type ?? null,
    genre: body.genre?.slice().sort() ?? null,
    language: body.language ?? null,
    minRating: body.minRating ?? null,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SpinRequestBody;
  const region = body.region ?? "GLOBAL";
  const comboKey = buildComboKey(body, region);

  let candidates: CandidateForPick[] | null = await getCachedCandidates<CandidateForPick[]>(comboKey);

  if (!candidates) {
    const rows = await prisma.recommendationScore.findMany({
      where: {
        region,
        title: {
          type: body.type ?? undefined,
          genres: body.genre?.length ? { some: { genre: { name: { in: body.genre } } } } : undefined,
          languages: body.language ? { some: { languageCode: body.language } } : undefined,
          ratings: body.minRating ? { some: { voteAverage: { gte: body.minRating } } } : undefined,
        },
      },
      orderBy: { computedScore: "desc" },
      take: CANDIDATE_POOL_SIZE,
      include: {
        title: {
          include: {
            genres: { include: { genre: true } },
            ratings: { orderBy: { updatedAt: "desc" }, take: 1 },
            watchProviders: { where: { region: "US" } },
          },
        },
      },
    });

    candidates = rows.map((r) => ({
      score: r.computedScore,
      componentsJson: r.componentsJson,
      title: {
        id: r.title.id,
        title: r.title.title,
        releaseYear: r.title.releaseYear,
        runtimeMinutes: r.title.runtimeMinutes,
        overview: r.title.overview,
        posterPath: r.title.posterPath,
        genres: r.title.genres,
        ratings: r.title.ratings,
        watchProviders: r.title.watchProviders,
      },
    }));

    await setCachedCandidates(comboKey, candidates);
  }

  const recentlyShownIds = await getRecentlyShown(body.sessionId ?? "");
  const available = candidates.filter((c) => !recentlyShownIds.includes(c.title.id));
  const pool = available.length > 0 ? available : candidates; // if everything's been shown, allow repeats rather than dead-end

  if (pool.length === 0) {
    return NextResponse.json(
      { error: null, result: null, message: "No titles match these filters yet." },
      { status: 200 }
    );
  }

  const picked = weightedRandomPick(pool.map((c) => ({ score: c.score, ref: c }))).ref;
  const latestRating = picked.title.ratings[0];

  if (body.sessionId) {
    await pushRecentlyShown(body.sessionId, picked.title.id);
    await prisma.userInteraction.create({
      data: { titleId: picked.title.id, action: "SHOWN", sessionId: body.sessionId },
    });
  }

  return NextResponse.json({
    title: {
      id: picked.title.id,
      title: picked.title.title,
      releaseYear: picked.title.releaseYear,
      runtimeMinutes: picked.title.runtimeMinutes,
      overview: picked.title.overview,
      posterPath: picked.title.posterPath,
      voteAverage: latestRating?.voteAverage ?? null,
      genres: picked.title.genres.map((g) => g.genre.name).slice(0, 3),
      watchProviders: picked.title.watchProviders.map((w) => ({
        name: w.providerName,
        type: w.type,
        link: w.link,
      })),
    },
    scoreExplanation: explainScore(picked.componentsJson as Record<string, number>),
  });
}