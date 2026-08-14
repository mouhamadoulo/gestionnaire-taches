import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ColumnDef } from "@/lib/types";
import { task } from "@/lib/__tests__/factory";
import { TaskCard } from "../TaskCard";

const COLS: ColumnDef[] = [
  { id: "inbox", label: "À trier", hint: "", tint: "#b599ff", locked: true },
  { id: "todo", label: "À faire", hint: "", tint: "#7aa2ff" },
  { id: "done", label: "Terminé", hint: "", tint: "#14b8a6", locked: true },
];

function setup(over: Partial<React.ComponentProps<typeof TaskCard>> = {}) {
  const props = {
    task: task({ id: "a", col: "todo", title: "Relire le devis" }),
    tint: "#3b82f6",
    today: "2026-08-14",
    columns: COLS,
    selected: false,
    selectionActive: false,
    cursor: false,
    onSelect: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleTimer: vi.fn(),
    onMoveTask: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    ...over,
  };
  return { ...props, ...render(<TaskCard {...props} />) };
}

const opener = () => screen.getByRole("button", { name: /Déplacer « Relire le devis »/ });

describe("TaskCard — déplacer sans glisser", () => {
  it("garde le menu fermé au repos", () => {
    setup();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(opener()).toHaveAttribute("aria-expanded", "false");
  });

  it("liste les destinations, sauf la liste courante", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(opener());
    expect(screen.getByRole("menuitem", { name: "À trier" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Terminé" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "À faire" })).toBeNull();
  });

  it("déplace vers la liste choisie, en fin de liste", async () => {
    // `beforeId` nul : sans pointeur, il n'y a pas de position d'insertion à
    // deviner — la carte va au bout, comme pour une action groupée.
    const user = userEvent.setup();
    const props = setup();

    await user.click(opener());
    await user.click(screen.getByRole("menuitem", { name: "Terminé" }));

    expect(props.onMoveTask).toHaveBeenCalledWith("a", "done", null);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("ne sélectionne pas la carte en ouvrant le menu", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(opener());
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it("ferme le menu avec Échap", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(opener());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
