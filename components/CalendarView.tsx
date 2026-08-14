"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, Task } from "@/lib/types";
import { CAT_COLOR, CAT_LBL } from "@/lib/constants";
import { tintOf } from "@/lib/columns";

interface Props {
  tasks: Task[];
  columns: ColumnDef[];
  onAdd: () => void;
  onEdit: (id: string) => void;
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function CalendarView({ tasks, columns, onAdd, onEdit }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(toISO(today));

  const grid = useMemo(() => buildGrid(cursor), [cursor]);
  const byDate = useMemo(() => indexByDate(tasks), [tasks]);
  const selectedTasks = byDate.get(selected) || [];

  const monthCount = useMemo(() => {
    let n = 0;
    for (const day of grid.flat()) {
      if (day && day.inMonth) n += (byDate.get(toISO(day.date)) || []).length;
    }
    return n;
  }, [grid, byDate]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-7 pt-[62px] md:pt-7 pb-6 md:pb-7 relative">
      <div className="max-w-[1240px] mx-auto stagger">
        {/* En-tête */}
        <header className="flex items-end justify-between gap-4 md:gap-6 flex-wrap mb-5 md:mb-6 md:pr-[46px]">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[1.6px] text-tm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cool" aria-hidden />
              Échéancier
            </div>
            <h1 className="font-display italic text-t1 text-[30px] md:text-[44px] leading-[1.05] tracking-[-1px] mt-[6px]">
              {MONTHS[cursor.getMonth()]}{" "}
              <span className="text-tm font-mono not-italic text-[19px] md:text-[24px] tracking-[-0.5px] tabular-nums">
                {cursor.getFullYear()}
              </span>
            </h1>
            <p className="text-t2 text-[13px] mt-2">
              {monthCount === 0
                ? "Aucune échéance ce mois-ci."
                : `${monthCount} tâche${monthCount > 1 ? "s" : ""} datée${monthCount > 1 ? "s" : ""} dans le mois.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavBtn onClick={() => stepMonth(setCursor, -1)} label="‹" title="Mois précédent" />
            <button
              onClick={() => {
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelected(toISO(today));
              }}
              className="btn-ghost font-mono text-[10px] uppercase tracking-[1.4px] px-3 py-[8px] rounded-[10px]"
            >
              Aujourd&apos;hui
            </button>
            <NavBtn onClick={() => stepMonth(setCursor, 1)} label="›" title="Mois suivant" />
            <button
              onClick={onAdd}
              className="btn-primary ml-2 flex items-center gap-[6px] rounded-[10px] px-[14px] py-[8px] text-[12px] font-semibold"
            >
              <span className="text-[14px] leading-none" aria-hidden>＋</span>
              Planifier
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Grille */}
          <div className="panel xl:col-span-8 rounded-[16px] p-2 md:p-4 relative overflow-hidden">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="font-mono text-[9px] uppercase tracking-[1.4px] text-td text-center py-[6px]"
                >
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {grid.flat().map((day, idx) => {
                if (!day) return <div key={idx} />;
                const iso = toISO(day.date);
                const items = byDate.get(iso) || [];
                const isToday = iso === toISO(today);
                const isSelected = iso === selected;
                const isOut = !day.inMonth;
                return (
                  <button
                    key={iso}
                    onClick={() => setSelected(iso)}
                    aria-pressed={isSelected}
                    aria-label={`${day.date.getDate()} — ${items.length} tâche(s)`}
                    className={`relative aspect-square min-h-[46px] md:min-h-[78px] p-[4px] md:p-2 rounded-[8px] md:rounded-[10px] cursor-pointer transition-all flex flex-col items-stretch text-left border ${
                      isSelected
                        ? "border-acc/60 bg-acc/[0.08]"
                        : isToday
                        ? "border-cool/40 bg-cool/[0.06]"
                        : isOut
                        ? "border-transparent bg-transparent hover:border-stroke1"
                        : "border-stroke1 bg-fill1 hover:border-stroke2"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono tabular-nums text-[12px] leading-none ${
                          isOut ? "text-td" : isToday ? "text-cool font-bold" : "text-t2"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {items.length > 0 && (
                        <span
                          className={`font-mono text-[9px] tabular-nums px-[5px] py-[1px] rounded-full ${
                            isSelected ? "text-acc bg-acc/20" : "text-tm bg-fill2"
                          }`}
                        >
                          {items.length}
                        </span>
                      )}
                    </div>
                    {/* Sur un téléphone, une case fait 45 px : le décompte suffit,
                        les titres partent dans le détail du jour juste dessous. */}
                    <div className="hidden md:flex flex-col gap-[3px] mt-[5px] overflow-hidden">
                      {items.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="text-[9.5px] truncate font-medium leading-[1.2] px-[5px] py-[2px] rounded-[5px]"
                          style={{
                            color: CAT_COLOR[t.cat],
                            background: `${CAT_COLOR[t.cat]}18`,
                            border: `1px solid ${CAT_COLOR[t.cat]}30`,
                          }}
                          title={t.title}
                        >
                          {t.title}
                        </span>
                      ))}
                      {items.length > 3 && (
                        <span className="font-mono text-[8px] text-td">+{items.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Détail du jour */}
          <aside className="panel-hi xl:col-span-4 rounded-[16px] p-4 md:p-5 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[1px]"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.6) 30%, rgba(20,184,166,0.5) 70%, transparent)",
              }}
            />
            <div className="font-mono text-[9px] uppercase tracking-[1.6px] text-tm">
              Jour sélectionné
            </div>
            <div className="font-display italic text-t1 text-[28px] leading-tight tracking-[-0.4px] mt-1">
              {fmtLong(new Date(selected))}
            </div>

            <div className="mt-5 flex flex-col gap-[8px]">
              {selectedTasks.length === 0 ? (
                <div className="dashed rounded-[12px] py-7 px-3 text-center text-tm text-[11px] font-mono uppercase tracking-[0.8px]">
                  Aucune tâche ce jour
                  <button
                    onClick={onAdd}
                    className="block mt-3 mx-auto text-acc hover:text-acc-hover text-[11px] font-mono uppercase tracking-[1.2px] bg-transparent border-none cursor-pointer underline-offset-4 hover:underline"
                  >
                    + Planifier une tâche
                  </button>
                </div>
              ) : (
                selectedTasks.map((t) => {
                  const tint = tintOf(columns, t.col);
                  return (
                    <button
                      key={t.id}
                      onClick={() => onEdit(t.id)}
                      className="glass-soft w-full text-left rounded-[12px] p-3 cursor-pointer transition-all hover:-translate-y-px relative overflow-hidden"
                    >
                      <span
                        aria-hidden
                        className="absolute left-0 top-0 bottom-0 w-[3px]"
                        style={{ background: `linear-gradient(180deg, ${tint}, ${tint}66)` }}
                      />
                      <div className="flex items-center gap-2 mb-1 ml-1 flex-wrap">
                        <span
                          className="font-mono text-[9px] uppercase tracking-[1.2px] px-[6px] py-[1px] rounded-full"
                          style={{
                            color: CAT_COLOR[t.cat],
                            background: `${CAT_COLOR[t.cat]}18`,
                            border: `1px solid ${CAT_COLOR[t.cat]}30`,
                          }}
                        >
                          {CAT_LBL[t.cat]}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.8px] text-tm">
                          {t.type}
                        </span>
                      </div>
                      <div className="text-t1 text-[12.5px] font-semibold leading-[1.35] ml-1">
                        {t.title}
                      </div>
                      {t.desc && (
                        <div className="text-t2 text-[11px] leading-[1.5] mt-1 line-clamp-2 ml-1">
                          {t.desc}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function NavBtn({ onClick, label, title }: { onClick: () => void; label: string; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="btn-ghost w-[34px] h-[34px] rounded-[10px] text-[14px] flex items-center justify-center"
    >
      {label}
    </button>
  );
}

function buildGrid(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const start = new Date(year, month, 1 - startDay);

  const weeks: ({ date: Date; inMonth: boolean } | null)[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: ({ date: Date; inMonth: boolean } | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      row.push({ date, inMonth: date.getMonth() === month });
    }
    weeks.push(row);
    if (w >= 4 && row[0]!.date.getDate() > daysInMonth) {
      weeks.pop();
      break;
    }
  }
  return weeks;
}

function indexByDate(tasks: Task[]) {
  const m = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.date) continue;
    const arr = m.get(t.date) || [];
    arr.push(t);
    m.set(t.date, arr);
  }
  return m;
}

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtLong(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function stepMonth(set: React.Dispatch<React.SetStateAction<Date>>, dir: number) {
  set((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
}
