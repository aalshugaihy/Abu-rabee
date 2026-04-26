import { apiAvailable } from './api';

type Listener = (event: { entity: string; action: string; at: string }) => void;

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export type SocketHandle = {
  available: boolean;
  status: 'connecting' | 'connected' | 'disconnected';
  onChange: (listener: Listener) => () => void;
  onStatus: (listener: (s: SocketHandle['status']) => void) => () => void;
  close: () => void;
};

/**
 * Lazily-loaded Socket.io client. The library is imported only when the API
 * URL is configured, so apps in localStorage mode never pay the bundle cost.
 */
let handle: SocketHandle | null = null;

export function getSocket(): SocketHandle {
  if (handle) return handle;

  let status: SocketHandle['status'] = apiAvailable ? 'connecting' : 'disconnected';
  const dataListeners = new Set<Listener>();
  const statusListeners = new Set<(s: SocketHandle['status']) => void>();

  const setStatus = (s: SocketHandle['status']) => {
    status = s;
    statusListeners.forEach((l) => l(status));
  };

  let socket: { close: () => void } | null = null;

  if (apiAvailable) {
    // Dynamic import so the dependency is tree-shaken away when not used.
    import('socket.io-client')
      .then(({ io }) => {
        const s = io(BASE, { withCredentials: true, transports: ['websocket', 'polling'] });
        socket = s;
        s.on('connect', () => setStatus('connected'));
        s.on('disconnect', () => setStatus('disconnected'));
        s.on('connect_error', () => setStatus('disconnected'));
        s.on('data:changed', (event: { entity: string; action: string; at: string }) => {
          dataListeners.forEach((l) => l(event));
        });
      })
      .catch(() => setStatus('disconnected'));
  }

  handle = {
    available: apiAvailable,
    get status() {
      return status;
    },
    onChange(listener) {
      dataListeners.add(listener);
      return () => dataListeners.delete(listener);
    },
    onStatus(listener) {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    close() {
      socket?.close();
      socket = null;
      handle = null;
    },
  } as SocketHandle;

  return handle;
}
