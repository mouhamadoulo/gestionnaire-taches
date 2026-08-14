import type { Task } from "./types";
import { NOTIFIED_KEY, REMINDERS_KEY } from "./constants";
import { isDueToday, isOverdue } from "./filters";

/**
 * Rappels d'échéance par notification du navigateur.
 *
 * Portée volontairement modeste et à dire clairement à l'utilisateur : sans
 * service worker ni serveur, une notification ne part que si MoloTask est
 * ouvert. C'est un rappel pendant la session, pas une alarme.
 */
export type ReminderState = "unsupported" | "off" | "denied" | "on";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function readOptIn(): boolean {
  try {
    return localStorage.getItem(REMINDERS_KEY) === "on";
  } catch {
    return false;
  }
}

export function writeOptIn(on: boolean) {
  try {
    localStorage.setItem(REMINDERS_KEY, on ? "on" : "off");
  } catch {}
}

export function reminderState(optIn: boolean): ReminderState {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return optIn && Notification.permission === "granted" ? "on" : "off";
}

/** Demande l'autorisation ; renvoie l'état obtenu. */
export async function askPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/** Tâches à rappeler : échéance aujourd'hui ou dépassée, hors listes terminées. */
export function dueForReminder(tasks: Task[], today: string): Task[] {
  if (!today) return [];
  return tasks.filter((t) => isDueToday(t, today) || isOverdue(t, today));
}

/** `{ idTâche: jour }` — une tâche n'est rappelée qu'une fois par jour. */
function readNotified(): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "{}");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function writeNotified(map: Record<string, string>) {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Envoie un rappel pour les tâches dues qui n'en ont pas encore eu aujourd'hui.
 *
 * Un seul message groupé : quatre notifications empilées se font fermer sans
 * être lues. Renvoie le nombre de tâches annoncées.
 */
export function sendReminders(tasks: Task[], today: string): number {
  if (!today || reminderState(true) !== "on") return 0;

  const due = dueForReminder(tasks, today);
  const seen = readNotified();
  const fresh = due.filter((t) => seen[t.id] !== today);
  if (fresh.length === 0) return 0;

  const [first] = fresh;
  const body =
    fresh.length === 1
      ? first.title
      : `${first.title} et ${fresh.length - 1} autre${fresh.length > 2 ? "s" : ""}`;

  try {
    new Notification(
      fresh.length === 1 ? "Une tâche arrive à échéance" : `${fresh.length} tâches à échéance`,
      { body, tag: "molotask-echeances", icon: "/icon.svg" },
    );
  } catch {
    return 0;
  }

  // Purge au passage les tâches disparues, sinon la table enfle sans fin.
  const alive = new Set(tasks.map((t) => t.id));
  const next: Record<string, string> = {};
  for (const [id, day] of Object.entries(seen)) if (alive.has(id)) next[id] = day;
  for (const t of fresh) next[t.id] = today;
  writeNotified(next);

  return fresh.length;
}
