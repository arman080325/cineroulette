"use client";

import { useRef, useCallback } from "react";

/**
 * Tiny procedural sound engine for the spin/reveal moment (Section 09:
 * "a short sound cue"). No audio files to fetch/host — every sound is a
 * synthesized Web Audio oscillator, so it's instant and license-free.
 *
 * AudioContext requires a user gesture to start — safe here since it's
 * only ever created inside the Spin button's click handler.
 */
export function useSpinSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ctx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AC();
    }
    return ctxRef.current;
  }, []);

  /** A single short "tick" — used once per reel card during the spin loop. */
  const tick = useCallback(
    (pitch = 520) => {
      const c = ctx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "square";
      osc.frequency.value = pitch;
      gain.gain.setValueAtTime(0.05, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.05);
      osc.connect(gain).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.05);
    },
    [ctx]
  );

  /** The lock-in "ding" — bright, two-note chime for the reveal moment. */
  const ding = useCallback(() => {
    const c = ctx();
    [880, 1318.5].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = c.currentTime + i * 0.06;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain).connect(c.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  }, [ctx]);

  /** A low, quiet thud for the near-miss beat — tension, not payoff. */
  const thud = useCallback(() => {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = 180;
    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.15);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.15);
  }, [ctx]);

  return { tick, ding, thud };
}
