# Mochi — Vibecoders Frontend

A React + TypeScript frontend prototype for the Mochi billing and customer management platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build tool | Vite 4 |
| Styling | Tailwind CSS 3 (custom Mochi design tokens) |
| UI primitives | Radix UI |
| Icons | Phosphor Icons |
| Drag & drop | dnd-kit |
| Charts | Chart.js + react-chartjs-2 |
| Linting | ESLint + TypeScript ESLint |

> **No backend.** All data lives in-memory inside `src/data/`. There is no `.env` file or API to configure.

---

## Prerequisites

- **Node.js** v18 or later — [nodejs.org](https://nodejs.org)
- **npm** v9 or later (bundled with Node)

Verify your versions:

```bash
node -v   # should be >= 18
npm -v    # should be >= 9
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/mochi-ph/vibecoders.git
cd vibecoders
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the dev server

```bash
npm run dev
```

The app opens at **http://localhost:5174** by default. Vite will pick the next available port if 5174 is already in use.

---

## Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with Hot Module Replacement (HMR) |
| `npm run build` | Type-check then compile a production bundle into `dist/` |
| `npm run preview` | Serve the production build locally for a final check |
| `npm run lint` | Run ESLint across all `.ts` / `.tsx` files |

---

## Project Structure

```
src/
├── assets/          # SVG logos and static images
├── components/
│   ├── ui/          # Reusable design-system primitives (Button, Badge, Input, …)
│   └── *.tsx        # Page-level and feature components
├── context/         # React contexts (Navigation, CustomFields)
├── data/            # In-memory seed data (customers, bills, groups)
├── hooks/           # Shared custom hooks (useTableSort, useStickyColumns)
├── lib/             # Utility helpers (cn / class merging)
├── types/           # Shared TypeScript type definitions
├── utils/           # Formatting helpers (phone numbers, etc.)
├── App.tsx          # Root component — page routing lives here
├── main.tsx         # React entry point
└── index.css        # Tailwind base + CSS custom properties (design tokens)
```

### Path alias

`@/` resolves to `src/`, so you can import without relative path traversal:

```ts
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
```

---

## Key Features

- **Customers** — list, create, edit, view, archive, draft-save
- **Bills** — manage bills table with filtering and column management
- **Reports** — Billed vs Collected bar chart
- **Settings** — custom fields builder (Customer and Bills)
- **Shared DataTable** — sortable columns, sticky columns, pagination, bulk actions, filter drawer

---

## Design System

Custom design tokens are defined in `src/index.css` as CSS variables and consumed by the Tailwind config in `tailwind.config.js`. The Mochi violet scale (`violet-50` → `violet-950`) overrides Tailwind's built-in violet.

UI primitives live in `src/components/ui/` and wrap Radix UI with Mochi-specific styling using `class-variance-authority`.

Reference specs are in the `Mochi Design System/` folder at the repo root (if present locally — not committed to version control).

---

## Contributing

1. Branch off `main` using a descriptive name: `feature/<slug>` or `fix/<slug>`
2. Run `npm run lint` before opening a PR — the CI check enforces zero warnings
3. Run `npm run build` to confirm there are no TypeScript errors
4. Open a PR against `main` on [github.com/mochi-ph/vibecoders](https://github.com/mochi-ph/vibecoders)
