import { describe, expect, it } from "vitest";

import { fmtDate, fmtDays, fmtDuration, fmtNum } from "../utils";

describe("fmtNum", () => {
  it("abrège les milliers et les millions", () => {
    expect(fmtNum(0)).toBe("0");
    expect(fmtNum(999)).toBe("999");
    expect(fmtNum(1000)).toBe("1.0k");
    expect(fmtNum(1500)).toBe("1.5k");
    expect(fmtNum(999_999)).toBe("1000.0k");
    expect(fmtNum(2_500_000)).toBe("2.5M");
  });
});

describe("fmtDays", () => {
  it("évite le faux zéro sous la demi-journée", () => {
    expect(fmtDays(0)).toBe("moins d'un jour");
    expect(fmtDays(0.49)).toBe("moins d'un jour");
  });

  it("garde une décimale, virgule française, sous dix jours", () => {
    expect(fmtDays(0.5)).toBe("0,5 j");
    expect(fmtDays(1)).toBe("1 j");
    expect(fmtDays(3.46)).toBe("3,5 j");
  });

  it("arrondit à l'unité au-delà", () => {
    expect(fmtDays(12.4)).toBe("12 j");
    expect(fmtDays(30)).toBe("30 j");
  });
});

describe("fmtDuration", () => {
  it("marque l'absence de durée d'un tiret", () => {
    expect(fmtDuration(0)).toBe("—");
    expect(fmtDuration(-30)).toBe("—");
  });

  it("écrit les minutes seules, les heures rondes, puis heures et minutes", () => {
    expect(fmtDuration(45)).toBe("45min");
    expect(fmtDuration(120)).toBe("2h");
    expect(fmtDuration(200)).toBe("3h20");
    // Les minutes sont sur deux chiffres pour rester lisibles.
    expect(fmtDuration(61)).toBe("1h01");
  });
});

describe("fmtDate", () => {
  it("ne rend rien pour une date vide", () => {
    expect(fmtDate("")).toBe("");
  });

  it("abrège en jour + mois", () => {
    // Midi UTC : le quantième est le même sur tous les fuseaux courants, la
    // sortie exacte du mois abrégé dépendant elle de l'ICU de la plateforme.
    const out = fmtDate("2026-08-14T12:00:00.000Z");
    expect(out).toContain("14");
    expect(out).toMatch(/ao/i);
  });
});
