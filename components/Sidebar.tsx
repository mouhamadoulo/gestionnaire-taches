"use client";

import type { ViewId } from "@/lib/types";

type SpaceItem = { icon: string; label: string; view: ViewId };
type PlatformItem = { icon: string; label: string; iconColor: string };

const SPACE: SpaceItem[] = [
  { icon: "⊞", label: "Dashboard",     view: "dashboard" },
  { icon: "▦", label: "Kanban Board",  view: "board" },
  { icon: "◫", label: "Calendrier",    view: "calendar" },
  { icon: "◈", label: "Analytiques",   view: "analytics" },
];

const PLATFORMS: PlatformItem[] = [
  { icon: "▶", label: "YouTube",   iconColor: "#ff4d4d" },
  { icon: "◉", label: "Instagram", iconColor: "#ff5e8a" },
  { icon: "♫", label: "TikTok",    iconColor: "#5eead4" },
  { icon: "✎", label: "Blog",      iconColor: "#7aa2ff" },
  { icon: "●", label: "Podcast",   iconColor: "#b599ff" },
];

interface NavLinkProps {
  icon: string;
  label: string;
  active?: boolean;
  iconColor?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
}

function NavLink({ icon, label, active, iconColor, onClick, onMouseEnter }: NavLinkProps) {
  const base =
    "group flex items-center gap-[10px] px-[11px] py-[8px] rounded-[9px] cursor-pointer text-[13px] font-medium transition-all mb-px relative w-full text-left bg-transparent border-none";
  const state = active ? "text-acc" : "text-tm hover:text-t1";
  return (
    <button type="button" onClick={onClick} onMouseEnter={onMouseEnter} className={`${base} ${state}`}>
      {active && (
        <>
          <span
            aria-hidden
            className="absolute inset-0 rounded-[9px] bg-acc/[0.08] border border-acc/25"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,107,53,0.2), 0 0 24px -8px rgba(255,107,53,0.5)" }}
          />
          <span aria-hidden className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-acc rounded-full shadow-glowAcc" />
        </>
      )}
      {!active && (
        <span aria-hidden className="absolute inset-0 rounded-[9px] opacity-0 group-hover:opacity-100 bg-white/[0.04] border border-white/[0.06] transition-opacity" />
      )}
      <span
        className="relative w-4 text-center text-[14px] flex-shrink-0"
        style={iconColor ? { color: iconColor, filter: `drop-shadow(0 0 6px ${iconColor}66)` } : undefined}
      >
        {icon}
      </span>
      <span className="relative">{label}</span>
    </button>
  );
}

interface Props {
  view: ViewId;
  onView: (v: ViewId) => void;
  platform: string;
  onPlatform: (p: string) => void;
}

export function Sidebar({ view, onView, platform, onPlatform }: Props) {
  return (
    <aside
      className="w-[228px] flex flex-col py-[22px] flex-shrink-0 z-10 relative"
      style={{
        background: "linear-gradient(180deg, rgba(12,14,22,0.85) 0%, rgba(8,9,15,0.75) 100%)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderRight: "1px solid #ffffff0a",
        boxShadow: "inset -1px 0 0 #00000060",
      }}
    >
      {/* Wordmark */}
      <button
        type="button"
        onClick={() => onView("dashboard")}
        className="px-[18px] pb-7 flex items-center gap-[11px] relative bg-transparent border-none cursor-pointer text-left"
      >
        <div
          className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-[16px] text-white font-black flex-shrink-0 relative"
          style={{
            background: "linear-gradient(135deg, #ff8359 0%, #ff6b35 50%, #e0541f 100%)",
            boxShadow: "0 6px 16px -4px rgba(255,107,53,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          <span className="relative z-10">✦</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display italic text-t1 text-[19px] tracking-[-0.5px]">
            ContentFlow
          </span>
          <span className="text-td text-[9px] font-mono uppercase tracking-[1.6px]">Atelier · v2</span>
        </div>
      </button>

      <nav className="flex-1 px-[10px] overflow-y-auto">
        <SectionTitle>Espace</SectionTitle>
        {SPACE.map((it) => (
          <NavLink
            key={it.view}
            icon={it.icon}
            label={it.label}
            active={view === it.view}
            onClick={() => onView(it.view)}
          />
        ))}

        <SectionTitle>Plateformes</SectionTitle>
        {PLATFORMS.map((it) => {
          const key = it.label.toLowerCase();
          const isActive = platform === key;
          return (
            <NavLink
              key={it.label}
              icon={it.icon}
              label={it.label}
              iconColor={it.iconColor}
              active={isActive}
              onClick={() => onPlatform(isActive ? "" : key)}
            />
          );
        })}

        <SectionTitle>Système</SectionTitle>
        <NavLink icon="⚙" label="Paramètres" />
      </nav>

      {/* User card */}
      <div className="mx-[10px] mt-3 p-[10px] rounded-[10px] glass-soft flex items-center gap-[10px]">
        <div
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #ff8359, #e0541f)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 10px -2px rgba(255,107,53,0.4)",
          }}
        >
          M
        </div>
        <div className="min-w-0">
          <div className="text-t1 text-[12px] font-semibold truncate">Mouhamadou</div>
          <div className="flex items-center gap-1 text-tm text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cool animate-breathe" />
            En ligne
          </div>
        </div>
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-td text-[10px] font-mono font-medium uppercase tracking-[1.4px] px-2 mt-[18px] mb-[6px]">
      — {children}
    </div>
  );
}
