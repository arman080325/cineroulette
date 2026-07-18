"use client";

import { SpinReel, type SpinReelResult } from "./SpinReel";
import { ResultTicket } from "./ResultTicket";

type Stage = "idle" | "revving" | "spinning" | "revealed" | "empty" | "error";

interface Props {
  stage: Stage;
  result: SpinReelResult | null;
  explanation: string;
  message: string | null;
  interaction: "idle" | "saved" | "not-interested";
  onRevealComplete: () => void;
  onSpinAgain: () => void;
  onSave: () => void;
  onNotForMe: () => void;
  onChangeFilters: () => void;
  onWatchClick: (provider: string) => void;
}

export function StagePanel(p: Props) {
  return (
    <div id="stage" className="flex w-full flex-col items-center">
      {p.stage === "idle" && (
        <div className="surface flex w-full max-w-[340px] flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="text-5xl opacity-70" aria-hidden="true">🎟️</span>
          <p className="font-display text-2xl tracking-wide text-smoke">Nothing showing yet</p>
          <p className="font-body text-sm text-ash">Pick a mood, or just spin. Either works.</p>
        </div>
      )}

      {p.stage === "revving" && (
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 py-16 text-ash">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" aria-hidden="true" />
          <span className="font-data text-xs uppercase tracking-widest">Revving up the reel</span>
        </div>
      )}

      {(p.stage === "empty" || p.stage === "error") && (
        <div className="surface flex w-full max-w-[340px] flex-col items-center gap-4 px-6 py-12 text-center">
          <p className="font-body text-sm text-smoke">{p.message}</p>
          <button
            type="button"
            onClick={p.onChangeFilters}
            className="min-h-[44px] rounded-2xl border border-brass/50 px-5 py-2.5 font-body text-sm text-smoke transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Adjust filters
          </button>
        </div>
      )}

      {(p.stage === "spinning" || p.stage === "revealed") && p.result && (
        <div className="flex w-full flex-col items-center">
          <SpinReel
            spinning={p.stage === "spinning"}
            result={p.result}
            onRevealComplete={p.onRevealComplete}
          />
          {p.stage === "revealed" && (
            <div role="status" aria-live="polite" className="w-full flex justify-center">
              <ResultTicket
                result={p.result}
                explanation={p.explanation}
                interaction={p.interaction}
                onSpinAgain={p.onSpinAgain}
                onSave={p.onSave}
                onNotForMe={p.onNotForMe}
                onChangeFilters={p.onChangeFilters}
                onWatchClick={p.onWatchClick}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}