import type { Task } from "../types";

/**
 * Tâche complète et neutre, à surcharger champ par champ.
 *
 * Les tests portent presque tous sur un ou deux champs : passer par une usine
 * évite de recopier les quinze autres et rend visible ce qui compte vraiment
 * dans chaque cas.
 */
export function task(over: Partial<Task> = {}): Task {
  return {
    id: "t1",
    col: "todo",
    title: "Tâche",
    desc: "",
    cat: "perso",
    type: "Tâche",
    prio: "med",
    date: "",
    tags: [],
    steps: [],
    repeat: "",
    estimate: 0,
    spent: 0,
    startedAt: "",
    learning: "",
    notes: "",
    createdAt: "",
    movedAt: "",
    doneAt: "",
    ...over,
  };
}
