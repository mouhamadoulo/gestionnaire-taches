"use client";

import { useEffect, useState } from "react";
import type { ColumnDef, ColumnId, Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface Props {
  col: ColumnDef;
  tasks: Task[];
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onAdd: (colId: ColumnId) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDrop: (colId: ColumnId) => void;
  onDragStart: (id: string, el: HTMLElement) => void;
  onDragEnd: (el: HTMLElement) => void;
  onRenameCol: (colId: ColumnId) => void;
  onMoveCol: (colId: ColumnId, dir: -1 | 1) => void;
  onDeleteCol: (colId: ColumnId) => void;
}

export function Column({
  col,
  tasks,
  canMoveLeft,
  canMoveRight,
  onAdd,
  onEdit,
  onDelete,
  onDrop,
  onDragStart,
  onDragEnd,
  onRenameCol,
  onMoveCol,
  onDeleteCol,
}: Props) {
  const tint = col.tint;
  const [menuOpen, setMenuOpen] = useState(false);

  // Échap ferme le menu avant que la page ne traite la touche.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [menuOpen]);

  const runAndClose = (fn: () => void) => {
    setMenuOpen(false);
    fn();
  };

  return (
    <section
      aria-label={col.label}
      className="w-[286px] flex-shrink-0 flex flex-col rounded-[14px] overflow-hidden max-h-full relative plate-column"
    >
      {/* Liseré supérieur teinté */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] opacity-90"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${tint} 30%, ${tint} 70%, transparent 100%)`,
        }}
      />

      {/* En-tête */}
      <div className="px-[14px] pt-[14px] pb-[10px] flex items-center gap-[7px] relative">
        <span
          aria-hidden
          className="w-[8px] h-[8px] rounded-full flex-shrink-0"
          style={{ background: tint, boxShadow: `0 0 0 3px ${tint}22` }}
        />
        <span className="text-[11px] font-bold text-t1 flex-1 uppercase tracking-[1.2px] truncate">
          {col.label}
        </span>
        <span
          className="font-mono text-[10px] font-semibold px-[7px] py-[2px] rounded-full tabular-nums"
          style={{ background: `${tint}1a`, color: tint, border: `1px solid ${tint}33` }}
        >
          {String(tasks.length).padStart(2, "0")}
        </span>
        <button
          onClick={() => onAdd(col.id)}
          title={`Ajouter dans « ${col.label} »`}
          aria-label={`Ajouter une tâche dans ${col.label}`}
          className="bg-transparent border-none text-tm hover:text-t1 hover:bg-fill2 cursor-pointer text-[15px] w-[20px] h-[20px] rounded leading-none transition-colors flex items-center justify-center"
        >
          ＋
        </button>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          title={`Options de « ${col.label} »`}
          aria-label={`Options de la liste ${col.label}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="bg-transparent border-none text-tm hover:text-t1 hover:bg-fill2 cursor-pointer text-[14px] w-[20px] h-[20px] rounded leading-none transition-colors flex items-center justify-center"
        >
          ⋯
        </button>

        {menuOpen && (
          <>
            {/* Ferme le menu au clic à l'extérieur */}
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              aria-label={`Options de ${col.label}`}
              className="panel-hi absolute right-[10px] top-[40px] z-50 w-[184px] rounded-[11px] py-[5px] overflow-hidden shadow-glass"
            >
              <MenuItem label="Renommer" icon="✎" onClick={() => runAndClose(() => onRenameCol(col.id))} />
              <MenuItem
                label="Déplacer à gauche"
                icon="←"
                disabled={!canMoveLeft}
                onClick={() => runAndClose(() => onMoveCol(col.id, -1))}
              />
              <MenuItem
                label="Déplacer à droite"
                icon="→"
                disabled={!canMoveRight}
                onClick={() => runAndClose(() => onMoveCol(col.id, 1))}
              />
              <div className="h-px bg-stroke1 my-[4px]" aria-hidden />
              <MenuItem
                label="Supprimer"
                icon="🗑"
                danger
                disabled={col.locked}
                title={col.locked ? "Liste structurelle — non supprimable" : undefined}
                onClick={() => runAndClose(() => onDeleteCol(col.id))}
              />
            </div>
          </>
        )}
      </div>

      {/* Zone de dépôt */}
      <div
        data-col-list
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("drop-active");
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove("drop-active");
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("drop-active");
          onDrop(col.id);
        }}
        className="col-scroll flex-1 overflow-y-auto overscroll-contain px-[10px] pt-[3px] pb-[12px] flex flex-col gap-[10px] min-h-[60px] transition-all"
      >
        {tasks.length === 0 ? (
          <button
            type="button"
            onClick={() => onAdd(col.id)}
            className="dashed group flex flex-col items-center justify-center px-3 py-7 text-tm hover:text-t1 text-[11px] gap-2 rounded-[10px] text-center cursor-pointer transition-all mx-[1px]"
          >
            <span
              className="text-[16px] w-[28px] h-[28px] rounded-full flex items-center justify-center transition-all"
              style={{ background: `${tint}14`, color: tint, border: `1px dashed ${tint}55` }}
              aria-hidden
            >
              ＋
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.8px] opacity-80">
              {col.hint || "Ajouter une tâche"}
            </span>
          </button>
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              tint={tint}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </section>
  );
}

function MenuItem({
  label,
  icon,
  onClick,
  disabled,
  danger,
  title,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-full text-left px-[12px] py-[7px] text-[11.5px] flex items-center gap-[9px] bg-transparent border-none transition-colors ${
        disabled
          ? "text-td cursor-not-allowed"
          : danger
          ? "text-t2 hover:bg-fill2 cursor-pointer hover:text-[color:var(--bad)]"
          : "text-t2 hover:bg-fill2 hover:text-t1 cursor-pointer"
      }`}
    >
      <span className="w-[14px] text-center text-[11px]" aria-hidden>{icon}</span>
      {label}
    </button>
  );
}
