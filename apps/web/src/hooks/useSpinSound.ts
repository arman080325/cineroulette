"use client";

import { useRef, useCallback } from "react";
import { useAudioStore } from "../lib/audio-store";

/**
 * Procedural sound engine for the spin/reveal moment.
 * Synthesized Web Audio oscillators — no assets needed.
 * Respects global mute state from useAudioStore.
 */
export function useSpinSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const isMuted = useAudioStore((state) => state.isMuted);

  const ctx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AC();
    }
    return ctxRef.current;
  }, []);

  /** A single short "tick" — used once per reel card during the spin loop. */
  const tick = useCallback(
    (pitch = 520) => {
      if (useAudioStore.getState().isMuted) return;
      try {
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
      } catch {
        // AudioContext error handling
      }
    },
    [ctx]
  );

  /** The lock-in "ding" — bright, two-note chime for the reveal moment. */
  const ding = useCallback(() => {
    if (useAudioStore.getState().isMuted) return;
    try {
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
    } catch {
      // AudioContext error handling
    }
  }, [ctx]);

  /** A low, quiet thud for the near-miss beat — tension, not payoff. */
  const thud = useCallback(() => {
    if (useAudioStore.getState().isMuted) return;
    try {
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
    } catch {
      // AudioContext error handling
    }
  }, [ctx]);

  return { tick, ding, thud, isMuted };
}
