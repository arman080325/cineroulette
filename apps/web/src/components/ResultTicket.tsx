"use client";

import { useEffect, useRef } from "react";
import type { SpinReelResult } from "./SpinReel";

interface Props {
  result: SpinReelResult;
  explanation: string;
  interaction: "idle" | "saved" | "not-interested";
  onSpinAgain: () => void;
  onSave: () => void;
  onNotForMe: () => void;
  onChangeFilters: () => void;
  onWatchClick: (provider: string) => void;
}

export function ResultTicket(p: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the result so screen-reader and keyboard users land on
  // the payoff instead of being stranded at the spin button.
  useEffect(() => {
    headingRef.current?.focus();
  }, [p.result.id]);

  const providers = Array.from(new Set((p.result.watchProviders ?? []).map((w) => w.name))).slice(0, 4);

  return (
    <div
      className="w-full max-w-[340px] text-center animate-[fadeUp_0.4s_ease-out]"
      style={{ ["--ticket-bg" as string]: "#0a0605" }}
    >
      <div className="ticket-divider" />
      <div className="px-1 pt-5">
        <p className="mb-1 font-data text-[10px] uppercase tracking-[0.35em] text-gold/70">
          Admit One
        </p>

        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-3xl tracking-wide text-white outline-none"
        >
          {p.result.title}
          {p.result.releaseYear ? ` · ${p.result.releaseYear}` : ""}
        </h2>

        <div className="mt-3 flex flex-wrap justify-center gap-1.5 font-data text-[11px]">
          {typeof p.result.voteAverage === "number" && (
            <span className="rounded-pill border border-gold/40 px-2.5 py-1 text-gold">
              ★ {p.result.voteAverage.toFixed(1)}
            </span>
          )}
          {p.result.genres?.map((g) => (
            <span key={g} className="rounded-pill border border-brass/40 px-2.5 py-1 text-ash">
              {g}
            </span>
          ))}
        </div>

        {p.result.overview && (
          <p className="mt-4 font-body text-sm leading-relaxed text-smoke">{p.result.overview}</p>
        )}

        {providers.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-data text-[10px] uppercase tracking-widest text-brass">
              Where to watch
            </p>
            <div className="flex flex-wrap justify-center gap-2 font-body text-xs">
              {providers.map((name) => {
                const provider = p.result.watchProviders!.find((w) => w.name === name)!;
                return (
                  <a
                    key={name}
                    href={provider.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => p.onWatchClick(name)}
                    aria-label={`Watch on ${name}, opens in new tab`}
                    className="rounded-pill border border-brass/50 px-3 py-1.5 text-smoke transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    ▶ {name}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {p.explanation && (
          <p className="mt-4 font-body text-sm italic text-gold/90">{p.explanation}</p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2.5 font-body text-sm">
          <button
            type="button"
            onClick={p.onSpinAgain}
            className="min-h-[44px] rounded-2xl bg-marquee px-5 py-2.5 font-medium text-white shadow-glow transition hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Spin again
          </button>

          <button
            type="button"
            onClick={p.onSave}
            disabled={p.interaction === "saved"}
            aria-pressed={p.interaction === "saved"}
            className={`min-h-[44px] rounded-2xl border px-5 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
              p.interaction === "saved"
                ? "border-gold bg-gold/10 text-gold"
                : "border-brass/50 text-smoke hover:border-gold/60 hover:text-gold"
            }`}
          >
            {p.interaction === "saved" ? "♥ Saved" : "♡ Save"}
          </button>

          <button
            type="button"
            onClick={p.onNotForMe}
            disabled={p.interaction === "not-interested"}
            aria-pressed={p.interaction === "not-interested"}
            className={`min-h-[44px] rounded-2xl border px-5 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
              p.interaction === "not-interested"
                ? "border-brass/40 text-ash"
                : "border-brass/50 text-smoke hover:border-brass"
            }`}
          >
            {p.interaction === "not-interested" ? "Noted" : "Not for me"}
          </button>

        <a  
            href={`/title/${p.result.id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open shareable page for ${p.result.title}, opens in new tab`}
            className="min-h-[44px] rounded-2xl border border-brass/50 px-5 py-2.5 text-smoke transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Copy link
          </a>

          <button
            type="button"
            onClick={p.onChangeFilters}
            className="min-h-[44px] rounded-2xl px-5 py-2.5 font-data text-[11px] uppercase tracking-widest text-ash transition hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Change filters
          </button>
        </div>
      </div>
    </div>
  );
}