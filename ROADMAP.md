# ROADMAP — MoloTask

Pistes d'évolution identifiées à partir de l'état du code (branche `feat/listes-personnalisees`).
Les tiers sont classés par impact, pas par difficulté.

**Ordre d'attaque conseillé : 1 → 2 → 4 → 3 → 5 → 7.**
Les horodatages passent en premier parce que chaque jour d'attente est de l'historique
définitivement perdu.

---

## Tier 1 — Manques structurels

Ces quatre points coûtent peu maintenant et cher plus tard.

### 1. Horodatages sur `Task`

**Constat** — `lib/types.ts` ne porte aucune date technique : ni `createdAt`, ni `movedAt`,
ni `doneAt`. Seul `date` (l'échéance saisie par l'utilisateur) existe.

**Conséquence** — impossible de calculer une vélocité, un cycle time, un burndown, ou même
« ce qui a été terminé cette semaine ». `AnalyticsView` plafonne à des totaux statiques.

**Piste** — ajouter `createdAt`, `movedAt`, `doneAt` (ISO strings) au modèle, les remplir dans
`handleSave` / `handleMove` (`app/page.tsx`), et prévoir une migration douce pour les tâches
déjà en `localStorage` (même principe que `sanitizeColumns` dans `lib/columns.ts`).

### 2. Export / import JSON

**Constat** — toutes les données vivent dans `localStorage` (`molotask_tasks`,
`molotask_columns`). Aucune sortie de secours.

**Conséquence** — vider le cache du navigateur, changer de machine ou passer en navigation
privée efface tout, sans avertissement.

**Piste** — deux boutons dans `Sidebar` : « Exporter » (télécharge un `.json` tâches +
colonnes) et « Importer » (relit le fichier, repasse par `sanitizeColumns`, demande
confirmation avant d'écraser). Environ une heure de travail, valeur d'assurance.

### 3. Ordre manuel dans une colonne

**Constat** — `handleMove` (`app/page.tsx:98`) ne modifie que `t.col`. La position d'une carte
est celle de son index dans le tableau `tasks`.

**Conséquence** — pas de glisser-déposer vertical, pas de tri par priorité ou par échéance,
pas de « remonter en haut de la pile ».

**Piste** — soit un champ `order: number` par tâche, soit un index de dépôt transmis par
`Board` / `Column` lors du drop. Ouvre ensuite un tri optionnel par priorité / date.

### 4. Annulation (undo)

**Constat** — `handleDelete` (`app/page.tsx:92`) et `handleDeleteCol` (`app/page.tsx:149`)
s'appuient sur un `confirm()` natif, puis la perte est sèche.

**Conséquence** — un clic de trop détruit une tâche ou renvoie toute une liste dans « À trier »
sans retour possible.

**Piste** — une pile d'annulation en mémoire et un toast « Annuler » affiché 5 secondes.
Couvre aussi bien la suppression de tâche que celle de liste.

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
