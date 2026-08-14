"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { ColumnDef, ColumnId, Task } from "@/lib/types";
import type { SortKey } from "@/lib/tasks";
import { TaskCard } from "./TaskCard";

interface Props {
  col: ColumnDef;
  tasks: Task[];
  /** Une recherche ou un filtre est actif : une liste vide n'est pas vide. */
  filtering: boolean;
  today: string;
  /** Largeur et visibilité, décidées par le tableau selon la taille d'écran. */
  className: string;
  /** Toutes les listes — destinations du menu « Déplacer vers » des cartes. */
  columns: ColumnDef[];
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onAdd: (colId: ColumnId) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleTimer: (id: string) => void;
  onMoveTask: (taskId: string, toCol: ColumnId, beforeId: string | null) => void;
  selected: Set<string>;
  /** Identifiant de la carte sous le curseur clavier. */
  cursor: string | null;
  onSelect: (id: string, range: boolean) => void;
  /** `beforeId` : tâche devant laquelle déposer, `null` pour la fin de liste. */
  onDrop: (colId: ColumnId, beforeId: string | null) => void;
  onDragStart: (id: string, el: HTMLElement) => void;
  onDragEnd: (el: HTMLElement) => void;
  onRenameCol: (colId: ColumnId) => void;
  onMoveCol: (colId: ColumnId, dir: -1 | 1) => void;
  onDeleteCol: (colId: ColumnId) => void;
  onSortCol: (colId: ColumnId, key: SortKey) => void;
}

export function Column({
  col,
  tasks,
  filtering,
  today,
  className,
  columns,
  canMoveLeft,
  canMoveRight,
  onAdd,
  onEdit,
  onDelete,
  onToggleTimer,
  onMoveTask,
  selected,
  cursor,
  onSelect,
  onDrop,
  onDragStart,
  onDragEnd,
  onRenameCol,
  onMoveCol,
  onDeleteCol,
  onSortCol,
}: Props) {
  const tint = col.tint;
  const [menuOpen, setMenuOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  /** Position d'insertion pendant un glisser : index dans `tasks`, ou `null`. */
  const [dropAt, setDropAt] = useState<number | null>(null);

  /* Position de dépôt : première carte dont le milieu passe sous le curseur.
     La carte en cours de déplacement reste dans le DOM, elle compte donc comme
     les autres — déposer sur soi-même est traité comme un non-déplacement. */
  const indexAt = (clientY: number) => {
    const el = listRef.current;
    if (!el) return tasks.length;
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-task-id]"));
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return cards.length;
  };

  // Échap ferme le menu avant que la page ne traite la touche.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [menuOpen]);

  const runAndClose = (fn: () => void) => {
    setMenuOpen(false);
    fn();
  };

  return (
    <section
      aria-label={col.label}
      className={`${className} flex-col rounded-[14px] overflow-hidden max-h-full relative plate-column`}
    >
      {/* Liseré supérieur teinté */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] opacity-90"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${tint} 30%, ${tint} 70%, transparent 100%)`,
        }}
      />

      {/* En-tête */}
      <div className="px-[14px] pt-[14px] pb-[10px] flex items-center gap-[7px] relative">
        <span
          aria-hidden
          className="w-[8px] h-[8px] rounded-full flex-shrink-0"
          style={{ background: tint, boxShadow: `0 0 0 3px ${tint}22` }}
        />
        <span className="text-[11px] font-bold text-t1 flex-1 uppercase tracking-[1.2px] truncate">
          {col.label}
        </span>
        <span
          className="font-mono text-[10px] font-semibold px-[7px] py-[2px] rounded-full tabular-nums"
          style={{ background: `${tint}1a`, color: tint, border: `1px solid ${tint}33` }}
        >
          {String(tasks.length).padStart(2, "0")}
        </span>
        <button
          onClick={() => onAdd(col.id)}
          title={`Ajouter dans « ${col.label} »`}
          aria-label={`Ajouter une tâche dans ${col.label}`}
          className="bg-transparent border-none text-tm hover:text-t1 hover:bg-fill2 cursor-pointer text-[15px] w-[20px] h-[20px] rounded leading-none transition-colors flex items-center justify-center"
        >
          ＋
        </button>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          title={`Options de « ${col.label} »`}
          aria-label={`Options de la liste ${col.label}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="bg-transparent border-none text-tm hover:text-t1 hover:bg-fill2 cursor-pointer text-[14px] w-[20px] h-[20px] rounded leading-none transition-colors flex items-center justify-center"
        >
          ⋯
        </button>

        {menuOpen && (
          <>
            {/* Ferme le menu au clic à l'extérieur */}
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              aria-label={`Options de ${col.label}`}
              className="panel-hi absolute right-[10px] top-[40px] z-50 w-[184px] rounded-[11px] py-[5px] overflow-hidden shadow-glass"
            >
              <MenuItem label="Renommer" icon="✎" onClick={() => runAndClose(() => onRenameCol(col.id))} />
              <MenuItem
                label="Trier par priorité"
                icon="↕"
                disabled={tasks.length < 2}
                onClick={() => runAndClose(() => onSortCol(col.id, "prio"))}
              />
              <MenuItem
                label="Trier par échéance"
                icon="↕"
                disabled={tasks.length < 2}
                onClick={() => runAndClose(() => onSortCol(col.id, "date"))}
              />
              <div className="h-px bg-stroke1 my-[4px]" aria-hidden />
              <MenuItem
                label="Déplacer à gauche"
                icon="←"
                disabled={!canMoveLeft}
                onClick={() => runAndClose(() => onMoveCol(col.id, -1))}
              />
              <MenuItem
                label="Déplacer à droite"
                icon="→"
                disabled={!canMoveRight}
                onClick={() => runAndClose(() => onMoveCol(col.id, 1))}
              />
              <div className="h-px bg-stroke1 my-[4px]" aria-hidden />
              <MenuItem
                label="Supprimer"
                icon="🗑"
                danger
                disabled={col.locked}
                title={col.locked ? "Liste structurelle — non supprimable" : undefined}
                onClick={() => runAndClose(() => onDeleteCol(col.id))}
              />
            </div>
          </>
        )}
      </div>

      {/* Zone de dépôt */}
      <div
        ref={listRef}
        data-col-list
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("drop-active");
          setDropAt(indexAt(e.clientY));
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove("drop-active");
          setDropAt(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("drop-active");
          const at = dropAt ?? indexAt(e.clientY);
          setDropAt(null);
          onDrop(col.id, at < tasks.length ? tasks[at].id : null);
        }}
        className="col-scroll flex-1 overflow-y-auto overscroll-contain px-[10px] pt-[3px] pb-[12px] flex flex-col gap-[10px] min-h-[60px] transition-all"
      >
        {tasks.length === 0 && filtering ? (
          <div className="dashed flex items-center justify-center px-3 py-7 rounded-[10px] mx-[1px] text-tm text-center font-mono text-[10px] uppercase tracking-[0.8px] leading-[1.6]">
            Rien ici avec
            <br />
            ces filtres
          </div>
        ) : tasks.length === 0 ? (
          <button
            type="button"
            onClick={() => onAdd(col.id)}
            className="dashed group flex flex-col items-center justify-center px-3 py-7 text-tm hover:text-t1 text-[11px] gap-2 rounded-[10px] text-center cursor-pointer transition-all mx-[1px]"
          >
            <span
              className="text-[16px] w-[28px] h-[28px] rounded-full flex items-center justify-center transition-all"
              style={{ background: `${tint}14`, color: tint, border: `1px dashed ${tint}55` }}
              aria-hidden
            >
              ＋
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.8px] opacity-80">
              {col.hint || "Ajouter une tâche"}
            </span>
          </button>
        ) : (
          <>
            {tasks.map((t, i) => (
              <Fragment key={t.id}>
                {dropAt === i && <DropLine tint={tint} />}
                <TaskCard
                  task={t}
                  tint={tint}
                  today={today}
                  columns={columns}
                  selected={selected.has(t.id)}
                  selectionActive={selected.size > 0}
                  cursor={cursor === t.id}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleTimer={onToggleTimer}
                  onMoveTask={onMoveTask}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              </Fragment>
            ))}
            {dropAt === tasks.length && <DropLine tint={tint} />}
          </>
        )}
      </div>
    </section>
  );
}

/** Trait d'insertion affiché à la position de dépôt pendant un glisser. */
function DropLine({ tint }: { tint: string }) {
  return (
    <div
      aria-hidden
      className="h-[3px] rounded-full -my-[3px] flex-shrink-0"
      style={{ background: tint, boxShadow: `0 0 10px -1px ${tint}` }}
    />
  );
}

function MenuItem({
  label,
  icon,
  onClick,
  disabled,
  danger,
  title,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-full text-left px-[12px] py-[7px] text-[11.5px] flex items-center gap-[9px] bg-transparent border-none transition-colors ${
        disabled
          ? "text-td cursor-not-allowed"
          : danger
          ? "text-t2 hover:bg-fill2 cursor-pointer hover:text-[color:var(--bad)]"
          : "text-t2 hover:bg-fill2 hover:text-t1 cursor-pointer"
      }`}
    >
      <span className="w-[14px] text-center text-[11px]" aria-hidden>{icon}</span>
      {label}
    </button>
  );
}
