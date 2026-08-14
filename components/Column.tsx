"use client";

import type { ColumnDef, ColumnId, Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface Props {
  col: ColumnDef;
  tasks: Task[];
  onAdd: (colId: ColumnId) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDrop: (colId: ColumnId) => void;
  onDragStart: (id: string, el: HTMLElement) => void;
  onDragEnd: (el: HTMLElement) => void;
}

// Accent par colonne (halo, liseré, pastille)
export const COL_TINT: Record<ColumnId, string> = {
  inbox:  "#8b5cf6",
  todo:   "#3b82f6",
  doing:  "#f59e0b",
  review: "#ec4899",
  sched:  "#14b8a6",
  done:   "#6366f1",
  arch:   "#64748b",
};

export function Column({ col, tasks, onAdd, onEdit, onDelete, onDrop, onDragStart, onDragEnd }: Props) {
  const tint = COL_TINT[col.id];

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
      <div className="px-[14px] pt-[14px] pb-[10px] flex items-center gap-[9px] relative">
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
              {col.hint}
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
