"use client";

import { useEffect, useId, useRef } from "react";
import type { ConfirmDialog } from "@/lib/use-confirm";
import { useFocusTrap } from "@/lib/use-focus-trap";

interface Props {
  /** `null` : aucune question en cours, rien n'est rendu. */
  dialog: ConfirmDialog | null;
}

/**
 * Boîte de confirmation interne, en remplacement de `confirm()` et `alert()` :
 * les dialogues natifs ignorent `data-theme` et les jetons de `globals.css`.
 *
 * Purement présentationnel — la question, la réponse et la promesse qui va
 * avec appartiennent à `useConfirm`.
 */
export function ConfirmModal({ dialog }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(dialog !== null, dialogRef);

  // Le focus va sur le bouton le moins destructeur : la boîte s'ouvre souvent
  // sous les doigts de quelqu'un qui tape, et Entrée validerait aussitôt.
  useEffect(() => {
    if (dialog) firstRef.current?.focus();
  }, [dialog]);

  const onCancel = dialog?.onCancel;
  useEffect(() => {
    if (!onCancel) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  if (!dialog) return null;

  const { title, body, confirmLabel, cancelLabel, tone, onConfirm } = dialog;

  return (
    <div
      data-testid="confirm-overlay"
      onClick={(e) => e.target === e.currentTarget && dialog.onCancel()}
      className="modal-overlay fixed inset-0 z-[120] flex items-center justify-center p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="plate-modal w-full max-w-md rounded-2xl p-6"
      >
        <h2 id={titleId} className="text-lg font-semibold text-t1">
          {title}
        </h2>
        {body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-t2">{body}</p>}

        <div className="mt-6 flex justify-end gap-2">
          {cancelLabel !== null && (
            <button
              ref={firstRef}
              type="button"
              onClick={dialog.onCancel}
              className="btn-ghost px-5 py-[9px] rounded-[10px] text-[12px] font-semibold"
            >
              {cancelLabel}
            </button>
          )}
          <button
            // Seul bouton en mode information : c'est lui qui prend le focus.
            ref={cancelLabel === null ? firstRef : undefined}
            type="button"
            onClick={onConfirm}
            className={`${tone === "danger" ? "btn-danger" : "btn-primary"} px-6 py-[9px] rounded-[10px] text-[12px] font-semibold`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
