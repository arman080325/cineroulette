"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface Option {
  value: string;
  label: string;
}

interface CinemaSelectProps {
  label: string;
  placeholder: string;
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  searchable?: boolean;
}

export function CinemaSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  searchable = true,
}: CinemaSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = searchable && search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase().trim()))
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearch("");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const sel = filteredOptions[highlightedIndex];
        if (sel) {
          onChange(sel.value);
          setIsOpen(false);
          setSearch("");
        }
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full font-body text-sm ${isOpen ? "z-50" : "z-10"}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        className={`flex min-h-[44px] w-full items-center justify-between rounded-pill border px-4 py-2 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
          value
            ? "border-gold/60 bg-ink text-gold shadow-glow font-medium"
            : "border-brass/40 bg-velvet/80 text-smoke hover:border-gold/50"
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 pl-2">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange(null);
                }
              }}
              className="text-xs text-ash transition hover:text-marquee"
              title="Clear selection"
              aria-label="Clear selection"
            >
              ✕
            </span>
          )}
          <span className={`text-[10px] text-ash transition-transform duration-200 ${isOpen ? "rotate-180 text-gold" : ""}`}>
            ▼
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-brass/50 bg-[#101428] shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl ring-1 ring-gold/20"
          >
            {searchable && (
              <div className="border-b border-brass/25 p-2 bg-[#0c0f20]">
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="w-full rounded-pill border border-brass/40 bg-velvet px-3 py-1.5 text-xs text-white placeholder-ash outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold"
                />
              </div>
            )}

            <div role="listbox" className="max-h-56 overflow-y-auto p-1.5 custom-scrollbar">
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
                  !value
                    ? "bg-gold/20 text-gold font-medium"
                    : "text-smoke hover:bg-brass/30 hover:text-white"
                }`}
              >
                <span>{placeholder}</span>
                {!value && <span>✓</span>}
              </button>

              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-xs text-ash">No options match &quot;{search}&quot;</div>
              ) : (
                filteredOptions.map((opt, i) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = i === highlightedIndex;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
                        isSelected
                          ? "bg-gold/20 text-gold font-medium"
                          : isHighlighted
                          ? "bg-brass/30 text-white"
                          : "text-smoke hover:bg-brass/25 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
