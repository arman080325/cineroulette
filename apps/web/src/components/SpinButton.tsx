"use client";

export function SpinButton({ spinning, onSpin }: { spinning: boolean; onSpin: () => void }) {
  const idleLetters = "SPIN THE ROULETTE".split("");
  const activeLetters = "SPINNING…".split("");

  return (
    <div className="relative hidden lg:inline-block">
      <style>{`
        .spin-btn {
          --radius: 20px;
          --pad: 3px;
          --a: #ff4d8d;
          --b: #38e1ff;
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1.1rem 2.2rem;
          border-radius: var(--radius);
          background: #0d0f1c;
          border: 1px solid rgba(255,255,255,0.12);
          cursor: pointer;
          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.15),
            inset 0 3px 6px rgba(255,255,255,0.05),
            0 0 0 rgba(255,77,141,0);
          transition: box-shadow 0.4s ease, border-color 0.4s ease, transform 0.15s ease;
        }
        .spin-btn::before {
          content: "";
          position: absolute;
          inset: calc(-1 * var(--pad));
          border-radius: calc(var(--radius) + var(--pad));
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(135deg, var(--a), var(--b));
          opacity: 0.55;
          filter: blur(2px);
          transition: opacity 0.4s ease, filter 0.4s ease;
        }
        .spin-btn:hover {
          border-color: rgba(255,255,255,0.25);
          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.2),
            0 0 26px 4px rgba(255,77,141,0.45),
            0 0 44px 10px rgba(56,225,255,0.25);
          transform: translateY(-1px);
        }
        .spin-btn:hover::before { opacity: 0.85; filter: blur(3px); }
        .spin-btn:active { transform: scale(0.97); }
        .spin-btn:disabled { cursor: default; }

        .spin-btn[data-spinning="true"] {
          border-color: rgba(56,225,255,0.4);
          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.2),
            0 0 30px 6px rgba(56,225,255,0.4),
            0 0 55px 14px rgba(255,77,141,0.3);
        }
        .spin-btn[data-spinning="true"]::before { opacity: 1; filter: blur(4px); }

        .spin-letter {
          display: inline-block;
          font-family: var(--font-display);
          font-size: 1.7rem;
          letter-spacing: 0.03em;
          color: rgba(255,255,255,0.55);
          animation: spin-shimmer 2.4s ease-in-out infinite;
          transition: color 0.3s ease, text-shadow 0.3s ease;
        }
        .spin-letter.space { width: 0.4em; }
        @keyframes spin-shimmer {
          50% { color: #fff; text-shadow: 0 0 8px rgba(255,255,255,0.5); }
        }

        .spin-btn[data-spinning="true"] .spin-letter {
          animation: spin-shimmer-fast 1s ease-in-out infinite;
          color: #38e1ff;
        }
        @keyframes spin-shimmer-fast {
          50% { color: #ff4d8d; text-shadow: 0 0 10px rgba(56,225,255,0.7); }
        }

        .spin-icon {
          font-size: 1.6rem;
          filter: drop-shadow(0 0 6px rgba(255,77,141,0.6));
          animation: spin-icon-pulse 2.4s ease-in-out infinite;
        }
        .spin-btn[data-spinning="true"] .spin-icon {
          animation: spin-icon-spin 0.9s linear infinite;
        }
        @keyframes spin-icon-pulse {
          50% { transform: scale(1.12); }
        }
        @keyframes spin-icon-spin {
          100% { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .spin-letter, .spin-icon, .spin-btn { animation: none !important; transition: none !important; }
        }
      `}</style>

      <button
        type="button"
        onClick={onSpin}
        disabled={spinning}
        data-spinning={spinning}
        className="spin-btn text-velvet focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold"
      >
        <span className="spin-icon" aria-hidden="true">🎬</span>
        <span className="flex">
          {(spinning ? activeLetters : idleLetters).map((ch, i) => (
            <span key={i} className={`spin-letter${ch === " " ? " space" : ""}`} style={{ animationDelay: `${i * 0.05}s` }}>
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </span>
      </button>
    </div>
  );
}