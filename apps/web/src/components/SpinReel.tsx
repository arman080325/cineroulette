"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MarqueeBorder } from "./MarqueeBorder";
import { useSpinSound } from "../hooks/useSpinSound";

export interface SpinReelResult {
  id: string;
  title: string;
  releaseYear: number | null;
  overview: string | null;
  posterPath: string | null;
  voteAverage?: number | null;
  genres?: string[];
  watchProviders?: { name: string; type: string; link: string }[];
}

type Phase = "idle" | "fast" | "nearMiss" | "correcting" | "locked";

// Real movie posters are a 2:3 ratio (TMDB w500 = 500x750). Sizing the reel
// window to match means the final poster fills it cleanly instead of being
// squeezed into a roughly-square frame.
const CARD_W = 300;
const CARD_H = 450;
const GAP = 14;
const STEP = CARD_H + GAP; // must match the actual rendered spacing exactly, or the strip drifts off-frame by the final card
const FILLER_COUNT = 14;

const FILLER_PALETTE = [
  { grad: "from-red-900 to-neutral-950", glyph: "🎬" },
  { grad: "from-amber-800 to-neutral-950", glyph: "🎭" },
  { grad: "from-indigo-900 to-neutral-950", glyph: "🌙" },
  { grad: "from-emerald-900 to-neutral-950", glyph: "🌴" },
  { grad: "from-rose-900 to-neutral-950", glyph: "❤️" },
  { grad: "from-slate-800 to-neutral-950", glyph: "🕵️" },
];

function ReelSlot({ children, marginBottom = GAP }: { children: React.ReactNode; marginBottom?: number }) {
  return (
    <div style={{ height: CARD_H, width: CARD_W, marginBottom }} className="shrink-0">
      {children}
    </div>
  );
}

function FillerCard({ seed }: { seed: number }) {
    // Safe: seed % FILLER_PALETTE.length is always a valid index into that array.
  const p = FILLER_PALETTE[seed % FILLER_PALETTE.length]!;
  return (
    <div
      className={`h-full w-full flex items-center justify-center rounded-card bg-gradient-to-br ${p.grad} border border-neutral-800`}
    >
      <span className="text-6xl opacity-60">{p.glyph}</span>
    </div>
  );
}

function NearMissCard() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center rounded-card bg-gradient-to-br from-neutral-800 to-neutral-950 border border-gold/40">
      <span className="text-6xl mb-3">🎞️</span>
      <span className="text-neutral-500 text-sm tracking-wide font-body">almost...</span>
    </div>
  );
}

function PosterCard({ result }: { result: SpinReelResult }) {
  const src = result.posterPath ? `https://image.tmdb.org/t/p/w500${result.posterPath}` : null;
  return (
    <div className="h-full w-full rounded-card overflow-hidden border border-neutral-800 bg-neutral-900 relative shadow-glow">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={result.title} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-marquee/40 to-neutral-950 p-6">
          <span className="font-display text-4xl text-center leading-tight">{result.title}</span>
        </div>
      )}
    </div>
  );
}

export function SpinReel({
  spinning,
  result,
  onRevealComplete,
}: {
  spinning: boolean;
  result: SpinReelResult | null;
  onRevealComplete?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [shake, setShake] = useState(false);
  const sound = useSpinSound();
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const filler = useMemo(() => Array.from({ length: FILLER_COUNT }, (_, i) => i), []);
  const nearMissIndex = FILLER_COUNT;
  const finalIndex = FILLER_COUNT + 1;

  useEffect(() => {
    if (!spinning || !result) return;

    if (reducedMotion.current) {
      setPhase("locked");
      sound.ding();
      onRevealComplete?.();
      return;
    }

    let cancelled = false;
    setPhase("fast");

    let interval = 70;
    const tickLoop = (elapsed: number) => {
      if (cancelled || elapsed > 1500) return;
      sound.tick(420 + Math.random() * 120);
      interval = Math.min(interval * 1.12, 240);
      setTimeout(() => tickLoop(elapsed + interval), interval);
    };
    tickLoop(0);

    const t1 = setTimeout(() => {
      if (cancelled) return;
      setPhase("nearMiss");
      sound.thud();
    }, 1600);

    const t2 = setTimeout(() => {
      if (cancelled) return;
      setPhase("correcting");
      sound.tick(300);
      setTimeout(() => sound.tick(360), 90);
    }, 1900);

    const t3 = setTimeout(() => {
      if (cancelled) return;
      setPhase("locked");
      sound.ding();
      setShake(true);
      setTimeout(() => setShake(false), 350);
      onRevealComplete?.();
    }, 2350);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, result]);

  if (!spinning && phase === "idle") return null;

  const y =
    phase === "fast"
      ? -(nearMissIndex - 1) * STEP
      : phase === "nearMiss"
        ? -nearMissIndex * STEP
        : -finalIndex * STEP;

  const transition =
    phase === "fast"
      ? { duration: 1.55, ease: [0.15, 0.85, 0.25, 1] as const }
      : phase === "correcting" || phase === "locked"
        ? { duration: 0.42, ease: [0.34, 1.56, 0.64, 1] as const }
        : { duration: 0 };

  return (
    <motion.div
      animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      className="relative"
      style={{ width: CARD_W }}
    >
      <div
        className="relative overflow-hidden rounded-card ring-1 ring-neutral-800"
        style={{ height: CARD_H }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/80 z-10 flex flex-col justify-around py-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-3 w-1.5 mx-auto rounded-full bg-neutral-700" />
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-black/80 z-10 flex flex-col justify-around py-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-3 w-1.5 mx-auto rounded-full bg-neutral-700" />
          ))}
        </div>

        <motion.div animate={{ y }} transition={transition} className="px-3.5">
          {filler.map((i) => (
            <ReelSlot key={`filler-${i}`}>
              <FillerCard seed={i} />
            </ReelSlot>
          ))}
          <ReelSlot key="near-miss">
            <NearMissCard />
          </ReelSlot>
          {result && (
            <ReelSlot key="final">
              <PosterCard result={result} />
            </ReelSlot>
          )}
        </motion.div>
      </div>

      <MarqueeBorder active={phase === "locked"} />
    </motion.div>
  );
}
