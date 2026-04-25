import type { Card } from "@/lib/types";
import { PAST_COLS } from "@/lib/constants";
import { fmtNum } from "@/lib/utils";

interface Stat {
  glyph: string;
  tint: string;
  value: string | number;
  label: string;
}

export function StatsBar({ cards }: { cards: Card[] }) {
  const ideas    = cards.filter((c) => c.col === "ideas").length;
  const inprog   = cards.filter((c) => ["plan", "prod", "edit"].includes(c.col)).length;
  const sched    = cards.filter((c) => c.col === "sched").length;
  const pubCount = cards.filter((c) => PAST_COLS.includes(c.col)).length;
  const totViews = cards.reduce((s, c) => s + (c.views || 0), 0);

  const stats: Stat[] = [
    { glyph: "✦", tint: "#b599ff", value: ideas,            label: "Idées" },
    { glyph: "◐", tint: "#ffb86b", value: inprog,           label: "En cours" },
    { glyph: "◇", tint: "#5eead4", value: sched,            label: "Programmés" },
    { glyph: "◆", tint: "#7aa2ff", value: pubCount,         label: "Publiés" },
    { glyph: "▣", tint: "#ff6b35", value: fmtNum(totViews), label: "Vues totales" },
  ];

  return (
    <div className="px-7 py-[12px] flex gap-3 flex-shrink-0 relative" style={{ borderBottom: "1px solid #ffffff08" }}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="flex items-center gap-[10px] px-[14px] py-[9px] rounded-[11px] glass-soft flex-1 min-w-0 transition-all hover:border-white/[0.18]"
        >
          {/* Glyph capsule with colored glow */}
          <div
            className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[15px] flex-shrink-0 relative"
            style={{
              background: `linear-gradient(135deg, ${s.tint}22, ${s.tint}08)`,
              border: `1px solid ${s.tint}30`,
              color: s.tint,
              boxShadow: `inset 0 1px 0 ${s.tint}25, 0 0 14px -4px ${s.tint}66`,
            }}
          >
            {s.glyph}
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[18px] font-semibold leading-none text-t1 tabular-nums" style={{ textShadow: `0 0 16px ${s.tint}40` }}>
              {s.value}
            </div>
            <div className="text-[10px] text-tm uppercase tracking-[0.8px] mt-[3px] font-medium">
              {s.label}
            </div>
          </div>
          {/* Sparkline-like decorative tick */}
          <div className="ml-auto flex flex-col items-end gap-[2px] text-td font-mono text-[8px] hidden md:flex">
            <span>{String(i + 1).padStart(2, "0")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
