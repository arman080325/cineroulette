"use client";

import { OrderStub } from "./OrderStub";

const MOODS = [
  { label: "feel-good", icon: "😊" },
  { label: "funny", icon: "😂" },
  { label: "emotional", icon: "😢" },
  { label: "romantic", icon: "💕" },
  { label: "exciting", icon: "⚡" },
  { label: "scary", icon: "👻" },
  { label: "mind-bending", icon: "🌀" },
  { label: "relaxing", icon: "🌊" },
  { label: "heartwarming", icon: "🔥" },
  { label: "dark", icon: "🌑" },
];

export interface CounterProps {
  mood: string | null;
  setMood: (v: string | null) => void;
  genres: string[];
  selectedGenre: string | null;
  setSelectedGenre: (v: string | null) => void;
  languages: { code: string; name: string }[];
  selectedLanguage: string;
  setSelectedLanguage: (v: string) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  serial: string;
  loadingRefs: boolean;
  spinning: boolean;
  onSpin: () => void;
  onClearAll: () => void;
  activeCount: number;
  // Once a result is revealed, the ResultTicket's own "Spin Again" button
  // takes over — the sticky mobile bar hides so the two don't show at once.
  showMobileSpin: boolean;
}

export function CounterPanel(p: CounterProps) {
  const langName = p.languages.find((l) => l.code === p.selectedLanguage)?.name ?? null;
  const fill = (p.minRating / 9) * 100;

  return (
    <div className="flex w-full flex-col items-center gap-5 lg:items-stretch">
      <OrderStub
        mood={p.mood}
        genre={p.selectedGenre}
        language={langName}
        minRating={p.minRating}
        serial={p.serial}
      />

      <div className="surface w-full px-5 py-5">
        <div className="flex flex-col gap-5">
          <fieldset>
            <legend className="mb-2 font-data text-[10px] uppercase tracking-[0.2em] text-ash">
              Mood
            </legend>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => p.setMood(p.mood === m.label ? null : m.label)}
                  aria-pressed={p.mood === m.label}
                  className={`flex min-h-[40px] items-center gap-1.5 rounded-pill border px-3 py-2 font-body text-xs transition duration-200 ease-ui active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${p.mood === m.label
                    ? "border-marquee bg-marquee/90 text-velvet shadow-glow"
                    : "border-brass/50 text-smoke hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold"
                    }`}
                >
                  <span aria-hidden="true">{m.icon}</span>
                  {m.label}
                  {p.mood === m.label && <span className="sr-only">, selected</span>}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-4 border-t border-brass/25 pt-4">
            {p.loadingRefs ? (
              <div className="flex flex-col gap-3">
                <div className="skeleton h-11 w-full" />
                <div className="skeleton h-11 w-full" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <select
                  value={p.selectedGenre ?? ""}
                  onChange={(e) => p.setSelectedGenre(e.target.value || null)}
                  aria-label="Filter by genre"
                  className="min-h-[44px] w-full rounded-pill border border-brass/50 bg-velvet/60 px-4 py-2 font-body text-sm text-smoke outline-none transition hover:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <option value="">Any genre</option>
                  {p.genres.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                <select
                  value={p.selectedLanguage}
                  onChange={(e) => p.setSelectedLanguage(e.target.value)}
                  aria-label="Filter by language"
                  className="min-h-[44px] w-full rounded-pill border border-brass/50 bg-velvet/60 px-4 py-2 font-body text-sm text-smoke outline-none transition hover:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <option value="">Any language</option>
                  {p.languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3 font-body">
              <label htmlFor="minrating" className="shrink-0 text-sm text-ash">Min rating</label>
              <input
                id="minrating"
                type="range"
                min={0}
                max={9}
                value={p.minRating}
                onChange={(e) => p.setMinRating(Number(e.target.value))}
                className="styled-range w-full"
                style={{ ["--range-fill" as string]: `${fill}%` }}
              />
              <span className="w-10 shrink-0 font-data text-sm text-gold">
                {p.minRating > 0 ? `${p.minRating}.0` : "Any"}
              </span>
            </div>

            {p.activeCount > 0 && (
              <button
                type="button"
                onClick={p.onClearAll}
                className="self-start rounded-pill border border-brass/40 px-3 py-1.5 font-data text-[11px] uppercase tracking-[0.2em] text-ash transition hover:border-gold/50 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                Clear {p.activeCount} filter{p.activeCount > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom bar — mobile only. Desktop's Spin button now lives
          next to the poster instead, so it's never a scroll away. */}
{/* Sticky bottom bar — mobile only, and only before a result exists.
          Once revealed, ResultTicket's own Spin Again button is the single
          source of truth for spinning, so this hides instead of doubling up. */}
      {p.showMobileSpin && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brass/30 bg-velvet/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={p.onSpin}
            disabled={p.spinning}
            className="w-full min-h-[56px] animate-gradient-pan rounded-2xl bg-gradient-to-r from-marquee via-[#ff8fc0] to-gold bg-[length:220%_220%] py-4 font-display text-xl tracking-wide text-velvet shadow-[0_0_24px_5px_rgba(255,77,141,0.5)] transition-shadow duration-300 hover:shadow-[0_0_32px_8px_rgba(255,77,141,0.65)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold"
          >
            {p.spinning ? "Spinning…" : "Spin the roulette"}
          </button>
        </div>
      )}
    </div>
  );
}