"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnId, Task, ViewId } from "@/lib/types";
import { SIDEBAR_KEY, STORAGE_KEY } from "@/lib/constants";
import { SAMPLE_TASKS } from "@/lib/sample-data";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { StatsBar } from "@/components/StatsBar";
import { Board } from "@/components/Board";
import { TaskModal } from "@/components/TaskModal";
import { CursorAurora } from "@/components/CursorAurora";
import { Dashboard } from "@/components/Dashboard";
import { CalendarView } from "@/components/CalendarView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewId>("board");
  const [navCollapsed, setNavCollapsed] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultCol, setDefaultCol] = useState<ColumnId>("inbox");

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setTasks(JSON.parse(s));
      setNavCollapsed(localStorage.getItem(SIDEBAR_KEY) === "collapsed");
    } catch {}
    setHydrated(true);
  }, []);

  const toggleNav = useCallback(() => {
    setNavCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "collapsed" : "expanded");
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks, hydrated]);

  const openAdd = useCallback((colId: ColumnId = "inbox") => {
    setEditing(null);
    setDefaultCol(colId);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback(
    (id: string) => {
      const t = tasks.find((x) => x.id === id);
      if (!t) return;
      setEditing(t);
      setModalOpen(true);
    },
    [tasks],
  );

  const handleDelete = useCallback((id: string) => {
    if (confirm("Supprimer cette tâche définitivement ?")) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  const handleMove = useCallback((taskId: string, toCol: ColumnId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId && t.col !== toCol ? { ...t, col: toCol } : t)),
    );
  }, []);

  const handleSave = useCallback((data: Omit<Task, "id"> & { id?: string }) => {
    setTasks((prev) => {
      if (data.id) {
        return prev.map((t) => (t.id === data.id ? { ...t, ...data, id: t.id } : t));
      }
      const newTask: Task = { ...data, id: "t" + Date.now() };
      return [...prev, newTask];
    });
    setModalOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        openAdd("inbox");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleNav();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openAdd, toggleNav]);

  return (
    <>
      <CursorAurora />
      <div className="relative z-10 h-screen flex overflow-hidden">
        <Sidebar
          view={view}
          onView={setView}
          collapsed={navCollapsed}
          onToggleCollapse={toggleNav}
        />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
          <ThemeToggle className="absolute top-[16px] right-[20px] z-30" />
          {view === "board" && (
            <>
              <TopBar
                search={search}
                onSearch={setSearch}
                onAdd={() => openAdd("inbox")}
              />
              <StatsBar tasks={tasks} />
              <Board
                tasks={tasks}
                search={search}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={handleDelete}
                onMove={handleMove}
              />
            </>
          )}

          {view === "dashboard" && (
            <Dashboard
              tasks={tasks}
              onAdd={() => openAdd("inbox")}
              onEdit={openEdit}
              onView={setView}
            />
          )}

          {view === "calendar" && (
            <CalendarView
              tasks={tasks}
              onAdd={() => openAdd("sched")}
              onEdit={openEdit}
            />
          )}

          {view === "analytics" && <AnalyticsView tasks={tasks} onEdit={openEdit} />}
        </main>

        <TaskModal
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
