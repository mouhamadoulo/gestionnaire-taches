"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Retient le focus dans une boîte de dialogue tant qu'elle est ouverte : Tab
 * sur le dernier élément revient au premier, Maj+Tab sur le premier va au
 * dernier. Sans cela, la tabulation part derrière la boîte, sur une interface
 * que l'utilisateur ne peut pas voir.
 *
 * La liste des éléments est relue à chaque frappe : le contenu d'une modale
 * change (un champ qui apparaît, une étape de checklist ajoutée).
 */
export function useFocusTrap(active: boolean, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !ref.current) return;
      const focusable = ref.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, ref]);
}
