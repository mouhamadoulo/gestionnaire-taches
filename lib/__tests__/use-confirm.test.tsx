import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useConfirm } from "../use-confirm";

describe("useConfirm", () => {
  it("n'affiche aucune boîte de dialogue au repos", () => {
    const { result } = renderHook(() => useConfirm());
    expect(result.current.dialog).toBeNull();
  });

  it("expose la demande en cours, avec ses libellés par défaut", () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      void result.current.ask({ title: "Supprimer ?" });
    });

    expect(result.current.dialog).toMatchObject({
      title: "Supprimer ?",
      confirmLabel: "Confirmer",
      cancelLabel: "Annuler",
      tone: "default",
    });
  });

  it("garde les libellés et le ton demandés", () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      void result.current.ask({
        title: "Supprimer la liste ?",
        body: "3 tâches repartiront dans « À trier ».",
        confirmLabel: "Supprimer",
        tone: "danger",
      });
    });

    expect(result.current.dialog).toMatchObject({
      body: "3 tâches repartiront dans « À trier ».",
      confirmLabel: "Supprimer",
      tone: "danger",
    });
  });

  it("résout à vrai sur confirmation et referme", async () => {
    const { result } = renderHook(() => useConfirm());

    let answer: Promise<boolean>;
    act(() => {
      answer = result.current.ask({ title: "Supprimer ?" });
    });
    act(() => result.current.dialog!.onConfirm());

    await expect(answer!).resolves.toBe(true);
    expect(result.current.dialog).toBeNull();
  });

  it("résout à faux sur annulation et referme", async () => {
    const { result } = renderHook(() => useConfirm());

    let answer: Promise<boolean>;
    act(() => {
      answer = result.current.ask({ title: "Supprimer ?" });
    });
    act(() => result.current.dialog!.onCancel());

    await expect(answer!).resolves.toBe(false);
    expect(result.current.dialog).toBeNull();
  });

  it("refuse la demande précédente plutôt que de la laisser en suspens", async () => {
    // Deux actions destructrices coup sur coup : la première promesse doit se
    // conclure, sinon son appelant reste bloqué pour toujours.
    const { result } = renderHook(() => useConfirm());

    let first: Promise<boolean>;
    let second: Promise<boolean>;
    act(() => {
      first = result.current.ask({ title: "Première" });
    });
    act(() => {
      second = result.current.ask({ title: "Seconde" });
    });

    await expect(first!).resolves.toBe(false);
    expect(result.current.dialog).toMatchObject({ title: "Seconde" });

    act(() => result.current.dialog!.onConfirm());
    await expect(second!).resolves.toBe(true);
  });

  it("conclut la demande en cours si le composant disparaît", async () => {
    const { result, unmount } = renderHook(() => useConfirm());

    let answer: Promise<boolean>;
    act(() => {
      answer = result.current.ask({ title: "Supprimer ?" });
    });
    unmount();

    await expect(answer!).resolves.toBe(false);
  });

  it("notify n'offre qu'un bouton et se conclut seul", async () => {
    const { result } = renderHook(() => useConfirm());

    let done: Promise<void>;
    act(() => {
      done = result.current.notify({ title: "Fichier illisible." });
    });

    expect(result.current.dialog).toMatchObject({ cancelLabel: null, confirmLabel: "Fermer" });

    act(() => result.current.dialog!.onConfirm());
    await expect(done!).resolves.toBeUndefined();
    expect(result.current.dialog).toBeNull();
  });

  it("garde des fonctions stables entre deux rendus", () => {
    // `ask` finit dans les dépendances des useCallback de HomePage : une
    // identité qui change à chaque rendu les invaliderait tous.
    const { result, rerender } = renderHook(() => useConfirm());
    const first = { ask: result.current.ask, notify: result.current.notify };

    rerender();

    expect(result.current.ask).toBe(first.ask);
    expect(result.current.notify).toBe(first.notify);
  });
});
