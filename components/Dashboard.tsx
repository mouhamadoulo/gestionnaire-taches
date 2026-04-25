"use client";

import { useMemo } from "react";
import type { Card, ViewId } from "@/lib/types";
import { COLS, PAST_COLS, PLT_COLOR, PLT_LBL } from "@/lib/constants";
import { fmtNum } from "@/lib/utils";
import { COL_TINT } from "./Column";

interface Props {
  cards: Card[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onView: (v: ViewId) => void;
}

export function Dashboard({ cards, onAdd, onEdit, onView }: Props) {
  const stats = useMemo(() => computeStats(cards), [cards]);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return cards
      .filter((c) => c.date && !PAST_COLS.includes(c.col))
      .filter((c) => new Date(c.date) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);
  }, [cards]);

  const topPerf = useMemo(() => {
    return cards
      .filter((c) => PAST_COLS.includes(c.col) && c.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 4);
  }, [cards]);

  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="flex-1 overflow-y-auto px-7 py-7 relative">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-7 stagger">
        {/* Hero greeting */}
        <header className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[1.6px] text-tm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-acc animate-breathe" />
              {fmtFullDate(new Date())} · Studio nocturne
            </div>
            <h1 className="font-display italic text-t1 text-[44px] leading-[1.05] tracking-[-1px] mt-[6px]">
              {greeting},<br />
              <span className="text-acc">Mouhamadou</span>.
            </h1>
            <p className="text-t2 text-[13px] mt-[10px] max-w-[460px] leading-[1.55]">
              {stats.inprog} pièces en mouvement · {stats.scheduled} prêtes à publier · {stats.totalViews > 0 ? fmtNum(stats.totalViews) + " vues cumulées" : "vos retombées vous attendent"}.
            </p>
          </div>

          <button
            onClick={onAdd}
            className="group relative flex items-center gap-[8px] text-white border-none rounded-[12px] px-[18px] py-[11px] text-[12px] font-semibold cursor-pointer transition-all hover:-translate-y-px"
            style={{
              background: "linear-gradient(135deg, #ff8359 0%, #ff6b35 50%, #e0541f 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 18px -4px rgba(255,107,53,0.6), 0 0 0 1px rgba(255,107,53,0.4)",
            }}
          >
            <span className="text-[15px] leading-none">＋</span>
            Nouvelle idée
            <kbd className="font-mono text-[9px] px-[5px] py-[1px] rounded border border-white/30 bg-white/10 ml-1">⌘N</kbd>
          </button>
        </header>

        {/* Pipeline ribbon */}
        <section className="glass-soft rounded-[16px] p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <span className="font-display italic text-t1 text-[20px] tracking-[-0.3px]">Pipeline</span>
              <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-tm">
                Du brouillon à l&apos;archive
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
            {COLS.map((col, i) => {
              const count = cards.filter((c) => c.col === col.id).length;
              const total = cards.length || 1;
              const pct = (count / total) * 100;
              const tint = COL_TINT[col.id];
              const isLast = i === COLS.length - 1;
              return (
                <div key={col.id} className="flex items-center flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onView("board")}
                    title={`${col.label} · ${count}`}
                    className="flex-1 h-full rounded-[8px] relative overflow-hidden group bg-transparent border-none cursor-pointer transition-all hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(180deg, ${tint}26, ${tint}06)`,
                      border: `1px solid ${tint}40`,
                      boxShadow: `inset 0 1px 0 ${tint}33`,
                    }}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-x-0 bottom-0"
                      style={{
                        height: `${Math.max(pct, count > 0 ? 18 : 0)}%`,
                        background: `linear-gradient(180deg, ${tint}88, ${tint}cc)`,
                        boxShadow: `0 0 18px ${tint}88`,
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-mono uppercase tracking-[0.5px] z-10">
                      <span className="text-t1 font-bold tabular-nums text-[15px] leading-none">
                        {String(count).padStart(2, "0")}
                      </span>
                      <span className="text-tm text-[8px] mt-[2px] truncate max-w-full px-1">
                        {col.label.replace(/^.+? /, "")}
                      </span>
                    </div>
                  </button>
                  {!isLast && (
                    <div
                      className="w-[10px] flex items-center justify-center text-[10px]"
                      style={{ color: tint }}
                    >
                      ›
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Three-column row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Hero stat */}
          <Card className="lg:col-span-4 p-5">
            <div className="font-mono text-[10px] uppercase tracking-[1.6px] text-tm">
              Audience cumulée
            </div>
            <div className="font-display italic text-t1 text-[56px] leading-none tracking-[-1.5px] mt-2 tabular-nums" style={{ textShadow: "0 0 32px rgba(255,107,53,0.4)" }}>
              {fmtNum(stats.totalViews)}
            </div>
            <div className="text-t2 text-[12px] mt-2 flex items-center gap-2">
              <span className="text-cool font-mono tabular-nums">♥ {fmtNum(stats.totalLikes)}</span>
              <span className="text-td">·</span>
              <span>réactions tous canaux</span>
            </div>
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
              <div className="flex flex-col">
                <span className="font-mono uppercase tracking-[1.4px] text-td text-[9px]">Publiés</span>
                <span className="text-t1 font-semibold text-[14px] tabular-nums mt-1">{stats.published}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono uppercase tracking-[1.4px] text-td text-[9px]">Idées</span>
                <span className="text-t1 font-semibold text-[14px] tabular-nums mt-1">{stats.ideas}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono uppercase tracking-[1.4px] text-td text-[9px]">En cours</span>
                <span className="text-t1 font-semibold text-[14px] tabular-nums mt-1">{stats.inprog}</span>
              </div>
            </div>
          </Card>

          {/* Upcoming */}
          <Card className="lg:col-span-5 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="font-display italic text-t1 text-[18px] tracking-[-0.3px]">À venir</span>
                <span className="font-mono text-[9px] uppercase tracking-[1.4px] text-tm">
                  Prochains jalons
                </span>
              </div>
              <button
                onClick={() => onView("calendar")}
                className="font-mono text-[10px] uppercase tracking-[1.2px] text-tm hover:text-acc cursor-pointer bg-transparent border-none transition-colors"
              >
                Calendrier →
              </button>
            </div>
            {upcoming.length === 0 ? (
              <EmptyHint label="Rien de planifié — capturez une idée pour démarrer" />
            ) : (
              <ul className="flex flex-col gap-[6px]">
                {upcoming.map((c) => {
                  const tint = COL_TINT[c.col];
                  const days = daysUntil(c.date);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onEdit(c.id)}
                        className="w-full text-left flex items-center gap-3 px-3 py-[9px] rounded-[10px] bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer"
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
                            {monthAbbr(c.date)}
                          </span>
                          <span className="font-display italic text-[18px] leading-none mt-[2px] tabular-nums">
                            {dayNum(c.date)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-t1 text-[12.5px] font-semibold truncate">{c.title}</div>
                          <div className="text-tm text-[10px] mt-[2px] flex items-center gap-2">
                            <span style={{ color: PLT_COLOR[c.plt] }}>{PLT_LBL[c.plt]}</span>
                            <span className="text-td">·</span>
                            <span className="font-mono uppercase tracking-[0.8px]">
                              {days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `J−${days}`}
                            </span>
                          </div>
                        </div>
                        <span className="text-tm text-[14px]">›</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Platform mix */}
          <Card className="lg:col-span-3 p-5">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-display italic text-t1 text-[18px] tracking-[-0.3px]">Mix</span>
              <span className="font-mono text-[9px] uppercase tracking-[1.4px] text-tm">Par canal</span>
            </div>
            <PlatformMix cards={cards} />
          </Card>
        </div>

        {/* Top performers */}
        {topPerf.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-3 px-1">
              <div className="flex items-baseline gap-3">
                <span className="font-display italic text-t1 text-[20px] tracking-[-0.3px]">Best-of</span>
                <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-tm">
                  Vos contenus en tête
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
              {topPerf.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => onEdit(c.id)}
                  className="text-left glass-card rounded-[14px] p-4 cursor-pointer relative overflow-hidden group"
                >
                  <div
                    className="absolute -top-6 -right-6 font-display italic text-[88px] leading-none tracking-[-2px] opacity-[0.07] group-hover:opacity-[0.12] transition-opacity select-none pointer-events-none"
                    style={{ color: PLT_COLOR[c.plt] }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="font-mono text-[9px] uppercase tracking-[1.4px] inline-block px-[7px] py-[2px] rounded-full mb-2"
                    style={{ color: PLT_COLOR[c.plt], background: `${PLT_COLOR[c.plt]}1a`, border: `1px solid ${PLT_COLOR[c.plt]}33` }}
                  >
                    {PLT_LBL[c.plt]}
                  </div>
                  <div className="text-t1 text-[13px] font-semibold leading-[1.35] mb-3 line-clamp-2 relative">
                    {c.title}
                  </div>
                  <div className="flex items-end gap-3 relative">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[1.2px] text-tm">Vues</div>
                      <div className="font-display italic text-[24px] leading-none tabular-nums text-t1 mt-[2px]">
                        {fmtNum(c.views)}
                      </div>
                    </div>
                    <div className="ml-auto text-cool font-mono text-[11px] tabular-nums">
                      ♥ {fmtNum(c.likes)}
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

function PlatformMix({ cards }: { cards: Card[] }) {
  const counts = new Map<string, number>();
  for (const c of cards) counts.set(c.plt, (counts.get(c.plt) || 0) + 1);
  const total = cards.length || 1;
  const entries = Array.from(counts.entries())
    .map(([k, v]) => ({ k, v, pct: (v / total) * 100 }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);

  if (entries.length === 0) return <EmptyHint label="Aucun contenu" />;

  return (
    <div className="flex flex-col gap-[10px]">
      {entries.map((e) => {
        const c = PLT_COLOR[e.k as keyof typeof PLT_COLOR] || "#6b7280";
        return (
          <div key={e.k}>
            <div className="flex items-center justify-between text-[10.5px] mb-[3px]">
              <span className="text-t2 font-medium">{PLT_LBL[e.k as keyof typeof PLT_LBL]}</span>
              <span className="font-mono text-tm tabular-nums">{e.v}</span>
            </div>
            <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${e.pct}%`,
                  background: `linear-gradient(90deg, ${c}, ${c}aa)`,
                  boxShadow: `0 0 8px ${c}80`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[16px] relative ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))",
        border: "1px solid #ffffff10",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        boxShadow: "inset 0 1px 0 #ffffff08, 0 12px 28px -16px rgba(0,0,0,0.6)",
      }}
    >
      {children}
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-6 text-tm text-[11px] font-mono uppercase tracking-[0.8px]">
      {label}
    </div>
  );
}

function computeStats(cards: Card[]) {
  return {
    ideas: cards.filter((c) => c.col === "ideas").length,
    inprog: cards.filter((c) => ["plan", "prod", "edit"].includes(c.col)).length,
    scheduled: cards.filter((c) => c.col === "sched").length,
    published: cards.filter((c) => PAST_COLS.includes(c.col)).length,
    totalViews: cards.reduce((s, c) => s + (c.views || 0), 0),
    totalLikes: cards.reduce((s, c) => s + (c.likes || 0), 0),
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
  const d = new Date(s);
  return d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
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

