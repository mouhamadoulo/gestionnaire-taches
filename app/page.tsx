"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, ColumnId, Task, TaskDraft, TaskTemplate, ViewId } from "@/lib/types";
import {
  COLUMNS_KEY,
  DEFAULT_COLS,
  INBOX_COL,
  SIDEBAR_KEY,
  STORAGE_KEY,
  TEMPLATES_KEY,
} from "@/lib/constants";
import { moveColumn, newColumnId, sanitizeColumns } from "@/lib/columns";
import { deleteTemplate, sanitizeTemplates, templateFrom } from "@/lib/templates";
import type { SortKey } from "@/lib/tasks";
import {
  deleteTasks,
  isDoneCol,
  moveTask,
  moveTasks,
  nowIso,
  reassignColumn,
  sanitizeTasks,
  sortColumn,
  startTimer,
  stopTimer,
  tagTasks,
  withColumn,
  withRecurrence,
} from "@/lib/tasks";
import { backupFilename, buildBackup, downloadJson, parseBackup } from "@/lib/backup";
import {
  type ReminderState,
  askPermission,
  readOptIn,
  reminderState,
  sendReminders,
  writeOptIn,
} from "@/lib/reminders";
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
import { ConfirmModal } from "@/components/ConfirmModal";
import { BulkBar } from "@/components/BulkBar";
import { nextCursor, type CursorDir } from "@/lib/board-cursor";
import { useConfirm } from "@/lib/use-confirm";

/** Date locale du jour, « AAAA-MM-JJ » — même format que `Task.date`. */
function localDay(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Touches de navigation du tableau : vi et flèches, au choix. */
const CURSOR_KEYS: Record<string, CursorDir | undefined> = {
  j: "down",
  ArrowDown: "down",
  k: "up",
  ArrowUp: "up",
  h: "left",
  ArrowLeft: "left",
  l: "right",
  ArrowRight: "right",
};

/** Instantané restauré par le bandeau « Annuler ». */
interface UndoEntry extends UndoOffer {
  tasks: Task[];
  columns: ColumnDef[];
  templates: TaskTemplate[];
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLS);
  /* Modèles de tâches. Vide au premier lancement : ils naissent d'une tâche
     que l'utilisateur a lui-même saisie, pas d'une liste livrée d'avance. */
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [view, setView] = useState<ViewId>("board");
  /* Les raccourcis d'une lettre n'ont de sens que sur le tableau. */
  const viewRef = useRef<ViewId>(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const [navCollapsed, setNavCollapsed] = useState(false);
  /* Tiroir de navigation : n'existe que sous `md`, où la barre latérale sort
     de l'écran. Distinct du repli, qui est un réglage du bureau. */
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);

  /* Date du jour au format « AAAA-MM-JJ », renseignée après hydratation : le
     serveur ne connaît pas le fuseau du navigateur et signalerait des retards
     d'un jour de travers. */
  const [today, setToday] = useState("");

  /* Rappels d'échéance. L'état par défaut « off » est aussi celui du rendu
     serveur, où l'API Notification n'existe pas. */
  const [reminders, setReminders] = useState<ReminderState>("off");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultCol, setDefaultCol] = useState<ColumnId>(INBOX_COL);

  const [colModalOpen, setColModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<ColumnDef | null>(null);

  const [undo, setUndo] = useState<UndoEntry | null>(null);

  /* Confirmations et messages, en lieu et place de `confirm()` / `alert()`. */
  const { dialog, ask, notify } = useConfirm();
  const dialogOpen = dialog !== null;

  /* Sélection multiple : identifiants des tâches cochées sur le tableau. */
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const clearSelection = useCallback(() => {
    setSelected((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  /* Miroir, pour la même raison que `stateRef` : les gestionnaires d'actions
     groupées ne doivent pas se recréer à chaque case cochée. */
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  /* Miroir de l'état courant : `offerUndo` a besoin de l'avant-action sans
     dépendre de `tasks` / `columns`, qui rendraient tous les gestionnaires
     instables à chaque frappe. */
  const stateRef = useRef({ tasks, columns, templates });
  useEffect(() => {
    stateRef.current = { tasks, columns, templates };
  }, [tasks, columns, templates]);

  /** Prend l'instantané d'avant l'action et propose de revenir dessus. */
  const offerUndo = useCallback((label: string) => {
    const { tasks: t, columns: c, templates: m } = stateRef.current;
    setUndo({ id: Date.now(), label, tasks: t, columns: c, templates: m });
  }, []);

  const dismissUndo = useCallback(() => setUndo(null), []);

  const applyUndo = useCallback(() => {
    if (!undo) return;
    setTasks(undo.tasks);
    setColumns(undo.columns);
    setTemplates(undo.templates);
    setUndo(null);
  }, [undo]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setTasks(sanitizeTasks(JSON.parse(s)));
      const c = localStorage.getItem(COLUMNS_KEY);
      if (c) setColumns(sanitizeColumns(JSON.parse(c)));
      const m = localStorage.getItem(TEMPLATES_KEY);
      if (m) setTemplates(sanitizeTemplates(JSON.parse(m)));
      setNavCollapsed(localStorage.getItem(SIDEBAR_KEY) === "collapsed");
    } catch {}
    setToday(localDay());
    setReminders(reminderState(readOptIn()));
    setHydrated(true);
  }, []);

  const toggleReminders = useCallback(async () => {
    const state = reminderState(readOptIn());
    if (state === "unsupported" || state === "denied") return;
    if (state === "on") {
      writeOptIn(false);
      setReminders("off");
      return;
    }
    const permission = await askPermission();
    writeOptIn(permission === "granted");
    setReminders(reminderState(permission === "granted"));
  }, []);

  /* Un rappel part à l'activation, au changement de jour, et quand une tâche
     bouge — `sendReminders` ne réveille chaque tâche qu'une fois par jour. */
  useEffect(() => {
    if (!hydrated || reminders !== "on") return;
    sendReminders(tasks, today);
  }, [hydrated, reminders, today, tasks]);

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

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    } catch {}
  }, [templates, hydrated]);

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

  const handleMove = useCallback(
    (taskId: string, toCol: ColumnId, beforeId: string | null) => {
      const at = nowIso();
      const day = localDay();

      /* Glisser une carte qui fait partie de la sélection emmène tout le lot :
         c'est ce qu'attend quelqu'un qui vient d'en cocher cinq. */
      const batch = selectedRef.current;
      if (batch.size > 1 && batch.has(taskId)) {
        const ids = [...batch];
        offerUndo(`${ids.length} tâches déplacées.`);
        setTasks((prev) => moveTasks(prev, ids, toCol, beforeId, at, day));
        clearSelection();
        return;
      }

      setTasks((prev) => {
        const before = prev.find((t) => t.id === taskId);
        return withRecurrence(moveTask(prev, taskId, toCol, beforeId, at), before, toCol, at, day);
      });
    },
    [offerUndo, clearSelection],
  );

  /* Un seul chronomètre à la fois : démarrer une tâche arrête celle qui
     tournait, sinon on oublie un compteur en route et `spent` devient faux. */
  const handleToggleTimer = useCallback((taskId: string) => {
    const at = nowIso();
    const now = Date.now();
    setTasks((prev) => {
      const target = prev.find((t) => t.id === taskId);
      if (!target) return prev;
      const starting = !target.startedAt;
      return prev.map((t) => {
        if (t.id === taskId) return starting ? startTimer(t, at) : stopTimer(t, now);
        return t.startedAt ? stopTimer(t, now) : t;
      });
    });
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
    const day = localDay();
    setTasks((prev) => {
      if (data.id) {
        const before = prev.find((t) => t.id === data.id);
        if (!before) return prev;
        // Le formulaire peut changer la liste : on repasse par withColumn
        // pour que movedAt / doneAt suivent, comme lors d'un glisser-déposer.
        const { id: _id, ...fields } = data;
        const merged = { ...before, ...fields, col: before.col };
        const list = prev.map((t) => (t.id === data.id ? withColumn(merged, data.col, at) : t));
        // `merged` porte la périodicité telle qu'elle vient d'être saisie :
        // cocher « chaque semaine » et terminer d'un coup doit fonctionner.
        return withRecurrence(list, merged, data.col, at, day);
      }
      return [
        ...prev,
        {
          ...data,
          id: "t" + Date.now(),
          startedAt: "",
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
    async (colId: ColumnId) => {
      const col = columns.find((c) => c.id === colId);
      if (!col || col.locked) return;
      const n = tasks.filter((t) => t.col === colId).length;
      const suite =
        n === 0
          ? ""
          : `${n} tâche${n > 1 ? "s" : ""} y ${n > 1 ? "sont" : "est"} rangée${n > 1 ? "s" : ""} — elle${n > 1 ? "s" : ""} repartir${n > 1 ? "ont" : "a"} dans « À trier ».`;

      const ok = await ask({
        title: `Supprimer la liste « ${col.label} » ?`,
        body: suite,
        confirmLabel: "Supprimer",
        tone: "danger",
      });
      if (!ok) return;

      offerUndo(`Liste « ${col.label} » supprimée.`);
      setTasks((prev) => reassignColumn(prev, colId, INBOX_COL));
      setColumns((prev) => prev.filter((c) => c.id !== colId));
    },
    [columns, tasks, offerUndo, ask],
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

  /* Ce que le tableau montre réellement, une fois recherche et filtres passés.
     Sert au compteur, à l'élagage de la sélection et aux plages Maj+clic. */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q && !hasFilters(filters)) return tasks;
    return tasks.filter((t) => matchesTask(t, q, filters, today));
  }, [tasks, search, filters, today]);
  const shownCount = visible.length;

  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  /* Une tâche masquée par un filtre ne doit pas partir dans une action groupée
     qu'on croit porter sur ce qu'on voit — même raison que `pruneTags`. */
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const shown = new Set(visible.map((t) => t.id));
      const kept = [...prev].filter((id) => shown.has(id));
      return kept.length === prev.size ? prev : new Set(kept);
    });
  }, [visible]);

  /* Curseur clavier : la carte « courante », distincte de la sélection. */
  const [cursor, setCursor] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  /* Comme la sélection, le curseur ne survit pas à la disparition de sa tâche
     — filtrée, supprimée ou importée par-dessus. */
  useEffect(() => {
    setCursor((prev) => (prev && visible.some((t) => t.id === prev) ? prev : null));
  }, [visible]);

  /* Ancre des plages Maj+clic : la dernière carte cliquée. */
  const anchorRef = useRef<string | null>(null);

  const handleSelect = useCallback((id: string, range: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const anchor = anchorRef.current;
      const list = visibleRef.current;

      /* Une plage ne vaut que dans une colonne : l'ordre global du tableau
         n'est pas ce que l'utilisateur voit à l'écran. */
      if (range && anchor && anchor !== id) {
        const from = list.find((t) => t.id === anchor);
        const to = list.find((t) => t.id === id);
        if (from && to && from.col === to.col) {
          const col = list.filter((t) => t.col === from.col).map((t) => t.id);
          const i = col.indexOf(anchor);
          const j = col.indexOf(id);
          col.slice(Math.min(i, j), Math.max(i, j) + 1).forEach((x) => next.add(x));
          return next;
        }
      }

      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    anchorRef.current = id;
    setCursor(id);
  }, []);

  /* Actions groupées. Pas de confirmation : comme pour une suppression
     unitaire, le bandeau « Annuler » est le filet. */
  const handleBulkMove = useCallback(
    (toCol: ColumnId) => {
      const ids = [...selectedRef.current];
      if (ids.length === 0) return;
      const col = columns.find((c) => c.id === toCol);
      offerUndo(`${ids.length} tâche${ids.length > 1 ? "s" : ""} déplacée${ids.length > 1 ? "s" : ""} vers « ${col?.label ?? toCol} ».`);
      const at = nowIso();
      const day = localDay();
      setTasks((prev) => moveTasks(prev, ids, toCol, null, at, day));
      clearSelection();
    },
    [columns, offerUndo, clearSelection],
  );

  const handleBulkDelete = useCallback(() => {
    const ids = [...selectedRef.current];
    if (ids.length === 0) return;
    offerUndo(`${ids.length} tâche${ids.length > 1 ? "s" : ""} supprimée${ids.length > 1 ? "s" : ""}.`);
    setTasks((prev) => deleteTasks(prev, ids));
    clearSelection();
  }, [offerUndo, clearSelection]);

  const handleBulkTag = useCallback(
    (tag: string) => {
      const ids = [...selectedRef.current];
      if (ids.length === 0 || !tag.trim()) return;
      offerUndo(`Tag « ${tag.trim()} » ajouté à ${ids.length} tâche${ids.length > 1 ? "s" : ""}.`);
      setTasks((prev) => tagTasks(prev, ids, tag));
      clearSelection();
    },
    [offerUndo, clearSelection],
  );

  /* Un modèle n'est ni une tâche ni une liste : sa création n'a rien à
     annuler, sa suppression se confirme comme celle d'une liste. */
  const handleSaveTemplate = useCallback(
    (name: string, fields: TaskTemplate["fields"]) => {
      setTemplates((prev) => [...prev, templateFrom(name, fields)]);
    },
    [],
  );

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      const tpl = stateRef.current.templates.find((t) => t.id === id);
      if (!tpl) return;
      const ok = await ask({
        title: `Supprimer le modèle « ${tpl.name} » ?`,
        body: "Les tâches déjà créées à partir de ce modèle ne bougent pas.",
        confirmLabel: "Supprimer",
        tone: "danger",
      });
      if (!ok) return;
      setTemplates((prev) => deleteTemplate(prev, id));
    },
    [ask],
  );

  const handleExport = useCallback(() => {
    const { tasks: t, columns: c, templates: m } = stateRef.current;
    downloadJson(backupFilename(), buildBackup(t, c, m));
  }, []);

  /* L'import remplace tout : le bandeau d'annulation est le filet, on ne
     demande donc qu'une confirmation, avec le décompte de ce qui arrive. */
  const handleImport = useCallback(
    async (file: File) => {
      let data: { tasks: Task[]; columns: ColumnDef[]; templates: TaskTemplate[] };
      try {
        data = parseBackup(await file.text());
      } catch (err) {
        await notify({
          title: "Import impossible",
          body: err instanceof Error ? err.message : "Fichier illisible.",
        });
        return;
      }

      const current = stateRef.current.tasks.length;
      const ok = await ask({
        title:
          `Importer ${data.tasks.length} tâche${data.tasks.length > 1 ? "s" : ""} ` +
          `et ${data.columns.length} liste${data.columns.length > 1 ? "s" : ""} ?`,
        body:
          `Vos ${current} tâche${current > 1 ? "s" : ""} actuelle${current > 1 ? "s" : ""} ` +
          `${current > 1 ? "seront remplacées" : "sera remplacée"} — annulable juste après.`,
        confirmLabel: "Importer",
      });
      if (!ok) return;

      offerUndo(`Sauvegarde importée (${data.tasks.length} tâches).`);
      setTasks(data.tasks);
      setColumns(data.columns);
      setTemplates(data.templates);
    },
    [offerUndo, ask, notify],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      /* Une question est posée : elle capte le clavier à elle seule. Sans
         cela, Échap refermerait aussi la modale qui l'a ouverte et Ctrl+Z
         annulerait une action qu'on n'a pas encore confirmée. */
      if (dialogOpen) return;

      const el = e.target as HTMLElement | null;
      const typing =
        el?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el?.tagName || "");

      if (e.key === "Escape") {
        setModalOpen(false);
        setColModalOpen(false);
        setNavOpen(false);
        clearSelection();
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
        if (typing) return;
        e.preventDefault();
        applyUndo();
      }

      /* Navigation au clavier : uniquement sur le tableau, hors saisie, et
         sans modificateur — Ctrl+L appartient au navigateur, pas à nous. */
      if (typing || modalOpen || colModalOpen || e.ctrlKey || e.metaKey || e.altKey) return;
      if (viewRef.current !== "board") return;

      const dir = CURSOR_KEYS[e.key];
      if (dir) {
        e.preventDefault();
        setCursor(nextCursor(visibleRef.current, stateRef.current.columns, cursorRef.current, dir));
        return;
      }

      const at = cursorRef.current;
      if (!at) return;

      /* Le curseur fait partie du lot : l'action porte sur tout le lot, comme
         pour un glisser-déposer. Sinon, sur la seule carte courante. */
      const batch = selectedRef.current;
      const targets = batch.size > 0 && batch.has(at) ? [...batch] : [at];

      if (/^[1-9]$/.test(e.key)) {
        const col = stateRef.current.columns[Number(e.key) - 1];
        if (!col) return;
        e.preventDefault();
        if (targets.length > 1) handleBulkMove(col.id);
        else handleMove(at, col.id, null);
        return;
      }

      if (e.key === "x" || e.key === " ") {
        e.preventDefault();
        handleSelect(at, false);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        openEdit(at);
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        if (targets.length > 1) handleBulkDelete();
        else handleDelete(at);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    openAdd,
    toggleNav,
    applyUndo,
    dialogOpen,
    clearSelection,
    modalOpen,
    colModalOpen,
    handleSelect,
    handleMove,
    handleBulkMove,
    handleBulkDelete,
    handleDelete,
    openEdit,
  ]);

  return (
    <>
      <CursorAurora />
      <div className="relative z-10 h-screen flex overflow-hidden">
        <Sidebar
          view={view}
          onView={setView}
          collapsed={navCollapsed}
          onToggleCollapse={toggleNav}
          mobileOpen={navOpen}
          onCloseMobile={closeNav}
          onExport={handleExport}
          onImport={handleImport}
          reminders={reminders}
          onToggleReminders={toggleReminders}
        />

        {/* Voile du tiroir */}
        {navOpen && (
          <div
            aria-hidden
            onClick={closeNav}
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
          />
        )}

        <main className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
          {/* Ouverture du tiroir — toutes vues confondues, d'où sa position
              flottante plutôt qu'un bouton dans la barre du tableau. */}
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            title="Ouvrir le menu"
            aria-label="Ouvrir le menu"
            aria-expanded={navOpen}
            className="md:hidden absolute top-[16px] left-[16px] z-30 w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[15px] leading-none text-t2 hover:text-acc bg-fill1 border border-stroke1 cursor-pointer transition-all"
          >
            <span aria-hidden>☰</span>
          </button>
          <ThemeToggle className="hidden md:flex absolute top-[16px] right-[20px] z-30" />
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
                onToggleTimer={handleToggleTimer}
                selected={selected}
                cursor={cursor}
                onSelect={handleSelect}
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
          templates={templates}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          onSaveTemplate={handleSaveTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />

        <ColumnModal
          open={colModalOpen}
          editing={editingCol}
          onClose={() => setColModalOpen(false)}
          onSave={handleSaveCol}
        />

        <BulkBar
          count={selected.size}
          columns={columns}
          tags={tags}
          onMove={handleBulkMove}
          onDelete={handleBulkDelete}
          onTag={handleBulkTag}
          onClear={clearSelection}
        />

        <ConfirmModal dialog={dialog} />

        <UndoToast offer={undo} onUndo={applyUndo} onDismiss={dismissUndo} />
      </div>
    </>
  );
}
