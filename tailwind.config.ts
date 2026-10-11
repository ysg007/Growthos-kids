import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* GrowthOS brand tokens */
        brand: {
          50:  "#F0EDFF",
          100: "#E2DCFF",
          200: "#C5BAFF",
          300: "#A897FF",
          400: "#8B74FF",
          500: "#6E51FF",  /* primary */
          600: "#5741CC",
          700: "#403199",
          800: "#2A2066",
          900: "#151033",
        },
        growth: {
          academic: "#6E51FF",
          habits:   "#10B981",
          skills:   "#F59E0B",
          physical: "#EF4444",
          mental:   "#8B5CF6",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted:   "#F8F7FF",
          subtle:  "#F1EFFF",
          border:  "#E8E5FF",
        },
        ink: {
          DEFAULT: "#0F0E1A",
          muted:   "#6B7280",
          subtle:  "#9CA3AF",
        },
        level: {
          explorer:  "#60A5FA",
          learner:   "#34D399",
          achiever:  "#FBBF24",
          innovator: "#F97316",
          champion:  "#EF4444",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-cal)", "var(--font-inter)", "sans-serif"],
        mono:    ["var(--font-jetbrains)", "Menlo", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        card:     "0 1px 3px 0 rgb(110 81 255 / 0.06), 0 1px 2px -1px rgb(110 81 255 / 0.04)",
        "card-lg":"0 4px 16px 0 rgb(110 81 255 / 0.10), 0 2px 6px -2px rgb(110 81 255 / 0.06)",
        glow:     "0 0 24px 4px rgb(110 81 255 / 0.18)",
      },
      keyframes: {
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(110,81,255,0.4)" },
          "70%":  { transform: "scale(1)",    boxShadow: "0 0 0 8px rgba(110,81,255,0)" },
          "100%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(110,81,255,0)" },
        },
      },
      animation: {
        shimmer:     "shimmer 2s linear infinite",
        float:       "float 3s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.455,0.03,0.515,0.955) infinite",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #6E51FF 0%, #A897FF 50%, #C5BAFF 100%)",
        "growth-gradient":"linear-gradient(135deg, #6E51FF 0%, #10B981 100%)",
        "card-shine":     "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
