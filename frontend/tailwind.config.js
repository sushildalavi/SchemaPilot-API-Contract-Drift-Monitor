/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out forwards",
        "flash-in": "flash-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        shimmer: "shimmer 1.8s infinite linear",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
