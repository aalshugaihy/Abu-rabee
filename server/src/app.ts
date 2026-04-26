import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/auth.js';
import committeesRoutes from './routes/committees.js';
import requestsRoutes from './routes/requests.js';
import tasksRoutes from './routes/tasks.js';
import commentsRoutes from './routes/comments.js';
import activityRoutes from './routes/activity.js';
import viewsRoutes from './routes/views.js';
import { openApiSpec } from './openapi.js';
import { prisma } from './db.js';

/**
 * Build a fresh Express app with all routes mounted but without binding to
 * a port. Tests inject this directly into supertest; production wraps it in
 * `index.ts` which adds the http+socket.io server.
 */
/**
 * Build the CORS origin matcher. Accepts:
 *   - empty / "*"   → mirror the request origin (good for local + Render)
 *   - "a, b, c"     → exact list
 *   - "https://*.example.com" → wildcard subdomain (single asterisk only)
 */
function buildCorsOrigin(spec: string | undefined): cors.CorsOptions['origin'] {
  if (!spec || spec.trim() === '' || spec.trim() === '*') return true;
  const entries = spec.split(',').map((s) => s.trim()).filter(Boolean);
  const exact = new Set<string>();
  const patterns: RegExp[] = [];
  for (const entry of entries) {
    if (entry.includes('*')) {
      const escaped = entry.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
      patterns.push(new RegExp(`^${escaped}$`));
    } else {
      exact.add(entry);
    }
  }
  return (origin, callback) => {
    if (!origin) return callback(null, true);
    if (exact.has(origin)) return callback(null, true);
    if (patterns.some((re) => re.test(origin))) return callback(null, true);
    // Reject by withholding the Access-Control-Allow-Origin header — the
    // browser then blocks the request itself. Returning an Error here would
    // bubble to the 500 handler, which is uglier than a clean CORS denial.
    return callback(null, false);
  };
}

export function createApp(): express.Express {
  const app = express();
  const origin = buildCorsOrigin(process.env.CLIENT_ORIGIN || 'http://localhost:5173');

  app.set('trust proxy', 1); // Render terminates TLS upstream
  app.use(cors({ origin, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  // Liveness probe — process is up. No DB hit so it can't fail on transient
  // database hiccups.
  app.get('/health', (_req, res) => res.json({ ok: true, at: new Date().toISOString() }));

  // Readiness probe — actually pings the DB. 503 if SQLite is unreachable.
  app.get('/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, db: 'up', at: new Date().toISOString() });
    } catch (err) {
      res.status(503).json({ ok: false, db: 'down', error: (err as Error).message });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/committees', committeesRoutes);
  app.use('/api/requests', requestsRoutes);
  app.use('/api/tasks', tasksRoutes);
  app.use('/api/comments', commentsRoutes);
  app.use('/api/activity', activityRoutes);
  app.use('/api/views', viewsRoutes);

  // Swagger UI under /api/docs (raw spec also at /api/openapi.json).
  app.get('/api/openapi.json', (_req, res) => res.json(openApiSpec));
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: 'Abu-Rabee API',
      swaggerOptions: { persistAuthorization: true },
    })
  );

  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // eslint-disable-next-line no-console
    console.error('[server error]', err);
    res.status(500).json({ error: 'server_error' });
  });

  return app;
}
