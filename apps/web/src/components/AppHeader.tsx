"use client";

import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { SavedDrawer } from "./SavedDrawer";

export function AppHeader() {
  const [savedOpen, setSavedOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-brass/25 bg-velvet/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <a  
            href="/"
            className="flex shrink-0 items-center gap-2 rounded font-display text-2xl tracking-wide text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span aria-hidden="true">◉</span>
            <span className="hidden sm:inline">CineRoulette</span>
          </a>

          <div className="min-w-0 flex-1">
            <SearchBar />
          </div>

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