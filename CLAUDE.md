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
```

> Do not run `npm run build` while `npm run dev` is running — the build overwrites `.next`
> and the dev server then serves 404s for its JS chunks (page loads but is not interactive).
> Restart the dev server after a build.

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
  Dashboard.tsx     # Overview: flow ribbon, upcoming, overdue, category mix
  CalendarView.tsx  # Month grid + selected-day detail
  AnalyticsView.tsx # Time spent, estimation drift, ranking
  CursorAurora.tsx  # Cursor-following light (decorative)
lib/
  types.ts          # Task, ColumnId, CategoryKey, Priority, ColumnDef, ViewId, ThemeMode
  constants.ts      # DEFAULT_COLS, COLUMN_TINTS, CAT_COLOR, CAT_LBL, CATEGORIES, TASK_TYPES, DONE_COLS, ACTIVE_COLS, keys
  columns.ts        # sanitizeColumns (storage migration), moveColumn, tintOf, newColumnId
  utils.ts          # fmtDate, fmtNum, fmtDuration
  use-theme.ts      # Reads/writes data-theme + localStorage
  sample-data.ts    # SAMPLE_TASKS (seed when localStorage is empty)
```

### Data model

```ts
interface Task {
  id, col, title, desc, cat,     // cat = category key (travail, perso, projet…)
  type, prio, date, tags,
  estimate, spent,               // minutes; spent is filled in on done/archived tasks
  learning, notes                // retrospective, shown for done/archived tasks
}
```

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
