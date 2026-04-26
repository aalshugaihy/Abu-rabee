# متابعة أعمال ومهام قطاع المساحة والاعمال الجيومكانية

A bilingual (Arabic / English, RTL / LTR) dashboard application for managing committees, teams, requests and tasks across the Survey & Geospatial Sector.

> Inspired by and based on the source repository [`AbdullahAloyaydi/SGSW`](https://github.com/AbdullahAloyaydi/SGSW.git) and seeded from the attached Excel committees & requests trackers.

## Core services

The dashboard exposes a services panel (rendered on the right side in Arabic / RTL mode):

1. **Committees & Teams Management** — internal & external committees, scope, departments, representatives, status.
2. **Requests Tracker** — register and track inbound / outbound requests with priorities and transactions.
3. **Tasks Management & Tracking** — every task is one of two kinds:
   - **Routine maintenance task** (recurring operational tasks)
   - **Team / workgroup task** (committee or team-specific tasks)
4. **Reports & Statistics** — KPIs, status & department breakdowns and compliance ratios.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS (custom brand palette + RTL/LTR aware utilities)
- React Router 6
- Lucide React icons
- LocalStorage persistence (no backend required)
- Bilingual i18n (Arabic / English) with automatic RTL/LTR direction switching

## Getting started

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # create a production build in dist/
npm run preview  # preview the production build
npm run typecheck
```

## Project structure

```
src/
├── App.tsx                    # Routes
├── main.tsx                   # Bootstrapping with providers
├── i18n/translations.ts       # AR / EN dictionaries
├── contexts/
│   ├── LanguageContext.tsx    # Locale + dir + t()
│   └── DataContext.tsx        # Persisted data store
├── data/
│   ├── types.ts               # Domain types
│   └── seed.ts                # Seed data from the Excel files
├── layouts/DashboardLayout.tsx
├── components/                # Sidebar, TopBar, Modal, StatusBadge, ...
└── pages/                     # Landing, Dashboard, Committees, Requests, Tasks, Reports, Settings
```

## Languages & RTL

- The default language is Arabic (`dir="rtl"`).
- Switch to English from the language toggle in the header — direction (`rtl` / `ltr`) is updated automatically on `<html>`.
- All layout uses logical CSS properties (`start` / `end`) so it mirrors correctly.

## Data

All data is seeded from the two attached workbooks:

- *Committees & Teams tracker* (`السجل الرئيسي`, `المسح البحري`, `الجيودسي` …)
- *Requests tracker* (`متتبع الطلبات`)

Data is persisted to `localStorage` so edits survive reloads. Reset is available from the Settings page.
