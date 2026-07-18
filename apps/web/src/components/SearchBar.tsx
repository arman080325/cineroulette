"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics-client";
import Image from "next/image";

interface SearchResult {
  id: string;
  title: string;
  releaseYear: number | null;
  posterPath: string | null;
  voteAverage: number | null;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
        setActiveIndex(-1);
        track("search_performed", { query: query.trim(), resultCount: data.results?.length ?? 0 });
      } catch {
        // aborted or failed — ignore, the next keystroke will retry
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectResult(result: SearchResult) {
    track("search_result_clicked", { titleId: result.id, query: query.trim() });
    setOpen(false);
    setQuery("");
    router.push(`/title/${result.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      // Safe: activeIndex is only ever set via Math.min/Math.max against
      // results.length in the arrow-key handlers above, so it's always
      // in bounds here — the assertion tells TS what's already guaranteed.
      const selected = results[activeIndex];
      if (selected) selectResult(selected);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto font-body">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search movies & shows..."
          role="combobox"
          aria-expanded={open}
          aria-controls="search-listbox"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
          className="w-full bg-neutral-900 border border-neutral-700 rounded-pill px-5 py-3 text-white placeholder-neutral-500 focus:border-gold focus-visible:ring-2 focus-visible:ring-gold outline-none transition"
        />
        {loading && (
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-gold border-t-transparent animate-spin"
            aria-hidden="true"
          />
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          id="search-listbox"
          role="listbox"
          className="absolute z-20 mt-2 w-full bg-neutral-900 border border-neutral-700 rounded-card overflow-hidden shadow-glow max-h-80 overflow-y-auto"
        >
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`search-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => selectResult(r)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition ${i === activeIndex ? "bg-marquee/20" : "hover:bg-neutral-800"
                }`}
            >
              <div className="relative h-14 w-10 shrink-0 rounded overflow-hidden bg-neutral-800">
                {r.posterPath ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w92${r.posterPath}`}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{r.title}</p>
                <p className="text-xs text-neutral-500">
                  {r.releaseYear ?? "—"}
                  {typeof r.voteAverage === "number" && ` · ★ ${r.voteAverage.toFixed(1)}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-20 mt-2 w-full bg-neutral-900 border border-neutral-700 rounded-card px-4 py-3 text-sm text-neutral-500">
          No matches yet — try a different spelling.
        </div>
      )}
    </div>
  );
}