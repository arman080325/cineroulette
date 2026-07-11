"use client";

import { useMemo } from "react";

/**
 * The signature element: a ring of marquee bulbs chasing around the result
 * card's border, like the title just got put up in lights. Ties directly
 * to the brand name ("marquee") rather than a generic glow/confetti effect.
 *
 * Bulb count and spacing derive from the card's aspect ratio so it reads
 * correctly at any size — not a fixed magic number of dots.
 */
export function MarqueeBorder({
  active,
  bulbsPerSide = 7,
}: {
  active: boolean;
  bulbsPerSide?: number;
}) {
  const bulbs = useMemo(() => {
    const positions: { top: string; left: string; delay: number }[] = [];
    const total = bulbsPerSide * 4 - 4; // corners shared, roughly a ring
    for (let i = 0; i < total; i++) {
      const t = i / total;
      let top = "0%";
      let left = "0%";
      // walk the four edges of the card in order: top, right, bottom, left
      if (t < 0.25) {
        left = `${(t / 0.25) * 100}%`;
        top = "0%";
      } else if (t < 0.5) {
        left = "100%";
        top = `${((t - 0.25) / 0.25) * 100}%`;
      } else if (t < 0.75) {
        left = `${100 - ((t - 0.5) / 0.25) * 100}%`;
        top = "100%";
      } else {
        left = "0%";
        top = `${100 - ((t - 0.75) / 0.25) * 100}%`;
      }
      positions.push({ top, left, delay: t }); // delay 0-1, scaled to animation duration in CSS var
    }
    return positions;
  }, [bulbsPerSide]);

  return (
    <div
      aria-hidden="true"
      className={`marquee-border ${active ? "marquee-border--active" : ""}`}
    >
      {bulbs.map((b, i) => (
        <span
          key={i}
          className="marquee-bulb"
          style={
            {
              top: b.top,
              left: b.left,
              "--bulb-delay": `${b.delay * 1.4}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
