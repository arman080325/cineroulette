"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TrailerModalProps {
  titleId: string;
  movieTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TrailerModal({ titleId, movieTitle, isOpen, onClose }: TrailerModalProps) {
  const [loading, setLoading] = useState(true);
  const [youtubeKey, setYoutubeKey] = useState<string | null>(null);
  const [searchUrl, setSearchUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !titleId) return;
    setLoading(true);
    setYoutubeKey(null);
    setSearchUrl(null);

    fetch(`/api/v1/titles/${titleId}/trailer`)
      .then((r) => r.json())
      .then((data) => {
        if (data.youtubeKey) {
          setYoutubeKey(data.youtubeKey);
        } else if (data.searchUrl) {
          setSearchUrl(data.searchUrl);
        }
      })
      .catch(() => {
        const query = encodeURIComponent(`${movieTitle} official trailer`);
        setSearchUrl(`https://www.youtube.com/results?search_query=${query}`);
      })
      .finally(() => setLoading(false));
  }, [isOpen, titleId, movieTitle]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-brass/40 bg-ink shadow-lift"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brass/25 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden="true">🎬</span>
              <h3 className="font-display text-xl tracking-wide text-white truncate max-w-md">
                {movieTitle} — Trailer
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-pill border border-brass/40 px-3 py-1 font-data text-xs text-ash transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              ✕ Close
            </button>
          </div>

          {/* Video Content */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            {loading && (
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                <p className="font-data text-xs uppercase tracking-widest text-ash">
                  Loading Trailer...
                </p>
              </div>
            )}

            {!loading && youtubeKey && (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1`}
                title={`${movieTitle} Official Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            )}

            {!loading && !youtubeKey && (
              <div className="p-8 text-center flex flex-col items-center gap-4">
                <span className="text-4xl opacity-70" aria-hidden="true">🎞️</span>
                <p className="font-body text-sm text-smoke">
                  Trailer embed not directly available for this title.
                </p>
                {searchUrl && (
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] inline-flex items-center gap-2 rounded-2xl bg-marquee px-6 py-2.5 font-body text-sm font-medium text-white shadow-glow transition hover:brightness-110"
                  >
                    ▶ Watch on YouTube
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
