"use client";

import { useRef } from "react";
import type { Card, ColumnId } from "@/lib/types";
import { COLS } from "@/lib/constants";
import { Column } from "./Column";

interface Props {
  cards: Card[];
  search: string;
  platform: string;
  onAdd: (colId: ColumnId) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (cardId: string, toCol: ColumnId) => void;
}

export function Board({ cards, search, platform, onAdd, onEdit, onDelete, onMove }: Props) {
  const dragIdRef = useRef<string | null>(null);
  const q = search.toLowerCase();

  const handleDragStart = (id: string, el: HTMLElement) => {
    dragIdRef.current = id;
    el.classList.add("dragging");
  };
  const handleDragEnd = (el: HTMLElement) => {
    el.classList.remove("dragging");
    dragIdRef.current = null;
  };
  const handleDrop = (colId: ColumnId) => {
    if (dragIdRef.current) onMove(dragIdRef.current, colId);
    dragIdRef.current = null;
  };

  const filtered = cards.filter((c) => {
    if (platform && c.plt !== platform) return false;
    if (q && !c.title.toLowerCase().includes(q) && !(c.desc || "").toLowerCase().includes(q))
      return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden px-7 py-6 relative">
      <div className="flex gap-[16px] h-full min-w-fit stagger">
        {COLS.map((col) => (
          <Column
            key={col.id}
            col={col}
            cards={filtered.filter((c) => c.col === col.id)}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
