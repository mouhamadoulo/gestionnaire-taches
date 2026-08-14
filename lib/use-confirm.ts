"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Ce que l'appelant décrit : une question, pas une boîte de dialogue. */
export interface ConfirmRequest {
  title: string;
  /** Conséquence de l'action, affichée sous le titre. */
  body?: string;
  confirmLabel?: string;
  /** `null` : un seul bouton — la boîte informe au lieu de demander. */
  cancelLabel?: string | null;
  /** `danger` teinte le bouton de validation en rouge. */
  tone?: "danger" | "default";
}

/** Ce que `ConfirmModal` reçoit : la demande, complétée et branchée. */
export interface ConfirmDialog extends ConfirmRequest {
  confirmLabel: string;
  cancelLabel: string | null;
  tone: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Remplace `confirm()` et `alert()` par une boîte de dialogue interne, sans
 * imposer aux appelants de se réécrire en machine à états.
 *
 * `ask()` rend une promesse : le code métier garde sa forme d'origine, un
 * `if (!confirm(…)) return;` devenant `if (!(await ask(…))) return;`. La
 * résolution est gardée dans un ref, seul endroit où la promesse et l'état
 * React se rencontrent.
 */
export function useConfirm() {
  const [dialog, setDialog] = useState<ConfirmDialog | null>(null);
  const resolve = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    const pending = resolve.current;
    resolve.current = null;
    setDialog(null);
    pending?.(ok);
  }, []);

  const ask = useCallback(
    (req: ConfirmRequest) =>
      new Promise<boolean>((done) => {
        // Une demande en écrase une autre : la précédente est refusée plutôt
        // que laissée en suspens, sinon son appelant attend indéfiniment.
        resolve.current?.(false);
        resolve.current = done;
        setDialog({
          ...req,
          confirmLabel: req.confirmLabel ?? "Confirmer",
          cancelLabel: req.cancelLabel === undefined ? "Annuler" : req.cancelLabel,
          tone: req.tone ?? "default",
          onConfirm: () => settle(true),
          onCancel: () => settle(false),
        });
      }),
    [settle],
  );

  /** Variante à un seul bouton, à la place d'un `alert()`. */
  const notify = useCallback(
    (req: ConfirmRequest) =>
      ask({ ...req, cancelLabel: null, confirmLabel: req.confirmLabel ?? "Fermer" }).then(
        () => undefined,
      ),
    [ask],
  );

  // Démontage avec une question à l'écran : personne ne répondra jamais.
  useEffect(
    () => () => {
      const pending = resolve.current;
      resolve.current = null;
      pending?.(false);
    },
    [],
  );

  return { dialog, ask, notify };
}
