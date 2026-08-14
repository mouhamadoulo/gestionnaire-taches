"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnDef, ColumnId, Task, ViewId } from "@/lib/types";
import {
  COLUMNS_KEY,
  DEFAULT_COLS,
  INBOX_COL,
  SIDEBAR_KEY,
  STORAGE_KEY,
} from "@/lib/constants";
import { moveColumn, newColumnId, sanitizeColumns } from "@/lib/columns";
import { SAMPLE_TASKS } from "@/lib/sample-data";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { StatsBar } from "@/components/StatsBar";
import { Board } from "@/components/Board";
import { TaskModal } from "@/components/TaskModal";
import { ColumnModal } from "@/components/ColumnModal";
import { CursorAurora } from "@/components/CursorAurora";
import { Dashboard } from "@/components/Dashboard";
import { CalendarView } from "@/components/CalendarView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLS);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewId>("board");
  const [navCollapsed, setNavCollapsed] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultCol, setDefaultCol] = useState<ColumnId>(INBOX_COL);

  const [colModalOpen, setColModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<ColumnDef | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setTasks(JSON.parse(s));
      const c = localStorage.getItem(COLUMNS_KEY);
      if (c) setColumns(sanitizeColumns(JSON.parse(c)));
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

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns));
    } catch {}
  }, [columns, hydrated]);

  const openAdd = useCallback((colId: ColumnId = INBOX_COL) => {
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

  const openAddCol = useCallback(() => {
    setEditingCol(null);
    setColModalOpen(true);
  }, []);

  const openRenameCol = useCallback(
    (colId: ColumnId) => {
      const c = columns.find((x) => x.id === colId);
      if (!c) return;
      setEditingCol(c);
      setColModalOpen(true);
    },
    [columns],
  );

  const handleSaveCol = useCallback(
    (data: { id?: string; label: string; hint: string; tint: string }) => {
      setColumns((prev) => {
        if (data.id) {
          return prev.map((c) =>
            c.id === data.id ? { ...c, label: data.label, hint: data.hint, tint: data.tint } : c,
          );
        }
        return [...prev, { id: newColumnId(), label: data.label, hint: data.hint, tint: data.tint }];
      });
      setColModalOpen(false);
    },
    [],
  );

  const handleMoveCol = useCallback((colId: ColumnId, dir: -1 | 1) => {
    setColumns((prev) => moveColumn(prev, colId, dir));
  }, []);

  const handleDeleteCol = useCallback(
    (colId: ColumnId) => {
      const col = columns.find((c) => c.id === colId);
      if (!col || col.locked) return;
      const n = tasks.filter((t) => t.col === colId).length;
      const suite =
        n === 0
          ? ""
          : `\n\n${n} tâche${n > 1 ? "s" : ""} y ${n > 1 ? "sont" : "est"} rangée${n > 1 ? "s" : ""} — elle${n > 1 ? "s" : ""} repartira${n > 1 ? "ont" : ""} dans « À trier ».`;
      if (!confirm(`Supprimer la liste « ${col.label} » ?${suite}`)) return;
      setTasks((prev) => prev.map((t) => (t.col === colId ? { ...t, col: INBOX_COL } : t)));
      setColumns((prev) => prev.filter((c) => c.id !== colId));
    },
    [columns, tasks],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalOpen(false);
        setColModalOpen(false);
      }
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
                columns={columns}
                search={search}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={handleDelete}
                onMove={handleMove}
                onAddCol={openAddCol}
                onRenameCol={openRenameCol}
                onMoveCol={handleMoveCol}
                onDeleteCol={handleDeleteCol}
              />
            </>
          )}

          {view === "dashboard" && (
            <Dashboard
              tasks={tasks}
              columns={columns}
              onAdd={() => openAdd(INBOX_COL)}
              onEdit={openEdit}
              onView={setView}
            />
          )}

          {view === "calendar" && (
            <CalendarView
              tasks={tasks}
              columns={columns}
              onAdd={() => openAdd("sched")}
              onEdit={openEdit}
            />
          )}

          {view === "analytics" && <AnalyticsView tasks={tasks} onEdit={openEdit} />}
        </main>

        <TaskModal
          open={modalOpen}
          editing={editing}
          columns={columns}
          defaultCol={defaultCol}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />

        <ColumnModal
          open={colModalOpen}
          editing={editingCol}
          onClose={() => setColModalOpen(false)}
          onSave={handleSaveCol}
        />
      </div>
    </>
  );
}
