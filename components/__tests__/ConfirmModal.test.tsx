import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ConfirmDialog } from "@/lib/use-confirm";
import { ConfirmModal } from "../ConfirmModal";

function dialog(over: Partial<ConfirmDialog> = {}): ConfirmDialog {
  return {
    title: "Supprimer la liste ?",
    confirmLabel: "Confirmer",
    cancelLabel: "Annuler",
    tone: "default",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...over,
  };
}

describe("ConfirmModal", () => {
  it("ne rend rien sans demande en cours", () => {
    const { container } = render(<ConfirmModal dialog={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("affiche le titre, la conséquence et les deux boutons", () => {
    render(<ConfirmModal dialog={dialog({ body: "3 tâches repartiront dans « À trier »." })} />);

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Supprimer la liste ?")).toBeInTheDocument();
    expect(screen.getByText("3 tâches repartiront dans « À trier ».")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Annuler" })).toBeInTheDocument();
  });

  it("nomme la boîte par son titre", () => {
    render(<ConfirmModal dialog={dialog()} />);
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Supprimer la liste ?");
  });

  it("remonte la validation et l'annulation", async () => {
    const user = userEvent.setup();
    const d = dialog();
    render(<ConfirmModal dialog={d} />);

    await user.click(screen.getByRole("button", { name: "Confirmer" }));
    expect(d.onConfirm).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Annuler" }));
    expect(d.onCancel).toHaveBeenCalledOnce();
  });

  it("annule sur Échap et sur un clic hors de la boîte", async () => {
    const user = userEvent.setup();
    const d = dialog();
    const { rerender } = render(<ConfirmModal dialog={d} />);

    await user.keyboard("{Escape}");
    expect(d.onCancel).toHaveBeenCalledOnce();

    rerender(<ConfirmModal dialog={d} />);
    await user.click(screen.getByTestId("confirm-overlay"));
    expect(d.onCancel).toHaveBeenCalledTimes(2);
  });

  it("ne se referme pas sur un clic à l'intérieur", async () => {
    const user = userEvent.setup();
    const d = dialog();
    render(<ConfirmModal dialog={d} />);

    await user.click(screen.getByRole("dialog"));
    expect(d.onCancel).not.toHaveBeenCalled();
  });

  it("n'offre qu'un bouton en mode information", () => {
    render(<ConfirmModal dialog={dialog({ cancelLabel: null, confirmLabel: "Fermer" })} />);

    expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Annuler" })).not.toBeInTheDocument();
  });

  it("prend le focus sur le bouton le moins destructeur", async () => {
    // Une validation part à l'Entrée : le focus initial ne doit jamais être
    // posé sur le bouton qui détruit.
    const { unmount } = render(<ConfirmModal dialog={dialog({ tone: "danger" })} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Annuler" })).toHaveFocus());
    unmount();

    // En mode information, il ne reste que le bouton de fermeture.
    render(<ConfirmModal dialog={dialog({ cancelLabel: null, confirmLabel: "Fermer" })} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Fermer" })).toHaveFocus());
  });

  it("signale visuellement une action destructrice", () => {
    render(<ConfirmModal dialog={dialog({ tone: "danger", confirmLabel: "Supprimer" })} />);
    expect(screen.getByRole("button", { name: "Supprimer" })).toHaveClass("btn-danger");
  });

  it("garde le focus dans la boîte au Tab", async () => {
    const user = userEvent.setup();
    render(<ConfirmModal dialog={dialog()} />);

    const cancel = screen.getByRole("button", { name: "Annuler" });
    const confirm = screen.getByRole("button", { name: "Confirmer" });
    await waitFor(() => expect(cancel).toHaveFocus());

    await user.tab();
    expect(confirm).toHaveFocus();
    // Dernier élément : Tab revient au premier au lieu de sortir de la boîte.
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
  });
});
