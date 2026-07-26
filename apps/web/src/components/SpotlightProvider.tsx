"use client";

import { useEffect } from "react";

/**
 * Drives the cursor-tracked spotlight (--mx/--my consumed by
 * .hero-spotlight in globals.css). rAF-throttled so pointermove never
 * does layout work on the main thread. No-ops for reduced-motion and
 * touch, where a follow-cursor light is either unwanted or meaningless.
 */
export function SpotlightProvider() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.documentElement.style.setProperty("--mx", `${x}%`);
        document.documentElement.style.setProperty("--my", `${y}%`);
        raf = 0;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}