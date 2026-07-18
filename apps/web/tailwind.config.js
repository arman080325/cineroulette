/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        velvet: "#0a0605",   // page base
        ink: "#14100e",      // raised surface — panels, cards, drawer
        marquee: "#c8102e",  // primary action ONLY
        gold: "#ffd36a",     // means "lit": active, selected, focused
        brass: "#8a6d3b",    // resting metal — borders/icons only, never text
        smoke: "#a09a94",    // body text (warm; replaces cold neutral-400)
        ash: "#827a73",      // secondary text — 4.78:1, verified AA
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        data: ["var(--font-data)"], // ticket print
      },
      borderRadius: { card: "12px", pill: "999px" },
      boxShadow: {
        glow: "0 0 24px 4px rgba(200, 16, 46, 0.25)",
        goldglow: "0 0 20px 3px rgba(255, 211, 106, 0.35)",
        lift: "0 8px 24px -6px rgba(0, 0, 0, 0.7)",
      },
      transitionTimingFunction: {
        snap: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        ui: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.2" },
          "50%": { transform: "translateY(-14px)", opacity: "0.6" },
        },
        kenburns: {
          "0%": { transform: "scale(1) translate(0, 0)" },
          "50%": { transform: "scale(1.08) translate(-1%, 1%)" },
          "100%": { transform: "scale(1) translate(0, 0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px 2px rgba(200, 16, 46, 0.35)" },
          "50%": { boxShadow: "0 0 36px 8px rgba(200, 16, 46, 0.6)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        kenburns: "kenburns 14s ease-in-out infinite",
        "spin-slow": "spin 16s linear infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};