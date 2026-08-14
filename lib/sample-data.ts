import type { Task } from "./types";
import { isDoneCol } from "./tasks";

/** Les horodatages du jeu d'exemple sont dérivés de l'échéance. */
type SeedTask = Omit<Task, "createdAt" | "movedAt" | "doneAt" | "steps" | "startedAt"> & {
  steps?: [string, boolean][];
};

/** Date de création par défaut des tâches d'exemple sans échéance. */
const SEED_ORIGIN = "2026-08-10T09:00:00.000Z";

/**
 * Décale une date « AAAA-MM-JJ » de n jours et lui donne une heure fixe.
 *
 * Volontairement sans `Date.now()` : le jeu d'exemple sert d'état initial au
 * rendu serveur comme au rendu client, les deux doivent produire exactement
 * les mêmes chaînes.
 */
function shift(date: string, days: number, hour: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.toISOString().slice(0, 10)}T${hour}.000Z`;
}

function seed(t: SeedTask): Task {
  // Identifiants d'étape dérivés de la tâche : stables d'un rendu à l'autre,
  // contrairement à un Date.now() qui casserait l'hydratation.
  const steps = (t.steps || []).map(([label, done], i) => ({
    id: `${t.id}-s${i + 1}`,
    label,
    done,
  }));

  if (isDoneCol(t.col) && t.date) {
    const doneAt = shift(t.date, 0, "17:30:00");
    return {
      ...t,
      steps,
      startedAt: "",
      createdAt: shift(t.date, -14, "09:00:00"),
      movedAt: doneAt,
      doneAt,
    };
  }
  const createdAt = t.date ? shift(t.date, -7, "09:00:00") : SEED_ORIGIN;
  return { ...t, steps, startedAt: "", createdAt, movedAt: createdAt, doneAt: "" };
}

const SEED: SeedTask[] = [
  { id: "t1",  col: "inbox",  title: "Trier les photos de vacances",              desc: "Récupérer les cartes SD, supprimer les doublons, sauvegarder sur le NAS.", cat: "perso",   type: "Tâche",       prio: "low",  date: "",           tags: ["photos", "sauvegarde"],        estimate: 90,  spent: 0,   learning: "", notes: "" },
  { id: "t2",  col: "inbox",  title: "Comparer les offres d'assurance habitation", desc: "3 devis minimum, vérifier la franchise et les garanties dégâts des eaux.", cat: "admin",   type: "Tâche",       prio: "med",  date: "",           tags: ["assurance", "comparatif"],     estimate: 60,  spent: 0,   learning: "", notes: "" },
  { id: "t3",  col: "inbox",  title: "Idée : automatiser le rapport hebdo",        desc: "Script qui agrège les tickets fermés et envoie le résumé le vendredi.",    cat: "projet",  type: "Note",        prio: "low",  date: "",           tags: ["automatisation", "idée"],      estimate: 0,   spent: 0,   learning: "", notes: "" },

  { id: "t4",  col: "todo",   title: "Préparer la revue trimestrielle",            desc: "Slides chiffres Q2, points de blocage, plan Q3.",                          cat: "travail", type: "Tâche",       prio: "high", date: "2026-08-19", tags: ["reporting", "q3"],             estimate: 180, spent: 0,   learning: "", notes: "" },
  { id: "t5",  col: "todo",   title: "Renouveler le passeport",                    desc: "Prendre rendez-vous en mairie, photos d'identité, justificatif de domicile.", cat: "admin", type: "Rendez-vous", prio: "high", date: "2026-08-21", tags: ["papiers", "urgent"],           estimate: 120, spent: 0,   learning: "", notes: "", steps: [["Photos d'identité", true], ["Justificatif de domicile", true], ["Timbre fiscal", false], ["Rendez-vous en mairie", false]] },
  { id: "t6",  col: "todo",   title: "Chapitre 4 — cours de statistiques",         desc: "Lire le chapitre puis faire les 12 exercices de fin de partie.",           cat: "etude",   type: "Lecture",     prio: "med",  date: "2026-08-18", tags: ["stats", "révisions"],          estimate: 150, spent: 0,   learning: "", notes: "" },

  { id: "t7",  col: "doing",  title: "Migrer la base vers PostgreSQL 16",          desc: "Dump, test de restauration sur staging, plan de rollback écrit.",          cat: "travail", type: "Tâche",       prio: "high", date: "2026-08-17", tags: ["infra", "migration"],          estimate: 300, spent: 0,   learning: "", notes: "", steps: [["Dump de production", true], ["Restauration sur staging", true], ["Vérifier les extensions", false], ["Écrire le plan de rollback", false], ["Fenêtre de bascule", false]] },
  { id: "t8",  col: "doing",  title: "Repeindre le mur du salon",                  desc: "Sous-couche faite. Reste deux couches + finitions autour des prises.",     cat: "maison",  type: "Tâche",       prio: "med",  date: "2026-08-16", tags: ["travaux", "peinture"],         estimate: 240, spent: 0,   learning: "", notes: "" },

  { id: "t9",  col: "review", title: "Relire le contrat prestataire",              desc: "Vérifier clause de confidentialité et pénalités de retard avant signature.", cat: "travail", type: "Tâche",     prio: "high", date: "2026-08-15", tags: ["juridique", "contrat"],        estimate: 60,  spent: 0,   learning: "", notes: "" },

  { id: "t10", col: "sched",  title: "Bilan sanguin annuel",                       desc: "À jeun, laboratoire du centre, ordonnance dans le tiroir du bureau.",       cat: "sante",   type: "Rendez-vous", prio: "med",  date: "2026-08-25", tags: ["santé", "annuel"],             estimate: 45,  spent: 0,   learning: "", notes: "" },
  { id: "t11", col: "sched",  title: "Point mensuel avec l'équipe design",         desc: "Ordre du jour : refonte du parcours d'inscription.",                       cat: "travail", type: "Réunion",     prio: "med",  date: "2026-08-28", tags: ["équipe", "design"],            estimate: 60,  spent: 0,   learning: "", notes: "" },

  { id: "t12", col: "done",   title: "Déclarer les revenus 2025",                  desc: "Déclaration en ligne, pièces jointes envoyées, accusé archivé.",            cat: "finance", type: "Tâche",       prio: "high", date: "2026-06-04", tags: ["impôts", "annuel"],            estimate: 120, spent: 195, learning: "Rassembler les justificatifs au fil de l'année plutôt qu'en une fois.", notes: "Bloqué 40 min sur un justificatif introuvable." },
  { id: "t13", col: "done",   title: "Mettre en place la sauvegarde automatique",  desc: "Rsync nocturne vers le disque externe + alerte mail en cas d'échec.",       cat: "projet",  type: "Tâche",       prio: "med",  date: "2026-07-12", tags: ["backup", "automatisation"],    estimate: 90,  spent: 75,  learning: "Tester la restauration, pas seulement la sauvegarde.", notes: "cron + rsync, 30 lignes de script." },
  { id: "t14", col: "done",   title: "Séance kiné — série de 6",                   desc: "Programme d'exercices à poursuivre à la maison 3 fois par semaine.",        cat: "sante",   type: "Rendez-vous", prio: "med",  date: "2026-07-28", tags: ["dos", "rééducation"],          estimate: 180, spent: 180, learning: "Les exercices tenus au quotidien comptent plus que les séances.", notes: "6 séances de 30 min." },

  { id: "t15", col: "arch",   title: "Déménagement du bureau",                     desc: "Cartons, transporteur, réinstallation du poste de travail.",               cat: "maison",  type: "Tâche",       prio: "high", date: "2026-04-11", tags: ["déménagement"],                estimate: 480, spent: 720, learning: "Sous-estimé de 50 % : prévoir large sur tout ce qui implique des tiers.", notes: "Deux jours au lieu d'un. Transporteur en retard." },
  { id: "t16", col: "arch",   title: "Certification cloud — examen blanc",         desc: "Deux examens blancs passés, score final 82 %.",                            cat: "etude",   type: "Tâche",       prio: "low",  date: "2026-03-19", tags: ["certification", "cloud"],      estimate: 240, spent: 210, learning: "Les examens blancs valent plus que la relecture passive du cours.", notes: "2 × 90 min + correction." },
];

export const SAMPLE_TASKS: Task[] = SEED.map(seed);
