"use client";

export function SpinButton({
  spinning,
  onSpin,
  size = "large",
}: {
  spinning: boolean;
  onSpin: () => void;
  size?: "large" | "medium";
}) {
  return (
    <button
      type="button"
      onClick={onSpin}
      disabled={spinning}
      className={`group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-marquee via-[#ff75a0] to-gold p-[2px] shadow-glow transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_8px_rgba(255,77,141,0.55)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold ${
        size === "large" ? "w-full max-w-sm sm:w-auto" : "w-auto"
      }`}
    >
      <div className="flex h-full w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#0d1022] px-8 py-3.5 transition-colors group-hover:bg-[#11162e]">
        <span
          className={`text-xl transition-transform duration-300 ${
            spinning ? "animate-spin" : "group-hover:scale-110"
          }`}
          aria-hidden="true"
        >
          🎬
        </span>
        <span className="font-display text-2xl tracking-wider text-white">
          {spinning ? "SPINNING…" : "SPIN ROULETTE"}
        </span>
      </div>
    </button>
  );
}