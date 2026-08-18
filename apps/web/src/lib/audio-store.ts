import { create } from "zustand";

interface AudioState {
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
}

const STORAGE_KEY = "cineroulette_sound_muted";

export const useAudioStore = create<AudioState>((set) => {
  let initialMuted = false;
  if (typeof window !== "undefined") {
    try {
      initialMuted = localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      // Storage unavailable
    }
  }

  return {
    isMuted: initialMuted,
    toggleMute: () => {
      set((state) => {
        const next = !state.isMuted;
        try {
          localStorage.setItem(STORAGE_KEY, String(next));
        } catch {
          // Ignore
        }
        return { isMuted: next };
      });
    },
    setMuted: (muted) => {
      try {
        localStorage.setItem(STORAGE_KEY, String(muted));
      } catch {
        // Ignore
      }
      set({ isMuted: muted });
    },
  };
});
