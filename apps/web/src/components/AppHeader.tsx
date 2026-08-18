"use client";

import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { SavedDrawer } from "./SavedDrawer";
import { SupportButton } from "./SupportButton";
import { Logo } from "./Logo";
import { useAudioStore } from "@/lib/audio-store";

export function AppHeader() {
  const [savedOpen, setSavedOpen] = useState(false);
  const { isMuted, toggleMute } = useAudioStore();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-brass/25 bg-velvet/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-3 sm:gap-3">
          <a
            href="/"
            className="flex shrink-0 items-center gap-2.5 rounded font-display text-2xl tracking-wide text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <Logo size={30} />
            <span className="hidden neon-text sm:inline">CineRoulette</span>
          </a>

          <div className="min-w-0 flex-1">
            <SearchBar />
          </div>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            title={isMuted ? "Sound: Off (Click to unmute)" : "Sound: On (Click to mute)"}
            className={`min-h-[44px] shrink-0 rounded-pill border px-3 py-2 font-body text-xs transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
              isMuted
                ? "border-brass/40 text-ash hover:border-brass/70 hover:text-smoke"
                : "border-gold/50 text-gold shadow-glow"
            }`}
          >
            <span aria-hidden="true" className="text-sm">
              {isMuted ? "🔇" : "🔊"}
            </span>
          </button>

          <SupportButton />

          <button
            type="button"
            onClick={() => setSavedOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={savedOpen}
            className="min-h-[44px] shrink-0 rounded-pill border border-brass/50 px-3 py-2 font-body text-sm text-smoke transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span aria-hidden="true">♥</span>
            <span className="ml-1.5 hidden sm:inline">Saved</span>
          </button>
        </div>
      </header>

      <SavedDrawer open={savedOpen} onClose={() => setSavedOpen(false)} />
    </>
  );
}