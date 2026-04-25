"use client";

import { useMemo, useState } from "react";
import type { Card } from "@/lib/types";
import { PLT_COLOR, PLT_LBL } from "@/lib/constants";
import { COL_TINT } from "./Column";

interface Props {
  cards: Card[];
  onAdd: () => void;
  onEdit: (id: string) => void;
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function CalendarView({ cards, onAdd, onEdit }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(toISO(today));

  const grid = useMemo(() => buildGrid(cursor), [cursor]);
  const byDate = useMemo(() => indexByDate(cards), [cards]);
  const selectedCards = byDate.get(selected) || [];

  const monthCount = useMemo(() => {
    let n = 0;
    for (const day of grid.flat()) {
      if (day && day.inMonth) n += (byDate.get(toISO(day.date)) || []).length;
    }
    return n;
  }, [grid, byDate]);

  return (
    <div className="flex-1 overflow-y-auto px-7 py-7 relative">
      <div className="max-w-[1240px] mx-auto stagger">
        {/* Header */}
        <header className="flex items-end justify-between gap-6 flex-wrap mb-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[1.6px] text-tm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cool" />
              Planning éditorial
            </div>
            <h1 className="font-display italic text-t1 text-[44px] leading-[1.05] tracking-[-1px] mt-[6px]">
              {MONTHS[cursor.getMonth()]}{" "}
              <span className="text-tm font-mono not-italic text-[24px] tracking-[-0.5px] tabular-nums">
                {cursor.getFullYear()}
              </span>
            </h1>
            <p className="text-t2 text-[13px] mt-2">
              {monthCount === 0
                ? "Aucune publication ce mois — l'ardoise est vierge."
                : `${monthCount} publication${monthCount > 1 ? "s" : ""} dans le mois.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavBtn onClick={() => stepMonth(setCursor, -1)} label="‹" />
            <button
              onClick={() => {
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelected(toISO(today));
              }}
              className="font-mono text-[10px] uppercase tracking-[1.4px] text-tm hover:text-acc px-3 py-[8px] rounded-[10px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] cursor-pointer transition-all"
            >
              Aujourd&apos;hui
            </button>
            <NavBtn onClick={() => stepMonth(setCursor, 1)} label="›" />
            <button
              onClick={onAdd}
              className="ml-2 flex items-center gap-[6px] text-white border-none rounded-[10px] px-[14px] py-[8px] text-[12px] font-semibold cursor-pointer transition-all hover:-translate-y-px"
              style={{
                background: "linear-gradient(135deg, #ff8359 0%, #ff6b35 50%, #e0541f 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 14px -2px rgba(255,107,53,0.55)",
              }}
            >
              <span className="text-[14px] leading-none">＋</span>
              Programmer
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Calendar grid */}
          <div
            className="xl:col-span-8 rounded-[16px] p-4 relative overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))",
              border: "1px solid #ffffff10",
              backdropFilter: "blur(14px) saturate(140%)",
              WebkitBackdropFilter: "blur(14px) saturate(140%)",
              boxShadow: "inset 0 1px 0 #ffffff08, 0 12px 28px -16px rgba(0,0,0,0.6)",
            }}
          >
            {/* Weekday header */}
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
                    className={`relative aspect-square min-h-[78px] p-2 rounded-[10px] cursor-pointer transition-all flex flex-col items-stretch text-left bg-transparent border ${
                      isSelected
                        ? "border-acc/60"
                        : isToday
                        ? "border-cool/40"
                        : "border-white/[0.05] hover:border-white/[0.12]"
                    }`}
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(255,107,53,0.10), rgba(255,107,53,0.02))"
                        : isToday
                        ? "linear-gradient(135deg, rgba(94,234,212,0.06), transparent)"
                        : isOut
                        ? "transparent"
                        : "rgba(255,255,255,0.015)",
                      boxShadow: isSelected
                        ? "inset 0 1px 0 rgba(255,107,53,0.25), 0 0 22px -6px rgba(255,107,53,0.5)"
                        : undefined,
                    }}
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
                          className="font-mono text-[9px] tabular-nums px-[5px] py-[1px] rounded-full"
                          style={{
                            background: isSelected ? "rgba(255,107,53,0.2)" : "rgba(255,255,255,0.06)",
                            color: isSelected ? "#ffb09a" : "#9aa0b4",
                          }}
                        >
                          {items.length}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-[3px] mt-[5px] overflow-hidden">
                      {items.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          className="text-[9.5px] truncate font-medium leading-[1.2] px-[5px] py-[2px] rounded-[5px]"
                          style={{
                            color: PLT_COLOR[c.plt],
                            background: `${PLT_COLOR[c.plt]}14`,
                            border: `1px solid ${PLT_COLOR[c.plt]}26`,
                          }}
                          title={c.title}
                        >
                          {c.title}
                        </div>
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

          {/* Day detail */}
          <aside
            className="xl:col-span-4 rounded-[16px] p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))",
              border: "1px solid #ffffff10",
              backdropFilter: "blur(14px) saturate(140%)",
              WebkitBackdropFilter: "blur(14px) saturate(140%)",
              boxShadow: "inset 0 1px 0 #ffffff08, 0 12px 28px -16px rgba(0,0,0,0.6)",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[1px]"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.6) 30%, rgba(94,234,212,0.5) 70%, transparent)",
              }}
            />
            <div className="font-mono text-[9px] uppercase tracking-[1.6px] text-tm">
              Jour sélectionné
            </div>
            <div className="font-display italic text-t1 text-[28px] leading-tight tracking-[-0.4px] mt-1">
              {fmtLong(new Date(selected))}
            </div>

            <div className="mt-5 flex flex-col gap-[8px]">
              {selectedCards.length === 0 ? (
                <div
                  className="rounded-[12px] py-7 px-3 text-center text-tm text-[11px] font-mono uppercase tracking-[0.8px]"
                  style={{ border: "1.5px dashed #ffffff14", background: "rgba(255,255,255,0.015)" }}
                >
                  Aucune publication ce jour
                  <button
                    onClick={onAdd}
                    className="block mt-3 mx-auto text-acc hover:text-acc-hover text-[11px] font-mono uppercase tracking-[1.2px] bg-transparent border-none cursor-pointer underline-offset-4 hover:underline"
                  >
                    + Programmer du contenu
                  </button>
                </div>
              ) : (
                selectedCards.map((c) => {
                  const tint = COL_TINT[c.col];
                  return (
                    <button
                      key={c.id}
                      onClick={() => onEdit(c.id)}
                      className="w-full text-left rounded-[12px] p-3 cursor-pointer transition-all hover:-translate-y-px relative overflow-hidden"
                      style={{
                        background: "linear-gradient(155deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
                        border: "1px solid #ffffff14",
                        boxShadow: "inset 0 1px 0 #ffffff10",
                      }}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-[3px]"
                        style={{
                          background: `linear-gradient(180deg, ${tint}, ${tint}66)`,
                          boxShadow: `0 0 8px ${tint}80`,
                        }}
                      />
                      <div className="flex items-center gap-2 mb-1 ml-1">
                        <span
                          className="font-mono text-[9px] uppercase tracking-[1.2px] px-[6px] py-[1px] rounded-full"
                          style={{
                            color: PLT_COLOR[c.plt],
                            background: `${PLT_COLOR[c.plt]}14`,
                            border: `1px solid ${PLT_COLOR[c.plt]}30`,
                          }}
                        >
                          {PLT_LBL[c.plt]}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.8px] text-tm">
                          {c.type}
                        </span>
                      </div>
                      <div className="text-t1 text-[12.5px] font-semibold leading-[1.35] ml-1">
                        {c.title}
                      </div>
                      {c.desc && (
                        <div className="text-t2 text-[11px] leading-[1.5] mt-1 line-clamp-2 ml-1">
                          {c.desc}
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

function NavBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-[34px] h-[34px] rounded-[10px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.15] text-t2 hover:text-t1 cursor-pointer text-[14px] flex items-center justify-center transition-all"
    >
      {label}
    </button>
  );
}

function buildGrid(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday=0
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
    // Stop if last row is fully outside the month and previous row covered the end
    if (w >= 4 && row[0]!.date.getDate() > daysInMonth) {
      weeks.pop();
      break;
    }
  }
  return weeks;
}

function indexByDate(cards: Card[]) {
  const m = new Map<string, Card[]>();
  for (const c of cards) {
    if (!c.date) continue;
    const arr = m.get(c.date) || [];
    arr.push(c);
    m.set(c.date, arr);
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
