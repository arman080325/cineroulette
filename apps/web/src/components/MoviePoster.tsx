"use client";

import { useState } from "react";
import Image from "next/image";

interface MoviePosterProps {
  title: string;
  posterPath: string | null;
  className?: string;
  priority?: boolean;
}

export function MoviePoster({
  title,
  posterPath,
  className = "",
  priority = false,
}: MoviePosterProps) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const src = posterPath && !hasError
    ? posterPath.startsWith("http")
      ? posterPath
      : `https://image.tmdb.org/t/p/w500${posterPath}`
    : null;

  return (
    <div className={`relative h-full w-full overflow-hidden bg-ink ${className}`}>
      {src ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 skeleton flex items-center justify-center">
              <span className="text-3xl opacity-30 animate-pulse" aria-hidden="true">🎬</span>
            </div>
          )}
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width: 640px) 300px, 360px"
            className={`object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            priority={priority}
            unoptimized
            onLoad={() => setLoaded(true)}
            onError={() => setHasError(true)}
          />
        </>
      ) : (
        /* Fallback Art Card */
        <div className="h-full w-full flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#1b2038] via-[#0d1020] to-[#080a14] border border-brass/30 text-center">
          <div className="flex items-center gap-1.5 font-data text-[10px] uppercase tracking-[0.3em] text-gold/70">
            <span>CINEROULETTE</span>
          </div>

          <div className="my-auto flex flex-col items-center gap-3">
            <span className="text-5xl filter drop-shadow-[0_0_12px_rgba(56,225,255,0.5)]" aria-hidden="true">
              🎬
            </span>
            <span className="font-display text-3xl leading-tight text-white line-clamp-3 max-w-[240px]">
              {title}
            </span>
          </div>

          <div className="font-data text-[10px] tracking-widest text-ash/80">
            OFFICIAL SELECTION
          </div>
        </div>
      )}
    </div>
  );
}
