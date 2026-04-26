import http from 'node:http';
import { Server as IOServer } from 'socket.io';
import { createApp } from './app.js';
import { setIo } from './sockets.js';

const PORT = Number(process.env.PORT) || 4000;
const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = createApp();
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
