export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";

const DEFAULT_POSTERS = [
  "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  "/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
  "/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg",
  "/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg",
  "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
  "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
  "/8UlWqwvgutMr9Z6830U6W4j8Fae.jpg",
];

export async function GET() {
  try {
    const rows = await prisma.recommendationScore.findMany({
      where: { region: "GLOBAL" },
      orderBy: { computedScore: "desc" },
      take: 24,
      include: { title: { select: { posterPath: true } } },
    });

    const posters = rows.map((r) => r.title.posterPath).filter((p): p is string => Boolean(p));
    if (posters.length > 0) {
      return NextResponse.json({ posters });
    }
  } catch {
    // Database connection or table unavailable
  }
  return NextResponse.json({ posters: DEFAULT_POSTERS });
}