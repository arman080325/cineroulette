import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@cineroulette/db";
import { weightedRandomPick, explainScore } from "@cineroulette/scoring";
import { getRecentlyShown, pushRecentlyShown, getCachedCandidates, setCachedCandidates } from "@/lib/redis";
import { trackServerEvent } from "@/lib/analytics-server";

interface SpinRequestBody {
  type?: "MOVIE" | "TV_SERIES" | "MINI_SERIES" | "ANIME" | "DOCUMENTARY" | "SHORT_FILM";
  genre?: string[];
  language?: string;
  mood?: string;
  minRating?: number;
  runtime?: "short" | "medium" | "long" | string;
  era?: "classic" | "80s-90s" | "2000s" | "recent" | string;
  provider?: string;
  exclude?: string[];
  sessionId?: string;
  region?: string;
}

interface CandidateForPick {
  score: number;
  componentsJson: unknown;
  moodWeight: number;
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
    moods: { moodTag: string; weight: number }[];
  };
}

const FALLBACK_TITLES = [
  {
    id: "fb-parasite",
    title: "Parasite",
    releaseYear: 2019,
    runtimeMinutes: 132,
    overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
    posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    voteAverage: 8.5,
    genres: ["Drama", "Thriller", "Comedy"],
    watchProviders: [{ name: "Max", type: "flatrate", link: "https://www.max.com" }],
    explanation: "Picked for strong critical acclaim and audience rating.",
  },
  {
    id: "fb-inception",
    title: "Inception",
    releaseYear: 2010,
    runtimeMinutes: 148,
    overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible: inception.",
    posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    voteAverage: 8.4,
    genres: ["Action", "Science Fiction", "Adventure"],
    watchProviders: [{ name: "Netflix", type: "flatrate", link: "https://www.netflix.com" }],
    explanation: "Picked for strong mind-bending concept and critical acclaim.",
  },
  {
    id: "fb-spirited-away",
    title: "Spirited Away",
    releaseYear: 2001,
    runtimeMinutes: 125,
    overview: "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.",
    posterPath: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    voteAverage: 8.5,
    genres: ["Animation", "Family", "Fantasy"],
    watchProviders: [{ name: "Max", type: "flatrate", link: "https://www.max.com" }],
    explanation: "Picked for strong feel-good mood match and awards pedigree.",
  },
  {
    id: "fb-eeaao",
    title: "Everything Everywhere All at Once",
    releaseYear: 2022,
    runtimeMinutes: 139,
    overview: "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save what's important to her by connecting with the lives she could have led in other universes.",
    posterPath: "/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg",
    voteAverage: 8.0,
    genres: ["Action", "Adventure", "Science Fiction"],
    watchProviders: [{ name: "Amazon Prime Video", type: "flatrate", link: "https://www.amazon.com" }],
    explanation: "Picked for awards pedigree and high current buzz.",
  },
  {
    id: "fb-interstellar",
    title: "Interstellar",
    releaseYear: 2014,
    runtimeMinutes: 169,
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    voteAverage: 8.4,
    genres: ["Adventure", "Drama", "Science Fiction"],
    watchProviders: [{ name: "Amazon Prime Video", type: "flatrate", link: "https://www.amazon.com" }],
    explanation: "Picked for emotional depth and mind-bending journey.",
  },
  {
    id: "fb-whiplash",
    title: "Whiplash",
    releaseYear: 2014,
    runtimeMinutes: 107,
    overview: "Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.",
    posterPath: "/6uSpfdNuRsgbkyRBkP366i9tF9p.jpg",
    voteAverage: 8.4,
    genres: ["Drama", "Music"],
    watchProviders: [{ name: "Netflix", type: "flatrate", link: "https://www.netflix.com" }],
    explanation: "Picked for intense excitement and critical acclaim.",
  },
  {
    id: "fb-lalaland",
    title: "La La Land",
    releaseYear: 2016,
    runtimeMinutes: 128,
    overview: "Mia, an aspiring actress, and Sebastian, a dedicated jazz musician, are struggling to make ends meet in a city known for crushing hopes and breaking hearts.",
    posterPath: "/uDO8zWDhfWwoFdKS4fzkVJt0Rf0.jpg",
    voteAverage: 7.9,
    genres: ["Comedy", "Drama", "Romance"],
    watchProviders: [{ name: "Netflix", type: "flatrate", link: "https://www.netflix.com" }],
    explanation: "Picked for romantic mood match and awards pedigree.",
  },
];

const CANDIDATE_POOL_SIZE = 200;

function buildComboKey(body: SpinRequestBody, region: string): string {
  return JSON.stringify({
    region,
    type: body.type ?? null,
    genre: body.genre?.slice().sort() ?? null,
    language: body.language ?? null,
    mood: body.mood ?? null,
    minRating: body.minRating ?? null,
    runtime: body.runtime ?? null,
    era: body.era ?? null,
    provider: body.provider ?? null,
  });
}

function getRuntimeFilter(runtime?: string): Prisma.IntNullableFilter | undefined {
  if (runtime === "short") return { lte: 90, not: null };
  if (runtime === "medium") return { gte: 90, lte: 125, not: null };
  if (runtime === "long") return { gte: 120, not: null };
  return undefined;
}

function getEraFilter(era?: string): Prisma.IntNullableFilter | undefined {
  if (era === "classic") return { lt: 1980, not: null };
  if (era === "80s-90s") return { gte: 1980, lte: 1999, not: null };
  if (era === "2000s") return { gte: 2000, lte: 2019, not: null };
  if (era === "recent") return { gte: 2020, not: null };
  return undefined;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SpinRequestBody;
  const region = body.region ?? "GLOBAL";
  const comboKey = buildComboKey(body, region);

  try {
    let candidates: CandidateForPick[] | null = await getCachedCandidates<CandidateForPick[]>(comboKey);

    if (!candidates) {
      const runtimeFilter = getRuntimeFilter(body.runtime);
      const eraFilter = getEraFilter(body.era);

      const rows = await prisma.recommendationScore.findMany({
        where: {
          region,
          title: {
            type: body.type ?? undefined,
            genres: body.genre?.length ? { some: { genre: { name: { in: body.genre } } } } : undefined,
            languages: body.language ? { some: { languageCode: body.language } } : undefined,
            ratings: body.minRating ? { some: { voteAverage: { gte: body.minRating } } } : undefined,
            moods: body.mood ? { some: { moodTag: body.mood } } : undefined,
            runtimeMinutes: runtimeFilter,
            releaseYear: eraFilter,
            watchProviders: body.provider
              ? { some: { providerName: { contains: body.provider, mode: "insensitive" } } }
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
              moods: true,
            },
          },
        },
      });

      if (rows.length > 0) {
        candidates = rows.map((r) => {
          const moodWeight = body.mood ? (r.title.moods.find((m) => m.moodTag === body.mood)?.weight ?? 0) : 0;
          return {
            score: r.computedScore,
            componentsJson: r.componentsJson,
            moodWeight,
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
              moods: r.title.moods,
            },
          };
        });

        await setCachedCandidates(comboKey, candidates);
      }
    }

    if (candidates && candidates.length > 0) {
      const recentlyShownIds = await getRecentlyShown(body.sessionId ?? "");
      const available = candidates.filter((c) => !recentlyShownIds.includes(c.title.id));
      const pool = available.length > 0 ? available : candidates;

      const picked = weightedRandomPick(
        pool.map((c) => ({ score: c.score * (1 + c.moodWeight), ref: c }))
      ).ref;
      const latestRating = picked.title.ratings[0];

      if (body.sessionId) {
        await pushRecentlyShown(body.sessionId, picked.title.id);
        try {
          await prisma.userInteraction.create({
            data: { titleId: picked.title.id, action: "SHOWN", sessionId: body.sessionId },
          });
        } catch {
          // Non-critical
        }
      }

      await trackServerEvent(body.sessionId ?? "anonymous", "spin_completed", {
        titleId: picked.title.id,
        candidatePoolSize: pool.length,
      });

      const components = picked.componentsJson as Record<string, number>;
      const explanation =
        body.mood && picked.moodWeight > 0
          ? `Picked for strong mood match and ${
              Object.entries(components).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "overall quality"
            }.`
          : explainScore(components);

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
        scoreExplanation: explanation,
      });
    }
  } catch {
    // Database connection or table unavailable - use fallback catalog
  }

  // Graceful fallback from starter titles pool
  const randomFallback = FALLBACK_TITLES[Math.floor(Math.random() * FALLBACK_TITLES.length)] ?? FALLBACK_TITLES[0]!;
  return NextResponse.json({
    title: {
      id: randomFallback.id,
      title: randomFallback.title,
      releaseYear: randomFallback.releaseYear,
      runtimeMinutes: randomFallback.runtimeMinutes,
      overview: randomFallback.overview,
      posterPath: randomFallback.posterPath,
      voteAverage: randomFallback.voteAverage,
      genres: randomFallback.genres,
      watchProviders: randomFallback.watchProviders.map((w) => ({
        name: w.name,
        type: w.type,
        link: w.link,
      })),
    },
    scoreExplanation: randomFallback.explanation,
  });
}