import { describe, expect, it } from "vitest";

import { nextCursor } from "../board-cursor";
import type { ColumnDef } from "../types";
import { task } from "./factory";

const cols = (...ids: string[]): ColumnDef[] =>
  ids.map((id) => ({ id, label: id, hint: "", tint: "#000" }));

const COLUMNS = cols("todo", "doing", "review");

/** todo : a, b, c — doing : d — review : e, f */
const board = () => [
  task({ id: "a", col: "todo" }),
  task({ id: "d", col: "doing" }),
  task({ id: "b", col: "todo" }),
  task({ id: "e", col: "review" }),
  task({ id: "c", col: "todo" }),
  task({ id: "f", col: "review" }),
];

describe("nextCursor — amorçage", () => {
  it("rend null quand le tableau ne montre rien", () => {
    expect(nextCursor([], COLUMNS, null, "down")).toBeNull();
    expect(nextCursor([], COLUMNS, "a", "down")).toBeNull();
  });

  it("se pose sur la première carte de la première liste non vide", () => {
    expect(nextCursor(board(), COLUMNS, null, "down")).toBe("a");
    expect(nextCursor(board(), COLUMNS, null, "up")).toBe("a");
    expect(nextCursor(board(), cols("sched", "doing", "todo"), null, "down")).toBe("d");
  });

  it("se réamorce quand le curseur pointe une tâche disparue", () => {
    // Filtre appliqué, tâche supprimée : le curseur ne doit pas rester bloqué.
    expect(nextCursor(board(), COLUMNS, "zzz", "down")).toBe("a");
  });
});

describe("nextCursor — dans une colonne", () => {
  it("descend et remonte dans l'ordre d'affichage", () => {
    expect(nextCursor(board(), COLUMNS, "a", "down")).toBe("b");
    expect(nextCursor(board(), COLUMNS, "b", "down")).toBe("c");
    expect(nextCursor(board(), COLUMNS, "c", "up")).toBe("b");
  });

  it("ne boucle pas aux extrémités", () => {
    // Marteler « j » en bas de pile ne doit pas repartir en haut sans prévenir.
    expect(nextCursor(board(), COLUMNS, "c", "down")).toBe("c");
    expect(nextCursor(board(), COLUMNS, "a", "up")).toBe("a");
  });

  it("ne bouge pas dans une colonne d'une seule carte", () => {
    expect(nextCursor(board(), COLUMNS, "d", "down")).toBe("d");
    expect(nextCursor(board(), COLUMNS, "d", "up")).toBe("d");
  });
});

describe("nextCursor — d'une colonne à l'autre", () => {
  it("garde la hauteur de ligne", () => {
    expect(nextCursor(board(), COLUMNS, "a", "right")).toBe("d");
    expect(nextCursor(board(), cols("todo", "review"), "b", "right")).toBe("f");
  });

  it("se rabat sur la dernière carte quand la colonne visée est plus courte", () => {
    expect(nextCursor(board(), COLUMNS, "c", "right")).toBe("d");
  });

  it("enjambe les colonnes vides", () => {
    const columns = cols("todo", "sched", "review");
    expect(nextCursor(board(), columns, "a", "right")).toBe("e");
  });

  it("ne sort pas du tableau", () => {
    expect(nextCursor(board(), COLUMNS, "a", "left")).toBe("a");
    expect(nextCursor(board(), COLUMNS, "e", "right")).toBe("e");
  });

  it("revient en arrière symétriquement", () => {
    expect(nextCursor(board(), COLUMNS, "d", "left")).toBe("a");
    expect(nextCursor(board(), COLUMNS, "f", "left")).toBe("d");
  });

  it("se réamorce si la colonne du curseur n'existe plus", () => {
    // Liste supprimée dans une autre session : la tâche pointe dans le vide.
    const orphan = [task({ id: "x", col: "c999" }), ...board()];
    expect(nextCursor(orphan, COLUMNS, "x", "right")).toBe("a");
  });
});
