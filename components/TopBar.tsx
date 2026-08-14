"use client";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  onAdd: () => void;
}

export function TopBar({ search, onSearch, onAdd }: Props) {
  return (
    <div className="pl-7 pr-[62px] py-[16px] flex items-end gap-[14px] flex-shrink-0 relative plate-topbar">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-[10px]">
          <h1 className="font-display italic text-t1 text-[30px] leading-none tracking-[-0.5px]">
            Tableau des tâches
          </h1>
          <span className="font-mono text-[10px] text-tm uppercase tracking-[1.4px]">
            · MoloTask
          </span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[1.4px] text-td mt-[8px] flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-acc" />
          Glissez les cartes d&apos;une colonne à l&apos;autre · ⌘N ajouter · ⌘B menu
        </div>
      </div>

      <div className="flex items-center gap-[8px]">
        {/* Recherche */}
        <div className="flex items-center gap-[8px] rounded-[10px] px-[12px] py-[7px] min-w-[220px] bg-fill1 border border-stroke1">
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

        {/* Action principale */}
        <button
          onClick={onAdd}
          className="btn-primary flex items-center gap-[6px] rounded-[10px] px-[16px] py-[8px] text-[12px] font-semibold whitespace-nowrap"
        >
          <span className="text-[14px] leading-none" aria-hidden>＋</span>
          Nouvelle tâche
        </button>
      </div>
    </div>
  );
}
