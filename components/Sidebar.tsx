"use client";

import { useRef } from "react";
import type { ViewId } from "@/lib/types";

type SpaceItem = { icon: string; label: string; view: ViewId };

const SPACE: SpaceItem[] = [
  { icon: "⊞", label: "Dashboard",     view: "dashboard" },
  { icon: "▦", label: "Tableau",       view: "board" },
  { icon: "◫", label: "Calendrier",    view: "calendar" },
  { icon: "◈", label: "Analytiques",   view: "analytics" },
];

interface NavLinkProps {
  icon: string;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  /** Infobulle explicite ; sinon le libellé sert d'infobulle une fois replié. */
  title?: string;
}

function NavLink({ icon, label, active, collapsed, onClick, title }: NavLinkProps) {
  const base =
    "group flex items-center gap-[10px] py-[8px] rounded-[9px] cursor-pointer text-[13px] font-medium transition-all mb-px relative w-full text-left bg-transparent border-none";
  const pad = collapsed ? "px-0 justify-center" : "px-[11px]";
  const state = active ? "text-acc" : "text-tm hover:text-t1";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || (collapsed ? label : undefined)}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={`${base} ${pad} ${state}`}
    >
      {active ? (
        <>
          <span
            aria-hidden
            className="absolute inset-0 rounded-[9px] bg-acc/[0.08] border border-acc/25"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,107,53,0.2), 0 0 24px -8px rgba(255,107,53,0.5)" }}
          />
          {!collapsed && (
            <span
              aria-hidden
              className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-acc rounded-full shadow-glowAcc"
            />
          )}
        </>
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 rounded-[9px] opacity-0 group-hover:opacity-100 bg-fill1 border border-stroke1 transition-opacity"
        />
      )}
      <span className="relative w-4 text-center text-[14px] flex-shrink-0">{icon}</span>
      {!collapsed && <span className="relative">{label}</span>}
    </button>
  );
}

interface Props {
  view: ViewId;
  onView: (v: ViewId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function Sidebar({ view, onView, collapsed, onToggleCollapse, onExport, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Remis à zéro pour que réimporter le même fichier redéclenche l'événement.
    e.target.value = "";
    if (file) onImport(file);
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[68px]" : "w-[228px]"
      } flex flex-col py-[22px] flex-shrink-0 z-20 relative plate-sidebar transition-[width] duration-200 ease-out`}
    >
      {/* Repli / dépli — chevauche le bord droit du panneau */}
      <button
        type="button"
        onClick={onToggleCollapse}
        title={collapsed ? "Déplier le menu (⌘B)" : "Replier le menu (⌘B)"}
        aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
        aria-expanded={!collapsed}
        className="absolute -right-[11px] top-[26px] z-30 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] leading-none text-t2 hover:text-acc bg-surface border border-stroke2 hover:border-acc/50 shadow-glass cursor-pointer transition-all"
      >
        <span aria-hidden>{collapsed ? "›" : "‹"}</span>
      </button>

      {/* Marque */}
      <button
        type="button"
        onClick={() => onView("dashboard")}
        title={collapsed ? "MoloTask" : undefined}
        className={`${
          collapsed ? "px-0 justify-center" : "px-[18px]"
        } pb-7 flex items-center gap-[11px] relative bg-transparent border-none cursor-pointer text-left`}
      >
        <div
          className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-[16px] text-white font-black flex-shrink-0 relative"
          style={{
            background: "linear-gradient(135deg, #ff8359 0%, #ff6b35 50%, #e0541f 100%)",
            boxShadow: "0 6px 16px -4px rgba(255,107,53,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          <span className="relative z-10">✓</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="font-display italic text-t1 text-[19px] tracking-[-0.5px]">
              MoloTask
            </span>
            <span className="text-td text-[9px] font-mono uppercase tracking-[1.6px]">
              Tâches · v2
            </span>
          </div>
        )}
      </button>

      <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${collapsed ? "px-[14px]" : "px-[10px]"}`}>
        {collapsed ? (
          <div className="h-px bg-stroke1 mb-[10px]" aria-hidden />
        ) : (
          <SectionTitle>Espace</SectionTitle>
        )}
        {SPACE.map((it) => (
          <NavLink
            key={it.view}
            icon={it.icon}
            label={it.label}
            active={view === it.view}
            collapsed={collapsed}
            onClick={() => onView(it.view)}
          />
        ))}

        {collapsed ? (
          <div className="h-px bg-stroke1 my-[10px]" aria-hidden />
        ) : (
          <SectionTitle>Données</SectionTitle>
        )}
        <NavLink
          icon="↓"
          label="Exporter"
          collapsed={collapsed}
          onClick={onExport}
          title="Télécharger tâches et listes au format JSON"
        />
        <NavLink
          icon="↑"
          label="Importer"
          collapsed={collapsed}
          onClick={() => fileRef.current?.click()}
          title="Remplacer les données par un fichier de sauvegarde"
        />
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={pickFile}
          className="hidden"
          aria-hidden
          tabIndex={-1}
        />
      </nav>

      {/* Carte utilisateur */}
      <div
        className={`mt-3 rounded-[10px] glass-soft flex items-center gap-[10px] ${
          collapsed ? "mx-[14px] p-[6px] justify-center" : "mx-[10px] p-[10px]"
        }`}
        title={collapsed ? "Mouhamadou · En ligne" : undefined}
      >
        <div
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #ff8359, #e0541f)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 10px -2px rgba(255,107,53,0.4)",
          }}
        >
          M
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-t1 text-[12px] font-semibold truncate">Mouhamadou</div>
            <div className="flex items-center gap-1 text-tm text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cool animate-breathe" />
              En ligne
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-td text-[10px] font-mono font-medium uppercase tracking-[1.4px] px-2 mt-[18px] mb-[6px] whitespace-nowrap">
      — {children}
    </div>
  );
}
