import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";

const RESULT_LIMIT = 15;

/**
 * GET /api/v1/search?q=... — not in the original doc's scope (Section 06
 * never specified search), added as a genuine gap: there was previously
 * no way to find a specific title, only random spins.
 *
 * Two-pass relevance without full-text search infra: titles starting
 * with the query rank first, titles merely containing it fill the rest.
 * Fine for a catalog this size — worth revisiting with a pg_trgm index
 * if the catalog grows into the tens of thousands.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const selectFields = {
    id: true,
    title: true,
    releaseYear: true,
    posterPath: true,
    ratings: { orderBy: { updatedAt: "desc" as const }, take: 1, select: { voteAverage: true } },
  };

  const startsWith = await prisma.title.findMany({
    where: {
      OR: [
        { title: { startsWith: q, mode: "insensitive" } },
        { originalTitle: { startsWith: q, mode: "insensitive" } },
      ],
    },
    take: RESULT_LIMIT,
    select: selectFields,
  });

  let results = startsWith;

  if (results.length < RESULT_LIMIT) {
    const contains = await prisma.title.findMany({
      where: {
        AND: [
          { id: { notIn: results.map((r) => r.id) } },
          {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { originalTitle: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      take: RESULT_LIMIT - results.length,
      select: selectFields,
    });
    results = [...results, ...contains];
  }

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.id,
      title: r.title,
      releaseYear: r.releaseYear,
      posterPath: r.posterPath,
      voteAverage: r.ratings[0]?.voteAverage ?? null,
    })),
  });
}