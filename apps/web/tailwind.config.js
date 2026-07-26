/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Neo-Noir Nightscreen" — midnight base, electric neon signature.
        // Token NAMES are unchanged from the previous theme so no component
        // markup needs editing; only the hex values shift the whole look.
        velvet: "#080a14",   // page base — deep midnight indigo
        ink: "#111527",      // raised glass surface — panels, cards, drawer
        marquee: "#ff4d8d",  // primary action — neon magenta
        gold: "#38e1ff",     // "lit": active, selected, focus — electric cyan
        brass: "#3a4166",    // resting borders/icons only — never text (2:1)
        smoke: "#c7cdf0",    // body text — cool off-white
        ash: "#8a90b8",      // secondary text — verified AA
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        data: ["var(--font-data)"],
      },
      borderRadius: { card: "16px", pill: "999px" },
      boxShadow: {
        glow: "0 0 28px 4px rgba(255, 77, 141, 0.35)",
        goldglow: "0 0 24px 3px rgba(56, 225, 255, 0.4)",
        lift: "0 20px 50px -12px rgba(0, 0, 0, 0.8)",
        glass: "0 8px 32px -8px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(199, 205, 240, 0.06)",
      },
      transitionTimingFunction: {
        snap: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        ui: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.25" },
          "50%": { transform: "translateY(-16px)", opacity: "0.7" },
        },
        kenburns: {
          "0%": { transform: "scale(1) translate(0, 0)" },
          "50%": { transform: "scale(1.08) translate(-1%, 1%)" },
          "100%": { transform: "scale(1) translate(0, 0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 24px 3px rgba(255, 77, 141, 0.45)" },
          "50%": { boxShadow: "0 0 44px 10px rgba(255, 77, 141, 0.7)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "neon-flicker": {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.7" },
          "94%": { opacity: "1" },
          "96%": { opacity: "0.85" },
          "97%": { opacity: "1" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        kenburns: "kenburns 14s ease-in-out infinite",
        "spin-slow": "spin 16s linear infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        "neon-flicker": "neon-flicker 5s linear infinite",
        "gradient-pan": "gradient-pan 8s ease infinite",
      },
    },
  },
  plugins: [],
};