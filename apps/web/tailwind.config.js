/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        marquee: "#c8102e",
      },
      borderRadius: {
        card: "12px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};
