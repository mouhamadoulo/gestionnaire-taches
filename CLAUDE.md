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

Reste hors couverture : les vues (`Dashboard`, `CalendarView`, `AnalyticsView`), le
glisser-déposer et le responsive, dont la géométrie ne se rejoue pas honnêtement sous jsdom — ils
se vérifient au navigateur (390×844 et 1440×900). Ce qui reste testable dans le mobile l'est :
`ColumnTabs` (compteurs filtrés, liste courante) et le menu « Déplacer vers » de `TaskCard`.

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
  layout.tsx        # Root HTML, fonts, inline no-FOUC theme script, viewport themeColor
  page.tsx          # HomePage: tasks state, localStorage sync, view + modal state, shortcuts
  manifest.ts       # PWA manifest (metadata route → /manifest.webmanifest)
  globals.css       # Theme variables (dark/light) + component classes
  icon.svg          # Favicon, and the manifest's only icon
public/
  sw.js             # Service worker: shell precache, network-first navigations
components/
  Sidebar.tsx       # Left nav (views + theme toggle + user card)
  ThemeToggle.tsx   # Clair / Sombre segmented control
  TopBar.tsx        # Title, search, "+ Nouvelle tâche"
  StatsBar.tsx      # Five summary counters (derived from tasks)
  Board.tsx         # Horizontal scroll container; owns drag state + the mobile active column
  ColumnTabs.tsx    # Mobile-only list picker (chips) shown above the board
  Column.tsx        # One kanban column (header + ⋯ menu, drop zone, task list or empty hint)
  TaskCard.tsx      # One task card (badges, title, desc, tags, estimate/spent bar, footer)
  TaskModal.tsx     # Create/edit task dialog (self-contained form state, focus trap)
  ColumnModal.tsx   # Create/rename list dialog (name, hint, tint swatches, live header preview)
  ServiceWorker.tsx # Registers /sw.js in production + "new version" banner
  UndoToast.tsx     # "Annuler" banner shown after a destructive action
  ConfirmModal.tsx  # Themed confirm / notify dialog (replaces confirm() and alert())
  BulkBar.tsx       # Bulk actions on the current selection (move / tag / delete)
  FilterMenu.tsx    # Filter popover opened from the top bar
  Dashboard.tsx     # Overview: flow ribbon, upcoming, overdue, category mix
  CalendarView.tsx  # Month grid + selected-day detail
  AnalyticsView.tsx # Time spent, estimation drift, ranking
  CursorAurora.tsx  # Cursor-following light (decorative)
lib/
  types.ts          # Task, TaskDraft, ColumnId, CategoryKey, Priority, ColumnDef, ViewId, ThemeMode
  constants.ts      # DEFAULT_COLS, COLUMN_TINTS, CAT_COLOR, CAT_LBL, CATEGORIES, TASK_TYPES, DONE_COLS, ACTIVE_COLS, keys
  columns.ts        # sanitizeColumns (storage migration), moveColumn, tintOf, newColumnId
  tasks.ts          # sanitizeTasks, withColumn, moveTask(s), sortColumn, bulk ops, timer + recurrence + cycle-time helpers
  templates.ts      # TaskTemplate: sanitizeTemplates, templateFrom, applyTemplate
  backup.ts         # buildBackup, parseBackup, downloadJson (JSON export / import)
  filters.ts        # Filters, matchesTask, isOverdue / isDueToday, collectTags
  reminders.ts      # opt-in browser notifications for due tasks
  utils.ts          # fmtDate, fmtNum, fmtDuration
  use-theme.ts      # Reads/writes data-theme + localStorage
  board-cursor.ts   # nextCursor: keyboard navigation between visible cards
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
(hydrate on mount, save on every change after hydration). The columns and the templates follow the
same pattern under `molotask_columns` and `molotask_templates`.

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

### Selection and bulk actions

`HomePage` owns `selected: Set<string>`. Three gestures fill it: the checkbox revealed on card
hover (permanent once anything is selected), `Ctrl/⌘+click` anywhere on the card, and
`Shift+click` for a range. **A range only spans one column** — the global array order is not what
the user sees on screen. `Escape` clears the selection.

The selection is **pruned to visible tasks** on every change of search/filters, for the same
reason `pruneTags` exists: a task hidden by a filter must not travel with a bulk action the user
believes applies to what they can see.

`BulkBar` is presentational; `moveTasks` / `deleteTasks` / `tagTasks` (`lib/tasks.ts`) are pure
and tested. `moveTasks` takes the same `beforeId` convention as `moveTask`, so dragging one card
of a selection drops the whole batch where it was released — `handleMove` routes to it whenever
the dragged id is part of a selection of more than one.

Bulk actions carry **no confirm dialog**: like a single delete, `UndoToast` is the safety net, and
a dialog nobody reads is worse than no dialog. `ConfirmModal` stays for deleting a list and for
importing, which are not covered the same way.

Completing a batch regenerates recurring tasks exactly as a one-by-one move would — that is why
`withRecurrence` lives in `lib/tasks.ts` rather than in `app/page.tsx`.

### Keyboard on the board

`cursor: string | null` in `HomePage` is the *current* card — distinct from the selection. The
board uses a **roving tabindex**: only the cursor card carries `tabIndex={0}`, so `Tab` has one
stop for the whole board and `TaskCard` takes real DOM focus (`focus({ preventScroll: true })`
then `scrollIntoView({ block: 'nearest' })`). A visual ring alone would leave screen readers
behind.

`j`/`k`/`h`/`l` and the arrows move it, `x` or `Space` toggles selection, `Enter` opens the card,
`Delete` deletes, `1`–`9` send it to the *n*-th list — nine and not seven, because columns are
data and there can be any number of them. Everything routes through `nextCursor`
(`lib/board-cursor.ts`), which is pure and walks `visible`, so search and filters apply and the
cursor is pruned like the selection when its task disappears. Nothing wraps around at the edges.

Bare-letter shortcuts are gated three ways: not while typing (`INPUT`/`TEXTAREA`/`SELECT`/
contentEditable), not while a modal or a `ConfirmModal` is open, and only on the board view
(`viewRef`). `1`–`9` and `Delete` follow the same batch rule as a group drag: they act on the
whole selection when the cursor belongs to it, on the single card otherwise.

### Timer and recurrence

`startedAt` is the running timer's start; `spent` only moves when the timer stops, so a reload
does not lose the session. Exactly one timer runs at a time (`handleToggleTimer` stops the
others), and `withColumn` banks the running time when a task is completed.

Completing a task whose `repeat` is set inserts `nextOccurrence` at the slot the old one held,
back in the column it came from. The clone resets `spent`, `startedAt`, `doneAt`, the
retrospective, and unchecks its steps with fresh ids. Month/year shifts clamp to the end of the
month, and the due date rolls forward past `today`.

### Task templates

A `TaskTemplate` (`lib/templates.ts`) is `{ id, name, fields }`, where `fields` holds only what
repeats: title, desc, cat, type, prio, tags, steps, repeat, estimate. The due date, `spent`,
`startedAt` and the retrospective belong to one occurrence — copying them would mint tasks that
are already dated and already reviewed.

`HomePage` owns `templates`, persisted under `molotask_templates` with the same pair of effects as
the columns, and there is **no seed**: templates come from a task the user actually wrote.
`TaskModal` shows them as chips **only when creating** — applying one while editing would
overwrite what the user opened the dialog to change — and `applyTemplate` re-ids the steps and
unchecks them, like the recurrence clone. Applying leaves `col` and `date` alone: the template
says *what*, the dialog already said *where and when*.

Saving goes the other way: the modal hands `HomePage` the raw `fields` and a name (falling back to
the title), and `templateFrom` builds the template. Creating one is not undoable and needs no
`UndoToast` — nothing is lost; deleting one asks through `useConfirm`, like deleting a list.

Backups carry `templates` while staying at `BACKUP_VERSION = 1`: an added field that an older
build ignores is cheaper than a version bump that would make that build refuse the file. A backup
written before templates existed parses to `[]`.

### Installable and offline (PWA)

`app/manifest.ts` is a Next metadata route; the only icon is the existing `app/icon.svg`
(`sizes: "any"`), so there is no PNG set to regenerate. `themeColor` is declared per color scheme
in `layout.tsx` so the installed title bar follows the theme.

`public/sw.js` is hand-written — the app is one page whose data already lives in `localStorage`,
so there is nothing to sync, only a shell to keep. Navigations are network-first with a cache
fallback (cache-first would serve a stale build on every visit); `/_next/static/` is cache-first,
its names being hashed. Bumping `VERSION` drops every older cache on activation.

`ServiceWorker.tsx` registers it **in production only** — in dev the worker would serve stale
compiled chunks and the page would look frozen after each edit — and shows a banner when a new
worker is waiting; accepting posts `skip-waiting`, and the `controllerchange` listener reloads
once.

Reminders are unchanged by this: a notification with the window closed needs Web Push, therefore a
server (roadmap 16). The service worker does not buy that.

### Undo and backups

Destructive actions snapshot `{ tasks, columns, templates }` before mutating and offer `UndoToast`
for 7 seconds (also `Ctrl/⌘+Z`, ignored while a field has focus). The snapshot is read from a
`useRef` mirror of the state so the handlers do not have to depend on `tasks` / `columns` — and it
covers the templates because an import replaces those too.

Because deletion is reversible, deleting a task has **no** confirm dialog. Deleting a list keeps
one, since it also relocates every task it holds.

Confirmations go through `useConfirm` (`lib/use-confirm.ts`), never `confirm()` / `alert()` —
native dialogs ignore `data-theme` and every token in `globals.css`. `ask()` returns a promise so
callers keep their shape (`if (!(await ask({…}))) return;`), and `notify()` is the one-button
variant that replaces `alert()`. A pending question is settled with `false` if another one
supersedes it or the component unmounts, so no caller is left waiting forever. `HomePage` renders
a single `<ConfirmModal dialog={dialog} />` and its global key handler stands down while a dialog
is open, otherwise Escape would also close the modal underneath.

Export writes `molotask-YYYY-MM-DD.json`
(`{ app, version, exportedAt, tasks, columns, templates }`). Import treats the file as hostile:
wrong `app` marker or a newer `version` is refused with a readable message, the payload goes
through `sanitizeTasks` / `sanitizeColumns` / `sanitizeTemplates`, and the whole replacement is
snapshotted for undo.

### State ownership

- **`HomePage`** owns `tasks`, `columns`, `templates`, `search`, `view`, and modal state. It passes
  handlers down.
- **`Board`** owns only the transient drag ID (`useRef`) and the mobile active list — not the
  dragged task's data.
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

### Écran étroit

One breakpoint: **`md` (768px)**. Above it nothing changed; below it the desktop board does not
survive as-is — 286px columns in a horizontal scroller, hover-only affordances and HTML5 drag and
drop all assume a mouse.

- **Navigation** — `Sidebar` is `fixed … -translate-x-full md:relative`, opened by the `☰` button
  `HomePage` floats at the top left of `<main>` (every view has one, which is why it does not live
  in `TopBar`). `navOpen` is separate from `navCollapsed`: the drawer is a mobile state, the
  collapse a desktop setting, and `compact = collapsed && !mobileOpen` keeps the drawer from
  opening as a column of bare icons. Escape, the veil and the `✕` all close it.
- **One list at a time** — `ColumnTabs` (chips + counters, `md:hidden`) picks the column `Board`
  shows. `Board` owns `activeId` and re-resolves it every render (`find(id) ?? columns[0]`), like
  the drag id: a deleted or imported-over list leaves no dead state. Every `Column` stays mounted,
  the inactive ones just carry `hidden md:flex` — menus, keyboard cursor and desktop drag do not
  rebuild on each switch. Counts come from the *filtered* tasks, or a chip would announce seven
  tasks and open on nothing.
- **Moving a task** — HTML5 drag and drop does not exist on touch, so `TaskCard` has a `⇄` menu
  listing the other lists and calling the same `onMove(id, col, null)`. It renders through
  `createPortal`: the card has `overflow: hidden` and a `backdrop-filter`, which clips an absolute
  *and* a fixed child. Position is computed from the button's rect and flips above when the bottom
  is too close.
- The card checkbox is `opacity-100 md:opacity-0 md:group-hover:opacity-100` — there is no hover to
  reveal it with.
- Rows that cannot shrink honestly are scrolled instead of squeezed: `StatsBar` tiles, the chips,
  the Analytics ranking (`min-w-[560px]`). `.no-scrollbar` hides the bar on those.

### Layout gotcha

Percentage-height bars (the dashboard flow ribbon, the monthly chart) need an unbroken chain of
definite heights: the flex row must be `items-stretch` and each wrapper must carry `h-full`,
otherwise the bars collapse to a hairline.

Tailwind classes of the same family do not fight in the order you wrote them, but in the order
they appear in the generated CSS: `relative` beats `fixed`, `hidden` beats `flex`, whatever the
class string says. That is why the sidebar carries `fixed md:relative` and not a leftover
`relative`, and why a responsive override is always the `md:` one.
