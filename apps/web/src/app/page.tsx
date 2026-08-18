"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { PosterWallBackground } from "@/components/PosterWallBackground";
import { ParticleField } from "@/components/ParticleField";
import { StagePanel } from "@/components/StagePanel";
import type { SpinReelResult } from "@/components/SpinReel";
import type { PresetFilter } from "@/components/MarqueePresets";
import { getSessionId } from "@/lib/session";
import { track } from "@/lib/analytics-client";
import { SpinButton } from "@/components/SpinButton";
import { CinemaSelect } from "@/components/CinemaSelect";

type Stage = "idle" | "revving" | "spinning" | "revealed" | "empty" | "error";

interface SpinState {
  stage: Stage;
  result: SpinReelResult | null;
  explanation: string;
  message: string | null;
  interaction: "idle" | "saved" | "not-interested";
}

type Action =
  | { type: "SPIN_REQUESTED" }
  | { type: "SPIN_RESOLVED"; result: SpinReelResult; explanation: string }
  | { type: "SPIN_EMPTY"; message: string }
  | { type: "SPIN_FAILED"; message: string }
  | { type: "REVEAL_COMPLETE" }
  | { type: "MARK"; value: "saved" | "not-interested" }
  | { type: "RESET_TO_IDLE" };

const initialState: SpinState = {
  stage: "idle",
  result: null,
  explanation: "",
  message: null,
  interaction: "idle",
};

function reducer(state: SpinState, action: Action): SpinState {
  switch (action.type) {
    case "SPIN_REQUESTED":
      return { ...initialState, stage: "revving" };
    case "SPIN_RESOLVED":
      return {
        ...state,
        stage: "spinning",
        result: action.result,
        explanation: action.explanation,
        message: null,
      };
    case "SPIN_EMPTY":
      return { ...initialState, stage: "empty", message: action.message };
    case "SPIN_FAILED":
      return { ...initialState, stage: "error", message: action.message };
    case "REVEAL_COMPLETE":
      return { ...state, stage: "revealed" };
    case "MARK":
      return { ...state, interaction: action.value };
    case "RESET_TO_IDLE":
      return initialState;
    default:
      return state;
  }
}

const MOODS = [
  { label: "feel-good", icon: "😊" },
  { label: "funny", icon: "😂" },
  { label: "emotional", icon: "😢" },
  { label: "romantic", icon: "💕" },
  { label: "exciting", icon: "⚡" },
  { label: "scary", icon: "👻" },
  { label: "mind-bending", icon: "🌀" },
  { label: "relaxing", icon: "🌊" },
  { label: "dark", icon: "🌑" },
];

const RUNTIMES = [
  { value: "short", label: "< 90m" },
  { value: "medium", label: "90–120m" },
  { value: "long", label: "120m+" },
];

const ERAS = [
  { value: "classic", label: "Classic (<80)" },
  { value: "80s-90s", label: "80s–90s" },
  { value: "2000s", label: "2000s" },
  { value: "recent", label: "Recent (2020+)" },
];

const STREAMING_PROVIDERS = [
  { value: "Netflix", label: "Netflix" },
  { value: "Amazon Prime Video", label: "Prime Video" },
  { value: "Disney Plus", label: "Disney+" },
  { value: "Apple TV Plus", label: "Apple TV+" },
  { value: "Max", label: "Max" },
];

export default function HomePage() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const [sessionId, setSessionId] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [languages, setLanguages] = useState<{ code: string; name: string }[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [runtime, setRuntime] = useState<string | null>(null);
  const [era, setEra] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const spinningRef = useRef(false);

  spinningRef.current = state.stage === "revving" || state.stage === "spinning";

  useEffect(() => {
    setSessionId(getSessionId());

    Promise.all([
      fetch("/api/v1/genres")
        .then((r) => r.json())
        .catch(() => ({ genres: [] as string[] })),
      fetch("/api/v1/languages")
        .then((r) => r.json())
        .catch(() => ({ languages: [] as { code: string; name: string }[] })),
    ]).then(([g, l]) => {
      setGenres(g?.genres ?? []);
      setLanguages(l?.languages ?? []);
      setLoadingRefs(false);
    });
  }, []);

  const activeCount = [
    mood,
    selectedGenre,
    selectedLanguage || null,
    minRating > 0 ? "rating" : null,
    runtime,
    era,
    provider,
  ].filter(Boolean).length;

  const executeSpin = useCallback(
    async (params?: {
      mood?: string | null;
      genre?: string | null;
      language?: string;
      minRating?: number;
      runtime?: string | null;
      era?: string | null;
      provider?: string | null;
    }) => {
      if (spinningRef.current) return;

      const effectiveMood = params?.mood !== undefined ? params.mood : mood;
      const effectiveGenre = params?.genre !== undefined ? params.genre : selectedGenre;
      const effectiveLang = params?.language !== undefined ? params.language : selectedLanguage;
      const effectiveMinRating = params?.minRating !== undefined ? params.minRating : minRating;
      const effectiveRuntime = params?.runtime !== undefined ? params.runtime : runtime;
      const effectiveEra = params?.era !== undefined ? params.era : era;
      const effectiveProvider = params?.provider !== undefined ? params.provider : provider;

      track("spin_started", {
        genre: effectiveGenre,
        language: effectiveLang || null,
        mood: effectiveMood,
        minRating: effectiveMinRating,
        runtime: effectiveRuntime,
        era: effectiveEra,
        provider: effectiveProvider,
      });

      dispatch({ type: "SPIN_REQUESTED" });

      try {
        const res = await fetch("/api/v1/spin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            minRating: effectiveMinRating || undefined,
            sessionId: sessionId || undefined,
            genre: effectiveGenre ? [effectiveGenre] : undefined,
            language: effectiveLang || undefined,
            mood: effectiveMood || undefined,
            runtime: effectiveRuntime || undefined,
            era: effectiveEra || undefined,
            provider: effectiveProvider || undefined,
          }),
        });

        const data: {
          title: SpinReelResult | null;
          scoreExplanation?: string;
          message?: string;
        } = await res.json();

        if (!data.title) {
          dispatch({
            type: "SPIN_EMPTY",
            message: data.message ?? "Nothing matches every filter. Try dropping or broadening one.",
          });
          return;
        }

        dispatch({
          type: "SPIN_RESOLVED",
          result: data.title,
          explanation: data.scoreExplanation ?? "",
        });
      } catch {
        dispatch({ type: "SPIN_FAILED", message: "The spin didn't go through. Try again." });
      }
    },
    [mood, selectedGenre, selectedLanguage, minRating, runtime, era, provider, sessionId]
  );

  const spin = useCallback(() => {
    void executeSpin();
  }, [executeSpin]);

  function handleSelectPreset(preset: PresetFilter) {
    setMood(preset.mood);
    setSelectedGenre(preset.genre);
    setMinRating(preset.minRating);
    if (preset.runtime !== undefined) setRuntime(preset.runtime);
    if (preset.era !== undefined) setEra(preset.era);

    void executeSpin({
      mood: preset.mood,
      genre: preset.genre,
      minRating: preset.minRating,
      runtime: preset.runtime,
      era: preset.era,
    });
  }

  // Keyboard shortcut 'S'
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "s" && e.key !== "S") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const el = document.activeElement;
      const tag = el?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (el instanceof HTMLElement && el.isContentEditable);
      if (isTyping) return;

      e.preventDefault();
      void spin();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [spin]);

  // Tab Title
  useEffect(() => {
    const base = "CineRoulette — Stop Searching. Start Watching.";
    document.title =
      state.stage === "revealed" && state.result
        ? `${state.result.title} — CineRoulette`
        : base;
    return () => {
      document.title = base;
    };
  }, [state.stage, state.result]);

  async function sendInteraction(action: "SAVED" | "NOT_INTERESTED") {
    if (!state.result) return;

    dispatch({ type: "MARK", value: action === "SAVED" ? "saved" : "not-interested" });

    try {
      await fetch("/api/v1/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId: state.result.id, action, sessionId }),
      });
    } catch {
      // Non-critical
    }
  }

  function clearAll() {
    setMood(null);
    setSelectedGenre(null);
    setSelectedLanguage("");
    setMinRating(0);
    setRuntime(null);
    setEra(null);
    setProvider(null);
  }

  const fill = (minRating / 9) * 100;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 pb-24 sm:py-10">
      <PosterWallBackground />
      <div className="hero-spotlight" />
      <ParticleField />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-8">
        {/* Top Filter Console - Symmetrical & Clean */}
        <section aria-label="Filter Controls" className="w-full relative z-30">
          <div className="surface w-full p-4 sm:p-5">
            {/* Mood Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setMood(mood === m.label ? null : m.label)}
                  aria-pressed={mood === m.label}
                  className={`flex min-h-[38px] items-center gap-1.5 rounded-pill border px-3.5 py-1.5 font-body text-xs transition duration-200 ease-ui active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                    mood === m.label
                      ? "border-marquee bg-marquee/90 text-white shadow-glow font-medium"
                      : "border-brass/40 bg-velvet/70 text-smoke hover:border-gold/60 hover:text-gold"
                  }`}
                >
                  <span aria-hidden="true">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Main Selectors Row */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">
              <CinemaSelect
                label="Genre"
                placeholder="Any genre"
                options={genres.map((g) => ({ value: g, label: g }))}
                value={selectedGenre}
                onChange={setSelectedGenre}
              />

              <CinemaSelect
                label="Language"
                placeholder="Any language"
                options={languages.map((l) => ({ value: l.code, label: l.name }))}
                value={selectedLanguage || null}
                onChange={(v) => setSelectedLanguage(v || "")}
              />

              {/* Min Rating */}
              <div className="flex items-center gap-2.5 rounded-pill border border-brass/40 bg-velvet/70 px-3.5 py-2 font-body text-xs">
                <span className="shrink-0 text-ash">★ Min</span>
                <input
                  id="minrating"
                  type="range"
                  min={0}
                  max={9}
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="styled-range w-full"
                  style={{ ["--range-fill" as string]: `${fill}%` }}
                />
                <span className="w-8 shrink-0 font-data text-xs text-gold font-medium text-right">
                  {minRating > 0 ? `${minRating}.0+` : "Any"}
                </span>
              </div>
            </div>

            {/* Advanced Filters Expandable Toggle */}
            <div className="mt-3.5 flex flex-wrap items-center justify-between border-t border-brass/20 pt-3 text-xs">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 rounded-pill font-data text-[11px] uppercase tracking-wider text-ash transition hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                <span>{showAdvanced ? "▲ Hide Options" : "▼ More Filters (Runtime, Era, Streaming)"}</span>
              </button>

              {activeCount > 0 && (
                <div className="flex items-center gap-3">
                  <span className="font-data text-[11px] text-ash">
                    {activeCount} active filter{activeCount > 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-pill border border-brass/40 px-2.5 py-1 font-data text-[11px] uppercase tracking-wider text-ash transition hover:border-gold/60 hover:text-gold"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Advanced Filters */}
            {showAdvanced && (
              <div className="mt-3.5 flex flex-col gap-3 border-t border-brass/20 pt-3.5 animate-[fadeUp_0.2s_ease-out]">
                {/* Runtime Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-data text-[11px] uppercase tracking-wider text-ash w-20">Runtime:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {RUNTIMES.map((rt) => (
                      <button
                        key={rt.value}
                        type="button"
                        onClick={() => setRuntime(runtime === rt.value ? null : rt.value)}
                        className={`rounded-pill border px-2.5 py-1 font-data text-xs transition ${
                          runtime === rt.value
                            ? "border-gold bg-gold/15 text-gold font-medium"
                            : "border-brass/40 text-smoke hover:border-brass/70 hover:text-white"
                        }`}
                      >
                        {rt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Era Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-data text-[11px] uppercase tracking-wider text-ash w-20">Era:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ERAS.map((e) => (
                      <button
                        key={e.value}
                        type="button"
                        onClick={() => setEra(era === e.value ? null : e.value)}
                        className={`rounded-pill border px-2.5 py-1 font-data text-xs transition ${
                          era === e.value
                            ? "border-gold bg-gold/15 text-gold font-medium"
                            : "border-brass/40 text-smoke hover:border-brass/70 hover:text-white"
                        }`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Streaming Providers */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-data text-[11px] uppercase tracking-wider text-ash w-20">Stream:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {STREAMING_PROVIDERS.map((sp) => (
                      <button
                        key={sp.value}
                        type="button"
                        onClick={() => setProvider(provider === sp.value ? null : sp.value)}
                        className={`rounded-pill border px-2.5 py-1 font-body text-xs transition ${
                          provider === sp.value
                            ? "border-marquee bg-marquee/20 text-white font-medium shadow-glow"
                            : "border-brass/40 text-smoke hover:border-brass/70 hover:text-white"
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Center Stage & Roulette Action */}
        <section aria-label="Roulette Stage" className="w-full flex flex-col items-center" ref={stageRef}>
          <StagePanel
            stage={state.stage}
            result={state.result}
            explanation={state.explanation}
            message={state.message}
            interaction={state.interaction}
            onRevealComplete={() => dispatch({ type: "REVEAL_COMPLETE" })}
            onSpinAgain={spin}
            onSave={() => sendInteraction("SAVED")}
            onNotForMe={() => sendInteraction("NOT_INTERESTED")}
            onChangeFilters={() => dispatch({ type: "RESET_TO_IDLE" })}
            onSelectPreset={handleSelectPreset}
            onWatchClick={(providerName) =>
              track("watch_provider_clicked", { titleId: state.result?.id, provider: providerName })
            }
          />

          {state.stage === "idle" && (
            <div className="mt-6 flex flex-col items-center gap-2.5">
              <SpinButton spinning={false} onSpin={spin} size="large" />
              <p className="font-data text-[11px] tracking-widest text-ash">
                PRESS <kbd className="rounded border border-brass/50 px-1.5 py-0.5 text-gold">S</kbd> ANY TIME
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}