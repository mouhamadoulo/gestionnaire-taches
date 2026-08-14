import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ColumnDef } from "@/lib/types";
import { task } from "@/lib/__tests__/factory";
import { ColumnTabs } from "../ColumnTabs";

const COLS: ColumnDef[] = [
  { id: "inbox", label: "À trier", hint: "", tint: "#b599ff", locked: true },
  { id: "todo", label: "À faire", hint: "", tint: "#7aa2ff" },
  { id: "done", label: "Terminé", hint: "", tint: "#14b8a6", locked: true },
];

function setup(over: Partial<React.ComponentProps<typeof ColumnTabs>> = {}) {
  const props = {
    columns: COLS,
    tasks: [
      task({ id: "a", col: "todo" }),
      task({ id: "b", col: "todo" }),
      task({ id: "c", col: "inbox" }),
    ],
    active: "inbox",
    onSelect: vi.fn(),
    onAdd: vi.fn(),
    ...over,
  };
  return { ...props, ...render(<ColumnTabs {...props} />) };
}

const chip = (name: RegExp) => screen.getByRole("button", { name });

describe("ColumnTabs", () => {
  it("montre une pastille par liste avec son décompte", () => {
    setup();
    expect(chip(/À faire/)).toHaveTextContent("2");
    expect(chip(/À trier/)).toHaveTextContent("1");
    expect(chip(/Terminé/)).toHaveTextContent("0");
  });

  it("compte ce qui est affiché, pas tout le tableau", () => {
    // `tasks` est déjà filtré par le Board : le compteur doit suivre la
    // recherche, sinon une liste annoncée « 07 » s'ouvre vide.
    setup({ tasks: [task({ id: "a", col: "todo" })] });
    expect(chip(/À trier/)).toHaveTextContent("0");
    expect(chip(/À faire/)).toHaveTextContent("1");
  });

  it("désigne la liste courante", () => {
    setup({ active: "todo" });
    expect(chip(/À faire/)).toHaveAttribute("aria-pressed", "true");
    expect(chip(/À trier/)).toHaveAttribute("aria-pressed", "false");
  });

  it("change de liste au clic", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(chip(/Terminé/));
    expect(props.onSelect).toHaveBeenCalledWith("done");
  });

  it("propose de créer une liste", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: /Créer une liste/ }));
    expect(props.onAdd).toHaveBeenCalled();
  });
});
