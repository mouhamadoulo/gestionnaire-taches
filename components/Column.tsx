"use client";

import type { Card, ColumnDef, ColumnId } from "@/lib/types";
import { CardItem } from "./CardItem";

interface Props {
  col: ColumnDef;
  cards: Card[];
  onAdd: (colId: ColumnId) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDrop: (colId: ColumnId) => void;
  onDragStart: (id: string, el: HTMLElement) => void;
  onDragEnd: (el: HTMLElement) => void;
}

// Per-column accent (used for glow, top edge, badge)
export const COL_TINT: Record<ColumnId, string> = {
  ideas: "#b599ff",
  plan:  "#7aa2ff",
  prod:  "#ffb86b",
  edit:  "#ff8ab4",
  sched: "#5eead4",
  pub:   "#9eb1ff",
  arch:  "#7d8499",
};

export function Column({ col, cards, onAdd, onEdit, onDelete, onDrop, onDragStart, onDragEnd }: Props) {
  const tint = COL_TINT[col.id];

  return (
    <div
      className="w-[286px] flex-shrink-0 flex flex-col rounded-[14px] overflow-hidden max-h-full relative"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.005) 100%), rgba(10, 12, 20, 0.45)",
        border: "1px solid #ffffff0d",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        boxShadow: "inset 0 1px 0 #ffffff08, 0 12px 28px -16px #000000aa",
      }}
    >
      {/* Top tinted glow rule */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] opacity-90"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${tint} 30%, ${tint} 70%, transparent 100%)`,
          boxShadow: `0 0 14px ${tint}99`,
        }}
      />

      {/* Header */}
      <div className="px-[14px] pt-[14px] pb-[10px] flex items-center gap-[9px] relative">
        <span
          className="w-[8px] h-[8px] rounded-full flex-shrink-0"
          style={{
            background: tint,
            boxShadow: `0 0 10px ${tint}, 0 0 0 3px ${tint}22`,
          }}
        />
        <span className="text-[11px] font-bold text-t1 flex-1 uppercase tracking-[1.2px] truncate">
          {col.label}
        </span>
        <span
          className="font-mono text-[10px] font-semibold px-[7px] py-[2px] rounded-full tabular-nums"
          style={{
            background: `${tint}1a`,
            color: tint,
            border: `1px solid ${tint}33`,
          }}
        >
          {String(cards.length).padStart(2, "0")}
        </span>
        <button
          onClick={() => onAdd(col.id)}
          title="Ajouter"
          className="bg-transparent border-none text-tm hover:text-t1 cursor-pointer text-[15px] w-[20px] h-[20px] rounded leading-none transition-colors flex items-center justify-center hover:bg-white/[0.06]"
        >
          ＋
        </button>
      </div>

      {/* Drop zone */}
      <div
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
        className="flex-1 overflow-y-auto px-[10px] pt-[3px] pb-[12px] flex flex-col gap-[10px] min-h-[60px] transition-all"
      >
        {cards.length === 0 ? (
          <div
            onClick={() => onAdd(col.id)}
            className="group flex flex-col items-center justify-center px-3 py-7 text-tm hover:text-t1 text-[11px] gap-2 rounded-[10px] text-center cursor-pointer transition-all mx-[1px]"
            style={{
              border: "1.5px dashed #ffffff14",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <div
              className="text-[16px] w-[28px] h-[28px] rounded-full flex items-center justify-center transition-all"
              style={{
                background: `${tint}14`,
                color: tint,
                border: `1px dashed ${tint}55`,
              }}
            >
              ＋
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.8px] opacity-80">{col.hint}</div>
          </div>
        ) : (
          cards.map((c) => (
            <CardItem
              key={c.id}
              card={c}
              col={col}
              tint={tint}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}
