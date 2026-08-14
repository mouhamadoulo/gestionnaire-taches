import { describe, expect, it } from "vitest";

import { moveColumn, newColumnId, sanitizeColumns, tintOf } from "../columns";
import { DEFAULT_COLS, FALLBACK_TINT } from "../constants";

const LOCKED = DEFAULT_COLS.filter((c) => c.locked).map((c) => c.id);

describe("sanitizeColumns", () => {
  it("retombe sur les colonnes livrées quand le stockage est inutilisable", () => {
    expect(sanitizeColumns(null)).toBe(DEFAULT_COLS);
    expect(sanitizeColumns("[]")).toBe(DEFAULT_COLS);
    expect(sanitizeColumns({})).toBe(DEFAULT_COLS);
    // Un tableau dont rien n'est récupérable revient au même.
    expect(sanitizeColumns([null, { id: "x" }, { label: "Sans id" }])).toBe(DEFAULT_COLS);
  });

  it("écarte les entrées invalides et les identifiants dupliqués", () => {
    const cols = sanitizeColumns([
      { id: "todo", label: "À faire" },
      { id: "todo", label: "Doublon" },
      { id: 7, label: "Id numérique" },
      { id: "vide", label: "   " },
    ]);
    expect(cols.filter((c) => c.id === "todo")).toHaveLength(1);
    expect(cols.some((c) => c.label === "Doublon")).toBe(false);
    expect(cols.some((c) => c.id === "vide")).toBe(false);
  });

  it("normalise les champs manquants", () => {
    const cols = sanitizeColumns([{ id: "c1", label: "  Idées  " }]);
    const col = cols.find((c) => c.id === "c1");
    expect(col).toEqual({ id: "c1", label: "Idées", hint: "", tint: FALLBACK_TINT });
  });

  it("garde la teinte et l'indice fournis", () => {
    const cols = sanitizeColumns([{ id: "c1", label: "Idées", hint: "en vrac", tint: "#ff0000" }]);
    expect(cols.find((c) => c.id === "c1")).toMatchObject({ hint: "en vrac", tint: "#ff0000" });
  });

  it("reprend `locked` des colonnes livrées et ne le laisse pas s'inventer", () => {
    const cols = sanitizeColumns([
      { id: "c1", label: "Idées", locked: true },
      { id: "done", label: "Fini" },
    ]);
    expect(cols.find((c) => c.id === "c1")?.locked).toBeUndefined();
    expect(cols.find((c) => c.id === "done")?.locked).toBe(true);
  });

  it("réinsère toute colonne structurelle absente, à sa place d'origine", () => {
    // Supprimer « terminé » du stockage casserait les statistiques.
    const cols = sanitizeColumns([{ id: "todo", label: "À faire" }]);
    expect(cols.map((c) => c.id)).toEqual(["inbox", "todo", "sched", "done", "arch"]);
    LOCKED.forEach((id) => expect(cols.some((c) => c.id === id)).toBe(true));
  });

  it("laisse l'ordre choisi par l'utilisateur quand rien ne manque", () => {
    const stored = DEFAULT_COLS.map((c) => ({ ...c })).reverse();
    expect(sanitizeColumns(stored).map((c) => c.id)).toEqual(
      DEFAULT_COLS.map((c) => c.id).reverse(),
    );
  });

  it("accepte un renommage des colonnes structurelles", () => {
    const cols = sanitizeColumns([{ id: "done", label: "Livré", tint: "#00ff00" }]);
    expect(cols.find((c) => c.id === "done")).toMatchObject({
      label: "Livré",
      tint: "#00ff00",
      locked: true,
    });
  });
});

describe("moveColumn", () => {
  const cols = [
    { id: "a", label: "A", hint: "", tint: "#000" },
    { id: "b", label: "B", hint: "", tint: "#000" },
    { id: "c", label: "C", hint: "", tint: "#000" },
  ];

  it("échange avec la colonne voisine", () => {
    expect(moveColumn(cols, "b", -1).map((c) => c.id)).toEqual(["b", "a", "c"]);
    expect(moveColumn(cols, "b", 1).map((c) => c.id)).toEqual(["a", "c", "b"]);
  });

  it("ne fait rien aux extrémités ni sur une colonne inconnue", () => {
    expect(moveColumn(cols, "a", -1)).toBe(cols);
    expect(moveColumn(cols, "c", 1)).toBe(cols);
    expect(moveColumn(cols, "zzz", 1)).toBe(cols);
  });

  it("ne modifie pas le tableau d'origine", () => {
    moveColumn(cols, "b", -1);
    expect(cols.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });
});

describe("tintOf", () => {
  it("rend la teinte de la colonne, ou le repli si elle a disparu", () => {
    expect(tintOf(DEFAULT_COLS, "done")).toBe("#6366f1");
    expect(tintOf(DEFAULT_COLS, "colonne-supprimée")).toBe(FALLBACK_TINT);
  });
});

describe("newColumnId", () => {
  it("produit un identifiant préfixé, distinct de ceux des colonnes livrées", () => {
    const id = newColumnId();
    expect(id).toMatch(/^c\d+$/);
    expect(DEFAULT_COLS.some((c) => c.id === id)).toBe(false);
  });
});
