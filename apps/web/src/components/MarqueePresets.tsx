"use client";

import { motion } from "framer-motion";

export interface PresetFilter {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  mood: string | null;
  genre: string | null;
  minRating: number;
  runtime?: string | null;
  era?: string | null;
}

export const QUICK_PRESETS: PresetFilter[] = [
  {
    id: "date-night",
    title: "Date Night",
    subtitle: "Charming & romantic picks",
    emoji: "🍿",
    mood: "romantic",
    genre: "Romance",
    minRating: 7.0,
  },
  {
    id: "brain-melter",
    title: "Brain Melter",
    subtitle: "Sci-Fi & mind-bending thrillers",
    emoji: "🌀",
    mood: "mind-bending",
    genre: "Science Fiction",
    minRating: 7.0,
  },
  {
    id: "adrenaline",
    title: "Adrenaline Rush",
    subtitle: "Fast-paced high octane action",
    emoji: "⚡",
    mood: "exciting",
    genre: "Action",
    minRating: 6.5,
  },
  {
    id: "late-night-chills",
    title: "Late Night Chills",
    subtitle: "Spooky & atmospheric horror",
    emoji: "🕯️",
    mood: "scary",
    genre: "Horror",
    minRating: 6.5,
  },
  {
    id: "sunday-comfort",
    title: "Sunday Comfort",
    subtitle: "Warm, funny & feel-good",
    emoji: "🛋️",
    mood: "feel-good",
    genre: "Comedy",
    minRating: 7.0,
  },
  {
    id: "masterpiece",
    title: "Top Acclaim",
    subtitle: "Critically acclaimed cinema",
    emoji: "🏆",
    mood: "emotional",
    genre: "Drama",
    minRating: 8.0,
  },
];

interface MarqueePresetsProps {
  onSelectPreset: (preset: PresetFilter) => void;
  disabled?: boolean;
}

export function MarqueePresets({ onSelectPreset, disabled }: MarqueePresetsProps) {
  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-5">
      <div className="text-center">
        <h2 className="font-display text-2xl tracking-wide text-white sm:text-3xl">
          Quick-Spin Curations
        </h2>
        <p className="mt-1 font-body text-xs text-smoke">
          Pick a curated theme for an instant spin, or customize filters above.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_PRESETS.map((preset, i) => (
          <motion.button
            key={preset.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPreset(preset)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            className="surface group flex items-center gap-3 p-3.5 text-left transition duration-200 hover:border-gold/60 hover:bg-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brass/40 bg-velvet text-xl transition duration-200 group-hover:scale-105 group-hover:border-gold/60">
              {preset.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-display text-base tracking-wide text-white group-hover:text-gold transition-colors truncate">
                  {preset.title}
                </span>
                <span className="font-data text-[10px] text-gold/80 ml-1 shrink-0">
                  ★ {preset.minRating.toFixed(1)}+
                </span>
              </div>
              <p className="truncate font-body text-[11px] text-ash group-hover:text-smoke transition-colors">
                {preset.subtitle}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
