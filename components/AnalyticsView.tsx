"use client";

import { useMemo } from "react";
import type { Card, PlatformKey } from "@/lib/types";
import { PAST_COLS, PLT_COLOR, PLT_LBL } from "@/lib/constants";
import { fmtNum, fmtDate } from "@/lib/utils";

interface Props {
  cards: Card[];
  onEdit: (id: string) => void;
}

export function AnalyticsView({ cards, onEdit }: Props) {
  const past = useMemo(() => cards.filter((c) => PAST_COLS.includes(c.col)), [cards]);

  const totals = useMemo(() => {
    const views = past.reduce((s, c) => s + (c.views || 0), 0);
    const likes = past.reduce((s, c) => s + (c.likes || 0), 0);
    const ratio = views > 0 ? (likes / views) * 100 : 0;
    const avg = past.length > 0 ? Math.round(views / past.length) : 0;
    return { views, likes, ratio, avg, count: past.length };
  }, [past]);

  const byPlatform = useMemo(() => {
    const m = new Map<PlatformKey, { count: number; views: number; likes: number }>();
    for (const c of past) {
      const cur = m.get(c.plt) || { count: 0, views: 0, likes: 0 };
      cur.count += 1;
      cur.views += c.views || 0;
      cur.likes += c.likes || 0;
      m.set(c.plt, cur);
    }
    return Array.from(m.entries())
      .map(([k, v]) => ({ k, ...v }))
      .sort((a, b) => b.views - a.views);
  }, [past]);

  const monthly = useMemo(() => buildMonthly(past), [past]);
  const ranked = useMemo(() => [...past].sort((a, b) => b.views - a.views), [past]);
  const maxViews = ranked[0]?.views || 0;

  return (
    <div className="flex-1 overflow-y-auto px-7 py-7 relative">
      <div className="max-w-[1240px] mx-auto stagger flex flex-col gap-6">
        {/* Header */}
        <header>
          <div className="font-mono text-[10px] uppercase tracking-[1.6px] text-tm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-acc animate-breathe" />
            Rétrospective · Studio
          </div>
          <h1 className="font-display italic text-t1 text-[44px] leading-[1.05] tracking-[-1px] mt-[6px]">
            Analytiques.
          </h1>
          <p className="text-t2 text-[13px] mt-2 max-w-[560px] leading-[1.55]">
            Lecture froide de vos contenus publiés. Les chiffres sont des indices, pas des juges.
          </p>
        </header>

        {past.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Big stat triptych */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BigStat
                label="Vues cumulées"
                value={fmtNum(totals.views)}
                sub={`${totals.count} publications`}
                tint="#ff6b35"
                glyph="▣"
              />
              <BigStat
                label="Réactions"
                value={fmtNum(totals.likes)}
                sub={`${totals.ratio.toFixed(2)}% d'engagement`}
                tint="#ff5e8a"
                glyph="♥"
              />
              <BigStat
                label="Audience moyenne"
                value={fmtNum(totals.avg)}
                sub="par contenu publié"
                tint="#5eead4"
                glyph="◐"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Monthly bars */}
              <div
                className="lg:col-span-8 rounded-[16px] p-5 relative overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))",
                  border: "1px solid #ffffff10",
                  backdropFilter: "blur(14px) saturate(140%)",
                  WebkitBackdropFilter: "blur(14px) saturate(140%)",
                  boxShadow: "inset 0 1px 0 #ffffff08, 0 12px 28px -16px rgba(0,0,0,0.6)",
                }}
              >
                <div className="flex items-baseline justify-between mb-5">
                  <div>
                    <div className="font-display italic text-t1 text-[20px] tracking-[-0.3px]">
                      Vues par mois
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[1.4px] text-tm mt-[2px]">
                      Sur les 6 derniers mois actifs
                    </div>
                  </div>
                </div>
                <MonthlyBars data={monthly} />
              </div>

              {/* Platform performance */}
              <div
                className="lg:col-span-4 rounded-[16px] p-5 relative overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))",
                  border: "1px solid #ffffff10",
                  backdropFilter: "blur(14px) saturate(140%)",
                  WebkitBackdropFilter: "blur(14px) saturate(140%)",
                  boxShadow: "inset 0 1px 0 #ffffff08, 0 12px 28px -16px rgba(0,0,0,0.6)",
                }}
              >
                <div className="font-display italic text-t1 text-[20px] tracking-[-0.3px]">
                  Par plateforme
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[1.4px] text-tm mt-[2px] mb-5">
                  Vues totales
                </div>
                <div className="flex flex-col gap-4">
                  {byPlatform.map((p) => {
                    const c = PLT_COLOR[p.k];
                    const pct = totals.views > 0 ? (p.views / totals.views) * 100 : 0;
                    return (
                      <div key={p.k}>
                        <div className="flex items-center justify-between mb-[5px]">
                          <span className="text-t2 text-[12px] font-medium">
                            {PLT_LBL[p.k]}
                          </span>
                          <span className="font-mono text-tm text-[10.5px] tabular-nums">
                            {fmtNum(p.views)} · {p.count}
                          </span>
                        </div>
                        <div
                          className="h-[7px] rounded-full overflow-hidden relative"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.04)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${c}, ${c}aa)`,
                              boxShadow: `0 0 12px ${c}80`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ranking */}
            <section>
              <div className="flex items-baseline gap-3 mb-3 px-1">
                <span className="font-display italic text-t1 text-[20px] tracking-[-0.3px]">Classement</span>
                <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-tm">
                  Tous les contenus publiés
                </span>
              </div>

              <div
                className="rounded-[16px] overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))",
                  border: "1px solid #ffffff10",
                  backdropFilter: "blur(14px) saturate(140%)",
                  WebkitBackdropFilter: "blur(14px) saturate(140%)",
                  boxShadow: "inset 0 1px 0 #ffffff08, 0 12px 28px -16px rgba(0,0,0,0.6)",
                }}
              >
                <div className="grid grid-cols-12 gap-3 px-5 py-3 font-mono text-[9px] uppercase tracking-[1.4px] text-td border-b border-white/[0.05]">
                  <div className="col-span-1">Rang</div>
                  <div className="col-span-5">Titre</div>
                  <div className="col-span-2">Canal</div>
                  <div className="col-span-1 text-right">Date</div>
                  <div className="col-span-3 text-right">Vues · Engagement</div>
                </div>
                <ul>
                  {ranked.map((c, i) => {
                    const ratio = c.views > 0 ? ((c.likes / c.views) * 100).toFixed(2) : "—";
                    const widthPct = maxViews > 0 ? (c.views / maxViews) * 100 : 0;
                    const tint = PLT_COLOR[c.plt];
                    return (
                      <li key={c.id} className="border-b border-white/[0.04] last:border-b-0">
                        <button
                          type="button"
                          onClick={() => onEdit(c.id)}
                          className="grid grid-cols-12 gap-3 px-5 py-[14px] w-full text-left items-center bg-transparent border-none hover:bg-white/[0.025] cursor-pointer transition-colors relative"
                        >
                          <div className="col-span-1 font-display italic text-[24px] leading-none text-tm tabular-nums">
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <div className="col-span-5 min-w-0">
                            <div className="text-t1 text-[12.5px] font-semibold truncate">{c.title}</div>
                            {c.learning && (
                              <div className="text-tm text-[10.5px] mt-[2px] italic truncate font-display">
                                « {c.learning} »
                              </div>
                            )}
                          </div>
                          <div className="col-span-2">
                            <span
                              className="font-mono text-[9px] uppercase tracking-[1.2px] px-[7px] py-[2px] rounded-full"
                              style={{
                                color: tint,
                                background: `${tint}1a`,
                                border: `1px solid ${tint}33`,
                              }}
                            >
                              {PLT_LBL[c.plt]}
                            </span>
                          </div>
                          <div className="col-span-1 text-right font-mono text-[10.5px] text-tm tabular-nums">
                            {fmtDate(c.date)}
                          </div>
                          <div className="col-span-3">
                            <div className="flex items-center gap-3 justify-end">
                              <span className="font-mono text-[9.5px] text-tm tabular-nums whitespace-nowrap">
                                {ratio}%
                              </span>
                              <div
                                className="flex-1 h-[6px] rounded-full overflow-hidden max-w-[160px]"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${widthPct}%`,
                                    background: `linear-gradient(90deg, ${tint}, ${tint}99)`,
                                    boxShadow: `0 0 8px ${tint}88`,
                                  }}
                                />
                              </div>
                              <span className="font-mono text-[12px] text-t1 tabular-nums tracking-[0.3px] min-w-[58px] text-right">
                                {fmtNum(c.views)}
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

function BigStat({ label, value, sub, tint, glyph }: { label: string; value: string; sub: string; tint: string; glyph: string }) {
  return (
    <div
      className="rounded-[16px] p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(155deg, ${tint}10, rgba(255,255,255,0.01) 60%)`,
        border: `1px solid ${tint}26`,
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        boxShadow: `inset 0 1px 0 ${tint}26, 0 12px 28px -16px rgba(0,0,0,0.6)`,
      }}
    >
      <div
        aria-hidden
        className="absolute -top-4 -right-2 font-display italic text-[112px] leading-none tracking-[-3px] opacity-[0.10] select-none pointer-events-none"
        style={{ color: tint }}
      >
        {glyph}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[1.6px]" style={{ color: `${tint}cc` }}>
        {label}
      </div>
      <div
        className="font-display italic text-t1 text-[52px] leading-none tracking-[-1.2px] mt-2 tabular-nums relative"
        style={{ textShadow: `0 0 28px ${tint}55` }}
      >
        {value}
      </div>
      <div className="text-t2 text-[12px] mt-2 relative">{sub}</div>
    </div>
  );
}

function MonthlyBars({ data }: { data: { key: string; label: string; views: number; likes: number }[] }) {
  if (data.length === 0) {
    return <div className="text-tm text-[11px] py-8 text-center font-mono uppercase tracking-[1px]">Pas encore de données mensuelles.</div>;
  }
  const max = Math.max(...data.map((d) => d.views), 1);
  return (
    <div className="flex items-end gap-3 h-[220px] px-1">
      {data.map((d) => {
        const h = (d.views / max) * 100;
        return (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div
              className="font-mono text-[10px] tabular-nums text-t2 whitespace-nowrap"
              title={`${d.views} vues · ${d.likes} likes`}
            >
              {fmtNum(d.views)}
            </div>
            <div className="w-full flex-1 flex items-end relative">
              <div
                className="w-full rounded-[8px] relative overflow-hidden"
                style={{
                  height: `${Math.max(h, 4)}%`,
                  background: "linear-gradient(180deg, rgba(255,107,53,0.85), rgba(224,84,31,0.7))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 0 22px -4px rgba(255,107,53,0.45)",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(180deg, transparent 0%, transparent 60%, rgba(255,107,53,0.35) 100%)",
                  }}
                />
              </div>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[1.4px] text-tm">
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-[16px] p-10 text-center relative"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))",
        border: "1.5px dashed #ffffff14",
      }}
    >
      <div className="font-display italic text-t1 text-[26px] tracking-[-0.4px]">
        Pas encore de données.
      </div>
      <p className="text-t2 text-[12.5px] mt-2 max-w-[420px] mx-auto leading-[1.55]">
        Publiez ou archivez du contenu pour voir vos chiffres apparaître ici. Les colonnes <em className="text-t1 not-italic">Publié</em> et <em className="text-t1 not-italic">Archive</em> alimentent cette vue.
      </p>
    </div>
  );
}

function buildMonthly(past: Card[]) {
  const m = new Map<string, { views: number; likes: number; date: Date }>();
  for (const c of past) {
    if (!c.date) continue;
    const d = new Date(c.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = m.get(key) || { views: 0, likes: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) };
    cur.views += c.views || 0;
    cur.likes += c.likes || 0;
    m.set(key, cur);
  }
  return Array.from(m.entries())
    .map(([key, v]) => ({
      key,
      label: v.date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "") + " " + String(v.date.getFullYear()).slice(-2),
      views: v.views,
      likes: v.likes,
      date: v.date,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-6);
}
