import type { CategoryKey, ColumnDef, ColumnId, Priority, Repeat } from "./types";

/**
 * Colonnes livrées avec l'application. Elles servent de graine : dès la
 * première visite elles sont copiées dans l'état `columns` de `HomePage`, que
 * l'utilisateur peut ensuite renommer, réordonner et compléter.
 *
 * `locked` marque les colonnes dont l'identifiant est référencé en dur par les
 * statistiques (voir StatsBar, Dashboard, DONE_COLS) : on peut les renommer et
 * les déplacer, pas les supprimer.
 */
export const DEFAULT_COLS: ColumnDef[] = [
  { id: "inbox",  label: "📥 À trier",      tint: "#8b5cf6", locked: true, hint: "Tout capturer ici, trier plus tard" },
  { id: "todo",   label: "📋 À faire",      tint: "#3b82f6", hint: "Prêt à démarrer" },
  { id: "doing",  label: "⚡ En cours",      tint: "#f59e0b", hint: "Travail en cours" },
  { id: "review", label: "🔍 Vérification", tint: "#ec4899", hint: "Relecture, validation, attente retour" },
  { id: "sched",  label: "📅 Planifié",     tint: "#14b8a6", locked: true, hint: "Programmé à une date précise" },
  { id: "done",   label: "✅ Terminé",       tint: "#6366f1", locked: true, hint: "Fait — bien joué" },
  { id: "arch",   label: "🗄️ Archivé",      tint: "#64748b", locked: true, hint: "Hors du flux courant" },
];

/** Teintes proposées à la création d'une liste. */
export const COLUMN_TINTS = [
  "#8b5cf6", "#3b82f6", "#0ea5e9", "#14b8a6",
  "#22c55e", "#f59e0b", "#f97316", "#ef4444",
  "#ec4899", "#64748b",
] as const;

/** Teinte de repli quand une tâche pointe vers une colonne disparue. */
export const FALLBACK_TINT = "#64748b";

/** Colonne d'accueil : les tâches d'une liste supprimée y retournent. */
export const INBOX_COL = "inbox";

// Teintes choisies pour rester lisibles sur fond clair comme sur fond sombre
// (texte blanc sur la pastille, texte teinté sur fond pâle).
export const CAT_COLOR: Record<CategoryKey, string> = {
  travail: "#2563eb",
  perso:   "#db2777",
  projet:  "#7c3aed",
  etude:   "#d97706",
  sante:   "#059669",
  admin:   "#475569",
  finance: "#0d9488",
  maison:  "#ea580c",
};

export const CAT_LBL: Record<CategoryKey, string> = {
  travail: "💼 Travail",
  perso:   "🏷 Perso",
  projet:  "🚀 Projet",
  etude:   "📚 Étude",
  sante:   "🌿 Santé",
  admin:   "🗂 Admin",
  finance: "💳 Finance",
  maison:  "🏠 Maison",
};

export const CATEGORIES = Object.keys(CAT_LBL) as CategoryKey[];

/** Types de tâche proposés dans le formulaire. */
export const TASK_TYPES = [
  "Tâche",
  "Réunion",
  "Appel",
  "Rendez-vous",
  "Course",
  "Lecture",
  "Rappel",
  "Note",
] as const;

/** Périodicités proposées dans le formulaire. */
export const REPEAT_LBL: Record<Repeat, string> = {
  "":        "Ne se répète pas",
  daily:     "Chaque jour",
  weekly:    "Chaque semaine",
  monthly:   "Chaque mois",
  yearly:    "Chaque année",
};

/** Version courte, affichée sur la carte. */
export const REPEAT_SHORT: Record<Repeat, string> = {
  "":        "",
  daily:     "quotidien",
  weekly:    "hebdo",
  monthly:   "mensuel",
  yearly:    "annuel",
};

export const REPEATS = Object.keys(REPEAT_LBL) as Repeat[];

export const PRIORITIES: Priority[] = ["high", "med", "low"];

/** Colonnes considérées comme terminées — rétrospective + temps passé. */
export const DONE_COLS: ColumnId[] = ["done", "arch"];

/** Colonnes du travail actif. */
export const ACTIVE_COLS: ColumnId[] = ["todo", "doing", "review"];

export const STORAGE_KEY = "molotask_tasks";
export const COLUMNS_KEY = "molotask_columns";
export const TEMPLATES_KEY = "molotask_templates";
export const THEME_KEY = "molotask_theme";
export const SIDEBAR_KEY = "molotask_sidebar";
/** Rappels d'échéance : « on » / « off ». */
export const REMINDERS_KEY = "molotask_reminders";
/** `{ idTâche: jour }` des rappels déjà envoyés. */
export const NOTIFIED_KEY = "molotask_notified";
