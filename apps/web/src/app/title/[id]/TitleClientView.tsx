"use client";

import { useState } from "react";
import { TrailerModal } from "@/components/TrailerModal";
import { useToastStore } from "@/lib/toast-store";
import { getSessionId } from "@/lib/session";
import { MoviePoster } from "@/components/MoviePoster";

interface TitleClientViewProps {
  title: {
    id: string;
    title: string;
    releaseYear: number | null;
    overview: string | null;
    posterPath: string | null;
    voteAverage: number | null;
    genres: string[];
    watchProviders: { name: string; link: string }[];
    explanation: string | null;
  };
}

export function TitleClientView({ title }: TitleClientViewProps) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const { showToast } = useToastStore();

  const src = title.posterPath
    ? `https://image.tmdb.org/t/p/w500${title.posterPath}`
    : null;

  async function handleCopyLink() {
    const url = window.location.href;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard! 🎟️", { type: "success", icon: "📋" });
      }
    } catch {
      showToast("Link copied to clipboard! 🎟️", { type: "success" });
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title.title} — CineRoulette`,
          text: `Check out ${title.title} on CineRoulette!`,
          url,
        });
      } catch {
        // Cancelled
      }
    } else {
      await handleCopyLink();
    }
  }

  async function handleSave() {
    setSaved(true);
    showToast("Added to your saved watchlist! ♥", { type: "success", icon: "♥" });
    try {
      await fetch("/api/v1/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleId: title.id,
          action: "SAVED",
          sessionId: getSessionId(),
        }),
      });
    } catch {
      // Non-critical
    }
  }

  const providers = Array.from(new Set(title.watchProviders.map((w) => w.name))).slice(0, 4);

  return (
    <>
      <div className="relative z-10 max-w-[340px] w-full text-center">
        {/* Poster */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-card border border-brass/30 bg-ink shadow-glow">
          <MoviePoster
            title={title.title}
            posterPath={title.posterPath}
            priority
          />
        </div>

        {/* Admit One Stub */}
        <div style={{ ["--ticket-bg" as string]: "#080a14" }}>
          <div className="ticket-divider" />

          <div className="pt-5 px-1">
            <p className="font-data text-[10px] uppercase tracking-[0.35em] text-gold/80 mb-1">
              Admit One
            </p>

            <h1 className="font-display text-3xl tracking-wide text-white">
              {title.title}
              {title.releaseYear ? ` · ${title.releaseYear}` : ""}
            </h1>

            <div className="flex flex-wrap justify-center gap-1.5 mt-3 font-data text-[11px]">
              {title.voteAverage != null && (
                <span className="px-2.5 py-1 rounded-pill border border-gold/40 bg-gold/10 text-gold font-medium">
                  ★ {title.voteAverage.toFixed(1)}
                </span>
              )}

              {title.genres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-pill border border-brass/40 bg-velvet/60 text-ash"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Trailer Action */}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="inline-flex items-center gap-2 rounded-pill border border-gold/40 bg-gold/10 px-4 py-1.5 font-body text-xs font-medium text-gold transition duration-200 hover:border-gold hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <span aria-hidden="true">▶</span> Watch Trailer
              </button>
            </div>

            {title.overview && (
              <p className="mt-4 font-body text-sm leading-relaxed text-smoke">{title.overview}</p>
            )}

            {providers.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 font-data text-[10px] uppercase tracking-widest text-brass">
                  Where to watch
                </p>
                <div className="flex flex-wrap justify-center gap-2 font-body text-xs">
                  {providers.map((name) => {
                    const provider = title.watchProviders.find((w) => w.name === name)!;
                    return (
                      <a
                        key={name}
                        href={provider.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Watch on ${name}, opens in new tab`}
                        className="rounded-pill border border-brass/50 bg-velvet/60 px-3 py-1.5 text-smoke transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                      >
                        ▶ {name}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {title.explanation && (
              <p className="mt-4 font-body text-sm italic text-gold/90">{title.explanation}</p>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-2.5 font-body text-sm">
              <button
                type="button"
                onClick={handleSave}
                disabled={saved}
                className={`min-h-[44px] rounded-2xl border px-5 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  saved
                    ? "border-gold bg-gold/15 text-gold font-medium"
                    : "border-brass/50 text-smoke hover:border-gold/60 hover:text-gold"
                }`}
              >
                {saved ? "♥ Saved" : "♡ Save"}
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="min-h-[44px] rounded-2xl border border-brass/50 px-4 py-2.5 text-smoke transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                📋 Copy Link
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="min-h-[44px] rounded-2xl border border-brass/50 px-4 py-2.5 text-smoke transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                ↗ Share
              </button>

              <a
                href="/"
                className="min-h-[44px] inline-flex items-center rounded-2xl bg-marquee px-5 py-2.5 font-medium text-white shadow-glow transition hover:brightness-110 active:scale-95"
              >
                🎬 Spin Your Own
              </a>
            </div>
          </div>
        </div>
      </div>

      <TrailerModal
        titleId={title.id}
        movieTitle={title.title}
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
      />
    </>
  );
}
