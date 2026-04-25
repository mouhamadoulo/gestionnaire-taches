import type { ColumnDef, ColumnId, PlatformKey } from "./types";

export const COLS: ColumnDef[] = [
  { id: "ideas", label: "💡 Idées",        dotClass: "bg-violet-500", barClass: "bg-violet-500", hint: "Capturer toutes les idées ici" },
  { id: "plan",  label: "📋 Planification", dotClass: "bg-blue-500",   barClass: "bg-blue-500",   hint: "Recherche, script, angle en cours" },
  { id: "prod",  label: "🎬 Production",    dotClass: "bg-amber-500",  barClass: "bg-amber-500",  hint: "Tournage, rédaction, enregistrement" },
  { id: "edit",  label: "✂️ Montage",       dotClass: "bg-pink-500",   barClass: "bg-pink-500",   hint: "Montage, édition, relecture" },
  { id: "sched", label: "📅 Programmé",     dotClass: "bg-emerald-500",barClass: "bg-emerald-500",hint: "Prêt — en attente de publication" },
  { id: "pub",   label: "✅ Publié",        dotClass: "bg-indigo-500", barClass: "bg-indigo-500", hint: "Contenu en ligne" },
  { id: "arch",  label: "📊 Archive",       dotClass: "bg-gray-500",   barClass: "bg-gray-500",   hint: "Analyse & apprentissages" },
];

export const PLT_COLOR: Record<PlatformKey, string> = {
  youtube: "#FF0000",
  instagram: "#E1306C",
  tiktok: "#010101",
  blog: "#3b82f6",
  linkedin: "#0077b5",
  podcast: "#8b5cf6",
  twitter: "#1da1f2",
  facebook: "#1877f2",
};

export const PLT_LBL: Record<PlatformKey, string> = {
  youtube: "▶ YouTube",
  instagram: "◉ Instagram",
  tiktok: "♫ TikTok",
  blog: "✎ Blog",
  linkedin: "⧉ LinkedIn",
  podcast: "● Podcast",
  twitter: "𝕏 Twitter",
  facebook: "▣ Facebook",
};

export const PAST_COLS: ColumnId[] = ["pub", "arch"];

export const STORAGE_KEY = "cf_cards";
