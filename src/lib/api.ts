/**
 * Thin fetch wrapper around the backend REST API. The base URL comes from
 * `VITE_API_URL` at build time; if it's not set, every helper resolves to
 * `null`, which the frontend treats as "no backend available, stay in local
 * mode". This lets the app keep working offline (localStorage) while the
 * backend is optional.
 */

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export const apiAvailable = Boolean(BASE);

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!apiAvailable) throw new Error('api_disabled');
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
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
  del: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
