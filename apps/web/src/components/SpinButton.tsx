"use client";

import { motion, useReducedMotion } from "framer-motion";

export function SpinButton({ spinning, onSpin }: { spinning: boolean; onSpin: () => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onSpin}
      disabled={spinning}
      whileHover={reduceMotion ? undefined : { scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      animate={reduceMotion || spinning ? undefined : { scale: [1, 1.025, 1] }}
      transition={reduceMotion ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      className={`relative hidden items-center gap-4 rounded-[28px] bg-gradient-to-r from-marquee via-[#ff8fc0] to-gold bg-[length:220%_220%] px-16 py-7 font-display text-4xl tracking-wide text-velvet transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold disabled:opacity-60 lg:flex shadow-[0_0_34px_6px_rgba(255,77,141,0.5),0_0_70px_16px_rgba(56,225,255,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_0_44px_10px_rgba(255,77,141,0.65),0_0_90px_22px_rgba(56,225,255,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] ${
        reduceMotion ? "" : "animate-gradient-pan"
      }`}
    >
      <span className={reduceMotion ? "text-3xl" : "animate-neon-flicker text-3xl"} aria-hidden="true">
        🎬
      </span>
      {spinning ? "Spinning…" : "Spin the roulette"}
    </motion.button>
  );
}