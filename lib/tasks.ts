import type { CategoryKey, ColumnId, Priority, Task } from "./types";
import { CATEGORIES, DONE_COLS, INBOX_COL } from "./constants";

/** Horodatage courant, en ISO 8601. */
export function nowIso(): string {
  return new Date().toISOString();
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
  return {
    ...task,
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
      estimate: num(e.estimate),
      spent: num(e.spent),
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
