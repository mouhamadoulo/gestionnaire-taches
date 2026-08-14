import { describe, expect, it } from "vitest";

import {
  EMPTY_FILTERS,
  collectTags,
  filterCount,
  hasFilters,
  isDueToday,
  isOverdue,
  matchesTask,
  pruneTags,
  toggleIn,
  type Filters,
} from "../filters";
import { task } from "./factory";

const TODAY = "2026-08-14";
const filters = (over: Partial<Filters> = {}): Filters => ({ ...EMPTY_FILTERS, ...over });

describe("isOverdue / isDueToday", () => {
  it("repère une échéance dépassée et une échéance du jour", () => {
    expect(isOverdue(task({ date: "2026-08-13" }), TODAY)).toBe(true);
    expect(isOverdue(task({ date: "2026-08-14" }), TODAY)).toBe(false);
    expect(isDueToday(task({ date: "2026-08-14" }), TODAY)).toBe(true);
    expect(isDueToday(task({ date: "2026-08-13" }), TODAY)).toBe(false);
  });

  it("ne dit rien tant que la date du jour est inconnue", () => {
    // Avant hydratation le fuseau du navigateur n'est pas connu : mieux vaut
    // ne rien marquer que de se tromper d'un jour.
    expect(isOverdue(task({ date: "2020-01-01" }), "")).toBe(false);
    expect(isDueToday(task({ date: TODAY }), "")).toBe(false);
  });

  it("ne dit rien sur une tâche sans échéance", () => {
    expect(isOverdue(task(), TODAY)).toBe(false);
    expect(isDueToday(task(), TODAY)).toBe(false);
  });

  it("épargne les tâches terminées et archivées", () => {
    expect(isOverdue(task({ date: "2026-08-13", col: "done" }), TODAY)).toBe(false);
    expect(isOverdue(task({ date: "2026-08-13", col: "arch" }), TODAY)).toBe(false);
    expect(isDueToday(task({ date: TODAY, col: "done" }), TODAY)).toBe(false);
  });
});

describe("filterCount / hasFilters", () => {
  it("compte chaque critère actif", () => {
    expect(filterCount(EMPTY_FILTERS)).toBe(0);
    expect(hasFilters(EMPTY_FILTERS)).toBe(false);

    const f = filters({ cats: ["perso", "travail"], prios: ["high"], tags: ["urgent"], overdue: true });
    expect(filterCount(f)).toBe(5);
    expect(hasFilters(f)).toBe(true);
  });
});

describe("toggleIn", () => {
  it("ajoute puis retire, sans toucher au tableau d'origine", () => {
    const list = ["a"];
    expect(toggleIn(list, "b")).toEqual(["a", "b"]);
    expect(toggleIn(list, "a")).toEqual([]);
    expect(list).toEqual(["a"]);
  });
});

describe("matchesTask", () => {
  const t = task({
    title: "Relire le devis",
    desc: "Version envoyée par Léa",
    cat: "travail",
    prio: "high",
    tags: ["client", "urgent"],
    date: "2026-08-01",
  });

  it("cherche dans le titre, la description et les tags", () => {
    expect(matchesTask(t, "devis", EMPTY_FILTERS, TODAY)).toBe(true);
    expect(matchesTask(t, "léa", EMPTY_FILTERS, TODAY)).toBe(true);
    expect(matchesTask(t, "client", EMPTY_FILTERS, TODAY)).toBe(true);
    expect(matchesTask(t, "facture", EMPTY_FILTERS, TODAY)).toBe(false);
  });

  it("laisse tout passer sans recherche ni filtre", () => {
    expect(matchesTask(t, "", EMPTY_FILTERS, TODAY)).toBe(true);
  });

  it("traite chaque liste de critères comme un « ou »", () => {
    expect(matchesTask(t, "", filters({ cats: ["perso", "travail"] }), TODAY)).toBe(true);
    expect(matchesTask(t, "", filters({ cats: ["perso"] }), TODAY)).toBe(false);
    expect(matchesTask(t, "", filters({ prios: ["high", "low"] }), TODAY)).toBe(true);
    expect(matchesTask(t, "", filters({ prios: ["med"] }), TODAY)).toBe(false);
    expect(matchesTask(t, "", filters({ tags: ["urgent", "perso"] }), TODAY)).toBe(true);
    expect(matchesTask(t, "", filters({ tags: ["maison"] }), TODAY)).toBe(false);
  });

  it("combine les critères en « et »", () => {
    expect(matchesTask(t, "devis", filters({ cats: ["travail"], prios: ["high"] }), TODAY)).toBe(true);
    expect(matchesTask(t, "devis", filters({ cats: ["travail"], prios: ["low"] }), TODAY)).toBe(false);
  });

  it("filtre les retards, en s'alignant sur isOverdue", () => {
    expect(matchesTask(t, "", filters({ overdue: true }), TODAY)).toBe(true);
    expect(matchesTask(task({ date: "2026-12-01" }), "", filters({ overdue: true }), TODAY)).toBe(false);
    // Sans date du jour, le filtre « en retard » ne retient rien.
    expect(matchesTask(t, "", filters({ overdue: true }), "")).toBe(false);
  });
});

describe("collectTags", () => {
  it("classe du plus utilisé au moins utilisé, à égalité par ordre alphabétique", () => {
    const tasks = [
      task({ id: "a", tags: ["urgent", "client"] }),
      task({ id: "b", tags: ["urgent"] }),
      task({ id: "c", tags: ["urgent", "admin"] }),
      task({ id: "d", tags: ["client"] }),
    ];
    expect(collectTags(tasks)).toEqual(["urgent", "client", "admin"]);
  });

  it("rend une liste vide quand aucune tâche n'est étiquetée", () => {
    expect(collectTags([task(), task({ id: "b" })])).toEqual([]);
    expect(collectTags([])).toEqual([]);
  });
});

describe("pruneTags", () => {
  it("retire les tags qui n'existent plus dans le tableau", () => {
    const f = filters({ tags: ["urgent", "disparu"] });
    expect(pruneTags(f, ["urgent", "client"]).tags).toEqual(["urgent"]);
  });

  it("rend l'objet inchangé quand rien n'est à retirer", () => {
    // Identité préservée : l'état React ne doit pas se mettre à jour pour rien.
    const f = filters({ tags: ["urgent"] });
    expect(pruneTags(f, ["urgent", "client"])).toBe(f);
    expect(pruneTags(EMPTY_FILTERS, [])).toBe(EMPTY_FILTERS);
  });
});
