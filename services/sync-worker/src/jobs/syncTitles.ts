import "dotenv/config";
import { prisma, TitleType } from "@cineroulette/db";
import { computeBaseScore } from "@cineroulette/scoring";
import { tmdb, TmdbMovie } from "../clients/tmdb";
import { getCriticScore } from "../clients/omdb";
import { computeMoodWeights } from "../lib/mood-mapping";

const PAGES_GLOBAL = Number(process.env.SYNC_PAGES_PER_RUN ?? 5);
const PAGES_PER_LANGUAGE = Number(process.env.SYNC_PAGES_PER_LANGUAGE ?? 3);
const PAGES_POPULAR = Number(process.env.SYNC_PAGES_POPULAR ?? 5);
const CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? 8);
const OMDB_ENABLED = process.env.OMDB_API_KEY ? true : false;
const OMDB_MAX_LOOKUPS_PER_RUN = Number(process.env.OMDB_MAX_LOOKUPS_PER_RUN ?? 300);
const QUALITY_FLOOR_PERCENTILE = Number(process.env.QUALITY_FLOOR_PERCENTILE ?? 0.1);

const LANGUAGES = (process.env.SYNC_LANGUAGES ?? "en,hi,ko,ja,fr,es,de,it,zh,tr,pt,ru")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

let omdbLookupsUsed = 0;

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor(p * (sorted.length - 1));
  return sorted[idx];
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
  const exists = await prisma.language.findUnique({ where: { code: languageCode } });
  if (!exists) return;

  await prisma.titleLanguage.upsert({
    where: { titleId_languageCode: { titleId, languageCode } },
    update: { isOriginal: true },
    create: { titleId, languageCode, isOriginal: true },
  });
}

/** Section 28 mood tagging: genre + TMDB keyword heuristic (see mood-mapping.ts). */
async function linkMoods(titleId: string, tmdbId: number, genreNames: string[]) {
  try {
    const { keywords } = await tmdb.keywords(tmdbId);
    const weights = computeMoodWeights(
      genreNames,
      keywords.map((k) => k.name)
    );

    // Delete-then-recreate, same idempotent pattern as watch providers —
    // a title's mood weights can shift on resync (new keywords, genre
    // corrections), so stale rows shouldn't linger.
    await prisma.titleMood.deleteMany({ where: { titleId } });
    for (const { mood, weight } of weights) {
      await prisma.titleMood.create({ data: { titleId, moodTag: mood, weight } });
    }
  } catch {
    // Non-fatal — a title with no mood tags just won't surface under mood filters.
  }
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

async function fetchCriticScore(tmdbId: number): Promise<number | null> {
  if (!OMDB_ENABLED || omdbLookupsUsed >= OMDB_MAX_LOOKUPS_PER_RUN) return null;
  omdbLookupsUsed++;

  try {
    const { imdb_id } = await tmdb.externalIds(tmdbId);
    if (!imdb_id) return null;
    return await getCriticScore(imdb_id);
  } catch {
    return null;
  }
}

export async function syncTitles() {
const byId = new Map<number, TmdbMovie>();

  for (let page = 1; page <= PAGES_GLOBAL; page++) {
    const { results } = await tmdb.discoverMovies(page);
    for (const m of results) byId.set(m.id, m);
  }

  // TMDB's own "popular" and "trending" lists — different ranking than
  // /discover, and the closest proxy to "titles a search user will
  // actually type." Fixes the "well-known movie missing from search" gap.
  for (let page = 1; page <= PAGES_POPULAR; page++) {
    const { results } = await tmdb.popularMovies(page);
    for (const m of results) byId.set(m.id, m);
  }
  {
    const { results } = await tmdb.trendingMovies();
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

  const batch = Array.from(byId.values()).filter((m) => m.vote_count >= 5);

  const groups = new Map<string, TmdbMovie[]>();
  for (const m of batch) {
    const key = m.original_language || "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const popNormByTmdbId = new Map<number, number>();
  const qualityFloorByLanguage = new Map<string, number>();

  for (const [lang, group] of groups.entries()) {
    const pops = group.map((m) => m.popularity);
    const minPop = Math.min(...pops);
    const maxPop = Math.max(...pops);
    for (const m of group) {
      popNormByTmdbId.set(m.id, normalize(m.popularity, minPop, maxPop));
    }

    const ratings = group.map((m) => m.vote_average).sort((a, b) => a - b);
    qualityFloorByLanguage.set(lang, percentile(ratings, QUALITY_FLOOR_PERCENTILE));
  }

  const genreIdMap = await buildGenreIdToOurIdMap();
  const tmdbGenreIdToName = new Map<number, string>();
  {
    const { genres: tmdbGenres } = await tmdb.genres("movie");
    for (const g of tmdbGenres) tmdbGenreIdToName.set(g.id, g.name);
  }

  let upserted = 0;
  let excludedByFloor = 0;

  await processInChunks(batch, CONCURRENCY, async (m) => {
    const lang = m.original_language || "unknown";
    const floor = qualityFloorByLanguage.get(lang) ?? 0;

    const titleId = await upsertTitle(m);
    await linkGenres(titleId, m.genre_ids, genreIdMap);
    await linkLanguage(titleId, m.original_language);
    await syncWatchProvidersForTitle(titleId, m.id);

    const genreNames = (m.genre_ids ?? [])
      .map((id) => tmdbGenreIdToName.get(id))
      .filter((n): n is string => Boolean(n));
    await linkMoods(titleId, m.id, genreNames);

    if (m.vote_average < floor) {
      excludedByFloor++;
      await prisma.recommendationScore.deleteMany({ where: { titleId, region: "GLOBAL" } });
      return;
    }

    const criticNorm = await fetchCriticScore(m.id);

    const base = computeBaseScore({
      popularityNorm: popNormByTmdbId.get(m.id) ?? 0.5,
      ratingNorm: m.vote_average / 10,
      criticNorm,
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
    `Synced ${upserted} titles across ${groups.size} languages (${batch.length} candidates, ${excludedByFloor} excluded by quality floor, ${omdbLookupsUsed} OMDb lookups used)`
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