import type { CategoryKey, ColumnId, Priority, Step, Task } from "./types";
import { CATEGORIES, DONE_COLS, INBOX_COL } from "./constants";

/** Horodatage courant, en ISO 8601. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Identifiant d'une étape de checklist. */
export function newStepId(): string {
  return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Minutes écoulées depuis le démarrage du chronomètre, 0 s'il est à l'arrêt. */
export function elapsedMinutes(t: Task, now: number = Date.now()): number {
  if (!t.startedAt) return 0;
  const from = new Date(t.startedAt).getTime();
  if (Number.isNaN(from) || now <= from) return 0;
  return Math.round((now - from) / 60_000);
}

/** Temps passé affiché : le total enregistré plus le chronomètre en cours. */
export function liveSpent(t: Task, now: number = Date.now()): number {
  return (t.spent || 0) + elapsedMinutes(t, now);
}

/** Démarre le chronomètre. */
export function startTimer(t: Task, at: string = nowIso()): Task {
  return t.startedAt ? t : { ...t, startedAt: at };
}

/** Arrête le chronomètre et verse le temps écoulé dans `spent`. */
export function stopTimer(t: Task, now: number = Date.now()): Task {
  if (!t.startedAt) return t;
  return { ...t, spent: (t.spent || 0) + elapsedMinutes(t, now), startedAt: "" };
}

/** Avancement de la checklist ; `total` à 0 quand la tâche n'en a pas. */
export function stepProgress(t: Task): { done: number; total: number } {
  const steps = t.steps || [];
  return { done: steps.filter((s) => s.done).length, total: steps.length };
}

/** Une liste terminée déclenche l'horodatage `doneAt`. */
export function isDoneCol(col: ColumnId): boolean {
  return DONE_COLS.includes(col);
}

/**
 * Applique un changement de liste et les horodatages qui vont avec.
 *
 * `movedAt` suit chaque déplacement ; `doneAt` est posé à l'entrée dans une
 * liste terminée et effacé si la tâche en ressort — une tâche rouverte ne doit
 * pas continuer à compter comme terminée dans les statistiques.
 */
export function withColumn(task: Task, toCol: ColumnId, at: string = nowIso()): Task {
  if (task.col === toCol) return task;
  const nowDone = isDoneCol(toCol);
  // Terminer une tâche arrête son chronomètre : le temps en cours est versé
  // dans `spent` plutôt que perdu.
  const base = nowDone ? stopTimer(task, new Date(at).getTime() || Date.now()) : task;
  return {
    ...base,
    col: toCol,
    movedAt: at,
    doneAt: nowDone ? task.doneAt || at : "",
  };
}

const PRIORITIES: Priority[] = ["high", "med", "low"];

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : 0;
}

/** Étapes venues du stockage ou d'un import : libellé obligatoire, id regénéré si besoin. */
function steps(v: unknown): Step[] {
  if (!Array.isArray(v)) return [];
  const out: Step[] = [];
  for (const entry of v) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const label = str(e.label).trim();
    if (!label) continue;
    out.push({ id: str(e.id) || newStepId(), label, done: e.done === true });
  }
  return out;
}

/** Ne garde une date que si elle est réellement analysable. */
function iso(v: unknown): string {
  const s = str(v);
  if (!s) return "";
  return Number.isNaN(new Date(s).getTime()) ? "" : s;
}

/**
 * Relit les tâches stockées dans localStorage — ou celles d'un fichier
 * importé.
 *
 * Même principe que `sanitizeColumns` : le contenu vient de l'extérieur, on ne
 * lui fait pas confiance. Les entrées inutilisables sont écartées, les champs
 * manquants reçoivent une valeur neutre, et les tâches d'avant les
 * horodatages gardent des dates vides plutôt qu'une date inventée.
 */
export function sanitizeTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const tasks: Task[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;

    const title = str(e.title).trim();
    if (!title) continue;

    const id = str(e.id) || "t" + Date.now() + Math.random().toString(36).slice(2, 7);
    if (seen.has(id)) continue;
    seen.add(id);

    const cat = CATEGORIES.includes(e.cat as CategoryKey) ? (e.cat as CategoryKey) : "perso";
    const prio = PRIORITIES.includes(e.prio as Priority) ? (e.prio as Priority) : "med";
    const col = str(e.col) || INBOX_COL;
    const doneAt = iso(e.doneAt);

    tasks.push({
      id,
      col,
      title,
      desc: str(e.desc),
      cat,
      type: str(e.type) || "Tâche",
      prio,
      date: str(e.date),
      tags: Array.isArray(e.tags) ? e.tags.filter((t): t is string => typeof t === "string") : [],
      steps: steps(e.steps),
      estimate: num(e.estimate),
      spent: num(e.spent),
      // Un chronomètre laissé tourner sur une tâche terminée n'a pas de sens.
      startedAt: isDoneCol(col) ? "" : iso(e.startedAt),
      learning: str(e.learning),
      notes: str(e.notes),
      createdAt: iso(e.createdAt),
      movedAt: iso(e.movedAt),
      // Une tâche sortie de « terminé » lors d'une session plus ancienne peut
      // avoir gardé un doneAt : la colonne fait foi.
      doneAt: isDoneCol(col) ? doneAt : "",
    });
  }

  return tasks;
}

/**
 * Déplace une tâche dans une liste, à une position précise.
 *
 * L'ordre d'affichage est celui du tableau `tasks` : pas de champ `order` à
 * maintenir, mais l'insertion doit se faire au bon index global. `beforeId`
 * désigne la tâche devant laquelle déposer ; `null` place en fin de liste.
 */
export function moveTask(
  tasks: Task[],
  taskId: string,
  toCol: ColumnId,
  beforeId: string | null,
  at: string = nowIso(),
): Task[] {
  const current = tasks.find((t) => t.id === taskId);
  if (!current) return tasks;
  // Déposer une tâche juste avant elle-même, c'est ne pas la déplacer.
  if (beforeId === taskId) return tasks;

  const moved = withColumn(current, toCol, at);
  const rest = tasks.filter((t) => t.id !== taskId);

  const target = beforeId ? rest.findIndex((t) => t.id === beforeId) : -1;
  if (target !== -1) {
    rest.splice(target, 0, moved);
    return rest;
  }

  // Fin de liste : juste après la dernière tâche de la colonne visée, sinon
  // en tête quand la colonne est vide.
  let last = -1;
  rest.forEach((t, i) => {
    if (t.col === toCol) last = i;
  });
  rest.splice(last + 1, 0, moved);
  return rest;
}

/** Critères de tri proposés dans le menu d'une liste. */
export type SortKey = "prio" | "date";

const PRIO_RANK: Record<Priority, number> = { high: 0, med: 1, low: 2 };

/** Les tâches sans échéance passent après celles qui en ont une. */
function byDate(a: Task, b: Task): number {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return a.date.localeCompare(b.date);
}

/**
 * Trie les tâches d'une seule liste, sans toucher aux autres : les positions
 * occupées dans le tableau global sont réutilisées telles quelles.
 */
export function sortColumn(tasks: Task[], colId: ColumnId, key: SortKey): Task[] {
  const slots: number[] = [];
  tasks.forEach((t, i) => {
    if (t.col === colId) slots.push(i);
  });
  if (slots.length < 2) return tasks;

  const sorted = slots
    .map((i) => tasks[i])
    .sort((a, b) =>
      key === "prio" ? PRIO_RANK[a.prio] - PRIO_RANK[b.prio] || byDate(a, b) : byDate(a, b),
    );

  const next = [...tasks];
  slots.forEach((pos, k) => {
    next[pos] = sorted[k];
  });
  return next;
}

const DAY_MS = 86_400_000;

/**
 * Délai création → clôture, en jours. `null` quand l'un des deux horodatages
 * manque : les tâches d'avant la mise en place du suivi ne doivent pas fausser
 * la moyenne.
 */
export function cycleTimeDays(t: Task): number | null {
  if (!t.createdAt || !t.doneAt) return null;
  const from = new Date(t.createdAt).getTime();
  const to = new Date(t.doneAt).getTime();
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
  return (to - from) / DAY_MS;
}

/** Médiane des délais de clôture — plus robuste qu'une moyenne sur peu de tâches. */
export function medianCycleDays(tasks: Task[]): number | null {
  const values = tasks
    .map(cycleTimeDays)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  if (values.length === 0) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

/** Tâches clôturées au cours des `days` derniers jours. */
export function closedSince(tasks: Task[], days: number, now: number = Date.now()): Task[] {
  const floor = now - days * DAY_MS;
  return tasks.filter((t) => {
    if (!t.doneAt) return false;
    const at = new Date(t.doneAt).getTime();
    return !Number.isNaN(at) && at >= floor;
  });
}

/**
 * Réaffecte les tâches d'une liste disparue vers « À trier », horodatage
 * compris.
 */
export function reassignColumn(tasks: Task[], from: ColumnId, to: ColumnId = INBOX_COL): Task[] {
  const at = nowIso();
  return tasks.map((t) => (t.col === from ? withColumn(t, to, at) : t));
}
