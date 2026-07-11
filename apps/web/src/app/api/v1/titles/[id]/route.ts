import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";
import { explainScore } from "@cineroulette/scoring";

/** GET /api/v1/titles/{id} — Section 17. Full detail for a permalinked result page. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const title = await prisma.title.findUnique({
    where: { id: params.id },
    include: {
      genres: { include: { genre: true } },
      ratings: { orderBy: { updatedAt: "desc" }, take: 1 },
      scores: { where: { region: "GLOBAL" }, take: 1 },
      watchProviders: true,
    },
  });

  if (!title) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "No title with that id." } },
      { status: 404 }
    );
  }

  const latestRating = title.ratings[0];
  const score = title.scores[0];

  return NextResponse.json({
    id: title.id,
    title: title.title,
    releaseYear: title.releaseYear,
    runtimeMinutes: title.runtimeMinutes,
    overview: title.overview,
    posterPath: title.posterPath,
    voteAverage: latestRating?.voteAverage ?? null,
    genres: title.genres.map((g) => g.genre.name),
    watchProviders: title.watchProviders.map((w) => ({
      name: w.providerName,
      link: w.link,
      type: w.type,
    })),
    scoreExplanation: score ? explainScore(score.componentsJson as Record<string, number>) : null,
  });
}