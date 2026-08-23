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
          DEFAULT: "#F6F5F1",
        },
        ink: {
          DEFAULT: "#16213E",
        },
        "seal-gold": {
          DEFAULT: "#C08A28",
        },
        "growth-teal": {
          DEFAULT: "#2F6F5E",
        },
        "horizon-slate": {
          DEFAULT: "#5C7290",
        },
        "stamp-red": {
          DEFAULT: "#9E3B3B",
        },
        primary: {
          DEFAULT: "#C08A28",
          foreground: "#F6F5F1",
        },
        secondary: {
          DEFAULT: "#5C7290",
          foreground: "#F6F5F1",
        },
        destructive: {
          DEFAULT: "#9E3B3B",
          foreground: "#F6F5F1",
        },
        muted: {
          DEFAULT: "#5C7290",
          foreground: "#16213E",
        },
        accent: {
          DEFAULT: "#C08A28",
          foreground: "#16213E",
        },
        card: {
          DEFAULT: "#F6F5F1",
          foreground: "#16213E",
        },
        border: "rgba(22, 33, 62, 0.12)",
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
        "card": "0 1px 3px rgba(22,33,62,0.04), 0 0 0 1px rgba(22,33,62,0.06)",
        "card-hover": "0 4px 12px rgba(22,33,62,0.08), 0 0 0 1px rgba(22,33,62,0.10)",
        "elevated": "0 8px 24px rgba(22,33,62,0.12), 0 2px 6px rgba(22,33,62,0.06)",
        "depth-1": "0 1px 0 rgba(22,33,62,0.04), 0 1px 3px rgba(22,33,62,0.06)",
        "depth-2": "0 2px 0 rgba(22,33,62,0.04), 0 4px 8px rgba(22,33,62,0.06)",
        "depth-3": "0 4px 0 rgba(22,33,62,0.03), 0 8px 16px rgba(22,33,62,0.08)",
        "gold-glow": "0 0 20px rgba(192,138,40,0.15)",
        "teal-glow": "0 0 20px rgba(47,111,94,0.15)",
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
