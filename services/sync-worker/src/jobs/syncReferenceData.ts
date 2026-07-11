import "dotenv/config";
import { prisma } from "@cineroulette/db";
import { tmdb } from "../clients/tmdb";

/**
 * Build order Step 3 — Genres/Languages/Moods reference sync.
 * Moods are NOT sourced from TMDB (no such concept there) — see the open
 * question in Section 28 ("which mood tags via TMDB keywords vs a
 * supplemental tagging pass"). For now this seeds a small, curated starter
 * set from Section 06 Tier 1, to be expanded once the tagging pass exists.
 */

const STARTER_MOODS = [
  "feel-good",
  "funny",
  "emotional",
  "romantic",
  "exciting",
  "scary",
  "mind-bending",
  "relaxing",
  "heartwarming",
  "dark",
];

export async function syncGenres() {
  const { genres: movieGenres } = await tmdb.genres("movie");
  const { genres: tvGenres } = await tmdb.genres("tv");
  const merged = new Map<string, string>();
  for (const g of [...movieGenres, ...tvGenres]) merged.set(g.name, g.name);

  for (const name of merged.keys()) {
    await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Synced ${merged.size} genres`);
}

export async function syncLanguages() {
  const languages = await tmdb.languages();
  for (const l of languages) {
    await prisma.language.upsert({
      where: { code: l.iso_639_1 },
      update: { name: l.english_name },
      create: { code: l.iso_639_1, name: l.english_name },
    });
  }
  console.log(`Synced ${languages.length} languages`);
}

export function starterMoodTags(): string[] {
  return STARTER_MOODS;
}

async function main() {
  await syncGenres();
  await syncLanguages();
  await prisma.syncLog.create({
    data: { source: "tmdb", titlesUpserted: 0, status: "success" },
  });
}

if (require.main === module) {
  main()
    .catch(async (err) => {
      console.error(err);
      await prisma.syncLog.create({
        data: { source: "tmdb", titlesUpserted: 0, status: "failed", error: String(err) },
      });
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
