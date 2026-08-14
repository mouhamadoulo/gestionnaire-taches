import type { ColumnDef, Task } from "./types";

/** Sens de déplacement du curseur clavier. */
export type CursorDir = "up" | "down" | "left" | "right";

/** Première carte du tableau, en suivant l'ordre des listes à l'écran. */
function firstId(visible: Task[], columns: ColumnDef[]): string | null {
  for (const col of columns) {
    const hit = visible.find((t) => t.col === col.id);
    if (hit) return hit.id;
  }
  // Toutes les tâches visibles pointent vers des listes disparues.
  return visible[0]?.id ?? null;
}

/**
 * Carte suivante sous le curseur clavier.
 *
 * `visible` est la liste déjà filtrée par la recherche et les filtres : on ne
 * navigue que vers ce que l'utilisateur voit. L'ordre dans une colonne est
 * celui du tableau, comme à l'affichage.
 *
 * Rien ne boucle : arriver en bas d'une pile et continuer à marteler « j » ne
 * doit pas repartir en haut sans prévenir. Aux bords, le curseur ne bouge pas.
 */
export function nextCursor(
  visible: Task[],
  columns: ColumnDef[],
  cursor: string | null,
  dir: CursorDir,
): string | null {
  if (visible.length === 0) return null;

  const current = cursor ? visible.find((t) => t.id === cursor) : undefined;
  // Pas de curseur, ou il désigne une tâche filtrée ou supprimée.
  if (!current) return firstId(visible, columns);

  const inColumn = (colId: string) => visible.filter((t) => t.col === colId);
  const list = inColumn(current.col);
  const row = list.findIndex((t) => t.id === current.id);

  if (dir === "up" || dir === "down") {
    const next = row + (dir === "down" ? 1 : -1);
    return next < 0 || next >= list.length ? current.id : list[next].id;
  }

  const order = columns.map((c) => c.id);
  const from = order.indexOf(current.col);
  if (from === -1) return firstId(visible, columns);

  const step = dir === "right" ? 1 : -1;
  for (let i = from + step; i >= 0 && i < order.length; i += step) {
    const target = inColumn(order[i]);
    // Une liste vide n'est pas une étape : on l'enjambe.
    if (target.length === 0) continue;
    return target[Math.min(row, target.length - 1)].id;
  }
  return current.id;
}
