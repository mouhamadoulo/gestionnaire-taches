"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, ColumnId, Task, TaskDraft, ViewId } from "@/lib/types";
import {
  COLUMNS_KEY,
  DEFAULT_COLS,
  INBOX_COL,
  SIDEBAR_KEY,
  STORAGE_KEY,
} from "@/lib/constants";
import { moveColumn, newColumnId, sanitizeColumns } from "@/lib/columns";
import type { SortKey } from "@/lib/tasks";
import {
  isDoneCol,
  moveTask,
  nowIso,
  reassignColumn,
  sanitizeTasks,
  sortColumn,
  withColumn,
} from "@/lib/tasks";
import { backupFilename, buildBackup, downloadJson, parseBackup } from "@/lib/backup";
import {
  type Filters,
  EMPTY_FILTERS,
  collectTags,
  hasFilters,
  isOverdue,
  matchesTask,
  pruneTags,
} from "@/lib/filters";
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
import { UndoToast, type UndoOffer } from "@/components/UndoToast";

/** Date locale du jour, « AAAA-MM-JJ » — même format que `Task.date`. */
function localDay(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Instantané restauré par le bandeau « Annuler ». */
interface UndoEntry extends UndoOffer {
  tasks: Task[];
  columns: ColumnDef[];
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLS);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [view, setView] = useState<ViewId>("board");
  const [navCollapsed, setNavCollapsed] = useState(false);

  /* Date du jour au format « AAAA-MM-JJ », renseignée après hydratation : le
     serveur ne connaît pas le fuseau du navigateur et signalerait des retards
     d'un jour de travers. */
  const [today, setToday] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultCol, setDefaultCol] = useState<ColumnId>(INBOX_COL);

  const [colModalOpen, setColModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<ColumnDef | null>(null);

  const [undo, setUndo] = useState<UndoEntry | null>(null);

  /* Miroir de l'état courant : `offerUndo` a besoin de l'avant-action sans
     dépendre de `tasks` / `columns`, qui rendraient tous les gestionnaires
     instables à chaque frappe. */
  const stateRef = useRef({ tasks, columns });
  useEffect(() => {
    stateRef.current = { tasks, columns };
  }, [tasks, columns]);

  /** Prend l'instantané d'avant l'action et propose de revenir dessus. */
  const offerUndo = useCallback((label: string) => {
    const { tasks: t, columns: c } = stateRef.current;
    setUndo({ id: Date.now(), label, tasks: t, columns: c });
  }, []);

  const dismissUndo = useCallback(() => setUndo(null), []);

  const applyUndo = useCallback(() => {
    if (!undo) return;
    setTasks(undo.tasks);
    setColumns(undo.columns);
    setUndo(null);
  }, [undo]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setTasks(sanitizeTasks(JSON.parse(s)));
      const c = localStorage.getItem(COLUMNS_KEY);
      if (c) setColumns(sanitizeColumns(JSON.parse(c)));
      setNavCollapsed(localStorage.getItem(SIDEBAR_KEY) === "collapsed");
    } catch {}
    setToday(localDay());
    setHydrated(true);
  }, []);

  /* Une session laissée ouverte doit changer de jour : sans cela une tâche du
     lendemain resterait affichée « à faire aujourd'hui ». */
  useEffect(() => {
    const t = setInterval(() => setToday(localDay()), 60_000);
    return () => clearInterval(t);
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

  /* Plus de confirmation bloquante : l'instantané rend le geste réversible,
     ce qui vaut mieux qu'une boîte de dialogue qu'on finit par valider sans
     lire. */
  const handleDelete = useCallback(
    (id: string) => {
      const t = stateRef.current.tasks.find((x) => x.id === id);
      if (!t) return;
      offerUndo(`« ${t.title} » supprimée.`);
      setTasks((prev) => prev.filter((x) => x.id !== id));
    },
    [offerUndo],
  );

  const handleMove = useCallback((taskId: string, toCol: ColumnId, beforeId: string | null) => {
    const at = nowIso();
    setTasks((prev) => moveTask(prev, taskId, toCol, beforeId, at));
  }, []);

  const handleSortCol = useCallback(
    (colId: ColumnId, key: SortKey) => {
      const col = stateRef.current.columns.find((c) => c.id === colId);
      offerUndo(`Liste « ${col?.label ?? colId} » triée.`);
      setTasks((prev) => sortColumn(prev, colId, key));
    },
    [offerUndo],
  );

  const handleSave = useCallback((data: TaskDraft) => {
    const at = nowIso();
    setTasks((prev) => {
      if (data.id) {
        return prev.map((t) => {
          if (t.id !== data.id) return t;
          // Le formulaire peut changer la liste : on repasse par withColumn
          // pour que movedAt / doneAt suivent, comme lors d'un glisser-déposer.
          const { id: _id, ...fields } = data;
          return withColumn({ ...t, ...fields, col: t.col }, data.col, at);
        });
      }
      return [
        ...prev,
        {
          ...data,
          id: "t" + Date.now(),
          createdAt: at,
          movedAt: at,
          doneAt: isDoneCol(data.col) ? at : "",
        },
      ];
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
      offerUndo(`Liste « ${col.label} » supprimée.`);
      setTasks((prev) => reassignColumn(prev, colId, INBOX_COL));
      setColumns((prev) => prev.filter((c) => c.id !== colId));
    },
    [columns, tasks, offerUndo],
  );

  const tags = useMemo(() => collectTags(tasks), [tasks]);
  const overdueCount = useMemo(
    () => tasks.filter((t) => isOverdue(t, today)).length,
    [tasks, today],
  );

  /* Un tag peut disparaître du tableau alors qu'il sert encore de filtre : le
     tableau paraîtrait vide sans raison visible. */
  useEffect(() => {
    setFilters((f) => pruneTags(f, tags));
  }, [tags]);

  const shownCount = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q && !hasFilters(filters)) return tasks.length;
    return tasks.filter((t) => matchesTask(t, q, filters, today)).length;
  }, [tasks, search, filters, today]);

  const handleExport = useCallback(() => {
    const { tasks: t, columns: c } = stateRef.current;
    downloadJson(backupFilename(), buildBackup(t, c));
  }, []);

  /* L'import remplace tout : le bandeau d'annulation est le filet, on ne
     demande donc qu'une confirmation, avec le décompte de ce qui arrive. */
  const handleImport = useCallback(
    async (file: File) => {
      let data: { tasks: Task[]; columns: ColumnDef[] };
      try {
        data = parseBackup(await file.text());
      } catch (err) {
        alert(err instanceof Error ? err.message : "Fichier illisible.");
        return;
      }

      const current = stateRef.current.tasks.length;
      const msg =
        `Importer ${data.tasks.length} tâche${data.tasks.length > 1 ? "s" : ""} ` +
        `et ${data.columns.length} liste${data.columns.length > 1 ? "s" : ""} ?\n\n` +
        `Vos ${current} tâche${current > 1 ? "s" : ""} actuelle${current > 1 ? "s" : ""} ` +
        `${current > 1 ? "seront remplacées" : "sera remplacée"} — annulable juste après.`;
      if (!confirm(msg)) return;

      offerUndo(`Sauvegarde importée (${data.tasks.length} tâches).`);
      setTasks(data.tasks);
      setColumns(data.columns);
    },
    [offerUndo],
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
      // Ctrl/⌘+Z annule la dernière action, sauf pendant une saisie où la
      // touche appartient au champ.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        const el = e.target as HTMLElement | null;
        const typing =
          el?.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(el?.tagName || "");
        if (typing) return;
        e.preventDefault();
        applyUndo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openAdd, toggleNav, applyUndo]);

  return (
    <>
      <CursorAurora />
      <div className="relative z-10 h-screen flex overflow-hidden">
        <Sidebar
          view={view}
          onView={setView}
          collapsed={navCollapsed}
          onToggleCollapse={toggleNav}
          onExport={handleExport}
          onImport={handleImport}
        />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
          <ThemeToggle className="absolute top-[16px] right-[20px] z-30" />
          {view === "board" && (
            <>
              <TopBar
                search={search}
                onSearch={setSearch}
                onAdd={() => openAdd("inbox")}
                filters={filters}
                onFilters={setFilters}
                tags={tags}
                overdueCount={overdueCount}
                shown={shownCount}
                total={tasks.length}
              />
              <StatsBar tasks={tasks} />
              <Board
                tasks={tasks}
                columns={columns}
                search={search}
                filters={filters}
                today={today}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={handleDelete}
                onMove={handleMove}
                onAddCol={openAddCol}
                onRenameCol={openRenameCol}
                onMoveCol={handleMoveCol}
                onDeleteCol={handleDeleteCol}
                onSortCol={handleSortCol}
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

        <UndoToast offer={undo} onUndo={applyUndo} onDismiss={dismissUndo} />
      </div>
    </>
  );
}
