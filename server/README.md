# abu-rabee server

Express + Prisma + SQLite + Socket.io API for the dashboard.

## Quick start

```bash
cd server
cp .env.example .env
npm install
npx prisma generate
npx prisma db push      # creates prisma/dev.db
npm run seed            # demo users (admin/staff/viewer) + a few entities
npm run dev             # starts on :4000
```

Then run the frontend in another terminal with:

```bash
VITE_API_URL=http://localhost:4000 npm run dev
```

## Demo accounts (after seed)

| email | password | role |
|---|---|---|
| `admin@aburabee.gov`  | `admin1234`  | admin  |
| `staff@aburabee.gov`  | `staff1234`  | staff  |
| `viewer@aburabee.gov` | `viewer1234` | viewer |

## REST endpoints

```
POST   /api/auth/register      register (first user becomes admin)
POST   /api/auth/login         login → sets http-only cookie
POST   /api/auth/logout        logout
GET    /api/auth/me            current user

GET    /api/committees         list / get / write / delete (admin & staff)
GET    /api/committees/:id
POST   /api/committees
PATCH  /api/committees/:id
DELETE /api/committees/:id

GET    /api/requests           ... same shape ...
GET    /api/tasks              ... + subtasks/dependencies endpoints
GET    /api/tasks/:id/subtasks
GET    /api/tasks/:id/dependencies
POST   /api/tasks/:id/dependencies     { dependsOnId }
DELETE /api/tasks/:id/dependencies/:depId

GET    /api/comments?entity=task&entityId=TSK-...
POST   /api/comments
DELETE /api/comments/:id

GET    /api/activity?entity=task&entityId=TSK-...
```

Realtime: clients connect to the same origin via Socket.io and listen
for `data:changed` events `{ entity, action, at }` to refetch.

## Backup & restore

Two helper scripts ship in `scripts/` for the SQLite database. `backup.sh`
uses SQLite's `VACUUM INTO` so it produces a consistent snapshot without
locking writers for long, and rotates backups (keeps the last 14):

```bash
# Backup
./scripts/backup.sh
# → wrote backups/abu-rabee-20260426T120000Z.db (96 KB)

# Restore (the current DB is moved aside to .replaced-<stamp>)
./scripts/restore.sh backups/abu-rabee-20260426T120000Z.db
```

Both scripts honour `DB_PATH` (default `prisma/dev.db`) and `BACKUP_DIR`
(default `backups`).

## Health endpoints

- `GET /health` — liveness, no DB hit. Always 200 if the process is up.
- `GET /ready` — readiness, runs `SELECT 1` against SQLite. Returns 503
  with `db: down` if the database is unreachable.

## Security

- Auth endpoints (`/login`, `/register`, `/refresh`) are rate-limited
  (10 req/min per IP per route, 30/min for refresh).
- Login attempts (success and failure) are recorded in the activity log
  under entity `user` with action `login` / `login_failed` / `logout`.
- Passwords are bcrypt-hashed (cost 10) and refresh tokens are stored
  as SHA-256 hashes — a leaked DB row alone cannot replay a session.
- Changing the password revokes every other refresh token immediately.
