/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans:    ["Inter",         "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter",         "ui-sans-serif"],
        mono:    ["JetBrains Mono","ui-monospace",  "monospace"],
      },
      colors: {
        brand: { DEFAULT: "#4f46e5", light: "#6366f1", dark: "#3730a3" },
        dark: {
          bg:      "#05070f",
          surface: "#0c0f1e",
          card:    "#10142a",
          border:  "#1e2240",
          text:    "#c8ceeb",
          muted:   "#4e5880",
        },
      },
    },
  },
  plugins: [],
};
