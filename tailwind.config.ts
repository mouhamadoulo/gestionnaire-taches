import type { Config } from "tailwindcss";

const config: Config = {
  // Le thème est piloté par [data-theme] sur <html> (voir ThemeScript / useTheme).
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces — valeurs définies dans globals.css, par thème
        ink:     "var(--ink)",
        bg:      "var(--bg)",
        sb:      "var(--sb)",
        surface: "var(--surface)",
        // Type
        t1: "var(--t1)",
        t2: "var(--t2)",
        tm: "var(--tm)",
        td: "var(--td)",
        // Lignes
        line: "var(--line)",
        // Voiles neutres (remplacent les anciens bg-white/[0.0x] codés en dur)
        fill1: "var(--fill-1)",
        fill2: "var(--fill-2)",
        fill3: "var(--fill-3)",
        stroke1: "var(--stroke-1)",
        stroke2: "var(--stroke-2)",
        // Accents — identiques dans les deux thèmes (l'opacité Tailwind reste utilisable)
        acc: {
          DEFAULT: "#ff6b35",
          hover:   "#ff8359",
          deep:    "#e0541f",
          soft:    "#ff6b3520",
        },
        cool: {
          DEFAULT: "#14b8a6",
          soft:    "#14b8a620",
        },
        glass: {
          fill:     "var(--fill-1)",
          fillHi:   "var(--fill-2)",
          stroke:   "var(--stroke-1)",
          strokeHi: "var(--stroke-2)",
          base:     "var(--panel-base)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-body)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glass:    "var(--sh-glass)",
        glassHi:  "var(--sh-glass-hi)",
        rim:      "var(--sh-rim)",
        glowAcc:  "0 0 28px -4px rgba(255,107,53,0.55)",
        glowCool: "0 0 22px -4px rgba(20,184,166,0.45)",
      },
      backdropBlur: {
        xs: "3px",
      },
      keyframes: {
        modalIn: {
          "0%":   { opacity: "0", transform: "scale(.96) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.55" },
          "50%":      { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        modalIn:  "modalIn .22s cubic-bezier(.2,.8,.2,1)",
        fadeUp:   "fadeUp .45s cubic-bezier(.2,.8,.2,1) both",
        breathe:  "breathe 3.2s ease-in-out infinite",
        shimmer:  "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
