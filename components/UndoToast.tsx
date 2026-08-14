"use client";

import { useEffect } from "react";

export interface UndoOffer {
  /** Change à chaque nouvelle action : relance le compte à rebours. */
  id: number;
  /** Ce qui vient d'être fait, à la première personne du passé. */
  label: string;
}

interface Props {
  offer: UndoOffer | null;
  onUndo: () => void;
  onDismiss: () => void;
}

/** Durée d'affichage, en millisecondes. */
export const UNDO_DELAY = 7000;

/**
 * Bandeau d'annulation affiché après une action destructrice.
 *
 * Le compte à rebours redémarre à chaque `offer.id` : deux suppressions
 * rapprochées ne laissent qu'une seule offre, celle de la plus récente.
 */
export function UndoToast({ offer, onUndo, onDismiss }: Props) {
  const id = offer?.id;

  useEffect(() => {
    if (id === undefined) return;
    const t = setTimeout(onDismiss, UNDO_DELAY);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  if (!offer) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[26px] left-1/2 -translate-x-1/2 z-[120] animate-fadeUp"
    >
      <div className="panel-hi rounded-[12px] shadow-glass overflow-hidden min-w-[320px] max-w-[92vw]">
        <div className="flex items-center gap-4 pl-[16px] pr-[10px] py-[11px]">
          <span className="text-t2 text-[12.5px] leading-[1.4] flex-1">{offer.label}</span>
          <button
            type="button"
            onClick={onUndo}
            className="btn-ghost px-[13px] py-[7px] rounded-[9px] text-[11.5px] font-semibold whitespace-nowrap hover:!text-acc hover:!border-acc/50"
          >
            ↩ Annuler
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Masquer"
            className="btn-ghost w-[26px] h-[26px] rounded-[8px] text-[11px] flex items-center justify-center flex-shrink-0"
          >
            ✕
          </button>
        </div>
        {/* Barre de temps restant — purement indicative */}
        <div className="h-[2px] bg-fill1" aria-hidden>
          <div
            key={offer.id}
            className="h-full bg-acc origin-left animate-undoBar"
            style={{ animationDuration: `${UNDO_DELAY}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
