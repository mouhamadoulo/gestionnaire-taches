import { describe, expect, it } from "vitest";

import { BACKUP_VERSION, backupFilename, buildBackup, parseBackup } from "../backup";
import { DEFAULT_COLS } from "../constants";
import { task } from "./factory";

describe("buildBackup", () => {
  it("estampille le format et embarque les données telles quelles", () => {
    const tasks = [task({ id: "a" })];
    const templates = [
      { id: "m1", name: "Revue", fields: { title: "Revue", desc: "", cat: "travail" as const, type: "Tâche", prio: "med" as const, tags: [], steps: [], repeat: "" as const, estimate: 0 } },
    ];
    const backup = buildBackup(tasks, DEFAULT_COLS, templates);

    expect(backup).toMatchObject({ app: "molotask", version: BACKUP_VERSION });
    expect(backup.tasks).toBe(tasks);
    expect(backup.columns).toBe(DEFAULT_COLS);
    expect(backup.templates).toBe(templates);
    expect(Number.isNaN(Date.parse(backup.exportedAt))).toBe(false);
  });
});

describe("backupFilename", () => {
  it("date le fichier, mois et jour sur deux chiffres", () => {
    expect(backupFilename(new Date(2026, 7, 14))).toBe("molotask-2026-08-14.json");
    expect(backupFilename(new Date(2026, 0, 5))).toBe("molotask-2026-01-05.json");
  });
});

describe("parseBackup", () => {
  const valid = JSON.stringify({
    app: "molotask",
    version: BACKUP_VERSION,
    exportedAt: "2026-08-14T10:00:00.000Z",
    tasks: [{ id: "a", title: "Relire" }],
    columns: [{ id: "todo", label: "À faire" }],
  });

  it("relit une sauvegarde complète en passant par les nettoyeurs", () => {
    const { tasks, columns } = parseBackup(valid);
    expect(tasks).toHaveLength(1);
    // Les champs absents du fichier reçoivent une valeur neutre.
    expect(tasks[0]).toMatchObject({ id: "a", title: "Relire", cat: "perso", prio: "med" });
    // Les colonnes structurelles manquantes sont réinsérées.
    expect(columns.some((c) => c.id === "done")).toBe(true);
  });

  it("refuse un fichier qui n'est pas du JSON", () => {
    expect(() => parseBackup("pas du json")).toThrow("Ce fichier n'est pas du JSON valide.");
  });

  it("refuse un JSON qui n'est pas un objet de sauvegarde", () => {
    const msg = "Ce fichier ne ressemble pas à une sauvegarde MoloTask.";
    expect(() => parseBackup("[]")).toThrow(msg);
    expect(() => parseBackup("null")).toThrow(msg);
    expect(() => parseBackup('"molotask"')).toThrow(msg);
  });

  it("refuse un fichier sans le marqueur de l'application", () => {
    // Un export d'un autre outil ne doit pas écraser le tableau.
    expect(() => parseBackup(JSON.stringify({ tasks: [], columns: [] }))).toThrow(
      "Ce fichier ne ressemble pas à une sauvegarde MoloTask.",
    );
    expect(() => parseBackup(JSON.stringify({ app: "trello", tasks: [] }))).toThrow(
      "Ce fichier ne ressemble pas à une sauvegarde MoloTask.",
    );
  });

  it("refuse un format plus récent que l'application", () => {
    const future = JSON.stringify({ app: "molotask", version: BACKUP_VERSION + 1, tasks: [] });
    expect(() => parseBackup(future)).toThrow(`Sauvegarde au format ${BACKUP_VERSION + 1}`);
  });

  it("accepte un format plus ancien", () => {
    const old = JSON.stringify({ app: "molotask", version: 0, tasks: [] });
    expect(parseBackup(old).tasks).toEqual([]);
  });

  it("refuse un fichier dépourvu de liste de tâches", () => {
    expect(() => parseBackup(JSON.stringify({ app: "molotask" }))).toThrow(
      "Sauvegarde illisible : aucune liste de tâches trouvée.",
    );
  });

  it("relit les modèles et les nettoie au passage", () => {
    const withTemplates = JSON.stringify({
      app: "molotask",
      tasks: [{ id: "a", title: "Relire" }],
      columns: [],
      templates: [
        { id: "m1", name: "Revue", fields: { title: "Revue", prio: "urgente" } },
        { name: "   " },
      ],
    });
    const { templates } = parseBackup(withTemplates);
    expect(templates).toHaveLength(1);
    expect(templates[0].fields.prio).toBe("med");
  });

  it("accepte une sauvegarde d'avant les modèles", () => {
    // Le champ est arrivé après coup : un fichier plus ancien reste lisible,
    // ce qui vaut mieux que de refuser la seule sauvegarde de l'utilisateur.
    expect(parseBackup(valid).templates).toEqual([]);
  });

  it("accepte un tableau vide, qui est un état légitime", () => {
    const empty = parseBackup(JSON.stringify({ app: "molotask", tasks: [], columns: [] }));
    expect(empty.tasks).toEqual([]);
    expect(empty.columns).toBe(DEFAULT_COLS);
  });
});
