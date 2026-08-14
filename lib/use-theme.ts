"use client";

import { useCallback, useEffect, useState } from "react";
import { THEME_KEY } from "./constants";
import type { ThemeMode } from "./types";

/**
 * Lit / bascule le thème.
 * L'attribut data-theme est posé sur <html> par le script inline du layout
 * (avant le premier rendu), donc on se contente ici de le refléter puis de
 * l'écrire. `mounted` évite d'afficher le mauvais libellé pendant l'hydratation.
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    setTheme(attr === "light" ? "light" : "dark");
    setMounted(true);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    setTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setMode(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
  }, [setMode]);

  return { theme, mounted, toggle, setMode };
}
