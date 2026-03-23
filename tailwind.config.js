/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0A0F1E",
        "navy-mid": "#141B2E",
        "navy-light": "#1E2740",
        gold: "#C9A84C",
        "gold-light": "#E8D9A8",
        cream: "#F2EDE3",
        sand: "#D6CFC4",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        mono: ["DM Mono", "monospace"],
        body: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
