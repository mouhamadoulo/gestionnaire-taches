"use client";

import { useEffect, useRef, useState } from "react";
import type { ColumnDef, ColumnId } from "@/lib/types";

interface Props {
  /** Nombre de tâches sélectionnées ; à 0 la barre disparaît. */
  count: number;
  columns: ColumnDef[];
  /** Tags déjà présents dans le tableau, du plus utilisé au moins utilisé. */
  tags: string[];
  onMove: (toCol: ColumnId) => void;
  onDelete: () => void;
  onTag: (tag: string) => void;
  onClear: () => void;
}

type Menu = "move" | "tag" | null;

/**
 * Barre d'actions groupées, en bas du tableau.
 *
 * Elle occupe la même bande que `UndoToast` mais jamais en même temps : une
 * action groupée vide la sélection, ce qui la fait disparaître au moment précis
 * où le bandeau d'annulation apparaît.
 */
export function BulkBar({ count, columns, tags, onMove, onDelete, onTag, onClear }: Props) {
  const [menu, setMenu] = useState<Menu>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (menu === "tag") inputRef.current?.focus();
    if (menu === null) setDraft("");
  }, [menu]);

  /* Échap referme le menu ouvert. La sélection, elle, est vidée par le
     gestionnaire global du tableau : ce n'est pas à la barre d'en décider. */
  useEffect(() => {
    if (!menu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setMenu(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menu]);

  if (count === 0) return null;

  const applyTag = (tag: string) => {
    if (!tag.trim()) return;
    onTag(tag.trim());
    setMenu(null);
  };

  return (
    <div className="fixed bottom-[18px] left-1/2 -translate-x-1/2 z-[90]">
      {menu === "move" && (
        <div
          role="menu"
          aria-label="Déplacer la sélection vers"
          className="panel-hi absolute bottom-[54px] left-0 w-[200px] rounded-[11px] py-[5px] overflow-hidden shadow-glass max-h-[240px] overflow-y-auto"
        >
          {columns.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => {
                onMove(col.id);
                setMenu(null);
              }}
              className="w-full flex items-center gap-[8px] px-[12px] py-[7px] text-[12px] text-t2 hover:text-t1 hover:bg-fill1 text-left"
            >
              <span
                aria-hidden
                className="w-[8px] h-[8px] rounded-full flex-shrink-0"
                style={{ background: col.tint }}
              />
              {col.label}
            </button>
          ))}
        </div>
      )}

      {menu === "tag" && (
        <div className="panel-hi absolute bottom-[54px] left-0 w-[240px] rounded-[11px] p-[10px] shadow-glass">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyTag(draft)}
            placeholder="Nouveau tag…"
            aria-label="Nouveau tag"
            className="input"
          />
          {tags.length > 0 && (
            <div className="mt-[9px] flex flex-wrap gap-[5px]">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => applyTag(tag)}
                  className="chip hover:text-t1 cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="plate-topbar flex items-center gap-[8px] rounded-[13px] px-[14px] py-[9px] shadow-glass">
        <span className="text-[12px] font-semibold text-t1 whitespace-nowrap">
          {count} tâche{count > 1 ? "s" : ""} sélectionnée{count > 1 ? "s" : ""}
        </span>

        <span aria-hidden className="w-px h-[18px] bg-stroke1" />

        <button
          type="button"
          onClick={() => setMenu(menu === "move" ? null : "move")}
          className="btn-ghost px-[11px] py-[6px] rounded-[9px] text-[12px] font-semibold"
        >
          Déplacer vers ▾
        </button>
        <button
          type="button"
          onClick={() => setMenu(menu === "tag" ? null : "tag")}
          className="btn-ghost px-[11px] py-[6px] rounded-[9px] text-[12px] font-semibold"
        >
          Ajouter un tag
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="btn-ghost px-[11px] py-[6px] rounded-[9px] text-[12px] font-semibold hover:!text-[#ef4444] hover:!border-[#ef4444]/40"
        >
          Supprimer
        </button>

        <span aria-hidden className="w-px h-[18px] bg-stroke1" />

        <button
          type="button"
          onClick={onClear}
          title="Échap"
          className="btn-ghost w-[28px] h-[28px] rounded-[8px] text-[12px] leading-none flex items-center justify-center"
          aria-label="Tout désélectionner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
