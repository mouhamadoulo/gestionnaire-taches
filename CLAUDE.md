# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Kanban board for content creators ("ContentFlow") built with **Next.js 15 (App Router) + TypeScript + Tailwind CSS 3**.

The legacy single-file prototype (`kanban-content.html`) is kept at the repo root for reference.

## Running

```bash
npm install        # first time only
npm run dev        # http://localhost:3000
npm run build
npm run start
```

## Architecture

### Stack
- **Next.js 15** — App Router
- **React 19** — UI (the main page is a single client component tree)
- **TypeScript** — strict mode
- **Tailwind CSS 3** — utility-first styling, custom theme tokens in `tailwind.config.ts`

### File layout

```
app/
  layout.tsx        # Root HTML, imports globals.css
  page.tsx          # HomePage: holds cards state, localStorage sync, modal state, shortcuts
  globals.css       # Tailwind directives + .input component class
components/
  Sidebar.tsx       # Left nav (static)
  TopBar.tsx        # Title, tabs, search, platform filter, "+ Nouveau contenu"
  StatsBar.tsx      # Five summary counters (derived from cards)
  Board.tsx         # Horizontal scroll container; owns drag/drop state via useRef
  Column.tsx        # One kanban column (header, drop zone, card list or empty hint)
  CardItem.tsx      # One card (badges, title, desc, tags, perf bar, footer)
  CardModal.tsx     # Create/edit dialog (self-contained form state)
lib/
  types.ts          # Card, ColumnId, PlatformKey, Priority, ColumnDef
  constants.ts      # COLS, PLT_COLOR, PLT_LBL, PAST_COLS, STORAGE_KEY
  utils.ts          # fmtDate, fmtNum
  sample-data.ts    # SAMPLE_CARDS (seed when localStorage is empty)
```

### Data model

```ts
interface Card {
  id, col, title, desc, plt,    // plt = platform key
  type, prio, date, tags,
  views, likes,                  // past-content only
  learning, prodNotes            // past-content only
}
```

Persistence is via `localStorage` key `cf_cards`, wired in `app/page.tsx` with two `useEffect`s: one to hydrate from storage on mount, one to save on every `cards` change after hydration.

### Columns

`COLS` in `lib/constants.ts` defines the 7 lifecycle columns (`ideas → plan → prod → edit → sched → pub → arch`). Each entry provides `id`, `label`, dot/bar Tailwind classes, and an empty-state hint.

`PAST_COLS = ['pub', 'arch']` controls which columns show the performance bar + retrospective fields (both in `CardItem` and `CardModal`).

### State ownership

- **`HomePage`** owns `cards`, `search`, `platform`, `tab`, and modal state. It passes handlers down.
- **`Board`** owns only the transient drag ID (`useRef`) — not the dragged card's data.
- **`CardModal`** owns its own form state; it resets via `useEffect` whenever `open` or `editing` changes.

### Styling conventions

- All colors via Tailwind tokens (`bg`, `t1`, `t2`, `tm`, `border`, `acc`, …) defined in `tailwind.config.ts`.
- Shadows via `shadow-s1 / s2 / s3` tokens.
- Use `className` utility strings; only drop to inline `style` when the value is dynamic (platform color, performance bar width/color).
- The `.input` component class in `globals.css` is shared by every form control.
