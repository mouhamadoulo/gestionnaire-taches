import type { CategoryKey, ColumnDef, ColumnId } from "./types";

export const COLS: ColumnDef[] = [
  { id: "inbox",  label: "📥 À trier",     dotClass: "bg-violet-500",  barClass: "bg-violet-500",  hint: "Tout capturer ici, trier plus tard" },
  { id: "todo",   label: "📋 À faire",     dotClass: "bg-blue-500",    barClass: "bg-blue-500",    hint: "Prêt à démarrer" },
  { id: "doing",  label: "⚡ En cours",     dotClass: "bg-amber-500",   barClass: "bg-amber-500",   hint: "Travail en cours" },
  { id: "review", label: "🔍 Vérification", dotClass: "bg-pink-500",    barClass: "bg-pink-500",    hint: "Relecture, validation, attente retour" },
  { id: "sched",  label: "📅 Planifié",    dotClass: "bg-emerald-500", barClass: "bg-emerald-500", hint: "Programmé à une date précise" },
  { id: "done",   label: "✅ Terminé",      dotClass: "bg-indigo-500",  barClass: "bg-indigo-500",  hint: "Fait — bien joué" },
  { id: "arch",   label: "🗄️ Archivé",     dotClass: "bg-gray-500",    barClass: "bg-gray-500",    hint: "Hors du flux courant" },
];

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

/** Colonnes considérées comme terminées — rétrospective + temps passé. */
export const DONE_COLS: ColumnId[] = ["done", "arch"];

/** Colonnes du travail actif. */
export const ACTIVE_COLS: ColumnId[] = ["todo", "doing", "review"];

export const STORAGE_KEY = "molotask_tasks";
export const THEME_KEY = "molotask_theme";
export const SIDEBAR_KEY = "molotask_sidebar";
