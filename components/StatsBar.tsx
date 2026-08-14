import type { Task } from "@/lib/types";
import { ACTIVE_COLS, DONE_COLS } from "@/lib/constants";
import { fmtDuration } from "@/lib/utils";

interface Stat {
  glyph: string;
  tint: string;
  value: string | number;
  label: string;
}

export function StatsBar({ tasks }: { tasks: Task[] }) {
  const inbox = tasks.filter((t) => t.col === "inbox").length;
  const active = tasks.filter((t) => ACTIVE_COLS.includes(t.col)).length;
  const sched = tasks.filter((t) => t.col === "sched").length;
  const done = tasks.filter((t) => DONE_COLS.includes(t.col)).length;
  const spent = tasks.reduce((s, t) => s + (t.spent || 0), 0);

  const stats: Stat[] = [
    { glyph: "✦", tint: "#b599ff", value: inbox,               label: "À trier" },
    { glyph: "◐", tint: "#ffb86b", value: active,              label: "En cours" },
    { glyph: "◇", tint: "#14b8a6", value: sched,               label: "Planifiées" },
    { glyph: "◆", tint: "#7aa2ff", value: done,                label: "Terminées" },
    { glyph: "▣", tint: "#ff6b35", value: fmtDuration(spent),  label: "Temps passé" },
  ];

  return (
    <div className="px-7 py-[12px] flex gap-3 flex-shrink-0 relative border-b border-stroke1">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="flex items-center gap-[10px] px-[14px] py-[9px] rounded-[11px] glass-soft flex-1 min-w-0 transition-all hover:border-stroke2"
        >
          <div
            className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[15px] flex-shrink-0 relative"
            style={{
              background: `linear-gradient(135deg, ${s.tint}22, ${s.tint}08)`,
              border: `1px solid ${s.tint}30`,
              color: s.tint,
            }}
            aria-hidden
          >
            {s.glyph}
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[18px] font-semibold leading-none text-t1 tabular-nums">
              {s.value}
            </div>
            <div className="text-[10px] text-tm uppercase tracking-[0.8px] mt-[3px] font-medium">
              {s.label}
            </div>
          </div>
          <div className="ml-auto flex-col items-end gap-[2px] text-td font-mono text-[8px] hidden md:flex">
            <span>{String(i + 1).padStart(2, "0")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
