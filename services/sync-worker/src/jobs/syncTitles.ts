import "dotenv/config";
import { prisma, TitleType } from "@cineroulette/db";
import { computeBaseScore } from "@cineroulette/scoring";
import { tmdb, TmdbMovie } from "../clients/tmdb";

/**
 * Build order Step 4 (bulk import) + Step 5 (score computation), combined
 * into one idempotent job per Section 22 engineering standards.
 *
 * NOTE on region-relative normalization (Section 07 "Why relative to
 * region matters"): a real implementation needs per-language/region
 * vote-count and popularity distributions computed BEFORE this loop, then
 * used to normalize each title against its own region's floor/ceiling
 * rather than the global max. That aggregation step is a TODO — this file
 * currently does a simple global min-max normalization per sync batch as
 * the honest starting point, flagged so it isn't mistaken for the final
 * algorithm.
 */

const PAGES_PER_RUN = Number(process.env.SYNC_PAGES_PER_RUN ?? 5);

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
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

export async function syncTitles() {
  let upserted = 0;
  const batch: TmdbMovie[] = [];

  for (let page = 1; page <= PAGES_PER_RUN; page++) {
    const { results } = await tmdb.discoverMovies(page);
    batch.push(...results);
  }

  const popularities = batch.map((m) => m.popularity);
  const ratings = batch.map((m) => m.vote_average / 10); // TMDB is 0-10
  const minPop = Math.min(...popularities);
  const maxPop = Math.max(...popularities);

  for (const m of batch) {
    const titleId = await upsertTitle(m);

    const base = computeBaseScore({
      popularityNorm: normalize(m.popularity, minPop, maxPop),
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
      create: {
        titleId,
        region: "GLOBAL",
        computedScore: base.score,
        componentsJson: base.components,
      },
    });

    upserted++;
  }

  await prisma.syncLog.create({
    data: { source: "tmdb", titlesUpserted: upserted, status: "success" },
  });

  console.log(`Synced ${upserted} titles across ${PAGES_PER_RUN} pages`);
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
