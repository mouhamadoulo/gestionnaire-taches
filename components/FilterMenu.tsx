"use client";

import { useEffect, useRef } from "react";
import type { CategoryKey, Priority } from "@/lib/types";
import { CAT_COLOR, CAT_LBL, CATEGORIES } from "@/lib/constants";
import { type Filters, EMPTY_FILTERS, filterCount, toggleIn } from "@/lib/filters";

const PRIO_LABEL: Record<Priority, { label: string; tint: string }> = {
  high: { label: "Haute", tint: "#ef4444" },
  med: { label: "Moyenne", tint: "#f59e0b" },
  low: { label: "Basse", tint: "#14b8a6" },
};

/** Au-delà, la liste de tags devient illisible : on garde les plus utilisés. */
const MAX_TAGS = 18;

interface Props {
  open: boolean;
  filters: Filters;
  tags: string[];
  overdueCount: number;
  onChange: (f: Filters) => void;
  onClose: () => void;
}

export function FilterMenu({ open, filters, tags, overdueCount, onChange, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Échap ferme le panneau avant que la page ne traite la touche.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const shown = tags.slice(0, MAX_TAGS);
  const count = filterCount(filters);

  return (
    <>
      <div className="fixed inset-0 z-40" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Filtrer les tâches"
        className="panel-hi absolute right-0 top-[calc(100%+8px)] z-50 w-[330px] max-h-[62vh] overflow-y-auto rounded-[13px] p-[15px] shadow-glass"
      >
        <div className="flex items-center justify-between mb-[13px]">
          <span className="font-mono text-[9.5px] uppercase tracking-[1.6px] text-tm">
            Filtrer · {count === 0 ? "aucun critère" : `${count} critère${count > 1 ? "s" : ""}`}
          </span>
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            disabled={count === 0}
            className={`text-[10.5px] font-semibold ${
              count === 0
                ? "text-td cursor-not-allowed"
                : "text-acc hover:underline cursor-pointer"
            } bg-transparent border-none`}
          >
            Tout effacer
          </button>
        </div>

        <button
          type="button"
          onClick={() => onChange({ ...filters, overdue: !filters.overdue })}
          aria-pressed={filters.overdue}
          className="w-full flex items-center gap-[9px] px-[11px] py-[9px] rounded-[9px] mb-[14px] cursor-pointer transition-all border text-left"
          style={
            filters.overdue
              ? { background: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.45)" }
              : { background: "var(--fill-1)", borderColor: "var(--stroke-1)" }
          }
        >
          <span
            aria-hidden
            className="w-[7px] h-[7px] rounded-full flex-shrink-0"
            style={{ background: "#ef4444" }}
          />
          <span className="text-[12px] font-medium flex-1" style={{ color: "var(--t1)" }}>
            En retard
          </span>
          <span className="font-mono text-[10.5px] tabular-nums text-tm">{overdueCount}</span>
        </button>

        <Group label="Catégorie">
          {CATEGORIES.map((c) => (
            <Pill
              key={c}
              label={CAT_LBL[c]}
              tint={CAT_COLOR[c]}
              active={filters.cats.includes(c)}
              onClick={() => onChange({ ...filters, cats: toggleIn(filters.cats, c as CategoryKey) })}
            />
          ))}
        </Group>

        <Group label="Priorité">
          {(["high", "med", "low"] as Priority[]).map((p) => (
            <Pill
              key={p}
              label={PRIO_LABEL[p].label}
              tint={PRIO_LABEL[p].tint}
              active={filters.prios.includes(p)}
              onClick={() => onChange({ ...filters, prios: toggleIn(filters.prios, p) })}
            />
          ))}
        </Group>

        {shown.length > 0 && (
          <Group label={tags.length > MAX_TAGS ? `Tags · ${MAX_TAGS} plus utilisés` : "Tags"}>
            {shown.map((tag) => (
              <Pill
                key={tag}
                label={`#${tag}`}
                tint="#8b5cf6"
                mono
                active={filters.tags.includes(tag)}
                onClick={() => onChange({ ...filters, tags: toggleIn(filters.tags, tag) })}
              />
            ))}
          </Group>
        )}
      </div>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-[14px] last:mb-0">
      <div className="font-mono text-[9px] uppercase tracking-[1.4px] text-td mb-[7px]">
        {label}
      </div>
      <div className="flex flex-wrap gap-[5px]">{children}</div>
    </div>
  );
}

function Pill({
  label,
  tint,
  active,
  mono,
  onClick,
}: {
  label: string;
  tint: string;
  active: boolean;
  mono?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-[9px] py-[4px] rounded-full text-[10.5px] cursor-pointer transition-all border ${
        mono ? "font-mono" : "font-medium"
      }`}
      style={
        active
          ? { background: `${tint}26`, borderColor: `${tint}80`, color: tint }
          : { background: "var(--fill-1)", borderColor: "var(--stroke-1)", color: "var(--t2)" }
      }
    >
      {label}
    </button>
  );
}
