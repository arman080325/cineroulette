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

const GAP = 14;
const RAIL = 14; // horizontal padding each side of the strip
const FILLER_COUNT = 14;

const FILLER_PALETTE = [
  { grad: "from-red-900 to-neutral-950", glyph: "🎬" },
  { grad: "from-amber-800 to-neutral-950", glyph: "🎭" },
  { grad: "from-indigo-900 to-neutral-950", glyph: "🌙" },
  { grad: "from-emerald-900 to-neutral-950", glyph: "🌴" },
  { grad: "from-rose-900 to-neutral-950", glyph: "❤️" },
  { grad: "from-slate-800 to-neutral-950", glyph: "🕵️" },
];

function FillerCard({ seed }: { seed: number }) {
  const p = FILLER_PALETTE[seed % FILLER_PALETTE.length]!;
  return (
    <div className={`h-full w-full flex items-center justify-center rounded-card bg-gradient-to-br ${p.grad} border border-brass/25`}>
      <span className="text-6xl opacity-60" aria-hidden="true">{p.glyph}</span>
    </div>
  );
}

function NearMissCard() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center rounded-card bg-gradient-to-br from-neutral-800 to-neutral-950 border border-gold/40">
      <span className="text-6xl mb-3" aria-hidden="true">🎞️</span>
      <span className="font-data text-xs tracking-widest text-ash">ALMOST</span>
    </div>
  );
}

function PosterCard({ result }: { result: SpinReelResult }) {
  const src = result.posterPath ? `https://image.tmdb.org/t/p/w500${result.posterPath}` : null;
  return (
    <div className="h-full w-full rounded-card overflow-hidden border border-brass/30 bg-ink relative shadow-glow">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={result.title} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-marquee/40 to-velvet p-6">
          <span className="font-display text-4xl text-center leading-tight text-smoke">{result.title}</span>
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
  const [cardH, setCardH] = useState(450);
  const [faded, setFaded] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const sound = useSpinSound();
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Measure, never guess: STEP must equal rendered spacing exactly or the
  // strip drifts off-frame by the final card.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const contentW = entry.contentRect.width - RAIL * 2;
      if (contentW > 0) setCardH(Math.round(contentW * 1.5)); // locked 2:3 poster ratio
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const STEP = cardH + GAP;
  const filler = useMemo(() => Array.from({ length: FILLER_COUNT }, (_, i) => i), []);
  const nearMissIndex = FILLER_COUNT;
  const finalIndex = FILLER_COUNT + 1;

  useEffect(() => {
    if (!spinning || !result) return;

    // Reduced motion: crossfade rather than hard-skip, so the spin still
    // reads as an event instead of the result appearing from nowhere.
    if (reducedMotion.current) {
      setPhase("locked");
      setFaded(false);
      const t = setTimeout(() => {
        setFaded(true);
        sound.ding();
        onRevealComplete?.();
      }, 300);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    setPhase("fast");
    setFaded(true);

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
      className="relative w-full max-w-[300px] sm:max-w-[340px]"
      style={{ opacity: faded ? 1 : 0, transition: "opacity 300ms ease-out" }}
    >
      <div
        ref={boxRef}
        className="relative overflow-hidden rounded-card ring-1 ring-brass/30"
        style={{ height: cardH }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/80 z-10 flex flex-col justify-around py-2" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-3 w-1.5 mx-auto rounded-full bg-brass/50" />
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-black/80 z-10 flex flex-col justify-around py-2" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-3 w-1.5 mx-auto rounded-full bg-brass/50" />
          ))}
        </div>

        <motion.div animate={{ y }} transition={transition} style={{ paddingLeft: RAIL, paddingRight: RAIL }}>
          {filler.map((i) => (
            <div key={`filler-${i}`} style={{ height: cardH, marginBottom: GAP }}>
              <FillerCard seed={i} />
            </div>
          ))}
          <div key="near-miss" style={{ height: cardH, marginBottom: GAP }}>
            <NearMissCard />
          </div>
          {result && (
            <div key="final" style={{ height: cardH, marginBottom: GAP }}>
              <PosterCard result={result} />
            </div>
          )}
        </motion.div>
      </div>

      <MarqueeBorder active={phase === "locked"} />
    </motion.div>
  );
}