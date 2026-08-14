"use client";

import { useMemo } from "react";
import type { CategoryKey, Task } from "@/lib/types";
import { CAT_COLOR, CAT_LBL, DONE_COLS } from "@/lib/constants";
import { fmtDate, fmtDuration } from "@/lib/utils";

interface Props {
  tasks: Task[];
  onEdit: (id: string) => void;
}

export function AnalyticsView({ tasks, onEdit }: Props) {
  const done = useMemo(() => tasks.filter((t) => DONE_COLS.includes(t.col)), [tasks]);

  const totals = useMemo(() => {
    const spent = done.reduce((s, t) => s + (t.spent || 0), 0);
    const estimate = done.reduce((s, t) => s + (t.estimate || 0), 0);
    // Écart d'estimation : >100 % = on a passé plus de temps que prévu
    const drift = estimate > 0 ? (spent / estimate) * 100 : 0;
    const avg = done.length > 0 ? Math.round(spent / done.length) : 0;
    return { spent, estimate, drift, avg, count: done.length };
  }, [done]);

  const byCategory = useMemo(() => {
    const m = new Map<CategoryKey, { count: number; spent: number; estimate: number }>();
    for (const t of done) {
      const cur = m.get(t.cat) || { count: 0, spent: 0, estimate: 0 };
      cur.count += 1;
      cur.spent += t.spent || 0;
      cur.estimate += t.estimate || 0;
      m.set(t.cat, cur);
    }
    return Array.from(m.entries())
      .map(([k, v]) => ({ k, ...v }))
      .sort((a, b) => b.spent - a.spent);
  }, [done]);

  const monthly = useMemo(() => buildMonthly(done), [done]);
  const ranked = useMemo(() => [...done].sort((a, b) => b.spent - a.spent), [done]);
  const maxSpent = ranked[0]?.spent || 0;

  return (
    <div className="flex-1 overflow-y-auto px-7 py-7 relative">
      <div className="max-w-[1240px] mx-auto stagger flex flex-col gap-6">
        <header className="pr-[46px]">
          <div className="font-mono text-[10px] uppercase tracking-[1.6px] text-tm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-acc animate-breathe" aria-hidden />
            Rétrospective · MoloTask
          </div>
          <h1 className="font-display italic text-t1 text-[44px] leading-[1.05] tracking-[-1px] mt-[6px]">
            Analytiques.
          </h1>
          <p className="text-t2 text-[13px] mt-2 max-w-[560px] leading-[1.55]">
            Lecture froide de vos tâches terminées : où part le temps, et de combien vos
            estimations s&apos;écartent du réel.
          </p>
        </header>

        {done.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BigStat
                label="Temps passé"
                value={fmtDuration(totals.spent)}
                sub={`${totals.count} tâche${totals.count > 1 ? "s" : ""} terminée${totals.count > 1 ? "s" : ""}`}
                tint="#ff6b35"
                glyph="▣"
              />
              <BigStat
                label="Écart d'estimation"
                value={totals.estimate > 0 ? `${Math.round(totals.drift)}%` : "—"}
                sub={
                  totals.estimate === 0
                    ? "aucune estimation saisie"
                    : totals.drift > 105
                    ? `dépassement de ${fmtDuration(totals.spent - totals.estimate)}`
                    : totals.drift < 95
                    ? `${fmtDuration(totals.estimate - totals.spent)} de marge`
                    : "estimations justes"
                }
                tint={totals.drift > 120 ? "#ef4444" : totals.drift > 105 ? "#f59e0b" : "#14b8a6"}
                glyph="◑"
              />
              <BigStat
                label="Durée moyenne"
                value={fmtDuration(totals.avg)}
                sub="par tâche terminée"
                tint="#14b8a6"
                glyph="◐"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Temps par mois */}
              <div className="panel lg:col-span-8 rounded-[16px] p-5 relative overflow-hidden">
                <div className="mb-5">
                  <div className="font-display italic text-t1 text-[20px] tracking-[-0.3px]">
                    Temps passé par mois
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[1.4px] text-tm mt-[2px]">
                    Sur les 6 derniers mois actifs
                  </div>
                </div>
                <MonthlyBars data={monthly} />
              </div>

              {/* Par catégorie */}
              <div className="panel-hi lg:col-span-4 rounded-[16px] p-5 relative overflow-hidden">
                <div className="font-display italic text-t1 text-[20px] tracking-[-0.3px]">
                  Par catégorie
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[1.4px] text-tm mt-[2px] mb-5">
                  Temps passé
                </div>
                <div className="flex flex-col gap-4">
                  {byCategory.map((c) => {
                    const color = CAT_COLOR[c.k];
                    const pct = totals.spent > 0 ? (c.spent / totals.spent) * 100 : 0;
                    return (
                      <div key={c.k}>
                        <div className="flex items-center justify-between mb-[5px] gap-2">
                          <span className="text-t2 text-[12px] font-medium truncate">
                            {CAT_LBL[c.k]}
                          </span>
                          <span className="font-mono text-tm text-[10.5px] tabular-nums whitespace-nowrap">
                            {fmtDuration(c.spent)} · {c.count}
                          </span>
                        </div>
                        <div className="track h-[7px] rounded-full overflow-hidden relative">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Classement */}
            <section>
              <div className="flex items-baseline gap-3 mb-3 px-1 flex-wrap">
                <span className="font-display italic text-t1 text-[20px] tracking-[-0.3px]">
                  Classement
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-tm">
                  Toutes les tâches terminées
                </span>
              </div>

              <div className="panel rounded-[16px] overflow-hidden">
                <div className="grid grid-cols-12 gap-3 px-5 py-3 font-mono text-[9px] uppercase tracking-[1.4px] text-td border-b border-stroke1">
                  <div className="col-span-1">Rang</div>
                  <div className="col-span-5">Tâche</div>
                  <div className="col-span-2">Catégorie</div>
                  <div className="col-span-1 text-right">Date</div>
                  <div className="col-span-3 text-right">Estimé · Passé</div>
                </div>
                <ul>
                  {ranked.map((t, i) => {
                    const widthPct = maxSpent > 0 ? (t.spent / maxSpent) * 100 : 0;
                    const tint = CAT_COLOR[t.cat];
                    const drift =
                      t.estimate > 0 ? Math.round((t.spent / t.estimate) * 100) : null;
                    const driftColor =
                      drift === null
                        ? "var(--tm)"
                        : drift > 120
                        ? "var(--bad)"
                        : drift > 105
                        ? "var(--warn)"
                        : "var(--ok)";
                    return (
                      <li key={t.id} className="border-b border-stroke1 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => onEdit(t.id)}
                          className="grid grid-cols-12 gap-3 px-5 py-[14px] w-full text-left items-center bg-transparent border-none hover:bg-fill1 cursor-pointer transition-colors relative"
                        >
                          <div className="col-span-1 font-display italic text-[24px] leading-none text-tm tabular-nums">
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <div className="col-span-5 min-w-0">
                            <div className="text-t1 text-[12.5px] font-semibold truncate">
                              {t.title}
                            </div>
                            {t.learning && (
                              <div className="text-tm text-[10.5px] mt-[2px] italic truncate font-display">
                                « {t.learning} »
                              </div>
                            )}
                          </div>
                          <div className="col-span-2 min-w-0">
                            <span
                              className="font-mono text-[9px] uppercase tracking-[1.2px] px-[7px] py-[2px] rounded-full inline-block truncate max-w-full"
                              style={{
                                color: tint,
                                background: `${tint}1a`,
                                border: `1px solid ${tint}33`,
                              }}
                            >
                              {CAT_LBL[t.cat]}
                            </span>
                          </div>
                          <div className="col-span-1 text-right font-mono text-[10.5px] text-tm tabular-nums">
                            {fmtDate(t.date)}
                          </div>
                          <div className="col-span-3">
                            <div className="flex items-center gap-3 justify-end">
                              <span
                                className="font-mono text-[9.5px] tabular-nums whitespace-nowrap"
                                style={{ color: driftColor }}
                                title="Temps passé rapporté à l'estimation"
                              >
                                {drift === null ? "—" : `${drift}%`}
                              </span>
                              <div className="track flex-1 h-[6px] rounded-full overflow-hidden max-w-[140px]">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${widthPct}%`,
                                    background: `linear-gradient(90deg, ${tint}, ${tint}99)`,
                                  }}
                                />
                              </div>
                              <span className="font-mono text-[12px] text-t1 tabular-nums tracking-[0.3px] min-w-[54px] text-right">
                                {fmtDuration(t.spent)}
                              </span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  sub,
  tint,
  glyph,
}: {
  label: string;
  value: string;
  sub: string;
  tint: string;
  glyph: string;
}) {
  return (
    <div
      className="rounded-[16px] p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(155deg, ${tint}14, var(--fill-1) 60%)`,
        border: `1px solid ${tint}30`,
        boxShadow: "var(--sh-panel)",
      }}
    >
      <div
        aria-hidden
        className="absolute -top-4 -right-2 font-display italic text-[112px] leading-none tracking-[-3px] opacity-[0.10] select-none pointer-events-none"
        style={{ color: tint }}
      >
        {glyph}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[1.6px] text-t2">{label}</div>
      <div className="font-display italic text-t1 text-[48px] leading-none tracking-[-1.2px] mt-2 tabular-nums relative">
        {value}
      </div>
      <div className="text-t2 text-[12px] mt-2 relative">{sub}</div>
    </div>
  );
}

function MonthlyBars({ data }: { data: { key: string; label: string; spent: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="text-tm text-[11px] py-8 text-center font-mono uppercase tracking-[1px]">
        Pas encore de données mensuelles.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.spent), 1);
  return (
    <div className="flex items-stretch gap-3 h-[220px] px-1">
      {data.map((d) => {
        const h = (d.spent / max) * 100;
        return (
          <div key={d.key} className="flex-1 h-full flex flex-col items-center gap-2 min-w-0">
            <div className="w-full flex-1 flex items-end min-h-0 pt-5">
              <div
                className="w-full rounded-[8px] relative"
                style={{
                  height: `${Math.max(h, 4)}%`,
                  background: "linear-gradient(180deg, rgba(255,107,53,0.85), rgba(224,84,31,0.7))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                <span className="absolute -top-[18px] inset-x-0 text-center font-mono text-[10px] tabular-nums text-t2 whitespace-nowrap">
                  {fmtDuration(d.spent)}
                </span>
              </div>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[1.4px] text-tm">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="dashed rounded-[16px] p-10 text-center relative">
      <div className="font-display italic text-t1 text-[26px] tracking-[-0.4px]">
        Pas encore de données.
      </div>
      <p className="text-t2 text-[12.5px] mt-2 max-w-[440px] mx-auto leading-[1.55]">
        Terminez ou archivez des tâches pour voir vos chiffres ici. Les colonnes{" "}
        <em className="text-t1 not-italic">Terminé</em> et{" "}
        <em className="text-t1 not-italic">Archivé</em> alimentent cette vue.
      </p>
    </div>
  );
}

function buildMonthly(done: Task[]) {
  const m = new Map<string, { spent: number; date: Date }>();
  for (const t of done) {
    if (!t.date) continue;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = m.get(key) || { spent: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) };
    cur.spent += t.spent || 0;
    m.set(key, cur);
  }
  return Array.from(m.entries())
    .map(([key, v]) => ({
      key,
      label:
        v.date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "") +
        " " +
        String(v.date.getFullYear()).slice(-2),
      spent: v.spent,
      date: v.date,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-6);
}
