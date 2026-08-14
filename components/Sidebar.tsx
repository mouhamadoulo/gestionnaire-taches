"use client";

import { useRef } from "react";
import type { ViewId } from "@/lib/types";
import type { ReminderState } from "@/lib/reminders";
import { ThemeToggle } from "./ThemeToggle";

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
  disabled?: boolean;
}

function NavLink({ icon, label, active, collapsed, onClick, title, disabled }: NavLinkProps) {
  const base =
    "group flex items-center gap-[10px] py-[8px] rounded-[9px] cursor-pointer text-[13px] font-medium transition-all mb-px relative w-full text-left bg-transparent border-none";
  const pad = collapsed ? "px-0 justify-center" : "px-[11px]";
  const state = disabled
    ? "text-td cursor-not-allowed"
    : active
    ? "text-acc"
    : "text-tm hover:text-t1";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
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
  /** Tiroir ouvert — sous `md` seulement, où la barre sort de l'écran. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  reminders: ReminderState;
  onToggleReminders: () => void;
}

const REMINDER_TEXT: Record<ReminderState, { icon: string; label: string; title: string }> = {
  on: {
    icon: "🔔",
    label: "Rappels actifs",
    title: "Rappels d'échéance activés — ils n'arrivent que si MoloTask est ouvert. Cliquer pour désactiver.",
  },
  off: {
    icon: "🔕",
    label: "Rappels",
    title: "Être prévenu des échéances du jour pendant que MoloTask est ouvert",
  },
  denied: {
    icon: "🔕",
    label: "Rappels bloqués",
    title: "Les notifications sont refusées pour ce site — à réautoriser dans les réglages du navigateur",
  },
  unsupported: {
    icon: "🔕",
    label: "Rappels indisponibles",
    title: "Ce navigateur ne gère pas les notifications",
  },
};

export function Sidebar({
  view,
  onView,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onExport,
  onImport,
  reminders,
  onToggleReminders,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  /* Le repli est un réglage du bureau : dans le tiroir, la place ne manque pas
     et une colonne d'icônes seules serait illisible. */
  const compact = collapsed && !mobileOpen;

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Remis à zéro pour que réimporter le même fichier redéclenche l'événement.
    e.target.value = "";
    if (file) onImport(file);
  };

  return (
    <aside
      /* Hors écran et par-dessus le contenu tant qu'on est sous `md` ; panneau
         ordinaire du flux à partir de là. */
      /* `md:relative` et non `md:static` : le bouton de repli est posé en
         absolu sur le bord droit du panneau. */
      className={`fixed md:relative inset-y-0 left-0 w-[248px] z-50 md:z-20 md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } ${compact ? "md:w-[68px]" : "md:w-[228px]"} flex flex-col py-[22px] flex-shrink-0 plate-sidebar transition-transform md:transition-[width] duration-200 ease-out`}
    >
      {/* Repli / dépli — chevauche le bord droit du panneau */}
      <button
        type="button"
        onClick={onToggleCollapse}
        title={collapsed ? "Déplier le menu (⌘B)" : "Replier le menu (⌘B)"}
        aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
        aria-expanded={!collapsed}
        className="absolute -right-[11px] top-[26px] z-30 w-[22px] h-[22px] rounded-full hidden md:flex items-center justify-center text-[10px] leading-none text-t2 hover:text-acc bg-surface border border-stroke2 hover:border-acc/50 shadow-glass cursor-pointer transition-all"
      >
        <span aria-hidden>{collapsed ? "›" : "‹"}</span>
      </button>

      {/* Fermeture du tiroir — le voile et Échap font la même chose */}
      <button
        type="button"
        onClick={onCloseMobile}
        title="Fermer le menu"
        aria-label="Fermer le menu"
        className="md:hidden absolute right-[12px] top-[18px] z-30 w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-[13px] leading-none text-t2 hover:text-acc bg-fill1 border border-stroke1 cursor-pointer transition-all"
      >
        <span aria-hidden>✕</span>
      </button>

      {/* Marque */}
      <button
        type="button"
        onClick={() => onView("dashboard")}
        title={compact ? "MoloTask" : undefined}
        className={`${
          compact ? "px-0 justify-center" : "px-[18px]"
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
        {!compact && (
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

      <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${compact ? "px-[14px]" : "px-[10px]"}`}>
        {compact ? (
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
            collapsed={compact}
            onClick={() => {
              onView(it.view);
              onCloseMobile();
            }}
          />
        ))}

        {compact ? (
          <div className="h-px bg-stroke1 my-[10px]" aria-hidden />
        ) : (
          <SectionTitle>Échéances</SectionTitle>
        )}
        <NavLink
          icon={REMINDER_TEXT[reminders].icon}
          label={REMINDER_TEXT[reminders].label}
          title={REMINDER_TEXT[reminders].title}
          active={reminders === "on"}
          collapsed={compact}
          disabled={reminders === "unsupported" || reminders === "denied"}
          onClick={onToggleReminders}
        />

        {compact ? (
          <div className="h-px bg-stroke1 my-[10px]" aria-hidden />
        ) : (
          <SectionTitle>Données</SectionTitle>
        )}
        <NavLink
          icon="↓"
          label="Exporter"
          collapsed={compact}
          onClick={onExport}
          title="Télécharger tâches et listes au format JSON"
        />
        <NavLink
          icon="↑"
          label="Importer"
          collapsed={compact}
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

      {/* Thème — la bascule flottante du coin haut droit n'existe pas ici */}
      <div className="md:hidden mt-3 px-[10px] flex items-center gap-[10px]">
        <ThemeToggle />
        <span className="text-tm text-[11px]">Thème</span>
      </div>

      {/* Carte utilisateur */}
      <div
        className={`mt-3 rounded-[10px] glass-soft flex items-center gap-[10px] ${
          compact ? "mx-[14px] p-[6px] justify-center" : "mx-[10px] p-[10px]"
        }`}
        title={compact ? "Mouhamadou · En ligne" : undefined}
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
        {!compact && (
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
