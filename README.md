<div align="center">

# MoloTask

**Tableau Kanban pour piloter n'importe quelle tâche — travail, perso, projets, études.**

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Thème](https://img.shields.io/badge/th%C3%A8me-clair%20%2F%20sombre-ff6b35?style=flat-square)](docs/user-guide/06-interface.md)
[![Stockage](https://img.shields.io/badge/stockage-localStorage-8b5cf6?style=flat-square)](#données-et-persistance)
[![Statut](https://img.shields.io/badge/statut-en%20d%C3%A9veloppement-f59e0b?style=flat-square)](#feuille-de-route)

</div>

![Tableau des tâches MoloTask](docs/images/01-board-sombre.png)

---

## Ce que c'est

Un kanban à sept colonnes qui suit une tâche de son arrivée à son archivage :

```
À trier → À faire → En cours → Vérification → Planifié → Terminé → Archivé
```

Chaque tâche porte une catégorie, un type, une priorité, une échéance, des tags,
un temps estimé et — une fois terminée — un temps réellement passé et une note
rétrospective. C'est ce couple *estimé / passé* qui alimente la vue Analytiques.

## Fonctionnalités

| | |
|---|---|
| **Tableau kanban** | 7 colonnes, glisser-déposer entre colonnes, défilement horizontal à la molette, auto-scroll près des bords pendant un glisser |
| **Tâches** | création et édition en modale, catégorie, type, priorité, échéance, tags, temps estimé |
| **Recherche** | filtre instantané sur le titre, la description et les tags |
| **Dashboard** | flux des colonnes, prochaines échéances, retards, temps investi, répartition par catégorie |
| **Calendrier** | grille mensuelle des échéances + détail du jour sélectionné |
| **Analytiques** | temps passé, écart d'estimation, temps par mois et par catégorie, classement des tâches |
| **Interface** | thème clair / sombre, menu latéral repliable, raccourcis clavier |

## Démarrage

```bash
npm install     # première fois
npm run dev     # http://localhost:3000
```

Autres scripts :

```bash
npm run build   # build de production
npm run start   # sert le build
npm run lint    # ESLint (next lint)
```

> ⚠️ Ne pas lancer `npm run build` pendant que `npm run dev` tourne : le build écrase
> `.next` et le serveur de dev renvoie ensuite des 404 sur ses chunks JS. Redémarrer le
> serveur de dev après un build.

## Raccourcis

| Raccourci | Action |
|---|---|
| `Ctrl` / `⌘` + `N` | Nouvelle tâche |
| `Ctrl` / `⌘` + `B` | Replier / déplier le menu latéral |
| `Échap` | Fermer la modale |
| Molette sur le tableau | Défilement horizontal des colonnes |
| `Maj` + molette | Défilement horizontal forcé |

## Stack

- **Next.js 15** (App Router) · **React 19**
- **TypeScript** en mode strict
- **Tailwind CSS 3**, dont les couleurs pointent vers des variables CSS — un seul jeu
  d'utilitaires sert les deux thèmes

## Structure

```
app/
  layout.tsx          # HTML racine, polices, script anti-FOUC du thème
  page.tsx            # état des tâches, persistance, vue active, raccourcis
  globals.css         # jetons de thème (clair / sombre) + classes composant
components/
  Sidebar.tsx         # navigation repliable
  ThemeToggle.tsx     # bascule clair / sombre (icône, en haut à droite)
  TopBar.tsx          # titre, recherche, « Nouvelle tâche »
  StatsBar.tsx        # cinq compteurs dérivés des tâches
  Board.tsx           # conteneur horizontal, drag & drop, défilement
  Column.tsx          # une colonne du kanban
  TaskCard.tsx        # une carte
  TaskModal.tsx       # création / édition
  Dashboard.tsx  CalendarView.tsx  AnalyticsView.tsx
lib/
  types.ts  constants.ts  utils.ts  use-theme.ts  sample-data.ts
docs/
  images/             # captures d'écran
  user-guide/         # guide utilisateur
```

## Données et persistance

Tout vit dans le navigateur — pas de serveur, pas de compte.

| Clé `localStorage` | Contenu |
|---|---|
| `molotask_tasks` | la liste des tâches (JSON) |
| `molotask_theme` | `dark` ou `light` |
| `molotask_sidebar` | `collapsed` ou `expanded` |

Au premier lancement, le tableau est amorcé avec un jeu de tâches d'exemple
(`lib/sample-data.ts`).

## Guide utilisateur

Captures et description écran par écran : **[docs/user-guide](docs/user-guide/README.md)**

| Écran | Guide |
|---|---|
| Tableau des tâches | [01-tableau.md](docs/user-guide/01-tableau.md) |
| Créer et modifier une tâche | [02-taches.md](docs/user-guide/02-taches.md) |
| Dashboard | [03-dashboard.md](docs/user-guide/03-dashboard.md) |
| Calendrier | [04-calendrier.md](docs/user-guide/04-calendrier.md) |
| Analytiques | [05-analytiques.md](docs/user-guide/05-analytiques.md) |
| Thème, menu, raccourcis | [06-interface.md](docs/user-guide/06-interface.md) |

## Feuille de route

- [ ] Réordonnancement des cartes à l'intérieur d'une colonne
- [ ] Saisie du temps passé depuis la carte
- [ ] Export / import JSON des tâches
- [ ] Filtres par catégorie et par priorité
