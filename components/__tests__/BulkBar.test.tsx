import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ColumnDef } from "@/lib/types";
import { BulkBar } from "../BulkBar";

const COLUMNS: ColumnDef[] = [
  { id: "todo", label: "À faire", hint: "", tint: "#3b82f6" },
  { id: "doing", label: "En cours", hint: "", tint: "#f59e0b" },
];

function setup(over: Partial<React.ComponentProps<typeof BulkBar>> = {}) {
  const props = {
    count: 3,
    columns: COLUMNS,
    tags: ["client", "urgent"],
    onMove: vi.fn(),
    onDelete: vi.fn(),
    onTag: vi.fn(),
    onClear: vi.fn(),
    ...over,
  };
  render(<BulkBar {...props} />);
  return props;
}

describe("BulkBar", () => {
  it("ne s'affiche pas sans sélection", () => {
    const { container } = render(
      <BulkBar
        count={0}
        columns={COLUMNS}
        tags={[]}
        onMove={vi.fn()}
        onDelete={vi.fn()}
        onTag={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("accorde le décompte", () => {
    setup({ count: 1 });
    expect(screen.getByText("1 tâche sélectionnée")).toBeInTheDocument();
  });

  it("accorde le décompte au pluriel", () => {
    setup({ count: 3 });
    expect(screen.getByText("3 tâches sélectionnées")).toBeInTheDocument();
  });

  it("propose chaque liste et remonte la destination choisie", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: /Déplacer vers/ }));
    await user.click(screen.getByRole("button", { name: "En cours" }));

    expect(props.onMove).toHaveBeenCalledWith("doing");
  });

  it("remonte la suppression et la désélection", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(props.onDelete).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Tout désélectionner" }));
    expect(props.onClear).toHaveBeenCalledOnce();
  });

  it("applique un tag saisi à la main", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: /tag/i }));
    await user.type(screen.getByRole("textbox"), "révision{Enter}");

    expect(props.onTag).toHaveBeenCalledWith("révision");
  });

  it("applique un tag existant en un clic", async () => {
    // Retaper un tag connu, c'est en créer un doublon à la faute de frappe près.
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: /tag/i }));
    await user.click(screen.getByRole("button", { name: "urgent" }));

    expect(props.onTag).toHaveBeenCalledWith("urgent");
  });

  it("ignore une saisie vide", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: /tag/i }));
    await user.type(screen.getByRole("textbox"), "   {Enter}");

    expect(props.onTag).not.toHaveBeenCalled();
  });

  it("referme les menus sur Échap sans vider la sélection", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: /Déplacer vers/ }));
    expect(screen.getByRole("button", { name: "En cours" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "En cours" })).not.toBeInTheDocument();
    // C'est le tableau, pas la barre, qui décide de vider la sélection.
    expect(props.onClear).not.toHaveBeenCalled();
  });
});
