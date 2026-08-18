"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSessionId } from "@/lib/session";
import { track } from "@/lib/analytics-client";
import { useToastStore } from "@/lib/toast-store";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SavedTitle {
  id: string;
  title: string;
  releaseYear: number | null;
  posterPath: string | null;
  voteAverage: number | null;
}

export function SavedDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<SavedTitle[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const { showToast } = useToastStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/saved?sessionId=${encodeURIComponent(getSessionId())}`);
      const data = await res.json();
      setItems(data.saved ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    void load();
    requestAnimationFrame(() => panelRef.current?.focus());
  }, [open, load]);

  // Focus trap + Esc
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  async function unsave(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    track("title_unsaved", { titleId: id });
    try {
      await fetch("/api/v1/interactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId: id, sessionId: getSessionId() }),
      });
      showToast("Removed from saved", { type: "info" });
    } catch {
      void load();
    }
  }

  function spinFromSaved() {
    if (items.length === 0) return;
    const randomPick = items[Math.floor(Math.random() * items.length)];
    if (!randomPick) return;
    onClose();
    router.push(`/title/${randomPick.id}`);
  }

  function exportWatchlist() {
    if (items.length === 0) return;
    const text = items
      .map((item, i) => `${i + 1}. ${item.title} (${item.releaseYear ?? "N/A"}) - ★ ${item.voteAverage?.toFixed(1) ?? "—"}`)
      .join("\n");
    navigator.clipboard.writeText(`🎟️ CineRoulette Saved Watchlist:\n\n${text}`);
    showToast("Watchlist copied to clipboard! 📋", { type: "success" });
  }

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase().trim()));
  }, [items, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Saved titles"
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-brass/30 bg-ink outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brass/25 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl tracking-wide text-gold">Saved</h2>
            <span className="rounded-full bg-gold/15 px-2 py-0.5 font-data text-xs text-gold">
              {items.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill border border-brass/50 px-3 py-1.5 font-data text-[11px] uppercase tracking-widest text-smoke transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Close
          </button>
        </div>

        {/* Action toolbar if items exist */}
        {items.length > 0 && (
          <div className="border-b border-brass/20 p-3 flex flex-col gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter saved titles..."
              className="w-full rounded-pill border border-brass/40 bg-velvet/80 px-3 py-1.5 text-xs text-smoke placeholder-ash outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={spinFromSaved}
                className="flex-1 rounded-pill border border-gold/40 bg-gold/10 px-3 py-1.5 font-data text-xs text-gold transition hover:bg-gold/20 hover:border-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                🎲 Spin From Saved
              </button>
              <button
                type="button"
                onClick={exportWatchlist}
                title="Copy watchlist text to clipboard"
                className="rounded-pill border border-brass/40 px-3 py-1.5 font-data text-xs text-ash transition hover:border-gold/50 hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                📋 Export
              </button>
            </div>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          {loading && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-20 w-full" />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <span className="text-4xl opacity-60" aria-hidden="true">🎟️</span>
              <p className="font-body text-sm text-smoke">No saved titles yet.</p>
              <p className="font-body text-sm text-ash">Spin, then hit Save on anything you like.</p>
            </div>
          )}

          {!loading && items.length > 0 && filteredItems.length === 0 && (
            <div className="py-8 text-center text-xs text-ash">
              No saved titles match &quot;{search}&quot;
            </div>
          )}

          {!loading &&
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="mb-3 flex items-center gap-3 rounded-card border border-brass/25 bg-velvet/50 p-2 transition hover:border-brass/50"
              >
                <div className="relative h-20 w-[54px] shrink-0 overflow-hidden rounded bg-velvet">
                  {item.posterPath && (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
                      alt=""
                      fill
                      sizes="54px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <a
                    href={`/title/${item.id}`}
                    className="block truncate font-body text-sm text-smoke transition hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    {item.title}
                  </a>
                  <p className="font-data text-[11px] text-ash">
                    {item.releaseYear ?? "—"}
                    {typeof item.voteAverage === "number" && ` · ★ ${item.voteAverage.toFixed(1)}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => unsave(item.id)}
                  aria-label={`Remove ${item.title} from saved`}
                  className="shrink-0 rounded-pill border border-brass/40 px-2.5 py-1.5 font-data text-[11px] text-ash transition hover:border-marquee hover:text-marquee focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  Remove
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}