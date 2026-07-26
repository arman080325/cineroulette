"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface GenerateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    idleText?: string;
    activeText?: string;
    isGenerating?: boolean;
}

export function GenerateButton({
    idleText = "Spin Again",
    activeText = "Spinning",
    isGenerating: controlledIsGenerating,
    className,
    onClick,
    ...props
}: GenerateButtonProps) {
    const [isFocused, setIsFocused] = useState(false);
    const isGenerating = controlledIsGenerating !== undefined ? controlledIsGenerating : isFocused;

    return (
        <div className="relative inline-block">
            <style>{`
.gen-btn {
          --radius: 22px;
          --pad: 4px;
          --transition: 0.4s;
          --a: #ff4d8d;
          --b: #38e1ff;

          user-select: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.85em 1.9em;
          font-family: var(--font-display);
          font-size: 1.55rem;
          font-weight: 400;
          text-transform: uppercase;

          background-color: #0d0f1c;
          border: solid 1px rgba(255,255,255,0.14);
          border-radius: var(--radius);
          cursor: pointer;

          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.15),
            inset 0 3px 6px rgba(255,255,255,0.06),
            inset 0 8px 12px rgba(255,255,255,0.04);

          transition: box-shadow var(--transition), border-color var(--transition), transform 0.15s ease;
        }

        .gen-btn::before {
          content: "";
          position: absolute;
          inset: calc(-1 * var(--pad));
          border-radius: calc(var(--radius) + var(--pad));
          pointer-events: none;
          z-index: -1;
          background: linear-gradient(135deg, var(--a), var(--b));
          opacity: 0.5;
          filter: blur(2px);
          transition: opacity var(--transition), filter var(--transition);
        }

        .gen-btn-icon {
          font-size: 1.5rem;
          filter: drop-shadow(0 0 5px rgba(255,77,141,0.6));
          animation: gen-icon-pulse 2.2s ease-in-out infinite;
        }

        @keyframes gen-icon-pulse {
          50% { transform: scale(1.14); }
        }

          .gen-btn-letter {
          position: relative;
          display: inline-block;
          letter-spacing: 0.02em;
          color: rgba(255,255,255,0.4);
          animation: gen-letter-anim 2.2s ease-in-out infinite;
          transition: color var(--transition), text-shadow var(--transition);
        }
          
        @keyframes gen-letter-anim {
          50% {
            text-shadow: 0 0 6px rgba(255,255,255,0.5);
            color: #fff;
          }
        }

        .gen-txt-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 6.4em;
        }

        .gen-txt-1, .gen-txt-2 {
          position: absolute;
        }

        .gen-txt-2 { opacity: 0; }

        .gen-btn[data-generating="true"] .gen-txt-1 {
          animation: gen-fade 0.3s ease-in-out forwards;
        }
        .gen-btn[data-generating="true"] .gen-txt-2 {
          animation: gen-fade 0.3s ease-in-out reverse forwards;
        }
        @keyframes gen-fade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        .gen-btn[data-generating="true"] .gen-btn-letter {
          animation: gen-letter-anim 0.7s ease-in-out infinite;
          color: #38e1ff;
        }
        .gen-btn[data-generating="true"] .gen-btn-letter:nth-child(odd) {
          color: #ff4d8d;
        }
        .gen-btn[data-generating="true"] .gen-btn-icon {
          animation: gen-icon-spin 0.9s linear infinite;
        }
        @keyframes gen-icon-spin {
          100% { transform: rotate(360deg); }
        }
        .gen-btn[data-generating="true"] {
          border-color: rgba(56,225,255,0.45);
          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.2),
            0 0 26px 5px rgba(56,225,255,0.4),
            0 0 46px 12px rgba(255,77,141,0.28);
        }
        .gen-btn[data-generating="true"]::before {
          opacity: 0.95;
          filter: blur(4px);
        }

        .gen-btn-letter:nth-child(1) { animation-delay: 0s; }
        .gen-btn-letter:nth-child(2) { animation-delay: 0.06s; }
        .gen-btn-letter:nth-child(3) { animation-delay: 0.12s; }
        .gen-btn-letter:nth-child(4) { animation-delay: 0.18s; }
        .gen-btn-letter:nth-child(5) { animation-delay: 0.24s; }
        .gen-btn-letter:nth-child(6) { animation-delay: 0.3s; }
        .gen-btn-letter:nth-child(7) { animation-delay: 0.36s; }
        .gen-btn-letter:nth-child(8) { animation-delay: 0.42s; }
        .gen-btn-letter:nth-child(9) { animation-delay: 0.48s; }
        .gen-btn-letter:nth-child(10) { animation-delay: 0.54s; }

        .gen-btn:hover {
          border-color: rgba(255,255,255,0.3);
          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.2),
            0 0 24px 4px rgba(255,77,141,0.45),
            0 0 40px 10px rgba(56,225,255,0.25);
          transform: translateY(-1px);
        }
        .gen-btn:hover::before { opacity: 0.9; }
        .gen-btn:hover .gen-btn-icon { animation: none; transform: scale(1.1); }

        .gen-btn:active { transform: scale(0.96); }
        .gen-btn:disabled { cursor: default; opacity: 0.65; }

        @media (prefers-reduced-motion: reduce) {
          .gen-btn-letter, .gen-btn-icon, .gen-btn { animation: none !important; }
        }
      `}</style>

            <button
                type="button"
                className={cn(
                    "gen-btn text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    className
                )}
                data-generating={isGenerating}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onClick={(e) => {
                    setIsFocused(true);
                    onClick?.(e);
                }}
                {...props}
            >
                <span className="gen-btn-icon" aria-hidden="true">🎬</span>

                <div className="gen-txt-wrapper">
                    <div className="gen-txt-1">
                        {idleText.split("").map((letter, i) => (
                            <span key={`t1-${i}`} className="gen-btn-letter">
                                {letter === " " ? "\u00A0" : letter}
                            </span>
                        ))}
                    </div>
                    <div className="gen-txt-2">
                        {activeText.split("").map((letter, i) => (
                            <span key={`t2-${i}`} className="gen-btn-letter">
                                {letter === " " ? "\u00A0" : letter}
                            </span>
                        ))}
                    </div>
                </div>
            </button>
        </div>
    );
}

export default GenerateButton;