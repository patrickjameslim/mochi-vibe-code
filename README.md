# Mochi — Vibecoders Frontend

A React + TypeScript frontend prototype for the Mochi billing and customer management platform, aligned with the mochi-labs production codebase standards.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | TanStack Router v1 (file-based) |
| Table | TanStack Table v8 |
| UI primitives | Radix UI + Base UI |
| Icons | Phosphor Icons |
| Drag & drop | dnd-kit |
| Charts | Chart.js + react-chartjs-2 |
| Date handling | Day.js + react-day-picker |
| Phone input | libphonenumber-js + react-phone-number-input |
| Toasts | Sonner |
| File upload | react-dropzone |
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
├── components/
│   ├── atoms/           # Base design-system primitives (Button, Badge, Input, …)
│   ├── molecules/       # Composite components (DataTable, FilterDrawer, Field, …)
│   ├── organisms/       # Feature-level components (AppSidebar, AssignGroupsDrawer, …)
│   ├── templates/       # Page layout shells (AppTemplate)
│   └── index.ts         # Barrel export for all components
├── context/             # React contexts (Navigation, CustomFields, Customers)
├── data/                # In-memory seed data (customers, bills, groups)
├── pages/
│   ├── billings/        # Billings list & create pages
│   ├── customers/       # Customers list, create, edit, view, groups pages
│   ├── dashboard/       # Dashboard page
│   ├── reports/         # Reports page (Billed vs Collected)
│   ├── settings/        # Settings page (custom fields builder)
│   └── shared/          # Shared page-level components (AppSidebar)
├── routes/              # TanStack Router file-based route tree
│   ├── __root.tsx
│   ├── _layout.tsx
│   └── _layout/         # Nested route files per page
├── styles/
│   ├── global.css       # Tailwind base + global resets
│   └── mochi/           # Mochi design tokens (colors, light theme variables)
├── utils/
│   └── formatters/      # Formatting helpers (currency, date, phone, ordinal, etc.)
├── main.tsx             # React entry point
└── index.css            # CSS entry (imports styles/global.css)
```

### Path alias

`@/` resolves to `src/`, so you can import without relative path traversal:

```ts
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
```

---

## Key Features

- **Dashboard** — overview page
- **Customers** — list, create, edit, view, archive, draft-save, assign groups
- **Bills** — manage bills table with filtering and column management
- **Reports** — Billed vs Collected bar chart
- **Settings** — custom fields builder (Customer and Bills)
- **Shared DataTable** — sortable columns, sticky columns, pagination, bulk actions, filter drawer

---

## Design System

Mochi design tokens are defined in `src/styles/mochi/` as CSS variables (colors, light theme) and consumed globally. Tailwind CSS 4 is used via the `@tailwindcss/vite` plugin — no `tailwind.config.js` required.

UI primitives live in `src/components/atoms/` and wrap Radix UI / Base UI with Mochi-specific styling using `class-variance-authority`. Molecules and organisms compose these primitives into larger patterns.

---

## Component Architecture

Components follow an atoms → molecules → organisms → templates hierarchy aligned with the mochi-labs production standards:

- **atoms** — stateless, styled primitives with no business logic
- **molecules** — combinations of atoms with light interaction (e.g. `Field`, `DataTable`, `FilterDrawer`)
- **organisms** — feature-aware components that may consume context or page data (e.g. `AppSidebar`, `AssignGroupsDrawer`)
- **templates** — layout shells that compose organisms into full-page structures

---

## Contributing

1. Branch off `main` using a descriptive name: `feature/<slug>` or `fix/<slug>`
2. Run `npm run lint` before opening a PR — the CI check enforces zero warnings
3. Run `npm run build` to confirm there are no TypeScript errors
4. Open a PR against `main` on [github.com/mochi-ph/vibecoders](https://github.com/mochi-ph/vibecoders)
