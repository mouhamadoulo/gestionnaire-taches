"use client";

import { useEffect, useRef, useState } from "react";
import type { Card, ColumnId, PlatformKey, Priority } from "@/lib/types";
import { PAST_COLS } from "@/lib/constants";

interface Props {
  open: boolean;
  editing: Card | null;
  defaultCol: ColumnId;
  onClose: () => void;
  onSave: (data: Omit<Card, "id"> & { id?: string }) => void;
}

interface FormState {
  title: string;
  desc: string;
  plt: PlatformKey;
  type: string;
  col: ColumnId;
  date: string;
  prio: Priority;
  tags: string;
  views: string;
  likes: string;
  learning: string;
  prodNotes: string;
}

const EMPTY = (col: ColumnId): FormState => ({
  title: "",
  desc: "",
  plt: "youtube",
  type: "Vidéo",
  col,
  date: "",
  prio: "med",
  tags: "",
  views: "",
  likes: "",
  learning: "",
  prodNotes: "",
});

const PRIO_STYLE: Record<Priority, { tint: string; label: string }> = {
  high: { tint: "#ff5e5e", label: "Haute" },
  med:  { tint: "#ffb86b", label: "Moyenne" },
  low:  { tint: "#5eead4", label: "Basse" },
};

export function CardModal({ open, editing, defaultCol, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY(defaultCol));
  const [titleError, setTitleError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        title: editing.title,
        desc: editing.desc,
        plt: editing.plt,
        type: editing.type,
        col: editing.col,
        date: editing.date || "",
        prio: editing.prio,
        tags: (editing.tags || []).join(", "),
        views: editing.views ? String(editing.views) : "",
        likes: editing.likes ? String(editing.likes) : "",
        learning: editing.learning || "",
        prodNotes: editing.prodNotes || "",
      });
    } else {
      setForm(EMPTY(defaultCol));
    }
    setTitleError(false);
    const t = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, editing, defaultCol]);

  if (!open) return null;

  const update = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const showStats = PAST_COLS.includes(form.col);

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
      plt: form.plt,
      type: form.type,
      col: form.col,
      date: form.date,
      prio: form.prio,
      tags,
      views: parseInt(form.views) || 0,
      likes: parseInt(form.likes) || 0,
      learning: form.learning,
      prodNotes: form.prodNotes,
    });
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: "rgba(5, 6, 11, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        className="rounded-[18px] w-[560px] max-w-[95vw] max-h-[90vh] overflow-y-auto animate-modalIn relative"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,22,32,0.92) 0%, rgba(13,15,22,0.92) 100%)",
          border: "1px solid #ffffff14",
          boxShadow:
            "inset 0 1px 0 #ffffff14, 0 40px 80px -20px rgba(0,0,0,0.9), 0 16px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px #00000060",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        {/* Top accent line */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[1px]"
          style={{
            background: "linear-gradient(90deg, transparent, #ff6b3580 30%, #5eead480 70%, transparent)",
          }}
        />

        {/* Header */}
        <div className="px-[26px] pt-[24px] pb-[6px] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase tracking-[1.6px] text-tm">
              {editing ? "ÉDITION" : "NOUVEAU"} · 0{editing ? "2" : "1"}
            </span>
            <h2 className="font-display italic text-t1 text-[26px] leading-tight tracking-[-0.4px] mt-[2px]">
              {editing ? "Modifier le contenu" : "Capturer une idée"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] w-[34px] h-[34px] rounded-[10px] cursor-pointer text-[14px] flex items-center justify-center text-t2 hover:text-t1 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="px-[26px] pt-[18px] pb-[24px] flex flex-col gap-[14px]">
          <Field label="Titre" required>
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={(e) => {
                update("title", e.target.value);
                if (titleError) setTitleError(false);
              }}
              placeholder="Ex: 10 habitudes des créateurs productifs…"
              className="input"
              style={titleError ? { borderColor: "#ff5e5e", boxShadow: "0 0 0 3px rgba(255,94,94,0.15)" } : undefined}
            />
          </Field>

          <Field label="Description / Notes / Angle">
            <textarea
              value={form.desc}
              onChange={(e) => update("desc", e.target.value)}
              placeholder="Idée, angle, inspiration, sources, structure…"
              className="input min-h-[72px] resize-y"
            />
          </Field>

          <div className="grid grid-cols-2 gap-[10px]">
            <Field label="Plateforme">
              <select
                value={form.plt}
                onChange={(e) => update("plt", e.target.value as PlatformKey)}
                className="input"
              >
                <option value="youtube">▶ YouTube</option>
                <option value="instagram">◉ Instagram</option>
                <option value="tiktok">♫ TikTok</option>
                <option value="blog">✎ Blog</option>
                <option value="linkedin">⧉ LinkedIn</option>
                <option value="podcast">● Podcast</option>
                <option value="twitter">𝕏 Twitter/X</option>
                <option value="facebook">▣ Facebook</option>
              </select>
            </Field>
            <Field label="Type de contenu">
              <select
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                className="input"
              >
                {["Vidéo", "Reel", "Post", "Carrousel", "Story", "Article", "Épisode", "Thread", "Live"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-[10px]">
            <Field label="Colonne">
              <select
                value={form.col}
                onChange={(e) => update("col", e.target.value as ColumnId)}
                className="input"
              >
                <option value="ideas">💡 Idées</option>
                <option value="plan">📋 Planification</option>
                <option value="prod">🎬 Production</option>
                <option value="edit">✂️ Montage</option>
                <option value="sched">📅 Programmé</option>
                <option value="pub">✅ Publié</option>
                <option value="arch">📊 Archive</option>
              </select>
            </Field>
            <Field label="Date cible / Publication">
              <input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="input"
                style={{ colorScheme: "dark" }}
              />
            </Field>
          </div>

          <Field label="Priorité">
            <div className="flex gap-[8px]">
              {(["high", "med", "low"] as Priority[]).map((p) => {
                const active = form.prio === p;
                const s = PRIO_STYLE[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => update("prio", p)}
                    className="flex-1 flex items-center justify-center gap-[6px] py-[9px] rounded-[9px] cursor-pointer text-[11px] font-semibold transition-all select-none uppercase tracking-[0.6px]"
                    style={
                      active
                        ? {
                            background: `linear-gradient(135deg, ${s.tint}26, ${s.tint}10)`,
                            border: `1px solid ${s.tint}66`,
                            color: s.tint,
                            boxShadow: `inset 0 1px 0 ${s.tint}30, 0 0 16px -4px ${s.tint}88`,
                          }
                        : {
                            background: "rgba(255,255,255,0.025)",
                            border: "1px solid #ffffff10",
                            color: "#7d8499",
                          }
                    }
                  >
                    <span
                      className="w-[7px] h-[7px] rounded-full"
                      style={{
                        background: s.tint,
                        boxShadow: active ? `0 0 8px ${s.tint}` : "none",
                      }}
                    />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Tags (séparés par virgules)">
            <input
              type="text"
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="ex: productivité, tutoriel, tendance"
              className="input"
            />
          </Field>

          {showStats && (
            <>
              <div
                className="my-1 flex items-center gap-3 text-tm font-mono text-[9px] uppercase tracking-[1.6px]"
              >
                <span className="flex-1 h-px bg-white/[0.06]" />
                Rétrospective
                <span className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <div className="grid grid-cols-2 gap-[10px]">
                <Field label="Vues">
                  <input
                    type="number"
                    value={form.views}
                    onChange={(e) => update("views", e.target.value)}
                    placeholder="0"
                    className="input font-mono"
                  />
                </Field>
                <Field label="Likes / Réactions">
                  <input
                    type="number"
                    value={form.likes}
                    onChange={(e) => update("likes", e.target.value)}
                    placeholder="0"
                    className="input font-mono"
                  />
                </Field>
              </div>
              <Field label="Ce qui a marché / Ce qu'il faut améliorer">
                <textarea
                  value={form.learning}
                  onChange={(e) => update("learning", e.target.value)}
                  placeholder="Ex: Le hook des 5 premières secondes a très bien fonctionné. Refaire ce format."
                  className="input min-h-[58px] resize-y"
                />
              </Field>
              <Field label="Notes de production (outils, durée, méthode)">
                <textarea
                  value={form.prodNotes}
                  onChange={(e) => update("prodNotes", e.target.value)}
                  placeholder="Ex: Filmé en 2h, monté sur Premiere, miniature Canva, durée 12min"
                  className="input min-h-[58px] resize-y"
                />
              </Field>
            </>
          )}

          <div className="flex gap-2 justify-end pt-3 mt-1" style={{ borderTop: "1px solid #ffffff0a" }}>
            <button
              onClick={onClose}
              className="px-5 py-[9px] rounded-[10px] bg-white/[0.04] hover:bg-white/[0.08] text-t2 hover:text-t1 text-[12px] font-semibold cursor-pointer transition-colors border border-white/[0.06]"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-[9px] rounded-[10px] text-white text-[12px] font-semibold cursor-pointer transition-all hover:-translate-y-px"
              style={{
                background: "linear-gradient(135deg, #ff8359 0%, #ff6b35 50%, #e0541f 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 14px -2px rgba(255,107,53,0.55), 0 0 0 1px rgba(255,107,53,0.4)",
              }}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-[10px] font-mono font-medium text-tm uppercase tracking-[1.2px] flex items-center gap-1">
        {label}
        {required && <span className="text-acc">*</span>}
      </label>
      {children}
    </div>
  );
}
