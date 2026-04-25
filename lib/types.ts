export type ColumnId =
  | "ideas"
  | "plan"
  | "prod"
  | "edit"
  | "sched"
  | "pub"
  | "arch";

export type PlatformKey =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "blog"
  | "linkedin"
  | "podcast"
  | "twitter"
  | "facebook";

export type Priority = "high" | "med" | "low";

export interface Card {
  id: string;
  col: ColumnId;
  title: string;
  desc: string;
  plt: PlatformKey;
  type: string;
  prio: Priority;
  date: string;
  tags: string[];
  views: number;
  likes: number;
  learning: string;
  prodNotes: string;
}

export interface ColumnDef {
  id: ColumnId;
  label: string;
  dotClass: string;
  barClass: string;
  hint: string;
}
