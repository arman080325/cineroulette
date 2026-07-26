"use client";

import { useId } from "react";

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  const gradId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="CineRoulette logo"
    >
      <defs>
        <linearGradient id={`cr-logo-${gradId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4d8d" />
          <stop offset="100%" stopColor="#38e1ff" />
        </linearGradient>
      </defs>

      {/* Outer ring — the roulette wheel */}
      <circle cx="24" cy="24" r="20.5" fill="none" stroke={`url(#cr-logo-${gradId})`} strokeWidth="2.25" />

      {/* Pockets around the rim */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * 2 * Math.PI;
        const x1 = 24 + 17.5 * Math.cos(angle);
        const y1 = 24 + 17.5 * Math.sin(angle);
        const x2 = 24 + 20 * Math.cos(angle);
        const y2 = 24 + 20 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={`url(#cr-logo-${gradId})`}
            strokeWidth="1.5"
            opacity={i % 2 === 0 ? 0.9 : 0.35}
          />
        );
      })}

      {/* Center hub — the "cine" half: a play mark, like a title reveal */}
      <circle cx="24" cy="24" r="12.5" fill="#0a0d1a" stroke={`url(#cr-logo-${gradId})`} strokeWidth="1.25" />
      <path d="M20.5 17.5 L20.5 30.5 L31.5 24 Z" fill={`url(#cr-logo-${gradId})`} />
    </svg>
  );
}