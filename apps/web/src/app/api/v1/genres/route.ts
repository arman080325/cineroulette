export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";

/** GET /api/v1/genres — Section 17 reference-list endpoint, cacheable at the CDN edge with a long TTL. */
export async function GET() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return NextResponse.json({ genres: genres.map((g) => g.name) });
}