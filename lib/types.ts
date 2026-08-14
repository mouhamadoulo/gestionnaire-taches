/**
 * Identifiant de colonne. Les sept colonnes livrées avec l'application gardent
 * leurs identifiants historiques ("inbox", "todo"…) ; les listes créées par
 * l'utilisateur reçoivent un identifiant généré ("c" + horodatage).
 */
export type ColumnId = string;

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
  hint: string;
  /** Teinte d'accent (halo, liseré, pastille, compteur). */
  tint: string;
  /**
   * Colonne structurelle référencée par les statistiques (à trier, planifié,
   * terminé, archivé) : renommable et déplaçable, mais pas supprimable.
   */
  locked?: boolean;
}

export type ViewId = "dashboard" | "board" | "calendar" | "analytics";

export type ThemeMode = "dark" | "light";
