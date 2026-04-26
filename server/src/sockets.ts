import type { Server as IOServer } from 'socket.io';

let io: IOServer | null = null;

export function setIo(server: IOServer): void {
  io = server;
}

/**
 * Broadcast a change event to all connected clients. The frontend listens for
 * "data:changed" and refetches the affected entity collection.
 */
export function broadcast(entity: 'committee' | 'request' | 'task' | 'comment' | 'activity', action: 'create' | 'update' | 'delete' | 'sync'): void {
  if (!io) return;
  io.emit('data:changed', { entity, action, at: new Date().toISOString() });
}
