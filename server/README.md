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
