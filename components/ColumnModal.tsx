"use client";

import { useEffect, useRef, useState } from "react";
import type { ColumnDef } from "@/lib/types";
import { COLUMN_TINTS } from "@/lib/constants";
import { useFocusTrap } from "@/lib/use-focus-trap";

interface Props {
  open: boolean;
  editing: ColumnDef | null;
  onClose: () => void;
  onSave: (data: { id?: string; label: string; hint: string; tint: string }) => void;
}

export function ColumnModal({ open, editing, onClose, onSave }: Props) {
  const [label, setLabel] = useState("");
  const [hint, setHint] = useState("");
  const [tint, setTint] = useState<string>(COLUMN_TINTS[0]);
  const [labelError, setLabelError] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLabel(editing?.label || "");
    setHint(editing?.hint || "");
    setTint(editing?.tint || COLUMN_TINTS[0]);
    setLabelError(false);
    const t = setTimeout(() => labelRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, editing]);

  useFocusTrap(open, dialogRef);

  if (!open) return null;

  const handleSave = () => {
    const name = label.trim();
    if (!name) {
      setLabelError(true);
      labelRef.current?.focus();
      return;
    }
    onSave({ id: editing?.id, label: name, hint: hint.trim(), tint });
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="column-modal-title"
        className="plate-modal rounded-[18px] w-[440px] max-w-[95vw] max-h-[90vh] overflow-y-auto animate-modalIn relative"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${tint}99 30%, ${tint}99 70%, transparent)`,
          }}
        />

        {/* En-tête */}
        <div className="px-[26px] pt-[24px] pb-[6px] flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[9px] uppercase tracking-[1.6px] text-tm">
              {editing ? "Édition" : "Nouvelle liste"}
            </span>
            <h2
              id="column-modal-title"
              className="font-display italic text-t1 text-[26px] leading-tight tracking-[-0.4px] mt-[2px]"
            >
              {editing ? "Modifier la liste" : "Ajouter une liste"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="btn-ghost w-[34px] h-[34px] rounded-[10px] text-[14px] flex items-center justify-center flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="px-[26px] pt-[18px] pb-[24px] flex flex-col gap-[14px]">
          <Field label="Nom" htmlFor="c-label" required>
            <input
              id="c-label"
              ref={labelRef}
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (labelError) setLabelError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Ex : 🎯 Cette semaine"
              className="input"
              aria-invalid={labelError}
              aria-describedby={labelError ? "c-label-err" : undefined}
              style={labelError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239,68,68,0.15)" } : undefined}
            />
            {labelError ? (
              <span id="c-label-err" className="text-[11px] text-[#ef4444]">
                Le nom est obligatoire.
              </span>
            ) : (
              <span className="text-[10.5px] text-td">
                Un emoji en début de nom s&apos;affiche bien dans l&apos;en-tête.
              </span>
            )}
          </Field>

          <Field label="Indice (colonne vide)" htmlFor="c-hint">
            <input
              id="c-hint"
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Ex : à traiter avant vendredi"
              className="input"
            />
          </Field>

          <Field label="Teinte">
            <div className="flex flex-wrap gap-[8px]" role="group" aria-label="Teinte de la liste">
              {COLUMN_TINTS.map((c) => {
                const active = c === tint;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTint(c)}
                    aria-pressed={active}
                    aria-label={`Teinte ${c}`}
                    className="w-[30px] h-[30px] rounded-full cursor-pointer transition-all flex items-center justify-center text-white text-[12px] leading-none"
                    style={{
                      background: `linear-gradient(135deg, ${c}, ${c}bb)`,
                      border: `1px solid ${active ? c : "var(--stroke-1)"}`,
                      boxShadow: active ? `0 0 0 3px ${c}44` : "none",
                    }}
                  >
                    {active ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Aperçu de l'en-tête tel qu'il apparaîtra sur le tableau */}
          <div className="plate-column rounded-[12px] px-[14px] py-[12px] flex items-center gap-[9px] relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[2px] opacity-90"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${tint} 30%, ${tint} 70%, transparent 100%)`,
              }}
            />
            <span
              aria-hidden
              className="w-[8px] h-[8px] rounded-full flex-shrink-0"
              style={{ background: tint, boxShadow: `0 0 0 3px ${tint}22` }}
            />
            <span className="text-[11px] font-bold text-t1 flex-1 uppercase tracking-[1.2px] truncate">
              {label.trim() || "Nom de la liste"}
            </span>
            <span
              className="font-mono text-[10px] font-semibold px-[7px] py-[2px] rounded-full tabular-nums"
              style={{ background: `${tint}1a`, color: tint, border: `1px solid ${tint}33` }}
            >
              00
            </span>
          </div>

          <div className="flex gap-2 justify-end pt-3 mt-1 border-t border-stroke1">
            <button
              onClick={onClose}
              className="btn-ghost px-5 py-[9px] rounded-[10px] text-[12px] font-semibold"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="btn-primary px-6 py-[9px] rounded-[10px] text-[12px] font-semibold"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label
        htmlFor={htmlFor}
        className="text-[10px] font-mono font-medium text-tm uppercase tracking-[1.2px] flex items-center gap-1"
      >
        {label}
        {required && <span className="text-acc" aria-hidden>*</span>}
      </label>
      {children}
    </div>
  );
}
