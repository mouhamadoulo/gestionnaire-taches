# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**MoloTask** — a Kanban board for managing any kind of task (work, personal, projects, study…),
built with **Next.js 15 (App Router) + TypeScript + Tailwind CSS 3**. UI copy is in French.

## Running

```bash
npm install        # first time only
npm run dev        # http://localhost:3000
npm run build
npm run start
npm run lint       # ESLint (flat config, next/core-web-vitals + next/typescript)
npm run typecheck  # tsc --noEmit
npm test           # Vitest, une passe
npm run test:watch # Vitest en continu
```

> Do not run `npm run build` while `npm run dev` is running — the build overwrites `.next`
> and the dev server then serves 404s for its JS chunks (page loads but is not interactive).
> Restart the dev server after a build.

### Tests

Vitest, `TZ` forcé à UTC, deux projets (`vitest.config.ts`) :

- **`lib`** — `environment: 'node'`, `lib/**/*.test.ts`. Logique pure, pas de DOM à charger.
- **`ui`** — `environment: 'jsdom'` + `vitest.setup.ts`, `{components,lib}/**/*.test.tsx`.
  Testing Library ; le setup ajoute les matchers `jest-dom` et un `cleanup` après chaque test.

L'extension décide donc du projet : `.test.ts` pour du pur, `.test.tsx` pour du rendu.
Les tests vivent dans `lib/__tests__/` et `components/__tests__/` — **pas** dans un dossier
`tests/` à la racine, que `next lint` n'inspecterait pas. `lib/__tests__/factory.ts` fournit
`task()`, une tâche complète et neutre à surcharger champ par champ.

`tsconfig.json` laisse le JSX à Next (`"jsx": "preserve"`), d'où le `esbuild: { jsx: 'automatic' }`
de la config Vitest : hors build Next, personne d'autre ne transforme le JSX.

`withRecurrence` n'est pas testable en l'état : il est défini dans `app/page.tsx` et non exporté.

Écrire un test = fixer une décision déjà prise, pas décrire l'implémentation : `doneAt` effacé
quand une tâche est rouverte, échéance récurrente qui roule au-delà de `today`, colonne
structurelle réinsérée par `sanitizeColumns`, import refusé si le marqueur `app` ne colle pas.
Les horodatages et `Date.now()` se passent en argument (`at`, `now`, `today`) — aucun test ne
doit dépendre de l'heure réelle.

### CI

`.github/workflows/ci.yml` runs on every push and PR to `main` (plus `workflow_dispatch`):
`npm ci` → `npm run lint -- --max-warnings=0` → `npm run typecheck` → `npm test` →
`npm run build`, on Node 20 and 22. **A warning fails the build**, so a new ESLint warning has to
be fixed or the rule tuned in `eslint.config.mjs` — not left in place. There is no deploy job in
Actions: the app is client-only (`localStorage`), and previews/production are already handled by
the Vercel GitHub integration, outside this workflow.

## Architecture

### Stack
- **Next.js 15** — App Router
- **React 19** — UI (the main page is a single client component tree)
- **TypeScript** — strict mode
- **Tailwind CSS 3** — utility-first styling; theme tokens are CSS variables (see Theming)

### File layout

```
app/
  layout.tsx        # Root HTML, fonts, inline no-FOUC theme script
  page.tsx          # HomePage: tasks state, localStorage sync, view + modal state, shortcuts
  globals.css       # Theme variables (dark/light) + component classes
  icon.svg          # Favicon
components/
  Sidebar.tsx       # Left nav (views + theme toggle + user card)
  ThemeToggle.tsx   # Clair / Sombre segmented control
  TopBar.tsx        # Title, search, "+ Nouvelle tâche"
  StatsBar.tsx      # Five summary counters (derived from tasks)
  Board.tsx         # Horizontal scroll container; owns drag state via useRef
  Column.tsx        # One kanban column (header + ⋯ menu, drop zone, task list or empty hint)
  TaskCard.tsx      # One task card (badges, title, desc, tags, estimate/spent bar, footer)
  TaskModal.tsx     # Create/edit task dialog (self-contained form state, focus trap)
  ColumnModal.tsx   # Create/rename list dialog (name, hint, tint swatches, live header preview)
  UndoToast.tsx     # "Annuler" banner shown after a destructive action
  ConfirmModal.tsx  # Themed confirm / notify dialog (replaces confirm() and alert())
  FilterMenu.tsx    # Filter popover opened from the top bar
  Dashboard.tsx     # Overview: flow ribbon, upcoming, overdue, category mix
  CalendarView.tsx  # Month grid + selected-day detail
  AnalyticsView.tsx # Time spent, estimation drift, ranking
  CursorAurora.tsx  # Cursor-following light (decorative)
lib/
  types.ts          # Task, TaskDraft, ColumnId, CategoryKey, Priority, ColumnDef, ViewId, ThemeMode
  constants.ts      # DEFAULT_COLS, COLUMN_TINTS, CAT_COLOR, CAT_LBL, CATEGORIES, TASK_TYPES, DONE_COLS, ACTIVE_COLS, keys
  columns.ts        # sanitizeColumns (storage migration), moveColumn, tintOf, newColumnId
  tasks.ts          # sanitizeTasks, withColumn, moveTask, sortColumn, timer + recurrence + cycle-time helpers
  backup.ts         # buildBackup, parseBackup, downloadJson (JSON export / import)
  filters.ts        # Filters, matchesTask, isOverdue / isDueToday, collectTags
  reminders.ts      # opt-in browser notifications for due tasks
  utils.ts          # fmtDate, fmtNum, fmtDuration
  use-theme.ts      # Reads/writes data-theme + localStorage
  use-confirm.ts    # Promise-based ask() / notify() driving ConfirmModal
  use-focus-trap.ts # Keeps Tab inside an open dialog (shared by the 3 modals)
  sample-data.ts    # SAMPLE_TASKS (seed when localStorage is empty)
```

### Data model

```ts
interface Task {
  id, col, title, desc, cat,     // cat = category key (travail, perso, projet…)
  type, prio, date, tags,        // date = user-facing due date
  steps,                         // checklist: { id, label, done }[]
  repeat,                        // "" | daily | weekly | monthly | yearly
  estimate, spent,               // minutes; spent is filled in on done/archived tasks
  startedAt,                     // running timer start, ISO; "" when stopped
  learning, notes,               // retrospective, shown for done/archived tasks
  createdAt, movedAt, doneAt     // ISO timestamps; "" means unknown
}
```

`TaskDraft` is what `TaskModal` emits: the editable fields plus an optional `id`. Timestamps are
set by `HomePage`, never by the form.

The three timestamps are **never invented**: a task stored before they existed keeps empty
strings, and every consumer (`cycleTimeDays`, `medianCycleDays`, `closedSince`, the Analytics
"Rythme" panel) skips those rather than guessing. `withColumn` is the single place that keeps
them coherent — it stamps `movedAt` on any column change and clears `doneAt` when a task leaves
a done column, so a reopened task stops counting as finished.

Persistence: `localStorage` key `molotask_tasks`, wired in `app/page.tsx` with two `useEffect`s
(hydrate on mount, save on every change after hydration). The columns follow the same pattern
under `molotask_columns`.

### Columns (lists)

Columns are **data, not constants**: `HomePage` owns a `columns: ColumnDef[]` state, persisted
under `molotask_columns`, and passes it to `Board`, `Dashboard`, `CalendarView` and `TaskModal`.
The user can add, rename, recolor, reorder and delete them from the board.

`DEFAULT_COLS` in `lib/constants.ts` is only the seed — the 7 lifecycle columns
(`inbox → todo → doing → review → sched → done → arch`). Each entry provides `id`, `label`,
`hint`, a `tint` hex (all accents derive from it) and an optional `locked`.

- `ColumnId` is a plain `string`. User lists get `"c" + Date.now()`.
- `locked: true` (`inbox`, `sched`, `done`, `arch`) — ids referenced in code, so these can be
  renamed and moved but not deleted. Deleting any other list sends its tasks back to `inbox`.
- `DONE_COLS = ['done', 'arch']` — these show the estimate/spent bar and the retrospective fields.
- `ACTIVE_COLS = ['todo', 'doing', 'review']` — counted as "en cours" in the stats.
- Stored columns come from a previous session, so they go through `sanitizeColumns`
  (`lib/columns.ts`): invalid or duplicate entries are dropped, `locked` is re-derived from
  `DEFAULT_COLS`, and any missing locked column is reinserted at its original index.
- Use `col.tint` where you have the `ColumnDef`, `tintOf(columns, task.col)` where you only have
  a task (it falls back to `FALLBACK_TINT` for an orphaned `col`).

### Task order

Display order **is** the order of the `tasks` array — there is no `order` field to keep in sync.
A drop therefore has to splice at the right global index: `Column` computes an insertion point
from the pointer against each card midpoint and passes a `beforeId` (`null` = end of list), and
`moveTask` (`lib/tasks.ts`) removes the task then re-inserts it before that id. Dropping a card
just before itself is a no-op. `sortColumn` reorders only the array slots one column already
occupies, leaving every other list untouched.

### Today, lateness and reminders

`HomePage` holds `today` as `"YYYY-MM-DD"`, **empty until after hydration** and refreshed every
minute. The server does not know the browser timezone, so anything date-relative (`isOverdue`,
`isDueToday`, recurrence roll-forward) treats an empty `today` as "say nothing" rather than
risking a day-off answer. Pass `today` down instead of calling `new Date()` inside a component
that server-renders.

Reminders (`lib/reminders.ts`) are opt-in browser notifications, deduped to one per task per day
in `localStorage`. Without a service worker they only fire while the app is open — the UI says so
rather than implying an alarm.

### Timer and recurrence

`startedAt` is the running timer's start; `spent` only moves when the timer stops, so a reload
does not lose the session. Exactly one timer runs at a time (`handleToggleTimer` stops the
others), and `withColumn` banks the running time when a task is completed.

Completing a task whose `repeat` is set inserts `nextOccurrence` at the slot the old one held,
back in the column it came from. The clone resets `spent`, `startedAt`, `doneAt`, the
retrospective, and unchecks its steps with fresh ids. Month/year shifts clamp to the end of the
month, and the due date rolls forward past `today`.

### Undo and backups

Destructive actions snapshot `{ tasks, columns }` before mutating and offer `UndoToast` for
7 seconds (also `Ctrl/⌘+Z`, ignored while a field has focus). The snapshot is read from a `useRef`
mirror of the state so the handlers do not have to depend on `tasks` / `columns`.

Because deletion is reversible, deleting a task has **no** confirm dialog. Deleting a list keeps
one, since it also relocates every task it holds.

Confirmations go through `useConfirm` (`lib/use-confirm.ts`), never `confirm()` / `alert()` —
native dialogs ignore `data-theme` and every token in `globals.css`. `ask()` returns a promise so
callers keep their shape (`if (!(await ask({…}))) return;`), and `notify()` is the one-button
variant that replaces `alert()`. A pending question is settled with `false` if another one
supersedes it or the component unmounts, so no caller is left waiting forever. `HomePage` renders
a single `<ConfirmModal dialog={dialog} />` and its global key handler stands down while a dialog
is open, otherwise Escape would also close the modal underneath.

Export writes `molotask-YYYY-MM-DD.json` (`{ app, version, exportedAt, tasks, columns }`).
Import treats the file as hostile: wrong `app` marker or a newer `version` is refused with a
readable message, the payload goes through `sanitizeTasks` / `sanitizeColumns`, and the whole
replacement is snapshotted for undo.

### State ownership

- **`HomePage`** owns `tasks`, `columns`, `search`, `view`, and modal state. It passes handlers down.
- **`Board`** owns only the transient drag ID (`useRef`) — not the dragged task's data.
- **`TaskModal` / `ColumnModal`** own their own form state; each resets via `useEffect` whenever
  `open` or `editing` changes.
- **Theme** lives on `<html data-theme>`; `useTheme` reads and writes it plus `localStorage`.

### Theming (dark / light)

`app/globals.css` defines every surface, text, line, fill, stroke and shadow token twice —
once under `:root, :root[data-theme="dark"]`, once under `:root[data-theme="light"]`.
`tailwind.config.ts` maps its color tokens to those variables, so `bg-surface`, `text-t2`,
`border-stroke1`, `shadow-glass`… all follow the active theme.

Rules when adding UI:

- **Never hardcode a surface color** (`rgba(255,255,255,0.04)`, `#0c0e16`, `bg-white/[0.06]`…).
  Use the tokens: `bg-fill1 / bg-fill2 / bg-fill3`, `border-stroke1 / border-stroke2`,
  `text-t1 / t2 / tm / td`, or the component classes below.
- Component classes in `globals.css`: `.glass`, `.glass-soft`, `.glass-card`, `.panel`,
  `.panel-hi`, `.plate-sidebar`, `.plate-topbar`, `.plate-column`, `.plate-modal`,
  `.modal-overlay`, `.dashed`, `.track`, `.btn-ghost`, `.btn-primary`, `.input`, `.chip`.
- Accent (`acc`) and `cool` stay the same in both themes, so Tailwind opacity modifiers
  (`bg-acc/[0.08]`, `border-cool/40`) are safe on them only.
- Status text colors use `var(--ok) / var(--warn) / var(--bad)`, which are darkened in the
  light theme for contrast. Category tints (`CAT_COLOR`) are picked to work on both backgrounds.
- Inline `style` is still fine for genuinely dynamic values (a category color, a bar width).

### Layout gotcha

Percentage-height bars (the dashboard flow ribbon, the monthly chart) need an unbroken chain of
definite heights: the flex row must be `items-stretch` and each wrapper must carry `h-full`,
otherwise the bars collapse to a hairline.
