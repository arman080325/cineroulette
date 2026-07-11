import type { Metadata } from "next";
import { prisma } from "@cineroulette/db";
import { explainScore } from "@cineroulette/scoring";
import { notFound } from "next/navigation";

/**
 * Server-rendered permalinked result page — FR-5, Section 19 SEO requirement.
 * Fetches directly from Prisma (server component, no need to round-trip
 * through our own API route) so this renders fully on the server for
 * crawlers and social-share unfurls.
 */

async function getTitle(id: string) {
  return prisma.title.findUnique({
    where: { id },
    include: {
      genres: { include: { genre: true } },
      ratings: { orderBy: { updatedAt: "desc" }, take: 1 },
      scores: { where: { region: "GLOBAL" }, take: 1 },
      watchProviders: { where: { region: "US" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const title = await getTitle(params.id);

  if (!title) {
    return { title: "Title not found — CineRoulette" };
  }

  const desc =
    title.overview?.slice(0, 155) ?? "Discover it on CineRoulette.";

  const poster = title.posterPath
    ? `https://image.tmdb.org/t/p/w500${title.posterPath}`
    : undefined;

  return {
    title: `${title.title} — CineRoulette`,
    description: desc,
    openGraph: {
      title: `${title.title} (${title.releaseYear ?? ""})`,
      description: desc,
      images: poster ? [poster] : undefined,
    },
  };
}

export default async function TitlePage({
  params,
}: {
  params: { id: string };
}) {
  const title = await getTitle(params.id);

  if (!title) {
    notFound();
  }

  const latestRating = title.ratings[0];
  const score = title.scores[0];

  const explanation = score
    ? explainScore(score.componentsJson as Record<string, number>)
    : null;

  const src = title.posterPath
    ? `https://image.tmdb.org/t/p/w500${title.posterPath}`
    : null;

  return (
    <main className="relative min-h-screen text-white flex flex-col items-center px-4 py-16">
      <div className="hero-spotlight" />

      <div className="relative z-10 max-w-[300px] w-full text-center">
        <div className="rounded-card overflow-hidden border border-neutral-800 shadow-glow">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={title.title}
              className="w-full aspect-[2/3] object-cover"
            />
          ) : (
            <div className="w-full aspect-[2/3] flex items-center justify-center bg-gradient-to-br from-marquee/40 to-neutral-950 p-6">
              <span className="font-display text-4xl">
                {title.title}
              </span>
            </div>
          )}
        </div>

        <div style={{ ["--ticket-bg" as string]: "#0a0605" }}>
          <div className="ticket-divider" />

          <div className="pt-5 px-1">
            <p className="text-xs tracking-[0.3em] text-gold/70 font-body uppercase mb-1">
              Admit One
            </p>

            <h1 className="font-display text-3xl tracking-wide">
              {title.title}
              {title.releaseYear ? ` · ${title.releaseYear}` : ""}
            </h1>

            <div className="flex flex-wrap justify-center gap-1.5 mt-3 font-body text-xs">
              {latestRating?.voteAverage != null && (
                <span className="px-2.5 py-1 rounded-pill border border-gold/40 text-gold">
                  ★ {latestRating.voteAverage.toFixed(1)}
                </span>
              )}

              {title.genres.map((g) => (
                <span
                  key={g.genre.name}
                  className="px-2.5 py-1 rounded-pill border border-neutral-700 text-neutral-300"
                >
                  {g.genre.name}
                </span>
              ))}
            </div>

            {title.overview && (
              <p className="text-neutral-400 mt-4 text-sm leading-relaxed font-body">
                {title.overview}
              </p>
            )}

            {title.watchProviders.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-4 font-body text-xs">
                {Array.from(
                  new Set(title.watchProviders.map((w) => w.providerName))
                )
                  .slice(0, 4)
                  .map((name) => {
                    const provider = title.watchProviders.find(
                      (w) => w.providerName === name
                    )!;

                    return (
                      <a
                        key={name}
                        href={provider.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-pill border border-neutral-700 text-neutral-300 hover:border-gold/60 hover:text-gold transition"
                      >
                        ▶ {name}
                      </a>
                    );
                  })}
              </div>
            )}

            {explanation && (
              <p className="text-sm text-gold mt-4 italic font-body">
                {explanation}
              </p>
            )}

            <a
              href="/"
              className="inline-block mt-6 px-5 py-2.5 rounded-2xl bg-marquee font-medium hover:brightness-110 active:scale-95 transition shadow-glow font-body"
            >
              🎬 Spin Your Own
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}