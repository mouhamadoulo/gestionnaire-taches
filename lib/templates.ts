import type {
  CategoryKey,
  ColumnId,
  Priority,
  Repeat,
  Step,
  TaskDraft,
  TaskTemplate,
} from "./types";
import { CATEGORIES, PRIORITIES, REPEATS } from "./constants";
import { newStepId } from "./tasks";

/** Champs qu'un modèle retient — le reste appartient à l'occurrence. */
type Fields = TaskTemplate["fields"];

/** Identifiant d'un modèle. */
export function newTemplateId(): string {
  return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Fabrique un modèle à partir de ce qu'on a sous la main — le formulaire en
 * cours de saisie, ou une tâche existante.
 *
 * Le nom sert d'étiquette sur la pastille ; laissé vide, le titre fait
 * l'affaire, ce qui évite d'imposer une saisie de plus.
 */
export function templateFrom(name: string, source: Fields | TaskDraft): TaskTemplate {
  const title = source.title.trim();
  return {
    id: newTemplateId(),
    name: name.trim() || title || "Modèle",
    fields: {
      title,
      desc: source.desc,
      cat: source.cat,
      type: source.type,
      prio: source.prio,
      tags: [...source.tags],
      steps: source.steps.map((s) => ({ ...s })),
      repeat: source.repeat,
      estimate: source.estimate,
    },
  };
}

/**
 * Déplie un modèle en brouillon de tâche, dans la colonne visée.
 *
 * Les étapes repartent décochées et avec des identifiants neufs, comme le
 * clone d'une tâche récurrente : deux tâches nées du même modèle ne doivent
 * rien partager.
 */
export function applyTemplate(template: TaskTemplate, col: ColumnId): TaskDraft {
  const f = template.fields;
  return {
    title: f.title,
    desc: f.desc,
    cat: f.cat,
    type: f.type,
    col,
    date: "",
    prio: f.prio,
    tags: [...f.tags],
    steps: f.steps.map((s) => ({ id: newStepId(), label: s.label, done: false })),
    repeat: f.repeat,
    estimate: f.estimate,
    spent: 0,
    learning: "",
    notes: "",
  };
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

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

/**
 * Relit les modèles stockés — même principe que `sanitizeColumns` et
 * `sanitizeTasks` : le contenu vient d'une session précédente ou d'un fichier
 * importé, on ne lui fait pas confiance.
 *
 * Un modèle sans titre reste valable : son nom suffit à le désigner, et il
 * pré-remplit alors tout sauf le titre.
 */
export function sanitizeTemplates(raw: unknown): TaskTemplate[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const out: TaskTemplate[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;

    const name = str(e.name).trim();
    if (!name) continue;

    const id = str(e.id) || newTemplateId();
    if (seen.has(id)) continue;
    seen.add(id);

    const f = (e.fields && typeof e.fields === "object" ? e.fields : {}) as Record<string, unknown>;
    const estimate = typeof f.estimate === "number" && f.estimate > 0 ? Math.round(f.estimate) : 0;

    out.push({
      id,
      name,
      fields: {
        title: str(f.title).trim(),
        desc: str(f.desc),
        cat: CATEGORIES.includes(f.cat as CategoryKey) ? (f.cat as CategoryKey) : "perso",
        type: str(f.type) || "Tâche",
        prio: PRIORITIES.includes(f.prio as Priority) ? (f.prio as Priority) : "med",
        tags: Array.isArray(f.tags) ? f.tags.filter((t): t is string => typeof t === "string") : [],
        steps: steps(f.steps),
        repeat: REPEATS.includes(f.repeat as Repeat) ? (f.repeat as Repeat) : "",
        estimate,
      },
    });
  }

  return out;
}

/** Retire un modèle. */
export function deleteTemplate(templates: TaskTemplate[], id: string): TaskTemplate[] {
  return templates.filter((t) => t.id !== id);
}
