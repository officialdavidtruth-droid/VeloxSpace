/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        velox: {
          bg: "#05070f",
          surface: "#0c0f1e",
          card: "#10142a",
          border: "#1e2240",
          primary: "#7c6af7",
          "primary-dark": "#6254d4",
          accent: "#00e5c8",
          pink: "#ff6b9d",
          text: "#c8ceeb",
          muted: "#4e5880",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};
