/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        breaking: "#ef4444",
        risky: "#f59e0b",
        safe: "#22c55e",
      },
    },
  },
  plugins: [],
};
