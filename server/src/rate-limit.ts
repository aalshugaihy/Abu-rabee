import type { Request, Response, NextFunction } from 'express';

/**
 * Tiny in-memory rate limiter — sliding-window-ish counter per (IP, route).
 * Good enough for protecting auth endpoints in a single-process deployment.
 * For multi-instance setups use a Redis-backed limiter instead.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export interface LimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export function rateLimit(options: LimitOptions) {
  const { windowMs, max, keyPrefix = 'rl' } = options;
  return function (req: Request, res: Response, next: NextFunction): void {
    // Disable in tests so they aren't flaky around the global counter.
    if (process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT_DISABLED === '1') {
      next();
      return;
    }
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const key = `${keyPrefix}:${ip}:${req.path}`;
    const now = Date.now();
    const bucket = store.get(key);
    if (!bucket || bucket.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > max) {
        const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
        res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
        res.status(429).json({ error: 'rate_limited', retryAfter });
        return;
      }
    }
    next();
  };
}

// Periodically drop expired buckets so the map doesn't grow unbounded under
// long uptimes. setInterval is unref()ed so it doesn't keep the event loop alive.
const gc = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt < now) store.delete(key);
  }
}, 60_000);
gc.unref();
