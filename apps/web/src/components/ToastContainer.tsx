"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "@/lib/toast-store";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <aside aria-label="Notifications" aria-live="polite" className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center gap-3 rounded-card border border-gold/40 bg-ink/95 px-4 py-3 shadow-glow backdrop-blur-md"
          >
            <span className="text-lg" aria-hidden="true">
              {toast.icon}
            </span>
            <p className="flex-1 font-body text-sm text-smoke">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded font-data text-xs text-ash hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </aside>
  );
}
