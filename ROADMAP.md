# ROADMAP — MoloTask

Pistes d'évolution identifiées à partir de l'état du code (branche `feat/listes-personnalisees`).
Les tiers sont classés par impact, pas par difficulté.

**Ordre d'attaque conseillé : 1 → 2 → 4 → 3 → 5 → 7.**
Les horodatages passent en premier parce que chaque jour d'attente est de l'historique
définitivement perdu.

> **État — Tier 1 livré** sur la branche `feat/tier-1-foundations`, dans l'ordre
> 1 → 4 → 2 → 3 (l'annulation avant l'export/import, pour que l'import soit lui aussi
> annulable).
>
> **Tier 2 livré** sur `feat/tier-2-daily-use` (items 5 à 9).
>
> **Tier 3 en cours** sur `feat/tier-3-finition`, dans l'ordre 12 → 10 → 13 → 11. Restent les
> modèles de tâches (14) et le PWA (15).

---

## Tier 1 — Manques structurels ✅

Ces quatre points coûtent peu maintenant et cher plus tard.

### 1. Horodatages sur `Task` — fait

**Constat** — `lib/types.ts` ne porte aucune date technique : ni `createdAt`, ni `movedAt`,
ni `doneAt`. Seul `date` (l'échéance saisie par l'utilisateur) existe.

**Conséquence** — impossible de calculer une vélocité, un cycle time, un burndown, ou même
« ce qui a été terminé cette semaine ». `AnalyticsView` plafonne à des totaux statiques.

**Livré** — `createdAt` / `movedAt` / `doneAt` sur `Task`, posés par `withColumn`
(`lib/tasks.ts`) à chaque changement de liste. Une chaîne vide signifie « inconnu » : les tâches
d'avant le suivi ne sont pas datées après coup, elles sont exclues des calculs.
`sanitizeTasks` reprend le principe de `sanitizeColumns`. La vue Analytiques gagne un bloc
**Rythme** (clôtures à 7 et 30 jours, délai médian création → clôture).

### 2. Export / import JSON — fait

**Constat** — toutes les données vivent dans `localStorage` (`molotask_tasks`,
`molotask_columns`). Aucune sortie de secours.

**Conséquence** — vider le cache du navigateur, changer de machine ou passer en navigation
privée efface tout, sans avertissement.

**Livré** — section « Données » dans `Sidebar`. L'export produit
`molotask-AAAA-MM-JJ.json` ; l'import vérifie le marqueur de format, refuse une version plus
récente, repasse par `sanitizeTasks` / `sanitizeColumns`, et le remplacement complet est
annulable (voir 4).

### 3. Ordre manuel dans une colonne — fait

**Constat** — `handleMove` (`app/page.tsx:98`) ne modifie que `t.col`. La position d'une carte
est celle de son index dans le tableau `tasks`.

**Conséquence** — pas de glisser-déposer vertical, pas de tri par priorité ou par échéance,
pas de « remonter en haut de la pile ».

**Livré** — sans champ `order` : `Column` calcule le point d'insertion à partir du curseur,
affiche un trait teinté, et transmet un `beforeId` que `moveTask` utilise pour réinsérer la
tâche au bon index global. Le menu d'une liste gagne « Trier par priorité » et
« Trier par échéance ».

### 4. Annulation (undo) — fait

**Constat** — `handleDelete` (`app/page.tsx:92`) et `handleDeleteCol` (`app/page.tsx:149`)
s'appuient sur un `confirm()` natif, puis la perte est sèche.

**Conséquence** — un clic de trop détruit une tâche ou renvoie toute une liste dans « À trier »
sans retour possible.

**Livré** — instantané de `{ tasks, columns }` avant chaque action destructrice, proposé
7 secondes dans `UndoToast` et par `Ctrl/⌘+Z`. Couvre la suppression de tâche, celle de liste,
un tri et un import. La confirmation à la suppression d'une tâche a disparu : le geste est
réversible, la boîte de dialogue ne servait plus qu'à être validée sans être lue.

---

## Tier 2 — Usage quotidien ✅

### 5. Filtres — fait

Panneau « Filtrer » dans `TopBar` : catégories, priorités, tags réellement présents (les 18 plus
utilisés) et bascule « En retard ». Les critères se cumulent en « ou » dans un groupe, en « et »
entre groupes. Le compteur « n sur m affichées » et le badge « n en retard » complètent la barre ;
une colonne vidée par un filtre le dit au lieu de proposer d'ajouter une tâche.

### 6. Sous-tâches / checklist — fait

`Task.steps` (`{ id, label, done }[]`), éditable dans `TaskModal` — Entrée valide et ouvre l'étape
suivante, Retour arrière sur une ligne vide la supprime. La carte affiche l'avancement et une
barre qui passe au vert une fois la liste finie.

### 7. Chronomètre — fait

`Task.startedAt` plus un bouton lecture/arrêt sur les cartes non terminées. Le total se rafraîchit
sur la carte, survit à un rechargement, et un seul chronomètre tourne à la fois. Terminer une
tâche arrête le sien et verse le temps dans `spent`.

### 8. Tâches récurrentes — fait

`Task.repeat` (quotidien, hebdomadaire, mensuel, annuel). Terminer une occurrence en crée une
nouvelle à la place laissée, dans la liste d'origine, remise à zéro. Le décalage d'échéance borne
au dernier jour du mois et avance jusqu'à dépasser aujourd'hui.

### 9. Rappels d'échéance — fait

Bascule « Rappels » dans la barre latérale : une notification groupée pour les tâches dues ou en
retard, au plus une fois par jour et par tâche. **Limite assumée** : sans service worker ni
serveur, un rappel ne part que si MoloTask est ouvert — l'infobulle le dit. Un vrai rappel hors
session dépend du PWA (15) ou d'un serveur (16).

---

## Tier 3 — Finition

### 10. Sélection multiple et actions groupées — fait
Case au survol, `Ctrl/⌘+clic`, `Maj+clic` pour une plage (dans une seule colonne). `BulkBar`
déplace, tague ou supprime le lot ; glisser une carte du lot emmène tout. Pas de confirmation :
`UndoToast` est le filet.

### 11. Responsive mobile — fait
Point de rupture unique, `md` (768 px). En dessous : barre latérale en tiroir (bouton `☰` flottant,
voile, Échap), sélecteur de listes en pastilles (`ColumnTabs`) et une seule colonne pleine largeur,
menu « Déplacer vers » sur la carte à la place du glisser-déposer — inexistant au tactile — cases à
cocher toujours visibles, barres de stats et classement en défilement latéral plutôt qu'écrasés.
Les trois autres vues ont reçu la même passe (paddings, titres, grille du calendrier).

### 12. Modales internes au lieu de `confirm()` — fait
`useConfirm` + `ConfirmModal` : `ask()` rend une promesse, `notify()` remplace `alert()`. Les
dialogues natifs ignoraient `data-theme` et tous les tokens de `globals.css`.

### 13. Accessibilité clavier — fait
Curseur de carte à tabulation mouvante : `j k h l` et les flèches naviguent, `x` coche, `Entrée`
ouvre, `Suppr` supprime, `1`–`9` envoient dans la n-ième liste (neuf, les listes étant des
données). Tout passe par `nextCursor` (`lib/board-cursor.ts`), pur et testé.

### 14. Modèles de tâches
Pré-remplir catégorie, estimation et tags pour les tâches répétitives de même forme.

### 15. PWA
Installable et hors-ligne. Next 15 le gère proprement et le modèle `localStorage` s'y prête déjà.

---

## Tier 4 — Gros chantiers

### 16. Backend et authentification
Synchronisation multi-appareils (Supabase ou équivalent). Casse le modèle `localStorage` en
place : à n'engager que si le besoin est réel et durable.

### 17. Tests
Aucun test pour l'instant. Playwright est déjà présent dans le projet (`.playwright/`).
Couverture minimale visée :

- créer, déplacer, supprimer une tâche ;
- persistance après rechargement ;
- migration `sanitizeColumns` (entrées invalides, doublons, colonne verrouillée manquante).
