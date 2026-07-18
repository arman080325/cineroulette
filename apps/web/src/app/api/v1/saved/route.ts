export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";

/**
 * GET /api/v1/saved?sessionId=...
 *
 * The write side (POST /interactions) has existed since Step 11, but nothing
 * ever read it back — saving was a black hole from the user's perspective.
 *
 * UserInteraction is an append-only log, so "currently saved" isn't just
 * "has a SAVED row": a title saved and later marked NOT_INTERESTED should
 * drop out. We compare the latest timestamp of each action per title.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return NextResponse.json({ saved: [] });
  }

  const rows = await prisma.userInteraction.findMany({
    where: { sessionId, action: { in: ["SAVED", "NOT_INTERESTED"] } },
    orderBy: { createdAt: "desc" },
    select: { titleId: true, action: true, createdAt: true },
  });

  // First occurrence per titleId wins because rows are already newest-first.
  const latest = new Map<string, "SAVED" | "NOT_INTERESTED">();
  for (const r of rows) {
    if (!latest.has(r.titleId)) {
      latest.set(r.titleId, r.action as "SAVED" | "NOT_INTERESTED");
    }
  }

  const savedIds = [...latest.entries()]
    .filter(([, action]) => action === "SAVED")
    .map(([titleId]) => titleId);

  if (savedIds.length === 0) {
    return NextResponse.json({ saved: [] });
  }

  const titles = await prisma.title.findMany({
    where: { id: { in: savedIds } },
    select: {
      id: true,
      title: true,
      releaseYear: true,
      posterPath: true,
      ratings: { orderBy: { updatedAt: "desc" }, take: 1, select: { voteAverage: true } },
    },
  });

  // Preserve most-recently-saved-first ordering, which the findMany above loses.
  const order = new Map(savedIds.map((id, i) => [id, i]));
  titles.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return NextResponse.json({
    saved: titles.map((t) => ({
      id: t.id,
      title: t.title,
      releaseYear: t.releaseYear,
      posterPath: t.posterPath,
      voteAverage: t.ratings[0]?.voteAverage ?? null,
    })),
  });
}