import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction, CookieOptions } from 'express';

export type Role = 'admin' | 'staff' | 'viewer';
const ROLES: ReadonlyArray<Role> = ['admin', 'staff', 'viewer'];
export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

const COOKIE = 'ab_token';
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

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

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role }, secret(), {
    expiresIn: TTL_SECONDS,
  });
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TTL_SECONDS * 1000,
    path: '/',
  };
}

export function setAuthCookie(res: Response, user: AuthUser): void {
  res.cookie(COOKIE, signToken(user), cookieOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE, { ...cookieOptions(), maxAge: 0 });
}

export function readAuthCookie(req: Request): AuthUser | null {
  const token = req.cookies?.[COOKIE];
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

/** Anyone can read; staff/admin can write. Use for resource-level write guards. */
export const canWrite = requireRole('admin', 'staff');
export const canAdmin = requireRole('admin');
