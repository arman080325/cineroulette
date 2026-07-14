/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        marquee: "#c8102e",
        gold: "#ffd36a",
        velvet: "#0a0605",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        card: "12px",
        pill: "999px",
      },
      boxShadow: {
        glow: "0 0 24px 4px rgba(200, 16, 46, 0.25)",
        goldglow: "0 0 20px 3px rgba(255, 211, 106, 0.35)",
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
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        kenburns: "kenburns 14s ease-in-out infinite",
        "spin-slow": "spin 16s linear infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};