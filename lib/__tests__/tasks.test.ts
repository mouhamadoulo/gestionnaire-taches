import { describe, expect, it } from "vitest";

import {
  closedSince,
  cycleTimeDays,
  elapsedMinutes,
  liveSpent,
  medianCycleDays,
  moveTask,
  nextOccurrence,
  reassignColumn,
  sanitizeTasks,
  shiftDate,
  sortColumn,
  startTimer,
  stepProgress,
  stopTimer,
  withColumn,
} from "../tasks";
import { task } from "./factory";

describe("shiftDate", () => {
  it("avance d'un jour et d'une semaine", () => {
    expect(shiftDate("2026-08-14", "daily")).toBe("2026-08-15");
    expect(shiftDate("2026-08-14", "weekly")).toBe("2026-08-21");
  });

  it("franchit les fins de mois et d'année", () => {
    expect(shiftDate("2026-08-31", "daily")).toBe("2026-09-01");
    expect(shiftDate("2026-12-28", "weekly")).toBe("2027-01-04");
    expect(shiftDate("2026-12-15", "monthly")).toBe("2027-01-15");
  });

  it("ramène le jour à la fin du mois quand il n'existe pas", () => {
    // Le 31 janvier décalé d'un mois tombe fin février, pas le 3 mars.
    expect(shiftDate("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(shiftDate("2028-01-31", "monthly")).toBe("2028-02-29");
    // Un 29 février annualisé retombe sur le 28.
    expect(shiftDate("2024-02-29", "yearly")).toBe("2025-02-28");
  });

  it("garde le quantième quand il existe dans le mois cible", () => {
    expect(shiftDate("2026-03-15", "monthly")).toBe("2026-04-15");
    expect(shiftDate("2026-03-15", "yearly")).toBe("2027-03-15");
  });

  it("rend la date inchangée si elle est vide, sans périodicité ou illisible", () => {
    expect(shiftDate("", "daily")).toBe("");
    expect(shiftDate("2026-08-14", "")).toBe("2026-08-14");
    expect(shiftDate("bientôt", "monthly")).toBe("bientôt");
    expect(shiftDate("2026-08-00", "monthly")).toBe("2026-08-00");
  });
});

describe("nextOccurrence", () => {
  const at = "2026-08-14T10:00:00.000Z";

  it("ne produit rien pour une tâche ponctuelle", () => {
    expect(nextOccurrence(task(), "todo", at)).toBeNull();
  });

  it("renvoie la tâche dans la liste d'où elle vient, avec un nouvel identifiant", () => {
    const next = nextOccurrence(task({ id: "t1", repeat: "weekly" }), "doing", at);
    expect(next?.col).toBe("doing");
    expect(next?.id).not.toBe("t1");
  });

  it("renvoie à « À trier » quand la tâche vient d'une liste terminée", () => {
    // Recréer une occurrence directement dans « Terminé » la rendrait invisible.
    expect(nextOccurrence(task({ repeat: "daily" }), "done", at)?.col).toBe("inbox");
    expect(nextOccurrence(task({ repeat: "daily" }), "arch", at)?.col).toBe("inbox");
  });

  it("repart d'une ardoise vierge", () => {
    const done = task({
      repeat: "monthly",
      spent: 120,
      startedAt: "2026-08-14T09:00:00.000Z",
      doneAt: "2026-08-14T10:00:00.000Z",
      learning: "trop long",
      notes: "voir avec Léa",
      steps: [
        { id: "s1", label: "Étape 1", done: true },
        { id: "s2", label: "Étape 2", done: false },
      ],
    });

    const next = nextOccurrence(done, "todo", at);

    expect(next).toMatchObject({
      spent: 0,
      startedAt: "",
      doneAt: "",
      learning: "",
      notes: "",
      createdAt: at,
      movedAt: at,
    });
    // Les étapes sont conservées mais décochées, avec des identifiants neufs.
    expect(next?.steps.map((s) => s.label)).toEqual(["Étape 1", "Étape 2"]);
    expect(next?.steps.every((s) => !s.done)).toBe(true);
    expect(next?.steps.map((s) => s.id)).not.toEqual(["s1", "s2"]);
  });

  it("avance l'échéance jusqu'à dépasser aujourd'hui", () => {
    // Une tâche hebdomadaire terminée avec six semaines de retard ne doit pas
    // être replanifiée à une date elle aussi dépassée.
    const late = task({ repeat: "weekly", date: "2026-07-01" });
    expect(nextOccurrence(late, "todo", at, "2026-08-14")?.date).toBe("2026-08-19");
  });

  it("ne décale que d'une période quand rien n'est en retard", () => {
    const t = task({ repeat: "weekly", date: "2026-08-14" });
    expect(nextOccurrence(t, "todo", at, "2026-08-14")?.date).toBe("2026-08-21");
  });

  it("laisse l'échéance vide quand la tâche n'en a pas", () => {
    expect(nextOccurrence(task({ repeat: "daily" }), "todo", at, "2026-08-14")?.date).toBe("");
  });
});

describe("chronomètre", () => {
  const start = "2026-08-14T10:00:00.000Z";
  const startMs = Date.parse(start);

  it("compte les minutes écoulées, arrondies", () => {
    expect(elapsedMinutes(task({ startedAt: start }), startMs + 90_000)).toBe(2);
    expect(elapsedMinutes(task({ startedAt: start }), startMs + 3_600_000)).toBe(60);
  });

  it("ne compte rien à l'arrêt, sur une date illisible ou un temps négatif", () => {
    expect(elapsedMinutes(task(), startMs)).toBe(0);
    expect(elapsedMinutes(task({ startedAt: "jamais" }), startMs)).toBe(0);
    expect(elapsedMinutes(task({ startedAt: start }), startMs - 60_000)).toBe(0);
  });

  it("ajoute le temps en cours au total déjà enregistré", () => {
    const t = task({ spent: 30, startedAt: start });
    expect(liveSpent(t, startMs + 600_000)).toBe(40);
    expect(liveSpent(task({ spent: 30 }), startMs)).toBe(30);
  });

  it("démarre une seule fois", () => {
    const stopped = task();
    expect(startTimer(stopped, start).startedAt).toBe(start);

    const running = task({ startedAt: start });
    expect(startTimer(running, "2026-08-14T11:00:00.000Z")).toBe(running);
  });

  it("verse le temps écoulé dans `spent` à l'arrêt", () => {
    const t = task({ spent: 15, startedAt: start });
    expect(stopTimer(t, startMs + 1_800_000)).toMatchObject({ spent: 45, startedAt: "" });
  });

  it("ne touche à rien quand le chronomètre est déjà arrêté", () => {
    const t = task({ spent: 15 });
    expect(stopTimer(t, startMs)).toBe(t);
  });
});

describe("stepProgress", () => {
  it("compte les étapes cochées", () => {
    const t = task({
      steps: [
        { id: "s1", label: "a", done: true },
        { id: "s2", label: "b", done: false },
        { id: "s3", label: "c", done: true },
      ],
    });
    expect(stepProgress(t)).toEqual({ done: 2, total: 3 });
  });

  it("rend un total nul sans checklist", () => {
    expect(stepProgress(task())).toEqual({ done: 0, total: 0 });
  });
});

describe("withColumn", () => {
  const at = "2026-08-14T10:00:00.000Z";

  it("ne fait rien quand la liste ne change pas", () => {
    const t = task({ col: "todo" });
    expect(withColumn(t, "todo", at)).toBe(t);
  });

  it("horodate chaque déplacement", () => {
    expect(withColumn(task({ col: "todo" }), "doing", at)).toMatchObject({
      col: "doing",
      movedAt: at,
      doneAt: "",
    });
  });

  it("pose `doneAt` à l'entrée dans une liste terminée", () => {
    expect(withColumn(task({ col: "doing" }), "done", at).doneAt).toBe(at);
    expect(withColumn(task({ col: "doing" }), "arch", at).doneAt).toBe(at);
  });

  it("garde la date de clôture d'origine en passant de « terminé » à « archivé »", () => {
    const done = task({ col: "done", doneAt: "2026-08-01T08:00:00.000Z" });
    expect(withColumn(done, "arch", at).doneAt).toBe("2026-08-01T08:00:00.000Z");
  });

  it("efface `doneAt` quand la tâche est rouverte", () => {
    // Une tâche rouverte ne doit plus compter comme terminée dans les stats.
    const done = task({ col: "done", doneAt: "2026-08-01T08:00:00.000Z" });
    expect(withColumn(done, "doing", at).doneAt).toBe("");
  });

  it("verse le chronomètre en cours dans `spent` quand la tâche est terminée", () => {
    const running = task({ col: "doing", spent: 10, startedAt: "2026-08-14T09:00:00.000Z" });
    expect(withColumn(running, "done", at)).toMatchObject({ spent: 70, startedAt: "" });
  });

  it("laisse tourner le chronomètre sur un déplacement ordinaire", () => {
    const running = task({ col: "todo", startedAt: "2026-08-14T09:00:00.000Z" });
    expect(withColumn(running, "doing", at).startedAt).toBe("2026-08-14T09:00:00.000Z");
  });
});

describe("sanitizeTasks", () => {
  it("rejette tout ce qui n'est pas un tableau", () => {
    expect(sanitizeTasks(null)).toEqual([]);
    expect(sanitizeTasks({ tasks: [] })).toEqual([]);
    expect(sanitizeTasks("[]")).toEqual([]);
  });

  it("écarte les entrées sans titre exploitable", () => {
    expect(sanitizeTasks([null, 3, "x", {}, { title: "   " }])).toEqual([]);
  });

  it("garde le premier exemplaire d'un identifiant dupliqué", () => {
    const out = sanitizeTasks([
      { id: "t1", title: "Premier" },
      { id: "t1", title: "Doublon" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("Premier");
  });

  it("génère un identifiant quand il manque", () => {
    expect(sanitizeTasks([{ title: "Sans id" }])[0].id).toBeTruthy();
  });

  it("remplace les valeurs hors domaine par des valeurs neutres", () => {
    const [t] = sanitizeTasks([{ title: "X", cat: "cuisine", prio: "urgente", repeat: "hourly" }]);
    expect(t).toMatchObject({ cat: "perso", prio: "med", repeat: "", col: "inbox", type: "Tâche" });
  });

  it("conserve les valeurs valides", () => {
    const [t] = sanitizeTasks([
      { title: "X", cat: "travail", prio: "high", repeat: "weekly", col: "doing", type: "Réunion" },
    ]);
    expect(t).toMatchObject({
      cat: "travail",
      prio: "high",
      repeat: "weekly",
      col: "doing",
      type: "Réunion",
    });
  });

  it("n'accepte comme durées que des nombres positifs, arrondis", () => {
    const [t] = sanitizeTasks([{ title: "X", estimate: 12.6, spent: -5 }]);
    expect(t).toMatchObject({ estimate: 13, spent: 0 });

    const [u] = sanitizeTasks([{ title: "X", estimate: "30", spent: Infinity }]);
    expect(u).toMatchObject({ estimate: 0, spent: 0 });
  });

  it("ne garde que des tags textuels", () => {
    const [t] = sanitizeTasks([{ title: "X", tags: ["ok", 3, null, "aussi"] }]);
    expect(t.tags).toEqual(["ok", "aussi"]);

    expect(sanitizeTasks([{ title: "X", tags: "perso" }])[0].tags).toEqual([]);
  });

  it("nettoie la checklist et regénère les identifiants manquants", () => {
    const [t] = sanitizeTasks([
      {
        title: "X",
        steps: [
          { id: "s1", label: "Garder", done: true },
          { label: "Sans id", done: "oui" },
          { label: "   " },
          "pas un objet",
        ],
      },
    ]);
    expect(t.steps).toHaveLength(2);
    expect(t.steps[0]).toEqual({ id: "s1", label: "Garder", done: true });
    // `done` n'est vrai que sur un vrai booléen ; l'identifiant est reconstruit.
    expect(t.steps[1]).toMatchObject({ label: "Sans id", done: false });
    expect(t.steps[1].id).toBeTruthy();
  });

  it("efface les horodatages illisibles plutôt que d'en inventer", () => {
    const [t] = sanitizeTasks([
      { title: "X", createdAt: "hier", movedAt: "", doneAt: "2026-08-14T10:00:00.000Z" },
    ]);
    expect(t).toMatchObject({ createdAt: "", movedAt: "", doneAt: "" });
  });

  it("fait foi de la colonne pour `doneAt` et le chronomètre", () => {
    const closed = "2026-08-14T10:00:00.000Z";

    // En liste terminée : la date de clôture est gardée, le chronomètre non.
    const [done] = sanitizeTasks([
      { title: "X", col: "done", doneAt: closed, startedAt: closed },
    ]);
    expect(done).toMatchObject({ doneAt: closed, startedAt: "" });

    // Hors liste terminée : un `doneAt` résiduel est effacé.
    const [open] = sanitizeTasks([
      { title: "X", col: "doing", doneAt: closed, startedAt: closed },
    ]);
    expect(open).toMatchObject({ doneAt: "", startedAt: closed });
  });
});

describe("moveTask", () => {
  const at = "2026-08-14T10:00:00.000Z";
  const board = () => [
    task({ id: "a", col: "todo" }),
    task({ id: "b", col: "todo" }),
    task({ id: "c", col: "doing" }),
  ];
  const ids = (list: ReturnType<typeof board>) => list.map((t) => t.id);

  it("ignore un identifiant inconnu", () => {
    const tasks = board();
    expect(moveTask(tasks, "zzz", "doing", null, at)).toBe(tasks);
  });

  it("traite le dépôt d'une tâche sur elle-même comme un non-déplacement", () => {
    const tasks = board();
    expect(moveTask(tasks, "a", "doing", "a", at)).toBe(tasks);
  });

  it("insère devant la tâche visée", () => {
    expect(ids(moveTask(board(), "b", "todo", "a", at))).toEqual(["b", "a", "c"]);
  });

  it("place en fin de liste quand aucune cible n'est donnée", () => {
    // Juste après la dernière tâche de la colonne visée, pas en fin de tableau.
    expect(ids(moveTask(board(), "a", "doing", null, at))).toEqual(["b", "c", "a"]);
  });

  it("place en tête quand la colonne visée est vide", () => {
    const out = moveTask(board(), "a", "review", null, at);
    expect(ids(out)).toEqual(["a", "b", "c"]);
    expect(out[0].col).toBe("review");
  });

  it("applique les horodatages du changement de liste", () => {
    const out = moveTask(board(), "a", "done", null, at);
    expect(out.find((t) => t.id === "a")).toMatchObject({ movedAt: at, doneAt: at });
  });

  it("ne modifie pas le tableau d'origine", () => {
    const tasks = board();
    moveTask(tasks, "a", "doing", null, at);
    expect(ids(tasks)).toEqual(["a", "b", "c"]);
    expect(tasks[0].col).toBe("todo");
  });
});

describe("sortColumn", () => {
  it("trie par priorité, l'échéance départageant les égalités", () => {
    const tasks = [
      task({ id: "a", col: "todo", prio: "low" }),
      task({ id: "b", col: "todo", prio: "high" }),
      task({ id: "c", col: "todo", prio: "med", date: "2026-09-01" }),
      task({ id: "d", col: "todo", prio: "med", date: "2026-08-01" }),
    ];
    expect(sortColumn(tasks, "todo", "prio").map((t) => t.id)).toEqual(["b", "d", "c", "a"]);
  });

  it("range les tâches sans échéance après celles qui en ont une", () => {
    const tasks = [
      task({ id: "a", col: "todo" }),
      task({ id: "b", col: "todo", date: "2026-09-01" }),
      task({ id: "c", col: "todo", date: "2026-08-01" }),
    ];
    expect(sortColumn(tasks, "todo", "date").map((t) => t.id)).toEqual(["c", "b", "a"]);
  });

  it("ne réutilise que les places déjà occupées par la colonne", () => {
    // « x » et « y » sont ailleurs : leur position dans le tableau ne bouge pas.
    const tasks = [
      task({ id: "x", col: "doing" }),
      task({ id: "a", col: "todo", date: "2026-09-01" }),
      task({ id: "y", col: "doing" }),
      task({ id: "b", col: "todo", date: "2026-08-01" }),
    ];
    expect(sortColumn(tasks, "todo", "date").map((t) => t.id)).toEqual(["x", "b", "y", "a"]);
  });

  it("ne fait rien en dessous de deux tâches", () => {
    const tasks = [task({ id: "a", col: "todo" }), task({ id: "b", col: "doing" })];
    expect(sortColumn(tasks, "todo", "prio")).toBe(tasks);
    expect(sortColumn(tasks, "review", "prio")).toBe(tasks);
  });
});

describe("délais de clôture", () => {
  it("mesure la création → clôture en jours", () => {
    const t = task({
      createdAt: "2026-08-10T00:00:00.000Z",
      doneAt: "2026-08-14T12:00:00.000Z",
    });
    expect(cycleTimeDays(t)).toBe(4.5);
  });

  it("refuse de deviner quand un horodatage manque ou est incohérent", () => {
    expect(cycleTimeDays(task({ doneAt: "2026-08-14T00:00:00.000Z" }))).toBeNull();
    expect(cycleTimeDays(task({ createdAt: "2026-08-14T00:00:00.000Z" }))).toBeNull();
    expect(cycleTimeDays(task({ createdAt: "hier", doneAt: "2026-08-14T00:00:00.000Z" }))).toBeNull();
    // Clôture antérieure à la création : donnée corrompue, pas un délai négatif.
    expect(
      cycleTimeDays(
        task({ createdAt: "2026-08-14T00:00:00.000Z", doneAt: "2026-08-10T00:00:00.000Z" }),
      ),
    ).toBeNull();
  });

  it("prend la médiane et ignore les tâches sans historique", () => {
    const closed = (days: number, id: string) =>
      task({
        id,
        createdAt: "2026-08-01T00:00:00.000Z",
        doneAt: new Date(Date.parse("2026-08-01T00:00:00.000Z") + days * 86_400_000).toISOString(),
      });

    expect(medianCycleDays([closed(1, "a"), closed(9, "b"), closed(2, "c")])).toBe(2);
    // Nombre pair : moyenne des deux valeurs centrales.
    expect(medianCycleDays([closed(1, "a"), closed(2, "b"), closed(4, "c"), closed(9, "d")])).toBe(3);
    expect(medianCycleDays([closed(4, "a"), task({ id: "b" })])).toBe(4);
    expect(medianCycleDays([task()])).toBeNull();
    expect(medianCycleDays([])).toBeNull();
  });
});

describe("closedSince", () => {
  const now = Date.parse("2026-08-14T00:00:00.000Z");

  it("ne garde que les tâches closes dans la fenêtre", () => {
    const tasks = [
      task({ id: "recent", doneAt: "2026-08-12T00:00:00.000Z" }),
      task({ id: "vieux", doneAt: "2026-07-01T00:00:00.000Z" }),
      task({ id: "ouvert" }),
      task({ id: "illisible", doneAt: "un jour" }),
    ];
    expect(closedSince(tasks, 7, now).map((t) => t.id)).toEqual(["recent"]);
  });
});

describe("reassignColumn", () => {
  it("rapatrie les tâches d'une liste supprimée et les horodate", () => {
    const tasks = [
      task({ id: "a", col: "c123" }),
      task({ id: "b", col: "todo" }),
      task({ id: "c", col: "c123" }),
    ];
    const out = reassignColumn(tasks, "c123");

    expect(out.map((t) => t.col)).toEqual(["inbox", "todo", "inbox"]);
    expect(out[0].movedAt).toBeTruthy();
    // Les autres tâches sont laissées strictement intactes.
    expect(out[1]).toBe(tasks[1]);
  });
});
