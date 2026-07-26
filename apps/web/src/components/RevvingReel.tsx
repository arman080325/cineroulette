"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Cycling text is the actual retention trick — it gives the eye something
// to track instead of a static spinner, and each phrase reads like a real
// step happening rather than a generic "loading" repeated forever.
const MESSAGES = [
  "Revving up the reel",
  "Dimming the house lights",
  "Cueing the projector",
  "Consulting the algorithm",
  "Rolling film",
  "Almost showtime",
];

export function RevvingReel() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 850);
    return () => clearInterval(interval);
  }, []);

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-5 py-16">
      {/* One clean announcement for screen readers — the rotating text below
          is visual-only, cycling it through aria-live would spam every 850ms. */}
      <span className="sr-only">Spinning the reel, please wait.</span>

      <div className="relative flex h-24 w-24 items-center justify-center">
        {!reduceMotion && (
          <div className="absolute inset-0 animate-pulse-glow rounded-full" aria-hidden="true" />
        )}
        <svg
          viewBox="0 0 100 100"
          className="h-20 w-20 text-gold"
          style={reduceMotion ? undefined : { animation: "spin 1.4s linear infinite" }}
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 7" opacity="0.6" />
          <circle cx="50" cy="50" r="11" fill="none" stroke="currentColor" strokeWidth="3" />
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const cx = 50 + 27 * Math.cos(rad);
            const cy = 50 + 27 * Math.sin(rad);
            return <circle key={deg} cx={cx} cy={cy} r="8" fill="none" stroke="currentColor" strokeWidth="2.5" />;
          })}
        </svg>
      </div>

      <div className="h-5 overflow-hidden" aria-hidden="true">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            transition={{ duration: 0.25 }}
            className="block font-data text-xs uppercase tracking-widest text-ash"
          >
            {MESSAGES[index]}…
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}