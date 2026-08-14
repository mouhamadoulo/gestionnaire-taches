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

/** Périodicité d'une tâche récurrente ; chaîne vide = tâche ponctuelle. */
export type Repeat = "" | "daily" | "weekly" | "monthly" | "yearly";

/** Une étape de la checklist d'une tâche. */
export interface Step {
  id: string;
  label: string;
  done: boolean;
}

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
  /** Découpage de la tâche ; liste vide quand elle n'en a pas besoin. */
  steps: Step[];
  /** Périodicité : une nouvelle occurrence naît quand celle-ci est terminée. */
  repeat: Repeat;
  /** Temps estimé, en minutes. */
  estimate: number;
  /** Temps réellement passé, en minutes (tâches terminées / archivées). */
  spent: number;
  /**
   * Début du chronomètre en cours, en ISO 8601 ; chaîne vide à l'arrêt.
   * Persisté, donc un chronomètre survit à un rechargement de page.
   */
  startedAt: string;
  /** Rétrospective — ce qui a marché, ce qu'il faut changer. */
  learning: string;
  /** Notes libres (méthode, outils, blocages). */
  notes: string;

  /**
   * Horodatages techniques, en ISO 8601. Chaîne vide = inconnu : les tâches
   * créées avant l'introduction de ces champs n'ont pas d'historique, et on
   * préfère l'admettre plutôt que d'inventer une date. Tout ce qui les
   * consomme doit donc tester la valeur avant de l'utiliser.
   */
  /** Création de la tâche. */
  createdAt: string;
  /** Dernier changement de liste. */
  movedAt: string;
  /** Entrée dans une liste terminée ; remis à vide si la tâche en ressort. */
  doneAt: string;
}

/**
 * Ce que le formulaire renvoie : les champs saisissables, plus l'identifiant
 * en cas d'édition. Les horodatages sont posés par `HomePage`, jamais par le
 * formulaire.
 */
export type TaskDraft = Omit<
  Task,
  "id" | "createdAt" | "movedAt" | "doneAt" | "startedAt"
> & { id?: string };

/**
 * Modèle de tâche : la forme réutilisable d'une tâche qui revient souvent.
 *
 * `fields` ne porte que ce qui se répète. L'échéance, le temps passé et la
 * rétrospective appartiennent à une occurrence précise : les recopier
 * fabriquerait des tâches déjà datées et déjà commentées.
 */
export interface TaskTemplate {
  id: string;
  /** Nom affiché sur la pastille ; repli sur le titre à l'enregistrement. */
  name: string;
  fields: Pick<
    Task,
    "title" | "desc" | "cat" | "type" | "prio" | "tags" | "steps" | "repeat" | "estimate"
  >;
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
