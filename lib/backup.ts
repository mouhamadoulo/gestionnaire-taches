import type { ColumnDef, Task, TaskTemplate } from "./types";
import { sanitizeColumns } from "./columns";
import { sanitizeTasks } from "./tasks";
import { sanitizeTemplates } from "./templates";

/** Marqueur de format : évite d'avaler un JSON qui n'a rien à voir. */
const APP = "molotask";

/** Version du format d'export, à incrémenter si la structure change. */
export const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof APP;
  version: number;
  exportedAt: string;
  tasks: Task[];
  columns: ColumnDef[];
  /**
   * Modèles de tâches. Arrivé après le format 1 et laissé dedans : un champ
   * ignoré par une version plus ancienne coûte moins cher qu'un numéro de
   * format qui ferait refuser le fichier à cette version-là.
   */
  templates: TaskTemplate[];
}

export function buildBackup(
  tasks: Task[],
  columns: ColumnDef[],
  templates: TaskTemplate[],
): Backup {
  return {
    app: APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tasks,
    columns,
    templates,
  };
}

/** « molotask-2026-08-14.json ». */
export function backupFilename(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `molotask-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

/**
 * Relit un fichier d'export.
 *
 * Lève une erreur au message lisible : il est affiché tel quel à
 * l'utilisateur, qui vient peut-être de choisir le mauvais fichier.
 */
export function parseBackup(text: string): {
  tasks: Task[];
  columns: ColumnDef[];
  templates: TaskTemplate[];
} {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Ce fichier n'est pas du JSON valide.");
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Ce fichier ne ressemble pas à une sauvegarde MoloTask.");
  }

  const data = raw as Partial<Backup>;
  if (data.app !== APP) {
    throw new Error("Ce fichier ne ressemble pas à une sauvegarde MoloTask.");
  }
  if (typeof data.version === "number" && data.version > BACKUP_VERSION) {
    throw new Error(
      `Sauvegarde au format ${data.version}, plus récent que cette version de l'application (${BACKUP_VERSION}).`,
    );
  }

  const tasks = sanitizeTasks(data.tasks);
  const columns = sanitizeColumns(data.columns);
  const templates = sanitizeTemplates(data.templates);

  if (tasks.length === 0 && !Array.isArray(data.tasks)) {
    throw new Error("Sauvegarde illisible : aucune liste de tâches trouvée.");
  }

  return { tasks, columns, templates };
}

/** Déclenche le téléchargement d'un fichier construit en mémoire. */
export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
