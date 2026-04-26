import http from 'node:http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server as IOServer } from 'socket.io';
import { setIo } from './sockets.js';

import authRoutes from './routes/auth.js';
import committeesRoutes from './routes/committees.js';
import requestsRoutes from './routes/requests.js';
import tasksRoutes from './routes/tasks.js';
import commentsRoutes from './routes/comments.js';
import activityRoutes from './routes/activity.js';

const PORT = Number(process.env.PORT) || 4000;
const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
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

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

// Centralized error handler — keeps the response shape consistent.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server error]', err);
  res.status(500).json({ error: 'server_error' });
});

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: ORIGIN, credentials: true },
});
setIo(io);

io.on('connection', (socket) => {
  socket.emit('hello', { at: new Date().toISOString() });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`abu-rabee server listening on :${PORT}, allow-origin: ${ORIGIN}`);
});
