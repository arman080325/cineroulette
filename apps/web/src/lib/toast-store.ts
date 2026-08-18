import { create } from "zustand";

export interface ToastMessage {
  id: string;
  message: string;
  type?: "info" | "success" | "warning";
  icon?: string;
}

interface ToastState {
  toasts: ToastMessage[];
  showToast: (message: string, options?: { type?: "info" | "success" | "warning"; icon?: string; duration?: number }) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, options = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = {
      id,
      message,
      type: options.type ?? "success",
      icon: options.icon ?? "🎟️",
    };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, options.duration ?? 3000);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
