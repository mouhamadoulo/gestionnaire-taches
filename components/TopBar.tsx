"use client";

import type { PlatformKey } from "@/lib/types";

type Tab = "board" | "list" | "analytics";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  platform: string;
  onPlatform: (v: string) => void;
  onAdd: () => void;
  tab: Tab;
  onTab: (t: Tab) => void;
}

const PLATFORM_OPTIONS: { value: PlatformKey | ""; label: string }[] = [
  { value: "",          label: "Toutes les plateformes" },
  { value: "youtube",   label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok",    label: "TikTok" },
  { value: "blog",      label: "Blog" },
  { value: "linkedin",  label: "LinkedIn" },
  { value: "podcast",   label: "Podcast" },
  { value: "twitter",   label: "Twitter/X" },
];

export function TopBar({ search, onSearch, platform, onPlatform, onAdd, tab, onTab }: Props) {
  return (
    <div
      className="px-7 py-[16px] flex items-end gap-[14px] flex-shrink-0 relative"
      style={{
        borderBottom: "1px solid #ffffff08",
        background: "linear-gradient(180deg, rgba(10,11,18,0.4), rgba(10,11,18,0))",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-[10px]">
          <h1 className="font-display italic text-t1 text-[30px] leading-none tracking-[-0.5px]">
            Mon Contenu
          </h1>
          <span className="font-mono text-[10px] text-tm uppercase tracking-[1.4px]">
            · Studio nocturne
          </span>
        </div>

        {/* Tabs as segmented underline */}
        <div className="flex gap-1 mt-[10px]">
          {([
            ["board",     "Kanban"],
            ["list",      "Liste"],
            ["analytics", "Analytiques"],
          ] as const).map(([k, l]) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => onTab(k)}
                className={`relative px-[10px] py-[5px] text-[11px] font-semibold uppercase tracking-[0.6px] cursor-pointer border-none bg-transparent transition-colors ${
                  active ? "text-t1" : "text-tm hover:text-t2"
                }`}
              >
                {l}
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-[10px] right-[10px] -bottom-[1px] h-[2px] bg-acc rounded-full"
                    style={{ boxShadow: "0 0 12px rgba(255,107,53,0.7)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-[8px]">
        {/* Search */}
        <div
          className="flex items-center gap-[8px] rounded-[10px] px-[12px] py-[7px] min-w-[220px]"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid #ffffff14",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <span className="text-tm text-[12px]">⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Rechercher un contenu…"
            className="border-none bg-transparent outline-none text-[12px] text-t1 w-full placeholder:text-tm font-sans"
          />
          <kbd className="hidden sm:inline-block font-mono text-[9px] text-td px-[5px] py-[1px] rounded border border-white/[0.06]">
            ⌘K
          </kbd>
        </div>

        {/* Platform select */}
        <div className="relative">
          <select
            value={platform}
            onChange={(e) => onPlatform(e.target.value)}
            className="appearance-none rounded-[10px] px-[14px] pr-[28px] py-[7px] text-[12px] text-t2 outline-none cursor-pointer transition-colors hover:text-t1"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid #ffffff14",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-tm text-[9px] pointer-events-none">▾</span>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onAdd}
          className="group relative flex items-center gap-[6px] text-white border-none rounded-[10px] px-[16px] py-[8px] text-[12px] font-semibold cursor-pointer transition-all whitespace-nowrap hover:-translate-y-px"
          style={{
            background: "linear-gradient(135deg, #ff8359 0%, #ff6b35 50%, #e0541f 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 14px -2px rgba(255,107,53,0.55), 0 0 0 1px rgba(255,107,53,0.4)",
          }}
        >
          <span className="text-[14px] leading-none">＋</span>
          Nouveau contenu
        </button>
      </div>
    </div>
  );
}
