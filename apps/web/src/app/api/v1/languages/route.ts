export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@cineroulette/db";

const DEFAULT_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ko", name: "Korean" },
  { code: "ja", name: "Japanese" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "zh", name: "Chinese" },
  { code: "tr", name: "Turkish" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
];

export async function GET() {
  try {
    const languages = await prisma.language.findMany({
      orderBy: { name: "asc" },
      select: { code: true, name: true },
    });
    if (languages && languages.length > 0) {
      return NextResponse.json({ languages });
    }
  } catch {
    // Database connection or table unavailable
  }
  return NextResponse.json({ languages: DEFAULT_LANGUAGES });
}