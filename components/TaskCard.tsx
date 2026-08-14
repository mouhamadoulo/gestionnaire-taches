"use client";

import type { Task } from "@/lib/types";
import { CAT_COLOR, CAT_LBL, DONE_COLS } from "@/lib/constants";
import { isDueToday, isOverdue } from "@/lib/filters";
import { stepProgress } from "@/lib/tasks";
import { fmtDate, fmtDuration } from "@/lib/utils";

interface Props {
  task: Task;
  tint: string;
  /** « AAAA-MM-JJ », vide avant hydratation : aucune échéance n'est signalée. */
  today: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string, el: HTMLElement) => void;
  onDragEnd: (el: HTMLElement) => void;
}

const PRIO_TINT: Record<string, { hex: string; label: string }> = {
  high: { hex: "#ef4444", label: "Haute" },
  med:  { hex: "#f59e0b", label: "Moyenne" },
  low:  { hex: "#14b8a6", label: "Basse" },
};

export function TaskCard({ task, tint, today, onEdit, onDelete, onDragStart, onDragEnd }: Props) {
  const catColor = CAT_COLOR[task.cat] || "#64748b";
  const catLabel = CAT_LBL[task.cat] || task.cat;
  const isDone = DONE_COLS.includes(task.col);
  const prio = PRIO_TINT[task.prio] || PRIO_TINT.med;
  const late = isOverdue(task, today);
  const due = isDueToday(task, today);
  const steps = stepProgress(task);
  const stepsPct = steps.total > 0 ? Math.round((steps.done / steps.total) * 100) : 0;

  // Barre estimé / passé : 100 % = le plus grand des deux
  const scale = Math.max(task.estimate, task.spent);
  const spentPct = scale > 0 ? Math.round((task.spent / scale) * 100) : 0;
  const overrun = task.estimate > 0 && task.spent > task.estimate;
  const barColor = !task.estimate
    ? "#64748b"
    : task.spent <= task.estimate
    ? "#14b8a6"
    : task.spent <= task.estimate * 1.25
    ? "#f59e0b"
    : "#ef4444";
  // Même sémantique, mais dans une teinte lisible sur le fond du thème courant
  const statusText = !task.estimate
    ? undefined
    : task.spent <= task.estimate
    ? "var(--ok)"
    : task.spent <= task.estimate * 1.25
    ? "var(--warn)"
    : "var(--bad)";

  return (
    <article
      draggable
      data-task-id={task.id}
      onDragStart={(e) => onDragStart(task.id, e.currentTarget)}
      onDragEnd={(e) => onDragEnd(e.currentTarget)}
      className="glass-card rounded-[12px] overflow-hidden cursor-grab relative group flex-shrink-0"
    >
      <div
        aria-hidden
        className="h-[2px] w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${tint}, transparent)` }}
      />

      <div className="px-[14px] pt-[12px] pb-[11px]">
        {/* Catégorie + type */}
        <div className="flex gap-[5px] flex-wrap mb-[9px] items-center">
          <span
            className="px-[8px] py-[3px] rounded-[5px] text-[9px] font-bold tracking-[0.6px] uppercase text-white"
            style={{
              background: `linear-gradient(135deg, ${catColor}, ${catColor}cc)`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            {catLabel}
          </span>
          <span className="chip uppercase tracking-[0.5px] !text-[9px] !font-semibold">
            {task.type}
          </span>
        </div>

        {/* Titre */}
        <h3 className="text-[14px] font-semibold text-t1 leading-[1.35] mb-[6px] tracking-[-0.1px]">
          {task.title}
        </h3>

        {task.desc && (
          <p className="text-[11.5px] text-t2 leading-[1.5] mb-[9px] line-clamp-2">
            {task.desc}
          </p>
        )}

        {steps.total > 0 && (
          <div className="mb-[9px]">
            <div className="flex items-center justify-between mb-[4px] font-mono text-[10px] text-tm tabular-nums">
              <span>{steps.done === steps.total ? "☑ Étapes" : "☐ Étapes"}</span>
              <span style={steps.done === steps.total ? { color: "var(--ok)" } : undefined}>
                {steps.done}/{steps.total}
              </span>
            </div>
            <div className="track h-[4px] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-[400ms]"
                style={{
                  width: `${stepsPct}%`,
                  background:
                    steps.done === steps.total
                      ? "linear-gradient(90deg, #14b8a6, #14b8a6aa)"
                      : `linear-gradient(90deg, ${tint}, ${tint}aa)`,
                }}
              />
            </div>
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-[4px] mb-[9px]">
            {task.tags.map((t) => (
              <span key={t} className="chip font-mono">#{t}</span>
            ))}
          </div>
        )}

        {/* Estimé vs passé — tâches terminées */}
        {isDone && (task.spent > 0 || task.estimate > 0) && (
          <div className="my-[8px] mb-[10px]">
            <div className="text-[10px] text-tm mb-[4px] flex justify-between font-mono tabular-nums">
              <span>Est. {fmtDuration(task.estimate)}</span>
              <span style={{ color: overrun ? statusText : undefined }}>
                Passé {fmtDuration(task.spent)}
              </span>
            </div>
            <div className="track h-[5px] rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-[width] duration-[600ms]"
                style={{
                  width: `${spentPct}%`,
                  background: `linear-gradient(90deg, ${barColor}, ${barColor}aa)`,
                }}
              />
            </div>
          </div>
        )}

        {/* Rétrospective */}
        {isDone && task.learning && (
          <div
            className="rounded-[8px] px-[10px] py-[7px] my-[8px] text-[11px] leading-[1.5] italic font-display"
            style={{
              background: "var(--learning-bg)",
              borderLeft: "2px solid #14b8a6",
              color: "var(--learning-text)",
            }}
          >
            « {task.learning} »
          </div>
        )}

        {/* Pied de carte */}
        <div className="flex items-center justify-between pt-[9px] mt-[2px] border-t border-stroke1">
          <div className="flex items-center gap-[8px]">
            <span
              className="w-[7px] h-[7px] rounded-full flex-shrink-0"
              style={{ background: prio.hex, boxShadow: `0 0 0 2px ${prio.hex}22` }}
              title={`Priorité ${prio.label}`}
              aria-label={`Priorité ${prio.label}`}
              role="img"
            />
            {task.date && (
              <span
                className="font-mono text-[10px] tabular-nums tracking-[0.3px]"
                style={{ color: late ? "var(--bad)" : due ? "var(--warn)" : "var(--tm)" }}
                title={late ? "Échéance dépassée" : due ? "À faire aujourd'hui" : undefined}
              >
                {late && "⚠ "}
                {fmtDate(task.date)}
              </span>
            )}
            {!isDone && task.estimate > 0 && (
              <span className="font-mono text-[10px] text-td tabular-nums">
                ⏱ {fmtDuration(task.estimate)}
              </span>
            )}
          </div>
          <div className="flex gap-[3px] opacity-70 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task.id);
              }}
              title="Modifier"
              aria-label={`Modifier la tâche « ${task.title} »`}
              className="btn-ghost w-[26px] h-[26px] rounded-[7px] text-[12px] leading-none flex items-center justify-center"
            >
              ✎
            </button>
            <button
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              title="Supprimer"
              aria-label={`Supprimer la tâche « ${task.title} »`}
              className="btn-ghost w-[26px] h-[26px] rounded-[7px] text-[12px] leading-none flex items-center justify-center hover:!text-[#ef4444] hover:!border-[#ef4444]/40"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
