"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { PosterWallBackground } from "@/components/PosterWallBackground";
import { ParticleField } from "@/components/ParticleField";
import { CounterPanel } from "@/components/CounterPanel";
import { StagePanel } from "@/components/StagePanel";
import type { SpinReelResult } from "@/components/SpinReel";
import { getSessionId } from "@/lib/session";
import { track } from "@/lib/analytics-client";

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

/**
 * Explicit state machine. The original implementation used eleven separate
 * useState calls with no transition back to "idle", which silently trapped
 * users on the result screen with no way to change filters after one spin.
 * Modelling the transitions makes an unreachable state obvious instead of
 * invisible.
 */
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

const HINT_KEY = "cineroulette_hint_dismissed";
const RESULT_HINT_KEY = "cineroulette_result_hint_dismissed";

export default function HomePage() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const [sessionId, setSessionId] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [languages, setLanguages] = useState<{ code: string; name: string }[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [showResultHint, setShowResultHint] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const spinningRef = useRef(false);

  // Keep a ref in sync so the keyboard handler can read the current value
  // without re-binding the listener on every state change.
  spinningRef.current = state.stage === "revving" || state.stage === "spinning";

  useEffect(() => {
    setSessionId(getSessionId());

    try {
      if (!localStorage.getItem(HINT_KEY)) setShowHint(true);
      if (!localStorage.getItem(RESULT_HINT_KEY)) setShowResultHint(true);
    } catch {
      // Private mode / storage blocked — skip the hints rather than crash.
    }

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

  const serial = useMemo(() => {
    const digits = sessionId.replace(/\D/g, "");
    return digits.length >= 4 ? digits.slice(0, 4) : digits.padStart(4, "0");
  }, [sessionId]);

  const activeCount = [
    mood,
    selectedGenre,
    selectedLanguage || null,
    minRating > 0 ? "rating" : null,
  ].filter(Boolean).length;


  function dismissResultHint() {
    setShowResultHint(false);
    try {
      localStorage.setItem(RESULT_HINT_KEY, "1");
    } catch {
      // Non-critical.
    }
  }

  function dismissHint() {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      // Non-critical.
    }
  }

  const spin = useCallback(async () => {
    if (spinningRef.current) return;

    track("spin_started", {
      genre: selectedGenre,
      language: selectedLanguage || null,
      mood,
      minRating,
    });
    dispatch({ type: "SPIN_REQUESTED" });

    try {
      const res = await fetch("/api/v1/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minRating: minRating || undefined,
          sessionId: sessionId || undefined,
          genre: selectedGenre ? [selectedGenre] : undefined,
          language: selectedLanguage || undefined,
          mood: mood || undefined,
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
          message: data.message ?? "Nothing matches every filter. Try dropping one.",
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
  }, [mood, selectedGenre, selectedLanguage, minRating, sessionId]);

  // Press S to spin. Ignored while typing so it never hijacks the search box.
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

  // On mobile the stage sits above the counter, so a spin triggered from the
  // button lands off-screen. Scroll it into view once the reel starts.
  useEffect(() => {
    if (state.stage !== "spinning") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;

    stageRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [state.stage]);

  // Reflect the pick in the tab title — makes a spun result meaningful when
  // the tab is backgrounded, and restores cleanly on reset.
  useEffect(() => {
    const base = "CineRoulette — Stop Searching. Start Watching.";
    document.title = state.stage === "revealed" && state.result
      ? `${state.result.title} — CineRoulette`
      : base;
    return () => {
      document.title = base;
    };
  }, [state.stage, state.result]);

  async function sendInteraction(action: "SAVED" | "NOT_INTERESTED") {
    if (!state.result) return;

    // Optimistic: the button reacts immediately, the write happens behind it.
    dispatch({ type: "MARK", value: action === "SAVED" ? "saved" : "not-interested" });

    try {
      await fetch("/api/v1/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId: state.result.id, action, sessionId }),
      });
    } catch {
      // Non-critical — losing one signal isn't worth an error state.
    }
  }

  function clearAll() {
    setMood(null);
    setSelectedGenre(null);
    setSelectedLanguage("");
    setMinRating(0);
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 pb-28 lg:pb-10">
      <PosterWallBackground />
      <div className="hero-spotlight" />
      <ParticleField />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <section aria-label="Choose your filters" className="order-2 lg:order-1">
          {showHint && (
            <div className="surface mb-6 flex w-full max-w-[340px] items-start gap-3 px-4 py-3 lg:max-w-none">
              <span aria-hidden="true" className="text-lg leading-none">🎟️</span>
              <p className="flex-1 font-body text-sm text-smoke">
                Pick a mood, or just spin. Press <kbd className="rounded border border-brass/50 px-1.5 py-0.5 font-data text-[11px] text-gold">S</kbd> any time.
              </p>
              <button
                type="button"
                onClick={dismissHint}
                aria-label="Dismiss hint"
                className="rounded font-data text-[11px] uppercase tracking-widest text-ash transition hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                Got it
              </button>
            </div>
          )}

          <CounterPanel
            mood={mood}
            setMood={setMood}
            genres={genres}
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
            languages={languages}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            minRating={minRating}
            setMinRating={setMinRating}
            serial={serial}
            loadingRefs={loadingRefs}
            spinning={state.stage === "revving" || state.stage === "spinning"}
            onSpin={spin}
            onClearAll={clearAll}
            activeCount={activeCount}
          />
        </section>

        <section aria-label="Your pick" className="order-1 lg:order-2" ref={stageRef}>
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
            onWatchClick={(provider) =>
              track("watch_provider_clicked", { titleId: state.result?.id, provider })
            }
          />

          {state.stage === "revealed" && showResultHint && (
            <div className="surface mx-auto mt-5 flex w-full max-w-[340px] items-start gap-3 px-4 py-3">
              <span aria-hidden="true" className="text-lg leading-none">💡</span>
              <p className="flex-1 font-body text-sm text-smoke">
                Not feeling it? Spin again — or hit Save to find it later under ♥ Saved.
              </p>
              <button
                type="button"
                onClick={dismissResultHint}
                aria-label="Dismiss tip"
                className="rounded font-data text-[11px] uppercase tracking-widest text-ash transition hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                Got it
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}