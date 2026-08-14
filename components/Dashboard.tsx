"use client";

import { useMemo } from "react";
import type { CategoryKey, ColumnDef, Task, ViewId } from "@/lib/types";
import { ACTIVE_COLS, CAT_COLOR, CAT_LBL, DONE_COLS } from "@/lib/constants";
import { tintOf } from "@/lib/columns";
import { fmtDuration } from "@/lib/utils";

interface Props {
  tasks: Task[];
  columns: ColumnDef[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onView: (v: ViewId) => void;
}

export function Dashboard({ tasks, columns, onAdd, onEdit, onView }: Props) {
  const stats = useMemo(() => computeStats(tasks), [tasks]);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks
      .filter((t) => t.date && !DONE_COLS.includes(t.col))
      .filter((t) => new Date(t.date) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);
  }, [tasks]);

  const overdue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks
      .filter((t) => t.date && !DONE_COLS.includes(t.col) && new Date(t.date) < today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks]);

  const heaviest = useMemo(
    () =>
      tasks
        .filter((t) => DONE_COLS.includes(t.col) && t.spent > 0)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 4),
    [tasks],
  );

  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="flex-1 overflow-y-auto px-7 py-7 relative">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-7 stagger">
        {/* Accueil */}
        <header className="flex items-end justify-between gap-6 flex-wrap pr-[46px]">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[1.6px] text-tm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-acc animate-breathe" aria-hidden />
              {fmtFullDate(new Date())} · MoloTask
            </div>
            <h1 className="font-display italic text-t1 text-[44px] leading-[1.05] tracking-[-1px] mt-[6px]">
              {greeting},<br />
              <span className="text-acc">Mouhamadou</span>.
            </h1>
            <p className="text-t2 text-[13px] mt-[10px] max-w-[480px] leading-[1.55]">
              {stats.active} tâche{stats.active > 1 ? "s" : ""} en cours · {stats.scheduled} planifiée
              {stats.scheduled > 1 ? "s" : ""}
              {overdue.length > 0 ? ` · ${overdue.length} en retard` : " · rien en retard"}.
            </p>
          </div>

          <button
            onClick={onAdd}
            className="btn-primary flex items-center gap-[8px] rounded-[12px] px-[18px] py-[11px] text-[12px] font-semibold"
          >
            <span className="text-[15px] leading-none" aria-hidden>＋</span>
            Nouvelle tâche
            <kbd className="font-mono text-[9px] px-[5px] py-[1px] rounded border border-white/30 bg-white/10 ml-1">
              ⌘N
            </kbd>
          </button>
        </header>

        {/* Retards */}
        {overdue.length > 0 && (
          <section
            className="rounded-[14px] px-5 py-4 flex items-center gap-4 flex-wrap"
            style={{
              background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))",
              border: "1px solid rgba(239,68,68,0.35)",
            }}
          >
            <span className="text-[18px]" aria-hidden>⚠</span>
            <div className="flex-1 min-w-[220px]">
              <div className="text-t1 text-[13px] font-semibold">
                {overdue.length} tâche{overdue.length > 1 ? "s" : ""} en retard
              </div>
              <div className="text-t2 text-[11.5px] mt-[2px] truncate">
                {overdue.slice(0, 3).map((t) => t.title).join(" · ")}
                {overdue.length > 3 && " …"}
              </div>
            </div>
            <button
              onClick={() => onEdit(overdue[0].id)}
              className="btn-ghost rounded-[9px] px-3 py-[7px] text-[11px] font-mono uppercase tracking-[1px]"
            >
              Traiter la plus ancienne
            </button>
          </section>
        )}

        {/* Pipeline */}
        <section className="glass-soft rounded-[16px] p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div className="flex items-baseline gap-3">
              <span className="font-display italic text-t1 text-[20px] tracking-[-0.3px]">Flux</span>
              <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-tm">
                De la boîte de réception à l&apos;archive
              </span>
            </div>
            <button
              onClick={() => onView("board")}
              className="font-mono text-[10px] uppercase tracking-[1.2px] text-tm hover:text-acc cursor-pointer bg-transparent border-none transition-colors"
            >
              Ouvrir le tableau →
            </button>
          </div>

          <div className="flex items-center gap-[2px] h-[58px]">
            {columns.map((col, i) => {
              const count = tasks.filter((t) => t.col === col.id).length;
              const total = tasks.length || 1;
              const pct = (count / total) * 100;
              const tint = col.tint;
              const isLast = i === columns.length - 1;
              return (
                <div key={col.id} className="flex items-stretch h-full flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onView("board")}
                    title={`${col.label} · ${count}`}
                    className="flex-1 h-full rounded-[8px] relative overflow-hidden bg-transparent cursor-pointer transition-all hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(180deg, ${tint}20, ${tint}06)`,
                      border: `1px solid ${tint}40`,
                    }}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-x-0 bottom-0"
                      style={{
                        height: `${Math.max(pct, count > 0 ? 18 : 0)}%`,
                        background: `linear-gradient(180deg, ${tint}66, ${tint}bb)`,
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-mono uppercase tracking-[0.5px] z-10">
                      <span className="text-t1 font-bold tabular-nums text-[15px] leading-none">
                        {String(count).padStart(2, "0")}
                      </span>
                      <span className="text-tm text-[8px] mt-[2px] truncate max-w-full px-1">
                        {col.label.replace(/^\S+\s/, "")}
                      </span>
                    </div>
                  </button>
                  {!isLast && (
                    <div className="w-[10px] flex items-center justify-center text-[10px]" style={{ color: tint }} aria-hidden>
                      ›
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Trois colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Chiffre principal */}
          <Panel className="lg:col-span-4 p-5">
            <div className="font-mono text-[10px] uppercase tracking-[1.6px] text-tm">
              Temps investi
            </div>
            <div className="font-display italic text-t1 text-[52px] leading-none tracking-[-1.5px] mt-2 tabular-nums">
              {fmtDuration(stats.totalSpent)}
            </div>
            <div className="text-t2 text-[12px] mt-2 flex items-center gap-2">
              <span className="text-cool font-mono tabular-nums">
                ⏱ {fmtDuration(stats.totalEstimate)}
              </span>
              <span className="text-td">·</span>
              <span>estimé au total</span>
            </div>
            <div className="mt-5 pt-4 border-t border-stroke1 flex items-center justify-between text-[11px]">
              <MiniStat label="Terminées" value={stats.done} />
              <MiniStat label="À trier" value={stats.inbox} />
              <MiniStat label="En cours" value={stats.active} />
            </div>
          </Panel>

          {/* À venir */}
          <Panel className="lg:col-span-5 p-5">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-baseline gap-2">
                <span className="font-display italic text-t1 text-[18px] tracking-[-0.3px]">À venir</span>
                <span className="font-mono text-[9px] uppercase tracking-[1.4px] text-tm">
                  Prochaines échéances
                </span>
              </div>
              <button
                onClick={() => onView("calendar")}
                className="font-mono text-[10px] uppercase tracking-[1.2px] text-tm hover:text-acc cursor-pointer bg-transparent border-none transition-colors whitespace-nowrap"
              >
                Calendrier →
              </button>
            </div>
            {upcoming.length === 0 ? (
              <EmptyHint label="Aucune échéance — ajoutez une date à vos tâches" />
            ) : (
              <ul className="flex flex-col gap-[6px]">
                {upcoming.map((t) => {
                  const tint = tintOf(columns, t.col);
                  const days = daysUntil(t.date);
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => onEdit(t.id)}
                        className="w-full text-left flex items-center gap-3 px-3 py-[9px] rounded-[10px] bg-fill1 hover:bg-fill2 border border-stroke1 hover:border-stroke2 transition-all cursor-pointer"
                      >
                        <div
                          className="flex flex-col items-center justify-center w-[42px] h-[42px] rounded-[9px] flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${tint}26, ${tint}08)`,
                            border: `1px solid ${tint}40`,
                            color: tint,
                          }}
                        >
                          <span className="font-mono text-[9px] uppercase tracking-[1px] opacity-80 leading-none">
                            {monthAbbr(t.date)}
                          </span>
                          <span className="font-display italic text-[18px] leading-none mt-[2px] tabular-nums">
                            {dayNum(t.date)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-t1 text-[12.5px] font-semibold truncate">{t.title}</div>
                          <div className="text-tm text-[10px] mt-[2px] flex items-center gap-2">
                            <span style={{ color: CAT_COLOR[t.cat] }}>{CAT_LBL[t.cat]}</span>
                            <span className="text-td">·</span>
                            <span className="font-mono uppercase tracking-[0.8px]">
                              {days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `J−${days}`}
                            </span>
                          </div>
                        </div>
                        <span className="text-tm text-[14px]" aria-hidden>›</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* Répartition */}
          <Panel className="lg:col-span-3 p-5">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-display italic text-t1 text-[18px] tracking-[-0.3px]">Répartition</span>
              <span className="font-mono text-[9px] uppercase tracking-[1.4px] text-tm">Par catégorie</span>
            </div>
            <CategoryMix tasks={tasks} />
          </Panel>
        </div>

        {/* Tâches les plus lourdes */}
        {heaviest.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-3 px-1 gap-3 flex-wrap">
              <div className="flex items-baseline gap-3">
                <span className="font-display italic text-t1 text-[20px] tracking-[-0.3px]">
                  Les plus lourdes
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-tm">
                  Terminées, par temps passé
                </span>
              </div>
              <button
                onClick={() => onView("analytics")}
                className="font-mono text-[10px] uppercase tracking-[1.2px] text-tm hover:text-acc cursor-pointer bg-transparent border-none transition-colors"
              >
                Tout l&apos;analytique →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {heaviest.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => onEdit(t.id)}
                  className="text-left glass-card rounded-[14px] p-4 cursor-pointer relative overflow-hidden group"
                >
                  <div
                    aria-hidden
                    className="absolute -top-6 -right-6 font-display italic text-[88px] leading-none tracking-[-2px] opacity-[0.07] group-hover:opacity-[0.12] transition-opacity select-none pointer-events-none"
                    style={{ color: CAT_COLOR[t.cat] }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="font-mono text-[9px] uppercase tracking-[1.4px] inline-block px-[7px] py-[2px] rounded-full mb-2"
                    style={{
                      color: CAT_COLOR[t.cat],
                      background: `${CAT_COLOR[t.cat]}1a`,
                      border: `1px solid ${CAT_COLOR[t.cat]}33`,
                    }}
                  >
                    {CAT_LBL[t.cat]}
                  </div>
                  <div className="text-t1 text-[13px] font-semibold leading-[1.35] mb-3 line-clamp-2 relative">
                    {t.title}
                  </div>
                  <div className="flex items-end gap-3 relative">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[1.2px] text-tm">Passé</div>
                      <div className="font-display italic text-[24px] leading-none tabular-nums text-t1 mt-[2px]">
                        {fmtDuration(t.spent)}
                      </div>
                    </div>
                    <div className="ml-auto text-tm font-mono text-[11px] tabular-nums">
                      est. {fmtDuration(t.estimate)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono uppercase tracking-[1.4px] text-td text-[9px]">{label}</span>
      <span className="text-t1 font-semibold text-[14px] tabular-nums mt-1">{value}</span>
    </div>
  );
}

function CategoryMix({ tasks }: { tasks: Task[] }) {
  const counts = new Map<CategoryKey, number>();
  for (const t of tasks) counts.set(t.cat, (counts.get(t.cat) || 0) + 1);
  const total = tasks.length || 1;
  const entries = Array.from(counts.entries())
    .map(([k, v]) => ({ k, v, pct: (v / total) * 100 }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);

  if (entries.length === 0) return <EmptyHint label="Aucune tâche" />;

  return (
    <div className="flex flex-col gap-[10px]">
      {entries.map((e) => {
        const c = CAT_COLOR[e.k] || "#64748b";
        return (
          <div key={e.k}>
            <div className="flex items-center justify-between text-[10.5px] mb-[3px]">
              <span className="text-t2 font-medium">{CAT_LBL[e.k]}</span>
              <span className="font-mono text-tm tabular-nums">{e.v}</span>
            </div>
            <div className="track h-[5px] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${e.pct}%`, background: `linear-gradient(90deg, ${c}, ${c}aa)` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`panel rounded-[16px] relative ${className}`}>{children}</div>;
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-6 text-tm text-[11px] font-mono uppercase tracking-[0.8px] text-center">
      {label}
    </div>
  );
}

function computeStats(tasks: Task[]) {
  return {
    inbox: tasks.filter((t) => t.col === "inbox").length,
    active: tasks.filter((t) => ACTIVE_COLS.includes(t.col)).length,
    scheduled: tasks.filter((t) => t.col === "sched").length,
    done: tasks.filter((t) => DONE_COLS.includes(t.col)).length,
    totalSpent: tasks.reduce((s, t) => s + (t.spent || 0), 0),
    totalEstimate: tasks.reduce((s, t) => s + (t.estimate || 0), 0),
  };
}

function greetingForHour(h: number) {
  if (h < 5) return "Encore éveillé";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bel après-midi";
  return "Bonsoir";
}

function fmtFullDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function monthAbbr(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
}
function dayNum(s: string) {
  return new Date(s).getDate();
}
function daysUntil(s: string) {
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  const b = new Date(s);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
