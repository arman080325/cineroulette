"use client";

import { useEffect, useState } from "react";

export function PosterWallBackground() {
  const [posters, setPosters] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/v1/featured")
      .then((r) => r.json())
      .then((d) => setPosters((d.posters ?? []).filter(Boolean)))
      .catch(() => setPosters([]));
  }, []);

  if (posters.length === 0) return null;

  const tiles = Array.from({ length: 16 }, (_, i) => posters[i % posters.length]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 opacity-[0.14] scale-110 blur-[1px]">
        {tiles.map((path, i) => (
          <div
            key={i}
            className="aspect-[2/3] rounded-md overflow-hidden animate-kenburns"
            style={{ animationDelay: `${(i % 8) * 1.1}s` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://image.tmdb.org/t/p/w92${path}`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover grayscale"
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-velvet via-velvet/85 to-velvet" />
    </div>
  );
}