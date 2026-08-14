export function fmtDate(d: string): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function fmtNum(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return String(n);
}

/** Jours → "aujourd'hui", "1 j", "12 j", "3,5 j". */
export function fmtDays(d: number): string {
  if (d < 0.5) return "moins d'un jour";
  if (d < 10) {
    const rounded = Math.round(d * 10) / 10;
    return `${String(rounded).replace(".", ",")} j`;
  }
  return `${Math.round(d)} j`;
}

/** Minutes → "45min", "2h", "3h20". */
export function fmtDuration(min: number): string {
  if (!min || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}
