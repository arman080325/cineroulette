/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        marquee: "#c8102e",
        gold: "#ffd36a",
        velvet: "#0a0605", // near-black with the faintest warm cast, not pure #000
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
    },
  },
  plugins: [],
};
