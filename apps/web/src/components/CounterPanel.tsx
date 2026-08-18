"use client";

import { OrderStub } from "./OrderStub";
import { CinemaSelect } from "./CinemaSelect";

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

const RUNTIMES = [
  { value: "short", label: "< 90m", fullLabel: "Under 90 mins" },
  { value: "medium", label: "90–120m", fullLabel: "90 to 120 mins" },
  { value: "long", label: "120m+", fullLabel: "2+ hours" },
];

const ERAS = [
  { value: "classic", label: "Classic (<80)", fullLabel: "Before 1980" },
  { value: "80s-90s", label: "80s–90s", fullLabel: "1980–1999" },
  { value: "2000s", label: "2000s", fullLabel: "2000–2019" },
  { value: "recent", label: "Recent (2020+)", fullLabel: "2020 to Present" },
];

const STREAMING_PROVIDERS = [
  { value: "Netflix", label: "Netflix" },
  { value: "Amazon Prime Video", label: "Prime Video" },
  { value: "Disney Plus", label: "Disney+" },
  { value: "Apple TV Plus", label: "Apple TV+" },
  { value: "Max", label: "Max" },
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
  runtime?: string | null;
  setRuntime: (v: string | null) => void;
  era?: string | null;
  setEra: (v: string | null) => void;
  provider?: string | null;
  setProvider: (v: string | null) => void;
  serial: string;
  loadingRefs: boolean;
  spinning: boolean;
  onSpin: () => void;
  onClearAll: () => void;
  activeCount: number;
  showMobileSpin: boolean;
}

export function CounterPanel(p: CounterProps) {
  const langName = p.languages.find((l) => l.code === p.selectedLanguage)?.name ?? null;
  const fill = (p.minRating / 9) * 100;

  const runtimeLabel = RUNTIMES.find((r) => r.value === p.runtime)?.label ?? null;
  const eraLabel = ERAS.find((e) => e.value === p.era)?.label ?? null;
  const providerLabel = STREAMING_PROVIDERS.find((pr) => pr.value === p.provider)?.label ?? p.provider ?? null;

  return (
    <div className="flex w-full flex-col items-center gap-5 lg:items-stretch">
      <OrderStub
        mood={p.mood}
        genre={p.selectedGenre}
        language={langName}
        minRating={p.minRating}
        runtime={runtimeLabel}
        era={eraLabel}
        provider={providerLabel}
        serial={p.serial}
      />

      <div className="surface w-full px-5 py-5">
        <div className="flex flex-col gap-5">
          {/* Mood Chips */}
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
                  className={`flex min-h-[38px] items-center gap-1.5 rounded-pill border px-3 py-1.5 font-body text-xs transition duration-200 ease-ui active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                    p.mood === m.label
                      ? "border-marquee bg-marquee/90 text-white shadow-glow font-medium"
                      : "border-brass/50 bg-velvet/60 text-smoke hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold"
                  }`}
                >
                  <span aria-hidden="true">{m.icon}</span>
                  {m.label}
                  {p.mood === m.label && <span className="sr-only">, selected</span>}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Genre & Language Selectors */}
          <div className="flex flex-col gap-3.5 border-t border-brass/25 pt-4">
            <legend className="font-data text-[10px] uppercase tracking-[0.2em] text-ash">
              Genre &amp; Language
            </legend>
            {p.loadingRefs ? (
              <div className="flex flex-col gap-3">
                <div className="skeleton h-11 w-full" />
                <div className="skeleton h-11 w-full" />
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <CinemaSelect
                  label="Genre"
                  placeholder="Any genre"
                  options={p.genres.map((g) => ({ value: g, label: g }))}
                  value={p.selectedGenre}
                  onChange={p.setSelectedGenre}
                />

                <CinemaSelect
                  label="Language"
                  placeholder="Any language"
                  options={p.languages.map((l) => ({ value: l.code, label: l.name }))}
                  value={p.selectedLanguage || null}
                  onChange={(v) => p.setSelectedLanguage(v || "")}
                />
              </div>
            )}
          </div>

          {/* Runtime & Era Quick Filter Chips */}
          <div className="flex flex-col gap-3.5 border-t border-brass/25 pt-4">
            <fieldset>
              <legend className="mb-2 font-data text-[10px] uppercase tracking-[0.2em] text-ash">
                Runtime
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {RUNTIMES.map((rt) => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => p.setRuntime(p.runtime === rt.value ? null : rt.value)}
                    aria-pressed={p.runtime === rt.value}
                    className={`rounded-pill border px-2.5 py-1 font-data text-[11px] transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                      p.runtime === rt.value
                        ? "border-gold bg-gold/15 text-gold font-medium"
                        : "border-brass/40 text-smoke hover:border-brass/70 hover:text-white"
                    }`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 font-data text-[10px] uppercase tracking-[0.2em] text-ash">
                Release Era
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {ERAS.map((era) => (
                  <button
                    key={era.value}
                    type="button"
                    onClick={() => p.setEra(p.era === era.value ? null : era.value)}
                    aria-pressed={p.era === era.value}
                    className={`rounded-pill border px-2.5 py-1 font-data text-[11px] transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                      p.era === era.value
                        ? "border-gold bg-gold/15 text-gold font-medium"
                        : "border-brass/40 text-smoke hover:border-brass/70 hover:text-white"
                    }`}
                  >
                    {era.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 font-data text-[10px] uppercase tracking-[0.2em] text-ash">
                Streaming Platform
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {STREAMING_PROVIDERS.map((sp) => (
                  <button
                    key={sp.value}
                    type="button"
                    onClick={() => p.setProvider(p.provider === sp.value ? null : sp.value)}
                    aria-pressed={p.provider === sp.value}
                    className={`rounded-pill border px-2.5 py-1 font-body text-xs transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                      p.provider === sp.value
                        ? "border-marquee bg-marquee/20 text-white font-medium shadow-glow"
                        : "border-brass/40 text-smoke hover:border-brass/70 hover:text-white"
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Rating Slider */}
          <div className="flex flex-col gap-2 border-t border-brass/25 pt-4">
            <div className="flex items-center gap-3 font-body">
              <label htmlFor="minrating" className="shrink-0 text-xs text-ash">
                Min rating
              </label>
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
              <span className="w-10 shrink-0 font-data text-xs text-gold">
                {p.minRating > 0 ? `${p.minRating}.0+` : "Any"}
              </span>
            </div>

            {p.activeCount > 0 && (
              <div className="mt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={p.onClearAll}
                  className="rounded-pill border border-brass/40 px-3 py-1 font-data text-[11px] uppercase tracking-[0.2em] text-ash transition hover:border-gold/50 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  Clear {p.activeCount} filter{p.activeCount > 1 ? "s" : ""}
                </button>
                <span className="font-data text-[11px] text-ash">
                  {p.activeCount} active
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom bar — mobile only */}
      {p.showMobileSpin && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brass/30 bg-velvet/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={p.onSpin}
            disabled={p.spinning}
            className="w-full min-h-[56px] animate-gradient-pan rounded-2xl bg-gradient-to-r from-marquee via-[#ff8fc0] to-gold bg-[length:220%_220%] py-4 font-display text-xl tracking-wide text-white shadow-[0_0_24px_5px_rgba(255,77,141,0.5)] transition-shadow duration-300 hover:shadow-[0_0_32px_8px_rgba(255,77,141,0.65)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold"
          >
            {p.spinning ? "Spinning…" : "Spin the roulette"}
          </button>
        </div>
      )}
    </div>
  );
}