export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";

const DEFAULT_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western",
];

export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    });
    if (genres && genres.length > 0) {
      return NextResponse.json({ genres: genres.map((g) => g.name) });
    }
  } catch {
    // Database connection or table unavailable
  }
  return NextResponse.json({ genres: DEFAULT_GENRES });
}