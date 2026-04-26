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

## Architecture

The repo is a small monorepo of two packages:

- **`/` (frontend)** — Vite + React 18 + TypeScript SPA. Works **offline** by
  default, persisting to `localStorage`. If `VITE_API_URL` is set at build
  time, it talks to the backend instead and adds login + roles + realtime.
- **`server/`** — Express + Prisma + SQLite + Socket.io API with JWT cookie
  auth and three roles (`admin` / `staff` / `viewer`). See
  [`server/README.md`](./server/README.md) for setup.

## Tech stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS (custom brand palette + RTL/LTR aware utilities)
- React Router 6, Lucide icons, Socket.io-client (lazy-loaded)
- Bilingual i18n (Arabic / English) with automatic RTL/LTR direction switching
- LocalStorage persistence by default; opt-in REST + websocket backend

## Quick start (development)

**Frontend only — localStorage mode (offline):**

```bash
npm install
npm run dev          # http://localhost:5173
```

**With backend — multi-user, auth, realtime:**

```bash
# Terminal 1 — backend on :4000
cd server
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run seed         # demo users (admin/staff/viewer) + seed entities
npm run dev

# Terminal 2 — frontend pointed at the backend
VITE_API_URL=http://localhost:4000 npm run dev
```

Other scripts:

```bash
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
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

### Option C — Self-hosted full stack (`docker compose up`)

The repo ships a top-level `docker-compose.yml` that builds and runs **both**
the API server and the Nginx-served SPA together:

```bash
cp .env.example .env          # generate JWT_SECRET, set CLIENT_ORIGIN
docker compose up --build     # builds both images
# → http://localhost:8080      (frontend)
# → http://localhost:4000/api/docs   (Swagger UI)
```

Demo accounts after first boot (run `docker compose exec server npm run seed`):

| email | password | role |
|---|---|---|
| `admin@aburabee.gov`  | `admin1234`  | admin  |
| `staff@aburabee.gov`  | `staff1234`  | staff  |
| `viewer@aburabee.gov` | `viewer1234` | viewer |

The SQLite database is persisted in the named volume `abu-rabee-data` so it
survives container restarts. Use `docker compose down -v` to wipe it.

Both images include healthchecks (`/` for the SPA, `/health` for the API)
and the server runs `prisma db push` automatically on first start.

### Option D — One-click deploy to Render

> 📘 **For a step-by-step guide in Arabic + English with troubleshooting,
> see [`RENDER_DEPLOY.md`](./RENDER_DEPLOY.md).**

The repo ships a top-level `render.yaml` blueprint that provisions all three
moving parts in a single deploy:

| Resource | Type | Plan | What it does |
|---|---|---|---|
| `abu-rabee-db`     | PostgreSQL 16 | Free (90-day) | Production datastore |
| `abu-rabee-api`    | Node web service | Free | Express + Prisma + Socket.io |
| `abu-rabee-client` | Static site | Free | Vite SPA, pre-built with `VITE_API_URL` |

**Deploy steps (≈ 5 minutes):**

1. **Push this repo to GitHub** (already done if you cloned from the PR).
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New** →
   **Blueprint** → connect your GitHub repo and pick the `Abu-rabee` branch.
3. Render reads `render.yaml`, creates the database, builds both services
   and wires `DATABASE_URL` automatically. JWT_SECRET is auto-generated.
4. **First-run seed (optional)** — open the API service in Render and run
   `npm run seed` from the Shell tab to create the demo users:

   | email | password | role |
   |---|---|---|
   | `admin@aburabee.gov`  | `admin1234`  | admin  |
   | `staff@aburabee.gov`  | `staff1234`  | staff  |
   | `viewer@aburabee.gov` | `viewer1234` | viewer |

5. Visit the static site URL (default `https://abu-rabee-client.onrender.com`),
   sign in, and you're live.

**Region / domain:** edit `region:` in `render.yaml` (default `frankfurt`)
to use the closest Render region. If you bring a custom domain, set
`CLIENT_ORIGIN` (API service) and `VITE_API_URL` (static site) to the new
URLs and redeploy — `VITE_API_URL` is build-time, so it must be set before
the static site rebuilds.

**Cold starts:** the free Web Service plan sleeps after ~15 min of
inactivity. The first request after a sleep takes ~30 s to wake. Upgrade
to **Starter** ($7/mo) for always-on.

**Database lifetime:** the free PostgreSQL plan deletes the database after
90 days. Upgrade to a paid plan ($7/mo) for persistence, or take regular
backups via the Render dashboard or `server/scripts/backup.sh` (works
against the connection string too — just point `DB_PATH` accordingly).

### Option E — Self-hosted SPA only (Docker + Nginx)

If you don't need the backend (localStorage mode), build just the frontend:

```bash
docker build -t abu-rabee-client .
docker run --rm -p 8080:80 abu-rabee-client
# → http://localhost:8080
```

The Nginx config sets cache-control for hashed assets, an SPA fallback, gzip,
and a few security headers.

### Sub-path deployments

If you serve the app under a sub-path (`/abu-rabee/`), build with `VITE_BASE` set:

```bash
VITE_BASE=/abu-rabee/ npm run build
```

Both `<base>` paths and the React Router `basename` pick up the value automatically (via `import.meta.env.BASE_URL`).

## Backend features (when `VITE_API_URL` is set)

- **JWT cookie auth** with rotating refresh tokens. *Remember me* extends
  the refresh TTL from 7 to 30 days; logout revokes the active token.
- **Role-based access**: `admin`, `staff` (read+write), `viewer` (read-only).
  The first registered user is auto-promoted to admin.
- **REST API** for committees, requests, tasks, comments, activity, sub-tasks
  and dependencies (cycle-detected on the server).
- **Realtime** updates over Socket.io: writes broadcast `data:changed`,
  every connected client refetches the affected entity.
- **Saved filter presets** per user (committees / requests / tasks pages).
- **Full activity log** filterable by entity, action, user, free text and
  date range — paged on the server, exportable to CSV.
- **Email notifications** via Nodemailer (smtp / json / noop transports)
  fire on task assignment and on new comments mentioning the assignee.
- **OpenAPI 3.0** spec served at `/api/openapi.json` and rendered in
  **Swagger UI** at `/api/docs`.

See [`server/README.md`](./server/README.md) for the full endpoint list.

## Continuous Integration

`.github/workflows/ci.yml` runs the full pipeline on every push and pull
request to `main`:

1. **Frontend** — typecheck → vitest → vite build → upload `dist/`.
2. **Server** — install deps → `prisma generate` → typecheck → vitest
   (with isolated SQLite test DB).

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
