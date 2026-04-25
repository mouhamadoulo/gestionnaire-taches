"use client";

import type { Card, ColumnDef } from "@/lib/types";
import { PAST_COLS, PLT_COLOR, PLT_LBL } from "@/lib/constants";
import { fmtDate, fmtNum } from "@/lib/utils";

interface Props {
  card: Card;
  col: ColumnDef;
  tint: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string, el: HTMLElement) => void;
  onDragEnd: (el: HTMLElement) => void;
}

const PRIO_TINT: Record<string, { hex: string; label: string }> = {
  high: { hex: "#ff5e5e", label: "Haute" },
  med:  { hex: "#ffb86b", label: "Moyenne" },
  low:  { hex: "#5eead4", label: "Basse" },
};

export function CardItem({ card, col, tint, onEdit, onDelete, onDragStart, onDragEnd }: Props) {
  const pltColor = PLT_COLOR[card.plt] || "#6b7280";
  const lbl = PLT_LBL[card.plt] || card.plt;
  const isPast = PAST_COLS.includes(card.col);
  const prio = PRIO_TINT[card.prio];

  const perfPct = card.views > 0 ? Math.min(100, Math.round(card.views / 500)) : 0;
  const perfColor = perfPct > 66 ? "#5eead4" : perfPct > 33 ? "#ffb86b" : "#ff6b6b";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(card.id, e.currentTarget)}
      onDragEnd={(e) => onDragEnd(e.currentTarget)}
      className="glass-card rounded-[12px] overflow-hidden cursor-grab relative group"
    >
      {/* Top tinted bar — column color, with subtle glow */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${tint}, transparent)`,
          boxShadow: `0 0 8px ${tint}80`,
        }}
      />

      <div className="px-[14px] pt-[12px] pb-[11px]">
        {/* Platform + type chips */}
        <div className="flex gap-[5px] flex-wrap mb-[9px] items-center">
          <span
            className="px-[8px] py-[3px] rounded-[5px] text-[9px] font-bold tracking-[0.6px] uppercase text-white"
            style={{
              background: `linear-gradient(135deg, ${pltColor}, ${pltColor}cc)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 10px ${pltColor}55`,
            }}
          >
            {lbl}
          </span>
          <span className="chip uppercase tracking-[0.5px] !text-[9px] !font-semibold">
            {card.type}
          </span>
        </div>

        {/* Title */}
        <div className="text-[14px] font-semibold text-t1 leading-[1.35] mb-[6px] tracking-[-0.1px]">
          {card.title}
        </div>

        {/* Description */}
        {card.desc && (
          <div className="text-[11.5px] text-t2 leading-[1.5] mb-[9px] line-clamp-2">
            {card.desc}
          </div>
        )}

        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-[4px] mb-[9px]">
            {card.tags.map((t) => (
              <span key={t} className="chip font-mono">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Performance bar (past content only) */}
        {isPast && card.views > 0 && (
          <div className="my-[8px] mb-[10px]">
            <div className="text-[10px] text-tm mb-[4px] flex justify-between font-mono tabular-nums">
              <span className="flex items-center gap-1">
                <span className="opacity-70">◉</span> {fmtNum(card.views)}
              </span>
              <span className="flex items-center gap-1">
                <span style={{ color: "#ff5e8a" }}>♥</span> {fmtNum(card.likes)}
              </span>
            </div>
            <div
              className="h-[5px] rounded-full overflow-hidden relative"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-[600ms]"
                style={{
                  width: `${perfPct}%`,
                  background: `linear-gradient(90deg, ${perfColor}, ${perfColor}aa)`,
                  boxShadow: `0 0 10px ${perfColor}80`,
                }}
              />
            </div>
          </div>
        )}

        {/* Learning note */}
        {isPast && card.learning && (
          <div
            className="rounded-[8px] px-[10px] py-[7px] my-[8px] text-[11px] leading-[1.5] italic font-display"
            style={{
              background: "linear-gradient(135deg, rgba(94,234,212,0.06), rgba(94,234,212,0.02))",
              borderLeft: "2px solid #5eead4",
              color: "#c8e8e0",
            }}
          >
            « {card.learning} »
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-[9px] mt-[2px]" style={{ borderTop: "1px solid #ffffff0a" }}>
          <div className="flex items-center gap-[8px]">
            <span
              className="w-[7px] h-[7px] rounded-full flex-shrink-0"
              style={{
                background: prio.hex,
                boxShadow: `0 0 8px ${prio.hex}, 0 0 0 2px ${prio.hex}22`,
              }}
              title={`Priorité ${prio.label}`}
            />
            {card.date && (
              <span className="font-mono text-[10px] text-tm tabular-nums tracking-[0.3px]">
                {fmtDate(card.date)}
              </span>
            )}
          </div>
          <div className="flex gap-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(card.id)}
              title="Modifier"
              className="bg-transparent border-none text-tm hover:text-t1 hover:bg-white/[0.06] cursor-pointer w-[22px] h-[22px] rounded text-[11px] transition-colors leading-none flex items-center justify-center"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(card.id)}
              title="Supprimer"
              className="bg-transparent border-none text-tm hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 cursor-pointer w-[22px] h-[22px] rounded text-[11px] transition-colors leading-none flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
