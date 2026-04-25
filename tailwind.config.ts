import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        ink:        "#07080d",   // pure black-blue base
        bg:         "#0a0b12",   // page canvas
        sb:         "#0c0e16",   // sidebar plate
        surface:    "#10121b",   // raised surface
        // Type
        t1:         "#ecedf2",   // primary pearl
        t2:         "#9aa0b4",   // secondary
        tm:         "#5e6378",   // muted
        td:         "#3b4055",   // dim
        // Lines
        line:       "#1c1f2e",
        // Accent — keep brand orange, add cool counter-accent
        acc: {
          DEFAULT: "#ff6b35",
          hover:   "#ff8359",
          deep:    "#e0541f",
          soft:    "#ff6b3520",
        },
        cool: {
          DEFAULT: "#5eead4",   // cyan-mint counter
          soft:    "#5eead420",
        },
        // Glass tokens (8-digit hex — RRGGBBAA)
        glass: {
          fill:    "#ffffff08",  // 3% white wash
          fillHi:  "#ffffff0f",  // 6% — hover / cards
          stroke:  "#ffffff14",  // 8% white stroke
          strokeHi:"#ffffff26",  // 15% — focus
          base:    "#0c0e1666",  // dark glass tint
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-body)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        // Glass weight stack: inner top highlight + dark drop
        glass:     "inset 0 1px 0 #ffffff10, 0 1px 0 #00000040, 0 18px 36px -16px rgba(0,0,0,0.7), 0 8px 18px -8px rgba(0,0,0,0.45)",
        glassHi:   "inset 0 1px 0 #ffffff1c, 0 1px 0 #00000050, 0 30px 60px -20px rgba(0,0,0,0.85), 0 14px 28px -10px rgba(0,0,0,0.55)",
        rim:       "inset 0 0 0 1px #ffffff10",
        glowAcc:   "0 0 28px -4px rgba(255,107,53,0.55)",
        glowCool:  "0 0 22px -4px rgba(94,234,212,0.45)",
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
