export type ColumnId =
  | "inbox"
  | "todo"
  | "doing"
  | "review"
  | "sched"
  | "done"
  | "arch";

/** Catégorie de tâche — remplace l'ancienne notion de plateforme. */
export type CategoryKey =
  | "travail"
  | "perso"
  | "projet"
  | "etude"
  | "sante"
  | "admin"
  | "finance"
  | "maison";

export type Priority = "high" | "med" | "low";

export interface Task {
  id: string;
  col: ColumnId;
  title: string;
  desc: string;
  cat: CategoryKey;
  type: string;
  prio: Priority;
  date: string;
  tags: string[];
  /** Temps estimé, en minutes. */
  estimate: number;
  /** Temps réellement passé, en minutes (tâches terminées / archivées). */
  spent: number;
  /** Rétrospective — ce qui a marché, ce qu'il faut changer. */
  learning: string;
  /** Notes libres (méthode, outils, blocages). */
  notes: string;
}

export interface ColumnDef {
  id: ColumnId;
  label: string;
  dotClass: string;
  barClass: string;
  hint: string;
}

export type ViewId = "dashboard" | "board" | "calendar" | "analytics";

export type ThemeMode = "dark" | "light";
