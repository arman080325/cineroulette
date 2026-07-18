export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";

/** GET /api/v1/featured — top-scored posters for the idle-screen background wall. Decorative only, not a real filter endpoint. */
export async function GET() {
  const rows = await prisma.recommendationScore.findMany({
    where: { region: "GLOBAL" },
    orderBy: { computedScore: "desc" },
    take: 24,
    include: { title: { select: { posterPath: true } } },
  });

  const posters = rows.map((r) => r.title.posterPath).filter((p): p is string => Boolean(p));
  return NextResponse.json({ posters });
}