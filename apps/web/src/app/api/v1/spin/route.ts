import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";
import { weightedRandomPick, explainScore } from "@cineroulette/scoring";
/**
 * POST /api/v1/spin — Section 17 API design, FR-2/FR-4/FR-6.
 * body: { type?, genre?: string[], language?, minRating?, runtime?, exclude?: string[], collectionSlug?, sessionId? }
 *
 * The public app is read-only (Section 15) — this is a single indexed read
 * against the precomputed RecommendationScore table, then an in-memory
 * weighted draw over the (small, already-filtered) candidate page.
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

const CANDIDATE_POOL_SIZE = 200; // fetch top-N by score within filters, then weighted-draw among them


export async function POST(req: NextRequest) {
  const body = (await req.json()) as SpinRequestBody;
  const region = body.region ?? "GLOBAL";

  // Titles the session has already been shown recently, so Reroll never repeats (FR-4)
  const recentlyShownIds = body.sessionId
    ? (
      await prisma.userInteraction.findMany({
        where: { sessionId: body.sessionId },
        select: { titleId: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    ).map((r) => r.titleId)
    : [];

  const candidates = await prisma.recommendationScore.findMany({
    where: {
      region,
      titleId: { notIn: recentlyShownIds },
      title: {
        type: body.type ?? undefined,
        genres: body.genre?.length ? { some: { genre: { name: { in: body.genre } } } } : undefined,
        languages: body.language ? { some: { languageCode: body.language } } : undefined,
        ratings: body.minRating
          ? { some: { voteAverage: { gte: body.minRating } } }
          : undefined,
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

  if (candidates.length === 0) {
    // FR: a zero-match filter combination returns a clear empty-result response, not an error (Section 17)
    return NextResponse.json(
      { error: null, result: null, message: "No titles match these filters yet." },
      { status: 200 }
    );
  }

  const picked = weightedRandomPick(
    candidates.map((c) => ({ score: c.computedScore, ref: c }))
  ).ref;

  const latestRating = picked.title.ratings[0];

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

