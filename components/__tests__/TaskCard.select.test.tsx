import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { task } from "@/lib/__tests__/factory";
import { TaskCard } from "../TaskCard";

function setup(over: Partial<React.ComponentProps<typeof TaskCard>> = {}) {
  const props = {
    task: task({ id: "a", title: "Relire le devis" }),
    tint: "#3b82f6",
    today: "2026-08-14",
    selected: false,
    selectionActive: false,
    cursor: false,
    onSelect: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleTimer: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    ...over,
  };
  return { ...props, ...render(<TaskCard {...props} />) };
}

const box = () => screen.getByRole("checkbox", { name: /Sélectionner/ });

describe("TaskCard — sélection", () => {
  it("expose une case à cocher qui reflète l'état", () => {
    setup({ selected: true });
    expect(box()).toBeChecked();
  });

  it("coche la tâche depuis la case", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(box());
    expect(props.onSelect).toHaveBeenCalledWith("a", false);
  });

  it("ne déclenche ni édition ni suppression en cochant", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(box());
    expect(props.onEdit).not.toHaveBeenCalled();
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it("sélectionne au Ctrl+clic sur la carte", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.keyboard("{Control>}");
    await user.click(screen.getByRole("article"));
    await user.keyboard("{/Control}");

    expect(props.onSelect).toHaveBeenCalledWith("a", false);
  });

  it("demande une plage au Maj+clic", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.keyboard("{Shift>}");
    await user.click(screen.getByRole("article"));
    await user.keyboard("{/Shift}");

    expect(props.onSelect).toHaveBeenCalledWith("a", true);
  });

  it("ignore un clic nu sur la carte", async () => {
    // Le clic simple ne faisait rien jusqu'ici : il ne doit pas se mettre à
    // sélectionner par surprise.
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("article"));
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it("ne met que la carte courante dans l'ordre de tabulation", () => {
    // Sans tabulation mouvante, Tab traverserait les seize cartes du tableau.
    const { unmount } = setup({ cursor: false });
    expect(screen.getByRole("article")).toHaveAttribute("tabindex", "-1");
    unmount();

    setup({ cursor: true });
    expect(screen.getByRole("article")).toHaveAttribute("tabindex", "0");
  });

  it("prend le focus réel quand le curseur arrive sur elle", () => {
    setup({ cursor: true });
    expect(screen.getByRole("article")).toHaveFocus();
  });

  it("marque la carte sélectionnée", () => {
    // L'état accessible passe par la case à cocher (`aria-selected` n'est pas
    // valide sur un article) ; l'attribut de données ne sert qu'au style.
    setup({ selected: true });
    expect(screen.getByRole("article")).toHaveAttribute("data-selected", "true");
    expect(box()).toBeChecked();
  });
});
