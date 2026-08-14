import type { CategoryKey, Priority, Task } from "./types";
import { DONE_COLS } from "./constants";

/**
 * Filtres du tableau. Chaque liste est un « ou » interne (deux catégories
 * cochées = l'une ou l'autre) et un « et » entre critères, ce qui correspond à
 * la lecture spontanée : « les tâches perso ou maison, en priorité haute ».
 */
export interface Filters {
  cats: CategoryKey[];
  prios: Priority[];
  tags: string[];
  /** Échéance passée, tâche non terminée. */
  overdue: boolean;
}

export const EMPTY_FILTERS: Filters = { cats: [], prios: [], tags: [], overdue: false };

/** Nombre de critères actifs — sert au badge du bouton « Filtrer ». */
export function filterCount(f: Filters): number {
  return f.cats.length + f.prios.length + f.tags.length + (f.overdue ? 1 : 0);
}

export function hasFilters(f: Filters): boolean {
  return filterCount(f) > 0;
}

/** Ajoute ou retire une valeur d'une liste de critères. */
export function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * `today` est au format « AAAA-MM-JJ », vide tant que la page n'est pas
 * hydratée : le rendu serveur ne connaît pas le fuseau du navigateur, on
 * préfère ne rien marquer en retard plutôt que de risquer un écart d'un jour.
 */
export function isOverdue(t: Task, today: string): boolean {
  if (!today || !t.date) return false;
  if (DONE_COLS.includes(t.col)) return false;
  return t.date < today;
}

export function isDueToday(t: Task, today: string): boolean {
  if (!today || !t.date) return false;
  if (DONE_COLS.includes(t.col)) return false;
  return t.date === today;
}

/** Recherche plein texte : titre, description, tags. */
function matchesQuery(t: Task, q: string): boolean {
  if (!q) return true;
  return (
    t.title.toLowerCase().includes(q) ||
    (t.desc || "").toLowerCase().includes(q) ||
    (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
  );
}

export function matchesTask(t: Task, q: string, f: Filters, today: string): boolean {
  if (!matchesQuery(t, q)) return false;
  if (f.cats.length > 0 && !f.cats.includes(t.cat)) return false;
  if (f.prios.length > 0 && !f.prios.includes(t.prio)) return false;
  if (f.tags.length > 0 && !(t.tags || []).some((tag) => f.tags.includes(tag))) return false;
  if (f.overdue && !isOverdue(t, today)) return false;
  return true;
}

/** Tags présents dans le tableau, du plus utilisé au moins utilisé. */
export function collectTags(tasks: Task[]): string[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    for (const tag of t.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}

/** Retire des filtres les tags qui n'existent plus dans le tableau. */
export function pruneTags(f: Filters, available: string[]): Filters {
  const kept = f.tags.filter((t) => available.includes(t));
  return kept.length === f.tags.length ? f : { ...f, tags: kept };
}
