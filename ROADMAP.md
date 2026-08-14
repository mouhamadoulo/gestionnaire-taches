# ROADMAP — MoloTask

Pistes d'évolution identifiées à partir de l'état du code (branche `feat/listes-personnalisees`).
Les tiers sont classés par impact, pas par difficulté.

**Ordre d'attaque conseillé : 1 → 2 → 4 → 3 → 5 → 7.**
Les horodatages passent en premier parce que chaque jour d'attente est de l'historique
définitivement perdu.

> **État — Tier 1 livré** sur la branche `feat/tier-1-foundations`, dans l'ordre
> 1 → 4 → 2 → 3 (l'annulation avant l'export/import, pour que l'import soit lui aussi
> annulable). Prochaine étape : Tier 2, en commençant par les filtres (5).

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

## Tier 2 — Usage quotidien

### 5. Filtres

`search` ne filtre que le texte. Manquent : filtrage par catégorie, par priorité, par tag, et un
raccourci « en retard ». À loger dans `TopBar`, à appliquer là où `search` l'est déjà (`Board`).

### 6. Sous-tâches / checklist

`Task.desc` est un bloc de texte libre. Une checklist typée (`{ label, done }[]`) permettrait une
barre de progression sur `TaskCard` et un découpage réel des grosses tâches.

### 7. Chronomètre

`spent` se saisit à la main dans `TaskModal`. Un bouton lecture/pause sur les cartes en cours,
qui incrémente `spent`, rendrait les chiffres d'`AnalyticsView` fiables au lieu d'être déclaratifs.

### 8. Tâches récurrentes

« Sport le lundi », « facture le 1er ». Un champ `repeat` sur `Task` et une régénération
automatique à la complétion.

### 9. Rappels d'échéance

`date` existe mais rien ne la surveille. Notification navigateur, ou au minimum un badge
« 3 en retard » cliquable dans `StatsBar` / `TopBar`.

---

## Tier 3 — Finition

### 10. Sélection multiple et actions groupées
Déplacer, supprimer ou taguer plusieurs tâches d'un coup.

### 11. Responsive mobile
`Board` est un scroll horizontal pensé pour le bureau. Sur téléphone : une colonne à la fois plus
un sélecteur de liste.

### 12. Modales internes au lieu de `confirm()`
Les `confirm()` natifs (`app/page.tsx:93`, `app/page.tsx:158`) cassent le thème et ignorent les
tokens de `globals.css`.

### 13. Accessibilité clavier
Déplacer une tâche exige aujourd'hui la souris. Raccourcis proposés : `j` / `k` pour naviguer,
`1`–`7` pour envoyer la carte sélectionnée dans une liste. À ajouter au gestionnaire de touches
existant (`app/page.tsx:165`).

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
