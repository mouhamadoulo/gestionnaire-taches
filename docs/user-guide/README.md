# Guide utilisateur — MoloTask

Visite guidée de l'application, écran par écran. Toutes les captures ont été prises
sur l'application réelle (Chromium, 1440 × 900) avec le jeu de tâches d'exemple.

| # | Écran | Ce qu'on y fait |
|---|---|---|
| 1 | [Tableau des tâches](01-tableau.md) | Voir et déplacer ses tâches dans les 7 colonnes |
| 2 | [Créer et modifier une tâche](02-taches.md) | Modale de saisie, édition, suppression, recherche |
| 3 | [Dashboard](03-dashboard.md) | Vue d'ensemble : flux, échéances, temps investi |
| 4 | [Calendrier](04-calendrier.md) | Échéances du mois, détail d'un jour |
| 5 | [Analytiques](05-analytiques.md) | Temps passé, écart d'estimation, classement |
| 6 | [Thème, menu et raccourcis](06-interface.md) | Clair / sombre, menu repliable, clavier |

## Le vocabulaire

| Terme | Sens dans MoloTask |
|---|---|
| **Colonne** | Étape du cycle de vie : `À trier`, `À faire`, `En cours`, `Vérification`, `Planifié`, `Terminé`, `Archivé` |
| **Catégorie** | Domaine de la tâche : Travail, Perso, Projet, Admin, Étude, Maison, Santé, Finance… |
| **Type** | Nature : Tâche, Note, Rendez-vous, Réunion, Lecture… |
| **Estimé / Passé** | Temps prévu à la création, temps réellement consommé une fois la tâche terminée |
| **Rétrospective** | Phrase de bilan affichée sur les cartes terminées ou archivées |

## Où sont les données

Rien n'est envoyé sur un serveur : les tâches, le thème et l'état du menu sont
stockés dans le `localStorage` du navigateur (`molotask_tasks`, `molotask_theme`,
`molotask_sidebar`). Vider les données du site remet le tableau à son jeu d'exemple.
