"use client";

import type { ColumnDef, ColumnId, Task } from "@/lib/types";

interface Props {
  columns: ColumnDef[];
  /** Tâches déjà filtrées par le tableau : les compteurs suivent la recherche. */
  tasks: Task[];
  active: ColumnId;
  onSelect: (colId: ColumnId) => void;
  onAdd: () => void;
}

/**
 * Sélecteur de liste du tableau sur petit écran.
 *
 * Sous `md`, le tableau n'affiche qu'une colonne à la fois : ces pastilles
 * remplacent le défilement horizontal, qui demande une précision qu'on n'a pas
 * au doigt et cache les listes de droite sans le dire.
 */
export function ColumnTabs({ columns, tasks, active, onSelect, onAdd }: Props) {
  return (
    <div
      role="group"
      aria-label="Choisir une liste"
      className="md:hidden flex gap-[7px] overflow-x-auto no-scrollbar px-4 pt-3 pb-1 flex-shrink-0"
    >
      {columns.map((col) => {
        const n = tasks.filter((t) => t.col === col.id).length;
        const on = col.id === active;
        return (
          <button
            key={col.id}
            type="button"
            onClick={() => onSelect(col.id)}
            aria-pressed={on}
            className={`flex items-center gap-[7px] flex-shrink-0 rounded-full px-[12px] py-[7px] text-[11px] font-semibold border transition-all ${
              on ? "text-t1" : "text-tm border-stroke1 bg-fill1"
            }`}
            style={
              on
                ? { background: `${col.tint}1f`, borderColor: `${col.tint}66` }
                : undefined
            }
          >
            <span
              aria-hidden
              className="w-[7px] h-[7px] rounded-full flex-shrink-0"
              style={{ background: col.tint }}
            />
            <span className="whitespace-nowrap">{col.label}</span>
            <span
              className="font-mono text-[10px] tabular-nums px-[6px] py-px rounded-full"
              style={{ background: `${col.tint}1a`, color: col.tint }}
            >
              {String(n).padStart(2, "0")}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        aria-label="Créer une liste"
        title="Créer une liste"
        className="flex-shrink-0 w-[32px] h-[32px] rounded-full flex items-center justify-center text-[14px] leading-none text-acc bg-acc/[0.10] border border-dashed border-acc/50"
      >
        <span aria-hidden>＋</span>
      </button>
    </div>
  );
}
