"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MarqueeBorder } from "./MarqueeBorder";
import { useSpinSound } from "../hooks/useSpinSound";

export interface SpinReelResult {
  title: string;
  releaseYear: number | null;
  overview: string | null;
  posterPath: string | null;
}

type Phase = "idle" | "fast" | "nearMiss" | "correcting" | "locked";

const CARD_HEIGHT = 440;
const FILLER_COUNT = 14;

// Placeholder reel cards use a small fixed gradient palette + glyph, never
// real titles — they're texture for the spin, not a promise of what's next.
const FILLER_PALETTE = [
  { grad: "from-red-800 to-neutral-900", glyph: "🎬" },
  { grad: "from-amber-700 to-neutral-900", glyph: "🎭" },
  { grad: "from-indigo-800 to-neutral-900", glyph: "🌙" },
  { grad: "from-emerald-800 to-neutral-900", glyph: "🌴" },
  { grad: "from-rose-800 to-neutral-900", glyph: "❤️" },
  { grad: "from-slate-700 to-neutral-900", glyph: "🕵️" },
];

function FillerCard({ seed }: { seed: number }) {
  const p = FILLER_PALETTE[seed % FILLER_PALETTE.length];
  return (
    <div
      className={`h-[440px] w-full flex items-center justify-center rounded-card bg-gradient-to-br ${p.grad} border border-neutral-800`}
    >
      <span className="text-6xl opacity-70">{p.glyph}</span>
    </div>
  );
}

function NearMissCard() {
  // Deliberately looks "almost real" — same layout as the final card shell —
  // so the false stop reads as a near-hit, not just another filler blur.
  return (
    <div className="h-[440px] w-full flex flex-col items-center justify-center rounded-card bg-gradient-to-br from-neutral-800 to-neutral-950 border border-amber-500/40">
      <span className="text-6xl mb-3">🎞️</span>
      <span className="text-neutral-500 text-sm tracking-wide">almost...</span>
    </div>
  );
}

function PosterCard({ result }: { result: SpinReelResult }) {
  const src = result.posterPath ? `https://image.tmdb.org/t/p/w500${result.posterPath}` : null;
  return (
    <div className="h-[440px] w-full rounded-card overflow-hidden border border-neutral-800 bg-neutral-900 relative">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={result.title} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-marquee/40 to-neutral-950">
          <span className="text-5xl font-bold text-center px-6">{result.title}</span>
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
  const [typedText, setTypedText] = useState("");
  const sound = useSpinSound();
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const filler = useMemo(
    () => Array.from({ length: FILLER_COUNT }, (_, i) => i),
    []
  );
  const nearMissIndex = FILLER_COUNT; // index in the strip
  const finalIndex = FILLER_COUNT + 1;

  // Drives the tick sound at a decelerating cadence, independent of the
  // visual tween — a simple, reliable way to sell "speeding up / slowing
  // down" acoustically without frame-syncing to the transform.
  useEffect(() => {
    if (!spinning || !result) return;

    if (reducedMotion.current) {
      // Skip the reel entirely: straight to reveal for reduced-motion users.
      setPhase("locked");
      sound.ding();
      typeOutExplanation();
      return;
    }

    let cancelled = false;
    setPhase("fast");
    setTypedText("");

    let interval = 70;
    const tickLoop = (elapsed: number) => {
      if (cancelled) return;
      if (elapsed > 1500) return; // stop ticking once we approach the near-miss beat
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
      typeOutExplanation();
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

  function typeOutExplanation() {
    // placeholder — actual explanation text typed in by parent via prop if desired
  }

  if (!spinning && phase === "idle") return null;

  const y =
    phase === "fast"
      ? -(nearMissIndex - 1) * CARD_HEIGHT
      : phase === "nearMiss"
        ? -nearMissIndex * CARD_HEIGHT
        : -finalIndex * CARD_HEIGHT;

  const transition =
    phase === "fast"
      ? { duration: 1.55, ease: [0.15, 0.85, 0.25, 1] as const }
      : phase === "correcting" || phase === "locked"
        ? { duration: 0.42, ease: [0.34, 1.56, 0.64, 1] as const } // slight overshoot on the final snap
        : { duration: 0 };

  return (
    <motion.div
      animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      className="relative w-full max-w-sm mx-auto"
    >
      {/* Film-strip window */}
      <div className="relative h-[440px] w-full overflow-hidden rounded-card ring-1 ring-neutral-800">
        {/* Sprocket rails */}
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

        <motion.div animate={{ y }} transition={transition} className="flex flex-col gap-2 px-4">
          {filler.map((i) => (
            <FillerCard key={`filler-${i}`} seed={i} />
          ))}
          <NearMissCard key="near-miss" />
          {result && <PosterCard key="final" result={result} />}
        </motion.div>

        {/* center-line highlight so the "landing slot" reads clearly during the spin */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[440px] ring-2 ring-marquee/0" />
      </div>

      <MarqueeBorder active={phase === "locked"} />
    </motion.div>
  );
}
