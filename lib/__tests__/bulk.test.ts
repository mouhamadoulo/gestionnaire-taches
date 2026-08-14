import { describe, expect, it } from "vitest";

import { deleteTasks, moveTasks, tagTasks, withRecurrence } from "../tasks";
import { task } from "./factory";

const AT = "2026-08-14T10:00:00.000Z";
const ids = (list: { id: string }[]) => list.map((t) => t.id);

describe("withRecurrence", () => {
  const board = () => [
    task({ id: "a", col: "doing" }),
    task({ id: "b", col: "doing", repeat: "weekly", date: "2026-08-14" }),
    task({ id: "c", col: "todo" }),
  ];

  it("insère l'occurrence suivante à la place laissée par l'ancienne", () => {
    // Elle doit réapparaître là où l'utilisateur la cherchait, pas en bout de
    // tableau.
    const before = board()[1];
    const out = withRecurrence(board(), before, "done", AT, "2026-08-14");

    expect(out).toHaveLength(4);
    expect(out[1].id).not.toBe("b");
    expect(out[1]).toMatchObject({ col: "doing", repeat: "weekly", date: "2026-08-21" });
    expect(ids(out).slice(2)).toEqual(["b", "c"]);
  });

  it("ne fait rien pour une tâche ponctuelle", () => {
    const tasks = board();
    expect(withRecurrence(tasks, tasks[0], "done", AT, "2026-08-14")).toBe(tasks);
  });

  it("ne fait rien sans tâche de départ", () => {
    const tasks = board();
    expect(withRecurrence(tasks, undefined, "done", AT, "2026-08-14")).toBe(tasks);
  });

  it("ne fait rien quand la destination n'est pas une liste terminée", () => {
    const tasks = board();
    expect(withRecurrence(tasks, tasks[1], "review", AT, "2026-08-14")).toBe(tasks);
  });

  it("ne régénère pas une tâche déjà terminée qu'on archive", () => {
    // « Terminé » → « Archivé » n'est pas une nouvelle clôture.
    const done = task({ id: "d", col: "done", repeat: "weekly", date: "2026-08-14" });
    const tasks = [done];
    expect(withRecurrence(tasks, done, "arch", AT, "2026-08-14")).toBe(tasks);
  });
});

describe("moveTasks", () => {
  const board = () => [
    task({ id: "a", col: "todo" }),
    task({ id: "b", col: "doing" }),
    task({ id: "c", col: "todo" }),
    task({ id: "d", col: "review" }),
  ];

  it("regroupe le lot en fin de colonne cible, dans l'ordre du tableau", () => {
    const out = moveTasks(board(), ["c", "a"], "doing", null, AT);
    expect(ids(out)).toEqual(["b", "a", "c", "d"]);
    expect(out.filter((t) => t.col === "doing").map((t) => t.id)).toEqual(["b", "a", "c"]);
  });

  it("place le lot en tête quand la colonne cible est vide", () => {
    const out = moveTasks(board(), ["a", "b"], "sched", null, AT);
    expect(ids(out)).toEqual(["a", "b", "c", "d"]);
    expect(out.slice(0, 2).every((t) => t.col === "sched")).toBe(true);
  });

  it("horodate chaque tâche déplacée", () => {
    const out = moveTasks(board(), ["a"], "done", null, AT);
    expect(out.find((t) => t.id === "a")).toMatchObject({ movedAt: AT, doneAt: AT });
  });

  it("laisse intacte une tâche déjà dans la colonne cible", () => {
    const tasks = board();
    const out = moveTasks(tasks, ["b"], "doing", null, AT);
    expect(out.find((t) => t.id === "b")).toBe(tasks[1]);
  });

  it("ignore les identifiants inconnus et rend le tableau tel quel si rien ne bouge", () => {
    const tasks = board();
    expect(moveTasks(tasks, ["zzz"], "doing", null, AT)).toBe(tasks);
    expect(moveTasks(tasks, [], "doing", null, AT)).toBe(tasks);
  });

  it("dépose le lot d'un bloc devant la tâche visée", () => {
    // Glisser une sélection au milieu d'une colonne : le lot atterrit là où on
    // l'a lâché, pas en bout de liste.
    const out = moveTasks(board(), ["a", "c"], "review", "d", AT);
    expect(ids(out)).toEqual(["b", "a", "c", "d"]);
    expect(out.slice(1, 3).every((t) => t.col === "review")).toBe(true);
  });

  it("réordonne dans la même colonne sur un dépôt positionné", () => {
    const tasks = [
      task({ id: "a", col: "todo" }),
      task({ id: "b", col: "todo" }),
      task({ id: "c", col: "todo" }),
    ];
    expect(ids(moveTasks(tasks, ["b", "c"], "todo", "a", AT))).toEqual(["b", "c", "a"]);
  });

  it("retombe sur la fin de colonne si la cible fait partie du lot", () => {
    // « a » et « c » sont tout ce que contenait « todo » : une fois le lot
    // retiré, la colonne est vide et sa fin est le début du tableau.
    const out = moveTasks(board(), ["a", "c"], "todo", "a", AT);
    expect(ids(out)).toEqual(["a", "c", "b", "d"]);
  });

  it("régénère les tâches récurrentes terminées en lot", () => {
    // Terminer cinq tâches d'un coup ne doit pas perdre leur périodicité.
    const tasks = [
      task({ id: "a", col: "todo", repeat: "weekly", date: "2026-08-14" }),
      task({ id: "b", col: "todo" }),
    ];
    const out = moveTasks(tasks, ["a", "b"], "done", null, AT, "2026-08-14");

    const clones = out.filter((t) => t.id !== "a" && t.id !== "b");
    expect(clones).toHaveLength(1);
    expect(clones[0]).toMatchObject({ col: "todo", date: "2026-08-21", doneAt: "" });
  });
});

describe("deleteTasks", () => {
  const board = () => [task({ id: "a" }), task({ id: "b" }), task({ id: "c" })];

  it("retire tout le lot en une passe", () => {
    expect(ids(deleteTasks(board(), ["a", "c"]))).toEqual(["b"]);
  });

  it("rend le tableau tel quel quand rien ne correspond", () => {
    const tasks = board();
    expect(deleteTasks(tasks, ["zzz"])).toBe(tasks);
    expect(deleteTasks(tasks, [])).toBe(tasks);
  });
});

describe("tagTasks", () => {
  it("ajoute le tag à tout le lot", () => {
    const tasks = [task({ id: "a", tags: ["client"] }), task({ id: "b", tags: [] })];
    const out = tagTasks(tasks, ["a", "b"], "urgent");
    expect(out[0].tags).toEqual(["client", "urgent"]);
    expect(out[1].tags).toEqual(["urgent"]);
  });

  it("ne duplique pas un tag déjà porté", () => {
    const tasks = [task({ id: "a", tags: ["urgent"] })];
    const out = tagTasks(tasks, ["a"], "urgent");
    expect(out[0].tags).toEqual(["urgent"]);
  });

  it("nettoie le libellé et refuse un tag vide", () => {
    const tasks = [task({ id: "a", tags: [] })];
    expect(tagTasks(tasks, ["a"], "  urgent  ")[0].tags).toEqual(["urgent"]);
    expect(tagTasks(tasks, ["a"], "   ")).toBe(tasks);
  });

  it("ne touche pas aux tâches hors du lot", () => {
    const tasks = [task({ id: "a", tags: [] }), task({ id: "b", tags: [] })];
    const out = tagTasks(tasks, ["a"], "urgent");
    expect(out[1]).toBe(tasks[1]);
  });

  it("rend le tableau tel quel quand rien ne change", () => {
    const tasks = [task({ id: "a", tags: ["urgent"] })];
    expect(tagTasks(tasks, ["a"], "urgent")).toBe(tasks);
    expect(tagTasks(tasks, [], "urgent")).toBe(tasks);
  });
});
