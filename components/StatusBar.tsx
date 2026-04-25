"use client";

import type { Card } from "@/lib/types";
import { PAST_COLS, PLT_LBL } from "@/lib/constants";
import { fmtNum } from "@/lib/utils";

interface Props {
  cards: Card[];
  platform: string;
}

const SEGMENTS = 24;

function ProgressBar({ pct }: { pct: number }) {
  const filled = Math.round((pct / 100) * SEGMENTS);
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <span
          key={i}
          className={`w-[6px] h-[10px] rounded-[1px] ${
            i < filled ? "bg-emerald-500" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

function Sep() {
  return <span className="text-gray-700 mx-3">|</span>;
}

export function StatusBar({ cards, platform }: Props) {
  const total = cards.length;
  const published = cards.filter((c) => PAST_COLS.includes(c.col)).length;
  const inProgress = cards.filter((c) => ["plan", "prod", "edit"].includes(c.col)).length;
  const highPrio = cards.filter((c) => c.prio === "high").length;
  const totalViews = cards.reduce((s, c) => s + (c.views || 0), 0);

  const pct = total > 0 ? Math.round((published / total) * 100) : 0;

  const platformLabel =
    platform && platform in PLT_LBL
      ? PLT_LBL[platform as keyof typeof PLT_LBL]
      : "Toutes plateformes";

  return (
    <div className="h-9 bg-sb border-t border-white/[0.06] flex items-center px-4 text-[12px] font-mono text-gray-400 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center">
        <span className="flex items-center gap-[6px]">
          <span className="text-acc">📁</span>
          <span className="text-gray-200">~/ContentFlow</span>
        </span>

        <Sep />

        <span className="flex items-center gap-[6px]">
          <span className="text-amber-400">★</span>
          <span className="text-gray-200">{platformLabel}</span>
        </span>

        <Sep />

        <span className="flex items-center gap-[8px]">
          <span className="text-violet-400">Avancement:</span>
          <ProgressBar pct={pct} />
          <span className="text-emerald-400 font-semibold">{pct}%</span>
        </span>

        <Sep />

        <span className="flex items-center gap-[6px]">
          <span className="text-amber-400">👁</span>
          <span className="text-gray-200">Vues:{fmtNum(totalViews)}</span>
        </span>

        <Sep />

        <span className="flex items-center gap-[6px]">
          <span className="text-emerald-400">🎬</span>
          <span className="text-gray-200">
            {inProgress} en cours
            {published > 0 && (
              <span className="text-gray-500">(+{published})</span>
            )}
          </span>
        </span>
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-[6px]">
        <span
          className={`w-[8px] h-[8px] rounded-full ${
            highPrio > 0 ? "bg-red-500" : "bg-emerald-500"
          }`}
        />
        <span className="text-gray-200">
          {highPrio > 0 ? "high" : "normal"}
        </span>
        <span className="text-gray-600">·</span>
        <span className="text-gray-400">/priorité</span>
      </div>
    </div>
  );
}
