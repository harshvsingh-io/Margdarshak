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
        background: "var(--background)",
        foreground: "var(--foreground)",
        paper: {
          DEFAULT: "rgb(var(--paper) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
        },
        "seal-gold": {
          DEFAULT: "rgb(var(--seal-gold) / <alpha-value>)",
        },
        "growth-teal": {
          DEFAULT: "rgb(var(--growth-teal) / <alpha-value>)",
        },
        "horizon-slate": {
          DEFAULT: "rgb(var(--horizon-slate) / <alpha-value>)",
        },
        "stamp-red": {
          DEFAULT: "rgb(var(--stamp-red) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "var(--accent-foreground)",
        },
        "burnt-orange": {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
      },
      fontFamily: {
        heading: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-ibm-sans)", "sans-serif"],
        mono: ["var(--font-ibm-mono)", "monospace"],
      },
      borderRadius: {
        sm: "2px",
        md: "4px",
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        "card": "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        "elevated": "var(--shadow-elevated)",
        "depth-1": "var(--shadow-depth-1)",
        "depth-2": "var(--shadow-depth-2)",
        "depth-3": "var(--shadow-depth-3)",
        "gold-glow": "0 0 20px rgba(226,176,83,0.15)",
        "teal-glow": "0 0 20px rgba(16,185,129,0.15)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
      },
      keyframes: {
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        "scale-in": "scale-in 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
