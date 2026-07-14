# Peso Tracker

A local, single-user personal finance tracker that replaces a hand-maintained
Google Sheet. Built with **Next.js (App Router) + TypeScript**, **Tailwind CSS
+ shadcn/ui**, **SQLite (better-sqlite3)** and **Recharts**. No cloud
services, no accounts, no auth — everything lives in one SQLite file on your
machine.

## Quick start

```bash
npm install        # install dependencies (compiles better-sqlite3 natively)
npm run seed       # optional: load ~170 realistic sample transactions, loans & budgets
npm run dev        # start the app at http://localhost:3000
```

That's it. The database (`data/finance.db`) is created automatically on first
run and seeded with the default accounts (UnionBank, Maya, Seabank, GCash,
SPayLater, GLoan, Atome) and categories (Household, Groceries, Cat/Pet,
Personal, Entertainment, Bills & Utilities, Loan Payment, Savings,
Debt/Installment, Income, Other).

Other useful commands:

```bash
npm run seed:reset   # wipe the database and reseed sample data from scratch
npm run build        # production build
npm start            # run the production build
```

## Using it from your phone

The app is fully responsive with a bottom tab bar on small screens. To open it
on your phone while it runs on your computer:

1. Make sure the phone and computer are on the same Wi-Fi network.
2. Start the dev server so it listens on your LAN: `npm run dev -- -H 0.0.0.0`
3. Find your computer's local IP (e.g. `192.168.1.5`) and open
   `http://192.168.1.5:3000` on the phone.
4. Optional: use your browser's **Add to Home Screen** — the app ships a PWA
   manifest and launches standalone like a native app.

## Pages

| Page | What it does |
|---|---|
| **Dashboard** (`/`) | Summary cards (spent this month, income, net, all-time), 12-month spending trend, category donut and per-account bars — all driven by the month selector |
| **Transactions** (`/transactions`) | Filter by account / category / type / date range, search descriptions, sort by date or amount, add/edit/delete via modal, CSV import & export |
| **Accounts** (`/accounts`) | One card per account with this-month + all-time spend and a 6-month sparkline; add, edit, archive/restore |
| **Loans** (`/loans`) | Remaining balance, monthly payment, next due date (supports two due days per month, e.g. 15th + end of month), payoff progress bars, and a one-tap "Log payment" that decrements the balance and records the expense |
| **Budgets** (`/budgets`) | Per-category monthly limit vs. actual with progress bars that turn red when over budget |
| **Reports** (`/reports`) | Month-over-month table, stacked category-per-month chart, top 5 categories and accounts for a 3/6/12-month range |
| **Categories** (`/categories`) | Add / rename / recolor / delete categories — the lists behind every dropdown live in the database, not in code |

Dark mode: toggle at the bottom of the sidebar (desktop) or under **More**
(mobile). It follows your OS preference by default.

## CSV import format

Import your spreadsheet history once via **Transactions → Import CSV**. The
file needs a header row; column order doesn't matter and matching is
case-insensitive:

```csv
date,amount,direction,account,category,description,notes,is_recurring
2026-06-15,619,expense,Maya,Entertainment,Netflix,,true
06/16/2026,14000,income,UnionBank,Income,Salary (1st half),,
2026-06-17,1345.50,expense,SPayLater,Cat/Pet,SP: Cat Food,15th batch,
```

- Only `date` and `amount` are required; dates accept `YYYY-MM-DD` or `MM/DD/YYYY`.
- `direction` defaults to `expense`; amounts can include `₱` and commas.
- Unknown accounts/categories are **created automatically**, so you can import
  first and tidy up colors later.
- **Export CSV** produces the same format — use it for backups (or just copy
  `data/finance.db`).

## Project structure

```
data/finance.db          The whole database (gitignored — back this file up)
scripts/seed.js          Sample-data seeder (npm run seed / seed:reset)
src/
  lib/
    schema.sql           Tables: accounts, categories, transactions, loans, budgets
    db.ts                Opens SQLite, applies schema, seeds default lists
    queries.ts           All read queries (dashboard aggregates, filters, reports)
    actions.ts           Server actions for every mutation (CRUD, budgets, payments)
    csv.ts               Tiny CSV parser/serializer used by import/export
    colors.ts            Shared categorical palette + auto-assignment
    format.ts            ₱ formatting and month/date helpers
  app/
    page.tsx             Dashboard  ·  transactions/ accounts/ loans/ budgets/ reports/ categories/
    api/import, api/export   CSV endpoints
  components/
    charts/              Recharts wrappers (trend, donut, stacked, sparkline)
    transactions|accounts|loans|budgets|categories/
    layout/              Sidebar (desktop), bottom tab bar (mobile), theme toggle
    ui/                  shadcn/ui primitives (vendored)
```

## Extending it

- **New account or category**: just add it in the UI — colors are auto-assigned
  from a colorblind-safe palette and used consistently across every chart,
  badge and card.
- **New field**: add the column in `src/lib/schema.sql` (new installs) plus an
  `ALTER TABLE` migration in `db.ts`, extend the type in `lib/types.ts`, and
  add the input to the relevant form component.
- **Backups**: copy `data/finance.db` anywhere, or use Export CSV.
