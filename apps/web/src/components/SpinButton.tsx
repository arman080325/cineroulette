"use client";

import { motion } from "framer-motion";

export function SpinButton({ spinning, onSpin }: { spinning: boolean; onSpin: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onSpin}
      disabled={spinning}
      whileTap={{ scale: 0.96 }}
      className="relative hidden min-h-[60px] animate-pulse-glow items-center gap-3 rounded-2xl bg-gradient-to-r from-marquee to-[#ff7aa8] px-12 py-4 font-display text-2xl tracking-wide text-velvet transition hover:brightness-110 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold lg:flex"
    >
      <span aria-hidden="true">🎬</span>
      {spinning ? "Spinning…" : "Spin the roulette"}
    </motion.button>
  );
}