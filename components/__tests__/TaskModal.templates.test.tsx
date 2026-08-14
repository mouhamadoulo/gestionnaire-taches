import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ColumnDef, TaskTemplate } from "@/lib/types";
import { task } from "@/lib/__tests__/factory";
import { TaskModal } from "../TaskModal";

const COLS: ColumnDef[] = [
  { id: "inbox", label: "À trier", hint: "", tint: "#b599ff", locked: true },
  { id: "todo", label: "À faire", hint: "", tint: "#7aa2ff" },
];

const TPL: TaskTemplate = {
  id: "m1",
  name: "Revue hebdo",
  fields: {
    title: "Revue hebdomadaire",
    desc: "Points bloquants.",
    cat: "travail",
    type: "Rendez-vous",
    prio: "high",
    tags: ["reunion", "equipe"],
    steps: [{ id: "s1", label: "Relire les tickets", done: true }],
    repeat: "weekly",
    estimate: 45,
  },
};

function setup(over: Partial<React.ComponentProps<typeof TaskModal>> = {}) {
  const props = {
    open: true,
    editing: null,
    columns: COLS,
    defaultCol: "inbox",
    templates: [TPL],
    onClose: vi.fn(),
    onSave: vi.fn(),
    onSaveTemplate: vi.fn(),
    onDeleteTemplate: vi.fn(),
    ...over,
  };
  return { ...props, ...render(<TaskModal {...props} />) };
}

const title = () => screen.getByLabelText(/Titre/) as HTMLInputElement;
const estimate = () => screen.getByLabelText(/Temps estimé/) as HTMLInputElement;
const tags = () => screen.getByLabelText(/Tags/) as HTMLInputElement;

describe("TaskModal — modèles", () => {
  it("pré-remplit le formulaire depuis un modèle", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Revue hebdo" }));

    expect(title().value).toBe("Revue hebdomadaire");
    expect(estimate().value).toBe("45");
    expect(tags().value).toBe("reunion, equipe");
    expect(screen.getByDisplayValue("Relire les tickets")).toBeInTheDocument();
  });

  it("laisse l'échéance et la liste tranquilles", async () => {
    // Le modèle dit « quoi », pas « où ni quand » : la liste choisie en
    // ouvrant la modale doit survivre.
    const user = userEvent.setup();
    setup({ defaultCol: "todo" });

    await user.click(screen.getByRole("button", { name: "Revue hebdo" }));

    expect((screen.getByLabelText("Liste") as HTMLSelectElement).value).toBe("todo");
    expect((screen.getByLabelText("Échéance") as HTMLInputElement).value).toBe("");
  });

  it("décoche les étapes venues du modèle", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Revue hebdo" }));

    expect(screen.getByRole("checkbox", { name: /Relire les tickets/ })).not.toBeChecked();
  });

  it("enregistre un modèle avec le nom saisi", async () => {
    const user = userEvent.setup();
    const props = setup({ templates: [] });

    await user.type(title(), "Facture");
    await user.type(estimate(), "20");
    await user.click(screen.getByRole("button", { name: "Enregistrer comme modèle" }));
    await user.type(screen.getByLabelText("Nom du modèle"), "Facture mensuelle");
    await user.click(screen.getByRole("button", { name: "Enregistrer le modèle" }));

    expect(props.onSaveTemplate).toHaveBeenCalledWith(
      "Facture mensuelle",
      expect.objectContaining({ title: "Facture", estimate: 20 }),
    );
  });

  it("se rabat sur le titre quand le nom reste vide", async () => {
    const user = userEvent.setup();
    const props = setup({ templates: [] });

    await user.type(title(), "Sauvegarde");
    await user.click(screen.getByRole("button", { name: "Enregistrer comme modèle" }));
    await user.click(screen.getByRole("button", { name: "Enregistrer le modèle" }));

    expect(props.onSaveTemplate).toHaveBeenCalledWith("Sauvegarde", expect.anything());
  });

  it("refuse un modèle sans nom ni titre", async () => {
    const user = userEvent.setup();
    const props = setup({ templates: [] });

    await user.click(screen.getByRole("button", { name: "Enregistrer comme modèle" }));
    await user.click(screen.getByRole("button", { name: "Enregistrer le modèle" }));

    expect(props.onSaveTemplate).not.toHaveBeenCalled();
  });

  it("demande la suppression d'un modèle", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: /Supprimer le modèle/ }));
    expect(props.onDeleteTemplate).toHaveBeenCalledWith("m1");
  });

  it("ne propose pas de modèle pendant l'édition d'une tâche", () => {
    // Appliquer un modèle écraserait ce qu'on est venu modifier.
    setup({ editing: task({ id: "a", title: "Déjà là" }) });
    expect(screen.queryByRole("button", { name: "Revue hebdo" })).toBeNull();
  });
});
