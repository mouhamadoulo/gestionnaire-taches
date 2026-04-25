"use client";

import { useCallback, useEffect, useState } from "react";
import type { Card, ColumnId } from "@/lib/types";
import { STORAGE_KEY } from "@/lib/constants";
import { SAMPLE_CARDS } from "@/lib/sample-data";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { StatsBar } from "@/components/StatsBar";
import { Board } from "@/components/Board";
import { CardModal } from "@/components/CardModal";
import { CursorAurora } from "@/components/CursorAurora";

type Tab = "board" | "list" | "analytics";

export default function HomePage() {
  const [cards, setCards] = useState<Card[]>(SAMPLE_CARDS);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [tab, setTab] = useState<Tab>("board");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [defaultCol, setDefaultCol] = useState<ColumnId>("ideas");

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setCards(JSON.parse(s));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch {}
  }, [cards, hydrated]);

  const openAdd = useCallback((colId: ColumnId = "ideas") => {
    setEditing(null);
    setDefaultCol(colId);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback(
    (id: string) => {
      const c = cards.find((x) => x.id === id);
      if (!c) return;
      setEditing(c);
      setModalOpen(true);
    },
    [cards],
  );

  const handleDelete = useCallback((id: string) => {
    if (confirm("Supprimer ce contenu définitivement ?")) {
      setCards((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  const handleMove = useCallback((cardId: string, toCol: ColumnId) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId && c.col !== toCol ? { ...c, col: toCol } : c)),
    );
  }, []);

  const handleSave = useCallback(
    (data: Omit<Card, "id"> & { id?: string }) => {
      setCards((prev) => {
        if (data.id) {
          return prev.map((c) => (c.id === data.id ? { ...c, ...data, id: c.id } : c));
        }
        const newCard: Card = { ...data, id: "c" + Date.now() };
        return [...prev, newCard];
      });
      setModalOpen(false);
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        openAdd("ideas");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openAdd]);

  return (
    <>
      <CursorAurora />
      <div className="relative z-10 h-screen flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopBar
            search={search}
            onSearch={setSearch}
            platform={platform}
            onPlatform={setPlatform}
            onAdd={() => openAdd("ideas")}
            tab={tab}
            onTab={setTab}
          />
          <StatsBar cards={cards} />
          <Board
            cards={cards}
            search={search}
            platform={platform}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        </main>
        <CardModal
          open={modalOpen}
          editing={editing}
          defaultCol={defaultCol}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      </div>
    </>
  );
}
