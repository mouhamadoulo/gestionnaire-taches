"use client";

import { useState } from "react";
import { type Filters, filterCount } from "@/lib/filters";
import { FilterMenu } from "./FilterMenu";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  onAdd: () => void;
  filters: Filters;
  onFilters: (f: Filters) => void;
  /** Tags présents dans le tableau, les plus utilisés d'abord. */
  tags: string[];
  overdueCount: number;
  /** Nombre de tâches affichées / total, une fois recherche et filtres appliqués. */
  shown: number;
  total: number;
}

export function TopBar({
  search,
  onSearch,
  onAdd,
  filters,
  onFilters,
  tags,
  overdueCount,
  shown,
  total,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const count = filterCount(filters);
  const filtering = count > 0 || search.trim().length > 0;

  return (
    <div className="px-4 md:pl-7 md:pr-[62px] py-[12px] md:py-[16px] flex flex-col md:flex-row items-stretch md:items-end gap-[10px] md:gap-[14px] flex-shrink-0 relative plate-topbar">
      {/* Le titre laisse la place au bouton du menu ; la ligne de recherche,
          elle, prend toute la largeur. */}
      <div className="flex-1 min-w-0 pl-[46px] md:pl-0">
        <div className="flex items-baseline gap-[10px]">
          <h1 className="font-display italic text-t1 text-[21px] md:text-[30px] leading-none tracking-[-0.5px]">
            Tableau des tâches
          </h1>
          <span className="font-mono text-[10px] text-tm uppercase tracking-[1.4px] hidden sm:inline">
            · MoloTask
          </span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[1.4px] text-td mt-[6px] md:mt-[8px] flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-acc" />
          {filtering ? (
            <span className="text-t2">
              {shown} tâche{shown > 1 ? "s" : ""} sur {total} affichée{shown > 1 ? "s" : ""}
            </span>
          ) : (
            /* Les raccourcis ne servent qu'au clavier : inutile de les annoncer
               sur un écran qui n'en a pas. */
            <span className="hidden md:inline">
              j k h l naviguer · x cocher · 1-9 déplacer · ⌘N ajouter · ⌘B menu
            </span>
          )}
          {overdueCount > 0 && (
            <button
              type="button"
              onClick={() => onFilters({ ...filters, overdue: !filters.overdue })}
              aria-pressed={filters.overdue}
              title={
                filters.overdue
                  ? "Retirer le filtre « en retard »"
                  : "N'afficher que les tâches en retard"
              }
              className="ml-1 px-[8px] py-[2px] rounded-full text-[9.5px] font-mono uppercase tracking-[1px] cursor-pointer transition-all border"
              style={{
                background: filters.overdue ? "rgba(239,68,68,0.22)" : "rgba(239,68,68,0.10)",
                borderColor: filters.overdue ? "rgba(239,68,68,0.6)" : "rgba(239,68,68,0.32)",
                color: "var(--bad)",
              }}
            >
              {overdueCount} en retard
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-[8px]">
        {/* Recherche */}
        <div className="flex items-center gap-[8px] rounded-[10px] px-[12px] py-[7px] flex-1 min-w-0 md:flex-none md:min-w-[220px] bg-fill1 border border-stroke1">
          <span className="text-tm text-[12px]" aria-hidden>⌕</span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Rechercher une tâche…"
            aria-label="Rechercher une tâche"
            className="border-none bg-transparent outline-none text-[12px] text-t1 w-full placeholder:text-tm font-sans"
          />
        </div>

        {/* Filtres */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-label="Filtrer"
            title="Filtrer par catégorie, priorité, tag ou retard"
            className="btn-ghost flex items-center gap-[7px] rounded-[10px] px-[13px] py-[8px] text-[12px] font-semibold whitespace-nowrap"
            style={count > 0 ? { borderColor: "rgba(255,107,53,0.5)", color: "var(--t1)" } : undefined}
          >
            <span className="text-[12px] leading-none" aria-hidden>⚟</span>
            <span className="hidden md:inline">Filtrer</span>
            {count > 0 && (
              <span className="font-mono text-[10px] tabular-nums px-[6px] py-px rounded-full bg-acc text-white leading-[1.4]">
                {count}
              </span>
            )}
          </button>

          <FilterMenu
            open={menuOpen}
            filters={filters}
            tags={tags}
            overdueCount={overdueCount}
            onChange={onFilters}
            onClose={() => setMenuOpen(false)}
          />
        </div>

        {/* Action principale */}
        <button
          onClick={onAdd}
          aria-label="Nouvelle tâche"
          title="Nouvelle tâche (⌘N)"
          className="btn-primary flex items-center gap-[6px] rounded-[10px] px-[13px] md:px-[16px] py-[8px] text-[12px] font-semibold whitespace-nowrap"
        >
          <span className="text-[14px] leading-none" aria-hidden>＋</span>
          <span className="hidden md:inline">Nouvelle tâche</span>
        </button>
      </div>
    </div>
  );
}
