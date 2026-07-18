"use client";

import { motion } from "framer-motion";
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
}

export function CounterPanel(p: CounterProps) {
  const langName = p.languages.find((l) => l.code === p.selectedLanguage)?.name ?? null;
  const fill = (p.minRating / 9) * 100;

  return (
    <div className="flex w-full flex-col items-center gap-6 lg:items-start">
      <OrderStub
        mood={p.mood}
        genre={p.selectedGenre}
        language={langName}
        minRating={p.minRating}
        serial={p.serial}
      />

      <div className="flex w-full max-w-[340px] flex-col gap-5 lg:max-w-none">
        <fieldset>
          <legend className="mb-2 font-data text-[10px] uppercase tracking-widest text-brass">
            Mood
          </legend>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => p.setMood(p.mood === m.label ? null : m.label)}
                aria-pressed={p.mood === m.label}
                className={`flex min-h-[44px] items-center gap-1.5 rounded-pill border px-4 py-2.5 font-body text-sm transition duration-200 ease-ui active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  p.mood === m.label
                    ? "border-marquee bg-marquee text-white shadow-glow"
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

        {p.loadingRefs ? (
          <div className="flex gap-3">
            <div className="skeleton h-11 w-40" />
            <div className="skeleton h-11 w-40" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <select
              value={p.selectedGenre ?? ""}
              onChange={(e) => p.setSelectedGenre(e.target.value || null)}
              aria-label="Filter by genre"
              className="min-h-[44px] rounded-pill border border-brass/50 bg-ink px-4 py-2 font-body text-sm text-smoke outline-none transition hover:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold"
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
              className="min-h-[44px] rounded-pill border border-brass/50 bg-ink px-4 py-2 font-body text-sm text-smoke outline-none transition hover:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold"
            >
              <option value="">Any language</option>
              {p.languages.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-3 font-body">
          <label htmlFor="minrating" className="text-sm text-ash">Min rating</label>
          <input
            id="minrating"
            type="range"
            min={0}
            max={9}
            value={p.minRating}
            onChange={(e) => p.setMinRating(Number(e.target.value))}
            className="styled-range w-40"
            style={{ ["--range-fill" as string]: `${fill}%` }}
          />
          <span className="w-12 font-data text-sm text-gold">
            {p.minRating > 0 ? `${p.minRating}.0` : "Any"}
          </span>
        </div>

        {p.activeCount > 0 && (
          <button
            type="button"
            onClick={p.onClearAll}
            className="self-start rounded-pill border border-brass/40 px-3 py-1.5 font-data text-[11px] uppercase tracking-widest text-ash transition hover:border-gold/50 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Clear {p.activeCount} filter{p.activeCount > 1 ? "s" : ""}
          </button>
        )}

        <motion.div className="relative self-center lg:self-start" whileTap={{ scale: 0.97 }}>
          <div
            className="pointer-events-none absolute -inset-3 animate-spin-slow rounded-2xl border-2 border-dashed border-gold/40"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={p.onSpin}
            disabled={p.spinning}
            className="relative min-h-[56px] animate-pulse-glow rounded-2xl bg-marquee px-10 py-4 font-display text-2xl tracking-wide text-white transition hover:brightness-110 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold"
          >
            {p.spinning ? "Spinning…" : "Spin the roulette"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}