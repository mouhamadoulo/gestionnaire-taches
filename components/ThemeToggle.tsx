"use client";

import { useTheme } from "@/lib/use-theme";

/**
 * Bascule clair / sombre — bouton icône seule, posé en haut à droite de l'écran.
 * L'icône montre le thème vers lequel on bascule (☀ en sombre, ☾ en clair).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, mounted, setMode } = useTheme();
  const isLight = mounted && theme === "light";
  const label = isLight ? "Passer au thème sombre" : "Passer au thème clair";

  return (
    <button
      type="button"
      onClick={() => setMode(isLight ? "dark" : "light")}
      title={label}
      aria-label={label}
      className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[15px] leading-none text-t2 hover:text-acc bg-fill1 hover:bg-fill2 border border-stroke1 hover:border-acc/40 cursor-pointer transition-all ${className}`}
    >
      <span aria-hidden>{isLight ? "☾" : "☀"}</span>
    </button>
  );
}
