import "dotenv/config";
import { prisma, TitleType } from "@cineroulette/db";
import { computeBaseScore } from "@cineroulette/scoring";
import { tmdb, TmdbMovie } from "../clients/tmdb";
import { getCriticScore } from "../clients/omdb";

/**
 * Build order Step 4 (bulk import) + Step 5 (score computation), combined
 * into one idempotent job per Section 22 engineering standards.
 *
 * This pass adds:
 * - OMDb critic scores (Section 14 supplemental source), capped per run
 *   to respect OMDb's free-tier 1,000 req/day quota.
 * - FR-6: a region-relative quality floor. Computed as the 10th
 *   percentile of voteAverage WITHIN each original_language group, not a
 *   single global number — Section 07 is explicit that a global threshold
 *   would bury smaller-catalog industries under Hollywood's volume.
 *   Titles below their own group's floor have their RecommendationScore
 *   row explicitly deleted, so a title that regresses on a later sync
 *   stops being selectable rather than lingering with a stale score.
 */

const PAGES_GLOBAL = Number(process.env.SYNC_PAGES_PER_RUN ?? 5);
const PAGES_PER_LANGUAGE = Number(process.env.SYNC_PAGES_PER_LANGUAGE ?? 3);
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

/** Fetches a critic score via TMDB external_ids -> OMDb, respecting the per-run cap. */
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

  // Group by original language for both popularity normalization AND the
  // FR-6 quality floor — both need to be computed relative to each
  // language's own distribution, never a single global number.
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
  let upserted = 0;
  let excludedByFloor = 0;

  await processInChunks(batch, CONCURRENCY, async (m) => {
    const lang = m.original_language || "unknown";
    const floor = qualityFloorByLanguage.get(lang) ?? 0;

    const titleId = await upsertTitle(m);
    await linkGenres(titleId, m.genre_ids, genreIdMap);
    await linkLanguage(titleId, m.original_language);
    await syncWatchProvidersForTitle(titleId, m.id);

    // FR-6: below this title's own language-group floor -> not selectable.
    // Title/Rating rows still get written above (so it exists in the
    // catalog for future re-evaluation), but no RecommendationScore means
    // /spin's query can never surface it.
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