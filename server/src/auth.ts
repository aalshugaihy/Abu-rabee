import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction, CookieOptions } from 'express';
import { prisma } from './db.js';

export type Role = 'admin' | 'staff' | 'viewer';
const ROLES: ReadonlyArray<Role> = ['admin', 'staff', 'viewer'];
export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

const ACCESS_COOKIE = 'ab_token';
const REFRESH_COOKIE = 'ab_refresh';
const ACCESS_TTL_SECONDS = 60 * 15; // 15 minutes
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const REFRESH_TTL_REMEMBER_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  return process.env.JWT_SECRET || 'dev-secret-change-me';
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function signAccess(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role }, secret(), {
    expiresIn: ACCESS_TTL_SECONDS,
  });
}

type SameSite = 'lax' | 'strict' | 'none';
function cookieSameSite(): SameSite {
  const v = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  if (v === 'none' || v === 'strict' || v === 'lax') return v;
  return 'lax';
}
function cookieSecure(): boolean {
  // SameSite=None requires Secure. Also default to Secure in production.
  if (cookieSameSite() === 'none') return true;
  return process.env.NODE_ENV === 'production';
}

function baseCookieOptions(maxAgeSeconds: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: cookieSameSite(),
    secure: cookieSecure(),
    maxAge: maxAgeSeconds * 1000,
    path: '/',
  };
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Mint and persist a new refresh token. The token itself is stored only as a
 * SHA-256 hash so a leaked DB row cannot be replayed.
 */
async function mintRefreshToken(userId: string, rememberMe: boolean): Promise<string> {
  const ttl = rememberMe ? REFRESH_TTL_REMEMBER_SECONDS : REFRESH_TTL_SECONDS;
  const token = randomBytes(48).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttl * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt, rememberMe },
  });
  return token;
}

export async function issueSession(res: Response, user: AuthUser, rememberMe = false): Promise<void> {
  const access = signAccess(user);
  const refresh = await mintRefreshToken(user.id, rememberMe);
  const refreshTtl = rememberMe ? REFRESH_TTL_REMEMBER_SECONDS : REFRESH_TTL_SECONDS;
  res.cookie(ACCESS_COOKIE, access, baseCookieOptions(ACCESS_TTL_SECONDS));
  res.cookie(REFRESH_COOKIE, refresh, baseCookieOptions(refreshTtl));
}

export async function rotateRefresh(req: Request, res: Response): Promise<AuthUser | null> {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return null;
  const tokenHash = hashToken(token);
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!row || row.revokedAt || row.expiresAt < new Date()) return null;

  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user) return null;

  // Rotate: revoke this token and issue a new pair.
  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });
  const role = isRole(user.role) ? user.role : 'viewer';
  const auth: AuthUser = { id: user.id, email: user.email, name: user.name, role };
  await issueSession(res, auth, row.rememberMe);
  return auth;
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function clearSession(res: Response, req?: Request): Promise<void> {
  if (req) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      const tokenHash = hashToken(token);
      await prisma.refreshToken
        .update({ where: { tokenHash }, data: { revokedAt: new Date() } })
        .catch(() => null);
    }
  }
  res.clearCookie(ACCESS_COOKIE, { ...baseCookieOptions(0), maxAge: 0 });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookieOptions(0), maxAge: 0 });
}

export function readAuthCookie(req: Request): AuthUser | null {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret()) as jwt.JwtPayload;
    if (!payload.sub || typeof payload.sub !== 'string') return null;
    const role = isRole(payload.role) ? payload.role : 'viewer';
    return {
      id: payload.sub,
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role,
    };
  } catch {
    return null;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = readAuthCookie(req);
  if (!user) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(...roles: Role[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'forbidden', need: roles });
      return;
    }
    next();
  };
}

export const canWrite = requireRole('admin', 'staff');
export const canAdmin = requireRole('admin');
