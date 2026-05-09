import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e8f6ff",
          100: "#cdeafe",
          200: "#a9d8fe",
          300: "#7cc3ff",
          400: "#5fb4ff",
          500: "#3495ea",
          600: "#2478bf",
          700: "#1f6098",
          800: "#1d507d",
          900: "#183f61",
        },
        ink: {
          950: "#07111f",
          900: "#0b1729",
          850: "#102038",
          800: "#142844",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        panel: "0 18px 40px rgba(0,0,0,0.24)",
        glow: "0 12px 32px rgba(95,180,255,0.2)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
