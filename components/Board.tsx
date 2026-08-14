"use client";

import { useEffect, useRef } from "react";
import type { ColumnDef, ColumnId, Task } from "@/lib/types";
import type { SortKey } from "@/lib/tasks";
import { Column } from "./Column";

interface Props {
  tasks: Task[];
  columns: ColumnDef[];
  search: string;
  onAdd: (colId: ColumnId) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (taskId: string, toCol: ColumnId, beforeId: string | null) => void;
  onAddCol: () => void;
  onRenameCol: (colId: ColumnId) => void;
  onMoveCol: (colId: ColumnId, dir: -1 | 1) => void;
  onDeleteCol: (colId: ColumnId) => void;
  onSortCol: (colId: ColumnId, key: SortKey) => void;
}

// Défilement automatique quand on glisse une carte près d'un bord
const EDGE = 90;      // px : zone sensible
const EDGE_SPEED = 18; // px par image

export function Board({
  tasks,
  columns,
  search,
  onAdd,
  onEdit,
  onDelete,
  onMove,
  onAddCol,
  onRenameCol,
  onMoveCol,
  onDeleteCol,
  onSortCol,
}: Props) {
  const dragIdRef = useRef<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const edgeDirRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const q = search.trim().toLowerCase();

  /* Molette verticale → défilement horizontal du tableau.
     On laisse d'abord la colonne survolée consommer la molette tant qu'elle
     peut encore défiler verticalement. */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.deltaY === 0) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // pavé tactile déjà horizontal
      if (el.scrollWidth <= el.clientWidth) return;

      if (!e.shiftKey) {
        const list = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-col-list]");
        if (list && list.scrollHeight > list.clientHeight + 1) {
          const atTop = list.scrollTop <= 0;
          const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1;
          if (!((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom))) return;
        }
      }

      const before = el.scrollLeft;
      el.scrollLeft += e.deltaY;
      if (el.scrollLeft !== before) e.preventDefault();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const stopEdgeScroll = () => {
    edgeDirRef.current = 0;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const runEdgeScroll = () => {
    const el = scrollerRef.current;
    if (!el || edgeDirRef.current === 0) {
      rafRef.current = null;
      return;
    }
    el.scrollLeft += edgeDirRef.current * EDGE_SPEED;
    rafRef.current = requestAnimationFrame(runEdgeScroll);
  };

  const handleBoardDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || !dragIdRef.current) return;
    const r = el.getBoundingClientRect();
    const dir = e.clientX < r.left + EDGE ? -1 : e.clientX > r.right - EDGE ? 1 : 0;
    edgeDirRef.current = dir;
    if (dir !== 0 && rafRef.current === null) rafRef.current = requestAnimationFrame(runEdgeScroll);
    if (dir === 0) stopEdgeScroll();
  };

  useEffect(() => stopEdgeScroll, []);

  const handleDragStart = (id: string, el: HTMLElement) => {
    dragIdRef.current = id;
    el.classList.add("dragging");
  };
  const handleDragEnd = (el: HTMLElement) => {
    el.classList.remove("dragging");
    dragIdRef.current = null;
    stopEdgeScroll();
  };
  const handleDrop = (colId: ColumnId, beforeId: string | null) => {
    if (dragIdRef.current) onMove(dragIdRef.current, colId, beforeId);
    dragIdRef.current = null;
    stopEdgeScroll();
  };

  const filtered = q
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.desc || "").toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q)),
      )
    : tasks;

  return (
    <div
      ref={scrollerRef}
      onDragOver={handleBoardDragOver}
      onDragLeave={stopEdgeScroll}
      onDrop={stopEdgeScroll}
      className="board-scroll flex-1 overflow-x-auto overflow-y-hidden px-7 pt-6 pb-3 relative"
    >
      <div className="flex gap-[16px] h-full min-w-fit stagger">
        {columns.map((col, i) => (
          <Column
            key={col.id}
            col={col}
            tasks={filtered.filter((t) => t.col === col.id)}
            canMoveLeft={i > 0}
            canMoveRight={i < columns.length - 1}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onRenameCol={onRenameCol}
            onMoveCol={onMoveCol}
            onDeleteCol={onDeleteCol}
            onSortCol={onSortCol}
          />
        ))}

        <button
          type="button"
          onClick={onAddCol}
          title="Créer une nouvelle liste"
          className="dashed w-[286px] flex-shrink-0 flex flex-col items-center justify-center gap-2 rounded-[14px] py-8 self-start text-tm hover:text-t1 cursor-pointer transition-all"
        >
          <span
            aria-hidden
            className="text-[16px] w-[28px] h-[28px] rounded-full flex items-center justify-center bg-acc/[0.10] text-acc border border-dashed border-acc/50"
          >
            ＋
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[1.2px]">Nouvelle liste</span>
        </button>
      </div>
    </div>
  );
}
