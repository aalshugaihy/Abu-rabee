/**
 * Validate production-only configuration up front. We refuse to boot if the
 * server would otherwise accept dangerous defaults (e.g. the dev JWT secret),
 * and we warn loudly about misconfiguration that would silently break login
 * (no DATABASE_URL, missing CLIENT_ORIGIN in cross-origin deploys, etc).
 */
const DEFAULT_JWT_SECRET = 'dev-secret-change-me';

export function assertProductionConfig(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_SECRET) {
    errors.push(
      'JWT_SECRET is missing or set to the dev default. Set a long random value (Render: envVars → generateValue: true does this for you).'
    );
  } else if (process.env.JWT_SECRET.length < 32) {
    warnings.push(`JWT_SECRET is shorter than 32 characters (${process.env.JWT_SECRET.length}). Use at least 32.`);
  }

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is missing.');
  }

  if (!process.env.CLIENT_ORIGIN) {
    warnings.push(
      'CLIENT_ORIGIN is not set; CORS will only accept the localhost dev origin. Set it to your frontend URL.'
    );
  }

  // SameSite=None requires Secure cookies. Render serves over HTTPS, but the
  // app's `secure` flag is bound to NODE_ENV=production OR SameSite=None, so
  // this is mostly a sanity check.
  const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  if (sameSite === 'none' && process.env.NODE_ENV !== 'production') {
    warnings.push('COOKIE_SAMESITE=none requires HTTPS; this only works in production.');
  }

  if (warnings.length) {
    // eslint-disable-next-line no-console
    console.warn('[abu-rabee] config warnings:\n  - ' + warnings.join('\n  - '));
  }
  if (errors.length) {
    // eslint-disable-next-line no-console
    console.error('[abu-rabee] refusing to boot in production:\n  - ' + errors.join('\n  - '));
    process.exit(1);
  }
}
