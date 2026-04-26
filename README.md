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

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS (custom brand palette + RTL/LTR aware utilities)
- React Router 6
- Lucide React icons
- LocalStorage persistence (no backend required)
- Bilingual i18n (Arabic / English) with automatic RTL/LTR direction switching

## Quick start (development)

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run typecheck    # tsc --noEmit
npm run build        # production build → dist/
npm run preview      # preview the production build on :4173
```

## Deployment

The app is a fully static SPA (no backend), so it can be deployed anywhere that serves static files. Three options are wired up out of the box:

### Option A — GitHub Pages (automatic)

A workflow in `.github/workflows/deploy.yml` builds the app and publishes it to GitHub Pages on every push to `main`.

To enable:

1. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. *(Optional)* If you deploy under a sub-path like `https://<owner>.github.io/<repo>/`, set a repository **variable** named `VITE_BASE` to `/<repo>/`. The workflow passes it through to Vite. If you use a custom domain or the user-site root, leave it unset.
3. Push to `main` — the workflow will build, copy `dist/index.html` to `dist/404.html` (SPA fallback), and deploy.

### Option B — Netlify / Vercel / Cloudflare Pages

Build command: `npm run build` · Publish directory: `dist`. SPA fallback is already included via `public/_redirects` (`/* /index.html 200`).

### Option C — Self-hosted (Docker + Nginx)

A multi-stage `Dockerfile` and an `nginx.conf` are provided. The Nginx config sets cache-control for hashed assets, an SPA fallback, gzip, and a few security headers.

```bash
# Build the image
docker build -t abu-rabee .

# Run on port 8080
docker run --rm -p 8080:80 abu-rabee
# → http://localhost:8080
```

Or with `docker compose`:

```yaml
services:
  app:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

### Sub-path deployments

If you serve the app under a sub-path (`/abu-rabee/`), build with `VITE_BASE` set:

```bash
VITE_BASE=/abu-rabee/ npm run build
```

Both `<base>` paths and the React Router `basename` pick up the value automatically (via `import.meta.env.BASE_URL`).

## Continuous Integration

`.github/workflows/ci.yml` runs `typecheck` and `build` on every push and pull request to `main`, and uploads the `dist/` artifact for inspection.

## Project structure

```
src/
├── App.tsx                    # Routes
├── main.tsx                   # Bootstraps providers and the router
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

public/
├── 404.html                   # SPA fallback for static hosts (e.g. GitHub Pages)
├── _redirects                 # SPA fallback for Netlify / Cloudflare Pages
└── favicon.svg

Dockerfile                     # node:20 build → nginx:1.27 runtime
nginx.conf                     # SPA fallback + caching + security headers
.github/workflows/ci.yml       # CI: typecheck + build
.github/workflows/deploy.yml   # CD: GitHub Pages
```

## Languages & RTL

- The default language is Arabic (`dir="rtl"`).
- Switch to English from the language toggle in the header — direction (`rtl` / `ltr`) is updated automatically on `<html>` and persisted to `localStorage`.
- All layout uses logical CSS properties (`start` / `end`, `ms-*` / `me-*` / `ps-*` / `pe-*`) so it mirrors correctly.

## Data

All data is seeded from the two attached workbooks:

- *Committees & Teams tracker* (`السجل الرئيسي`, `المسح البحري`, `الجيودسي` …)
- *Requests tracker* (`متتبع الطلبات`)

Data is persisted to `localStorage` so edits survive reloads. Reset to seed is available from the Settings page.
