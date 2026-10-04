import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        earth: {
          950: "#050b14",
          900: "#0b1526",
          850: "#0e1c33",
          800: "#132544",
          700: "#1c3560",
          600: "#2a4c85",
          500: "#3d6cb5",
          400: "#6092e0",
          300: "#8fb5f0",
          200: "#c4daf9",
          100: "#e5effd",
          50: "#f3f7fe",
        },
        cyclone: {
          cat1: "#38bdf8",
          cat2: "#34d399",
          cat3: "#facc15",
          cat4: "#fb923c",
          cat5: "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
