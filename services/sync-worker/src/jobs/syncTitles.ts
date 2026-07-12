import "dotenv/config";
import { prisma, TitleType } from "@cineroulette/db";
import { computeBaseScore } from "@cineroulette/scoring";
import { tmdb, TmdbMovie } from "../clients/tmdb";

/**
 * Build order Step 4 (bulk import) + Step 5 (score computation), combined
 * into one idempotent job per Section 22 engineering standards.
 *
 * Broadened per production-readiness pass: pulls per-language, not just
 * global popularity, so smaller industries (Korean, Nollywood, regional
 * Indian, etc.) actually get synced instead of buried under Hollywood's
 * raw volume — Section 07's core differentiator, not a nice-to-have.
 *
 * Region-relative score normalization (the TODO flagged since the first
 * version of this file) is now implemented: popularity is normalized
 * within each title's own original_language group, not against one global
 * min/max. It's still a simplification — Section 07 describes normalizing
 * against a full region's rating/vote-count distribution, and this only
 * groups by language, not a proper geographic region — but it's the real
 * mechanism now, not a placeholder.
 */

const PAGES_GLOBAL = Number(process.env.SYNC_PAGES_PER_RUN ?? 5);
const PAGES_PER_LANGUAGE = Number(process.env.SYNC_PAGES_PER_LANGUAGE ?? 3);
const CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? 8);

// A deliberately curated "truly global" spread (Section 01 core value),
// not just whatever TMDB happens to have the most of. Configurable via env
// so this can grow without another code change.
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

  // Global trending pass — catches whatever's broadly popular right now,
  // regardless of language.
  for (let page = 1; page <= PAGES_GLOBAL; page++) {
    const { results } = await tmdb.discoverMovies(page);
    for (const m of results) byId.set(m.id, m);
  }

  // Per-language passes — guarantees every configured industry actually
  // gets synced, rather than only whatever floats to the top of a single
  // global popularity sort (which skews English-language by default).
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

  // Region-relative normalization: group by each title's own
  // original_language, compute min/max popularity within that group only.
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

  let upserted = 0;

  await processInChunks(batch, CONCURRENCY, async (m) => {
    // Basic sanity filter, not yet the full per-region quality floor FR-6
    // describes — that needs a proper vote-count distribution per
    // language, still a TODO. This just drops near-zero-engagement noise.
    if (m.vote_count < 5) return;

    const titleId = await upsertTitle(m);
    await syncWatchProvidersForTitle(titleId, m.id);

    const base = computeBaseScore({
      popularityNorm: popNormByTmdbId.get(m.id) ?? 0.5,
      ratingNorm: m.vote_average / 10,
      criticNorm: null,
      recencyTrendNorm: 0.5, // TODO: derive from popularity delta across syncs
      awardsBoost: 0, // TODO: Wikidata supplemental source, Section 14
      moodMatch: 0, // no user context at sync time; computed at selection time
      languageRelevance: 1, // no user context at sync time
      streamingAvailable: 0, // TODO: JustWatch supplemental source
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