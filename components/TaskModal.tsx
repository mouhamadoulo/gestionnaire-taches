"use client";

import { useEffect, useRef, useState } from "react";
import type { CategoryKey, ColumnId, Priority, Task } from "@/lib/types";
import { CAT_LBL, CATEGORIES, COLS, DONE_COLS, TASK_TYPES } from "@/lib/constants";

interface Props {
  open: boolean;
  editing: Task | null;
  defaultCol: ColumnId;
  onClose: () => void;
  onSave: (data: Omit<Task, "id"> & { id?: string }) => void;
}

interface FormState {
  title: string;
  desc: string;
  cat: CategoryKey;
  type: string;
  col: ColumnId;
  date: string;
  prio: Priority;
  tags: string;
  estimate: string;
  spent: string;
  learning: string;
  notes: string;
}

const EMPTY = (col: ColumnId): FormState => ({
  title: "",
  desc: "",
  cat: "travail",
  type: "Tâche",
  col,
  date: "",
  prio: "med",
  tags: "",
  estimate: "",
  spent: "",
  learning: "",
  notes: "",
});

const PRIO_STYLE: Record<Priority, { tint: string; text: string; label: string }> = {
  high: { tint: "#ef4444", text: "var(--bad)",  label: "Haute" },
  med:  { tint: "#f59e0b", text: "var(--warn)", label: "Moyenne" },
  low:  { tint: "#14b8a6", text: "var(--ok)",   label: "Basse" },
};

export function TaskModal({ open, editing, defaultCol, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY(defaultCol));
  const [titleError, setTitleError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        title: editing.title,
        desc: editing.desc,
        cat: editing.cat,
        type: editing.type,
        col: editing.col,
        date: editing.date || "",
        prio: editing.prio,
        tags: (editing.tags || []).join(", "),
        estimate: editing.estimate ? String(editing.estimate) : "",
        spent: editing.spent ? String(editing.spent) : "",
        learning: editing.learning || "",
        notes: editing.notes || "",
      });
    } else {
      setForm(EMPTY(defaultCol));
    }
    setTitleError(false);
    const t = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, editing, defaultCol]);

  // Piège à focus : Tab reste dans la boîte de dialogue.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
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
  }, [open]);

  if (!open) return null;

  const update = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const showRetro = DONE_COLS.includes(form.col);

  const handleSave = () => {
    const title = form.title.trim();
    if (!title) {
      setTitleError(true);
      titleRef.current?.focus();
      return;
    }
    const tags = form.tags
      ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    onSave({
      id: editing?.id,
      title,
      desc: form.desc,
      cat: form.cat,
      type: form.type,
      col: form.col,
      date: form.date,
      prio: form.prio,
      tags,
      estimate: parseInt(form.estimate) || 0,
      spent: parseInt(form.spent) || 0,
      learning: form.learning,
      notes: form.notes,
    });
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
        aria-labelledby="task-modal-title"
        className="plate-modal rounded-[18px] w-[560px] max-w-[95vw] max-h-[90vh] overflow-y-auto animate-modalIn relative"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[1px]"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.5) 30%, rgba(20,184,166,0.5) 70%, transparent)",
          }}
        />

        {/* En-tête */}
        <div className="px-[26px] pt-[24px] pb-[6px] flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[9px] uppercase tracking-[1.6px] text-tm">
              {editing ? "Édition" : "Nouvelle tâche"}
            </span>
            <h2
              id="task-modal-title"
              className="font-display italic text-t1 text-[26px] leading-tight tracking-[-0.4px] mt-[2px]"
            >
              {editing ? "Modifier la tâche" : "Ajouter une tâche"}
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
          <Field label="Titre" htmlFor="f-title" required>
            <input
              id="f-title"
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={(e) => {
                update("title", e.target.value);
                if (titleError) setTitleError(false);
              }}
              placeholder="Ex : préparer la revue trimestrielle"
              className="input"
              aria-invalid={titleError}
              aria-describedby={titleError ? "f-title-err" : undefined}
              style={titleError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239,68,68,0.15)" } : undefined}
            />
            {titleError && (
              <span id="f-title-err" className="text-[11px] text-[#ef4444]">
                Le titre est obligatoire.
              </span>
            )}
          </Field>

          <Field label="Description / notes" htmlFor="f-desc">
            <textarea
              id="f-desc"
              value={form.desc}
              onChange={(e) => update("desc", e.target.value)}
              placeholder="Contexte, étapes, personnes concernées, liens…"
              className="input min-h-[72px] resize-y"
            />
          </Field>

          <div className="grid grid-cols-2 gap-[10px]">
            <Field label="Catégorie" htmlFor="f-cat">
              <select
                id="f-cat"
                value={form.cat}
                onChange={(e) => update("cat", e.target.value as CategoryKey)}
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CAT_LBL[c]}</option>
                ))}
              </select>
            </Field>
            <Field label="Type" htmlFor="f-type">
              <select
                id="f-type"
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                className="input"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-[10px]">
            <Field label="Colonne" htmlFor="f-col">
              <select
                id="f-col"
                value={form.col}
                onChange={(e) => update("col", e.target.value as ColumnId)}
                className="input"
              >
                {COLS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Échéance" htmlFor="f-date">
              <input
                id="f-date"
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-[10px]">
            <Field label="Temps estimé (minutes)" htmlFor="f-est">
              <input
                id="f-est"
                type="number"
                min={0}
                value={form.estimate}
                onChange={(e) => update("estimate", e.target.value)}
                placeholder="0"
                className="input font-mono"
              />
            </Field>
            <Field label="Priorité">
              <div className="flex gap-[8px]" role="group" aria-label="Priorité">
                {(["high", "med", "low"] as Priority[]).map((p) => {
                  const active = form.prio === p;
                  const s = PRIO_STYLE[p];
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update("prio", p)}
                      aria-pressed={active}
                      title={s.label}
                      className="flex-1 flex items-center justify-center gap-[5px] py-[9px] rounded-[9px] cursor-pointer text-[10.5px] font-semibold transition-all select-none uppercase tracking-[0.4px] border"
                      style={
                        active
                          ? {
                              background: `linear-gradient(135deg, ${s.tint}26, ${s.tint}10)`,
                              borderColor: `${s.tint}66`,
                              color: s.text,
                            }
                          : {
                              background: "var(--fill-1)",
                              borderColor: "var(--stroke-1)",
                              color: "var(--tm)",
                            }
                      }
                    >
                      <span
                        aria-hidden
                        className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                        style={{ background: s.tint }}
                      />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          <Field label="Tags (séparés par des virgules)" htmlFor="f-tags">
            <input
              id="f-tags"
              type="text"
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="ex : urgent, maison, rendez-vous"
              className="input"
            />
          </Field>

          {showRetro && (
            <>
              <div className="my-1 flex items-center gap-3 text-tm font-mono text-[9px] uppercase tracking-[1.6px]">
                <span className="flex-1 h-px bg-stroke1" />
                Rétrospective
                <span className="flex-1 h-px bg-stroke1" />
              </div>
              <Field label="Temps réellement passé (minutes)" htmlFor="f-spent">
                <input
                  id="f-spent"
                  type="number"
                  min={0}
                  value={form.spent}
                  onChange={(e) => update("spent", e.target.value)}
                  placeholder="0"
                  className="input font-mono"
                />
              </Field>
              <Field label="Ce qui a marché / ce qu'il faut changer" htmlFor="f-learning">
                <textarea
                  id="f-learning"
                  value={form.learning}
                  onChange={(e) => update("learning", e.target.value)}
                  placeholder="Ex : découper la tâche en deux aurait évité le blocage."
                  className="input min-h-[58px] resize-y"
                />
              </Field>
              <Field label="Notes (méthode, outils, blocages)" htmlFor="f-notes">
                <textarea
                  id="f-notes"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Ex : fait en deux sessions, bloqué 40 min sur un justificatif."
                  className="input min-h-[58px] resize-y"
                />
              </Field>
            </>
          )}

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
