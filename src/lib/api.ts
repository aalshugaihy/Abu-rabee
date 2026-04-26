/**
 * Thin fetch wrapper around the backend REST API. The base URL comes from
 * `VITE_API_URL` at build time; if it's not set, every helper rejects with
 * `api_disabled`, which the frontend treats as "no backend, stay local".
 *
 * Auto-refresh: a 401 response triggers a single attempt to call
 * `/api/auth/refresh` and replay the original request. Concurrent 401s share
 * the same in-flight refresh promise so we don't stampede the server.
 */

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export const apiAvailable = Boolean(BASE);

let refreshInFlight: Promise<boolean> | null = null;

async function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        // Allow another refresh attempt later (after the next 401 or login).
        setTimeout(() => {
          refreshInFlight = null;
        }, 100);
      });
  }
  return refreshInFlight;
}

async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' });
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!apiAvailable) throw new Error('api_disabled');

  let res = await rawFetch(path, init);

  // Don't recurse on the refresh endpoint itself.
  if (res.status === 401 && !path.endsWith('/api/auth/refresh') && !path.endsWith('/api/auth/me')) {
    const ok = await refreshOnce();
    if (ok) res = await rawFetch(path, init);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const message = (data && data.error) || `http_${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  base: BASE,
  available: apiAvailable,
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
