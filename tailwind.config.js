/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0E14",
          900: "#111520",
          800: "#171C2A",
          700: "#212739",
          600: "#2B3247",
          500: "#454E6B",
        },
        parchment: {
          100: "#F7F4EC",
          200: "#ECE7D8",
        },
        amber: {
          400: "#F2B84B",
          500: "#E6A73A",
          600: "#C98A24",
        },
        signal: {
          blue: "#5B8DEF",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        xl2: "1.1rem",
      },
      keyframes: {
        blink: {
          "0%, 80%, 100%": { opacity: "0.2" },
          "40%": { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        blink: "blink 1.4s infinite both",
        "slide-up": "slide-up 0.18s ease-out",
      },
    },
  },
  plugins: [],
};
