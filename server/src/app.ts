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

/**
 * Build a fresh Express app with all routes mounted but without binding to
 * a port. Tests inject this directly into supertest; production wraps it in
 * `index.ts` which adds the http+socket.io server.
 */
export function createApp(): express.Express {
  const app = express();
  const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  app.use(cors({ origin: ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, at: new Date().toISOString() }));

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
