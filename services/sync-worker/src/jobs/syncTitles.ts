import "dotenv/config";
import { prisma, TitleType } from "@cineroulette/db";
import { computeBaseScore } from "@cineroulette/scoring";
import { tmdb, TmdbMovie } from "../clients/tmdb";

/**
 * Build order Step 4 (bulk import) + Step 5 (score computation), combined
 * into one idempotent job per Section 22 engineering standards.
 *
 * Fix (this pass): upsertTitle previously never wrote TitleGenre or
 * TitleLanguage join rows, so genre/language filters were structurally
 * guaranteed to return zero results regardless of catalog size — not a
 * "not enough data" problem, a "the link never existed" problem. Now
 * builds a TMDB genre_id -> our Genre.id map once per run and links both
 * genres and original_language for every synced title.
 */

const PAGES_GLOBAL = Number(process.env.SYNC_PAGES_PER_RUN ?? 5);
const PAGES_PER_LANGUAGE = Number(process.env.SYNC_PAGES_PER_LANGUAGE ?? 3);
const CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? 8);

const LANGUAGES = (process.env.SYNC_LANGUAGES ?? "en,hi,ko,ja,fr,es,de,it,zh,tr,pt,ru")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

async function processInChunks<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    await Promise.all(chunk.map(fn));
  }
}

async function buildGenreIdToOurIdMap(): Promise<Map<number, string>> {
  const { genres: tmdbGenres } = await tmdb.genres("movie");
  const ourGenres = await prisma.genre.findMany({ select: { id: true, name: true } });
  const nameToOurId = new Map(ourGenres.map((g) => [g.name, g.id]));

  const map = new Map<number, string>();
  for (const g of tmdbGenres) {
    const ourId = nameToOurId.get(g.name);
    if (ourId) map.set(g.id, ourId);
  }
  return map;
}

async function upsertTitle(m: TmdbMovie): Promise<string> {
  const releaseYear = m.release_date ? Number(m.release_date.slice(0, 4)) : null;

  const title = await prisma.title.upsert({
    where: { tmdbId: m.id },
    update: {
      title: m.title,
      originalTitle: m.original_title,
      overview: m.overview,
      releaseYear: releaseYear ?? undefined,
      posterPath: m.poster_path,
    },
    create: {
      tmdbId: m.id,
      type: TitleType.MOVIE,
      title: m.title,
      originalTitle: m.original_title,
      overview: m.overview,
      releaseYear: releaseYear ?? undefined,
      posterPath: m.poster_path,
    },
  });

  await prisma.rating.create({
    data: {
      titleId: title.id,
      voteAverage: m.vote_average,
      voteCount: m.vote_count,
      popularity: m.popularity,
    },
  });

  return title.id;
}

async function linkGenres(titleId: string, tmdbGenreIds: number[] | undefined, genreIdMap: Map<number, string>) {
  for (const tmdbGenreId of tmdbGenreIds ?? []) {
    const ourGenreId = genreIdMap.get(tmdbGenreId);
    if (!ourGenreId) continue;
    await prisma.titleGenre.upsert({
      where: { titleId_genreId: { titleId, genreId: ourGenreId } },
      update: {},
      create: { titleId, genreId: ourGenreId },
    });
  }
}

async function linkLanguage(titleId: string, languageCode: string | undefined) {
  if (!languageCode) return;
  // Only link if we actually synced this language code as a reference row —
  // avoids a foreign-key failure on a code TMDB returns that our Language
  // table doesn't have (rare, but possible for obscure codes).
  const exists = await prisma.language.findUnique({ where: { code: languageCode } });
  if (!exists) return;

  await prisma.titleLanguage.upsert({
    where: { titleId_languageCode: { titleId, languageCode } },
    update: { isOriginal: true },
    create: { titleId, languageCode, isOriginal: true },
  });
}

async function syncWatchProvidersForTitle(titleId: string, tmdbId: number) {
  try {
    const { results } = await tmdb.watchProviders(tmdbId);
    await prisma.watchProvider.deleteMany({ where: { titleId } });

    for (const region of ["US", "IN"]) {
      const regionData = results[region];
      if (!regionData) continue;

      const categories: { list: { provider_name: string }[] | undefined; type: string }[] = [
        { list: regionData.flatrate, type: "subscription" },
        { list: regionData.rent, type: "rent" },
        { list: regionData.buy, type: "buy" },
      ];

      for (const { list, type } of categories) {
        for (const provider of list ?? []) {
          await prisma.watchProvider.create({
            data: { titleId, providerName: provider.provider_name, region, link: regionData.link, type },
          });
        }
      }
    }
  } catch {
    // Non-fatal — a title without watch-provider data just shows no links.
  }
}

export async function syncTitles() {
  const byId = new Map<number, TmdbMovie>();

  for (let page = 1; page <= PAGES_GLOBAL; page++) {
    const { results } = await tmdb.discoverMovies(page);
    for (const m of results) byId.set(m.id, m);
  }

  for (const lang of LANGUAGES) {
    for (let page = 1; page <= PAGES_PER_LANGUAGE; page++) {
      try {
        const { results } = await tmdb.discoverMovies(page, lang);
        for (const m of results) byId.set(m.id, m);
      } catch (err) {
        console.error(`Skipping language=${lang} page=${page}:`, err);
      }
    }
  }

  const batch = Array.from(byId.values());

  const groups = new Map<string, TmdbMovie[]>();
  for (const m of batch) {
    const key = m.original_language || "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const popNormByTmdbId = new Map<number, number>();
  for (const group of groups.values()) {
    const pops = group.map((m) => m.popularity);
    const min = Math.min(...pops);
    const max = Math.max(...pops);
    for (const m of group) {
      popNormByTmdbId.set(m.id, normalize(m.popularity, min, max));
    }
  }

  const genreIdMap = await buildGenreIdToOurIdMap();
  let upserted = 0;

  await processInChunks(batch, CONCURRENCY, async (m) => {
    if (m.vote_count < 5) return;

    const titleId = await upsertTitle(m);
    await linkGenres(titleId, m.genre_ids, genreIdMap);
    await linkLanguage(titleId, m.original_language);
    await syncWatchProvidersForTitle(titleId, m.id);

    const base = computeBaseScore({
      popularityNorm: popNormByTmdbId.get(m.id) ?? 0.5,
      ratingNorm: m.vote_average / 10,
      criticNorm: null,
      recencyTrendNorm: 0.5,
      awardsBoost: 0,
      moodMatch: 0,
      languageRelevance: 1,
      streamingAvailable: 0,
    });

    await prisma.recommendationScore.upsert({
      where: { titleId_region: { titleId, region: "GLOBAL" } },
      update: { computedScore: base.score, componentsJson: base.components },
      create: { titleId, region: "GLOBAL", computedScore: base.score, componentsJson: base.components },
    });

    upserted++;
  });

  await prisma.syncLog.create({
    data: { source: "tmdb", titlesUpserted: upserted, status: "success" },
  });

  console.log(
    `Synced ${upserted} titles across ${groups.size} languages (${batch.length} candidates fetched)`
  );
}

if (require.main === module) {
  syncTitles()
    .catch(async (err) => {
      console.error(err);
      await prisma.syncLog.create({
        data: { source: "tmdb", titlesUpserted: 0, status: "failed", error: String(err) },
      });
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}