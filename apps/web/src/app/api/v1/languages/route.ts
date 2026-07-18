export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";

/** GET /api/v1/languages — Section 17 reference-list endpoint. */
export async function GET() {
  const languages = await prisma.language.findMany({
    orderBy: { name: "asc" },
    select: { code: true, name: true },
  });
  return NextResponse.json({ languages });
}