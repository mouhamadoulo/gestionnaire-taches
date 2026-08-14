import { describe, expect, it } from "vitest";

import type { TaskTemplate } from "../types";
import { applyTemplate, sanitizeTemplates, templateFrom } from "../templates";

const FIELDS: TaskTemplate["fields"] = {
  title: "Revue hebdo",
  desc: "Points bloquants, chiffres de la semaine.",
  cat: "travail",
  type: "Rendez-vous",
  prio: "high",
  tags: ["reunion"],
  steps: [{ id: "s1", label: "Relire les tickets", done: true }],
  repeat: "weekly",
  estimate: 60,
};

const tpl = (over: Partial<TaskTemplate> = {}): TaskTemplate => ({
  id: "m1",
  name: "Revue hebdo",
  fields: FIELDS,
  ...over,
});

describe("templateFrom", () => {
  it("retient les champs réutilisables d'un brouillon", () => {
    const t = templateFrom("Revue", {
      title: "Revue de mars",
      desc: "d",
      cat: "travail",
      type: "Rendez-vous",
      col: "todo",
      date: "2026-03-01",
      prio: "high",
      tags: ["reunion"],
      steps: [{ id: "s1", label: "Relire", done: true }],
      repeat: "weekly",
      estimate: 60,
      spent: 30,
      learning: "trop long",
      notes: "n",
    });

    expect(t.name).toBe("Revue");
    expect(t.fields.title).toBe("Revue de mars");
    expect(t.fields.estimate).toBe(60);
    // Ce qui appartient à l'occurrence, pas au modèle.
    expect(t.fields).not.toHaveProperty("date");
    expect(t.fields).not.toHaveProperty("col");
    expect(t.fields).not.toHaveProperty("spent");
    expect(t.fields).not.toHaveProperty("learning");
  });

  it("se rabat sur le titre quand le nom est vide", () => {
    const t = templateFrom("   ", { ...FIELDS, title: "Facture mensuelle" });
    expect(t.name).toBe("Facture mensuelle");
  });

  it("donne un identifiant à chaque modèle", () => {
    expect(templateFrom("a", FIELDS).id).not.toBe(templateFrom("b", FIELDS).id);
  });
});

describe("applyTemplate", () => {
  it("rend un brouillon complet posé dans la colonne demandée", () => {
    const draft = applyTemplate(tpl(), "doing");
    expect(draft.col).toBe("doing");
    expect(draft.title).toBe("Revue hebdo");
    expect(draft.prio).toBe("high");
    expect(draft.repeat).toBe("weekly");
    expect(draft.estimate).toBe(60);
  });

  it("laisse vide ce qui n'appartient qu'à l'occurrence", () => {
    const draft = applyTemplate(tpl(), "todo");
    expect(draft.date).toBe("");
    expect(draft.spent).toBe(0);
    expect(draft.learning).toBe("");
    expect(draft.notes).toBe("");
  });

  it("décoche les étapes et leur donne des identifiants neufs", () => {
    // Sans cela, deux tâches nées du même modèle partageraient leurs ids
    // d'étapes — et cocher l'une cocherait l'autre.
    const draft = applyTemplate(tpl(), "todo");
    expect(draft.steps).toHaveLength(1);
    expect(draft.steps[0].done).toBe(false);
    expect(draft.steps[0].id).not.toBe("s1");
    expect(applyTemplate(tpl(), "todo").steps[0].id).not.toBe(draft.steps[0].id);
  });

  it("ne partage pas les tableaux avec le modèle", () => {
    const source = tpl();
    const draft = applyTemplate(source, "todo");
    draft.tags.push("ajouté");
    expect(source.fields.tags).toEqual(["reunion"]);
  });
});

describe("sanitizeTemplates", () => {
  it("rend une liste vide pour tout ce qui n'est pas un tableau", () => {
    expect(sanitizeTemplates(undefined)).toEqual([]);
    expect(sanitizeTemplates({ name: "x" })).toEqual([]);
  });

  it("écarte les entrées sans nom ni champs exploitables", () => {
    expect(sanitizeTemplates([null, 3, {}, { name: "   " }])).toEqual([]);
  });

  it("écarte les identifiants dupliqués", () => {
    const out = sanitizeTemplates([tpl(), tpl({ name: "Copie" })]);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("Revue hebdo");
  });

  it("remet des valeurs neutres sur les champs douteux", () => {
    const out = sanitizeTemplates([
      {
        id: "m9",
        name: "Bancal",
        fields: {
          title: "Titre",
          cat: "inconnue",
          prio: "urgente",
          repeat: "chaque lune",
          estimate: -5,
          tags: ["ok", 3],
          steps: [{ label: "  " }, { label: "vraie" }],
        },
      },
    ]);

    expect(out).toHaveLength(1);
    expect(out[0].fields.cat).toBe("perso");
    expect(out[0].fields.prio).toBe("med");
    expect(out[0].fields.repeat).toBe("");
    expect(out[0].fields.estimate).toBe(0);
    expect(out[0].fields.tags).toEqual(["ok"]);
    expect(out[0].fields.steps).toHaveLength(1);
    expect(out[0].fields.steps[0].label).toBe("vraie");
  });

  it("accepte un modèle sans titre — le nom suffit à le désigner", () => {
    const out = sanitizeTemplates([{ id: "m2", name: "Vide", fields: {} }]);
    expect(out).toHaveLength(1);
    expect(out[0].fields.title).toBe("");
    expect(out[0].fields.type).toBe("Tâche");
  });
});
