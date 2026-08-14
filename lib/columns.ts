import type { ColumnDef, ColumnId } from "./types";
import { DEFAULT_COLS, FALLBACK_TINT } from "./constants";

/** Identifiant d'une liste créée par l'utilisateur. */
export function newColumnId() {
  return "c" + Date.now();
}

/** Teinte d'une colonne, avec repli si la colonne n'existe plus. */
export function tintOf(columns: ColumnDef[], id: ColumnId) {
  return columns.find((c) => c.id === id)?.tint || FALLBACK_TINT;
}

/**
 * Relit les colonnes stockées dans localStorage.
 *
 * Le contenu vient d'une session précédente : on ne lui fait pas confiance.
 * Les entrées invalides sont écartées, les identifiants dupliqués aussi, le
 * drapeau `locked` est repris des colonnes par défaut, et toute colonne
 * verrouillée absente est réinsérée à sa place d'origine — sinon supprimer la
 * clé « terminé » casserait les statistiques.
 */
export function sanitizeColumns(raw: unknown): ColumnDef[] {
  if (!Array.isArray(raw)) return DEFAULT_COLS;

  const seen = new Set<string>();
  const cols: ColumnDef[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { id, label, hint, tint } = entry as Partial<ColumnDef>;
    if (typeof id !== "string" || !id || seen.has(id)) continue;
    if (typeof label !== "string" || !label.trim()) continue;
    seen.add(id);
    cols.push({
      id,
      label: label.trim(),
      hint: typeof hint === "string" ? hint : "",
      tint: typeof tint === "string" && tint ? tint : FALLBACK_TINT,
      locked: DEFAULT_COLS.some((d) => d.id === id && d.locked) || undefined,
    });
  }

  if (cols.length === 0) return DEFAULT_COLS;

  DEFAULT_COLS.forEach((def, i) => {
    if (!def.locked || seen.has(def.id)) return;
    cols.splice(Math.min(i, cols.length), 0, { ...def });
  });

  return cols;
}

/** Décale une colonne d'un cran (-1 à gauche, +1 à droite). */
export function moveColumn(columns: ColumnDef[], id: ColumnId, dir: -1 | 1): ColumnDef[] {
  const i = columns.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i === -1 || j < 0 || j >= columns.length) return columns;
  const next = [...columns];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
