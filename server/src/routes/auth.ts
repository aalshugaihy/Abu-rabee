import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import {
  clearSession,
  hashPassword,
  isRole,
  issueSession,
  readAuthCookie,
  requireAuth,
  rotateRefresh,
  verifyPassword,
  type Role,
} from '../auth.js';
import { sendEmail } from '../email.js';
import { rateLimit } from '../rate-limit.js';

const router = Router();

// Hard limits on auth-shaped endpoints to slow brute-force attacks.
const authLimit = rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'auth' });
const refreshLimit = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'refresh' });

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

router.post('/register', authLimit, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', issues: parsed.error.format() });
    return;
  }
  const { email, password, name, rememberMe } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'email_taken' });
    return;
  }
  const userCount = await prisma.user.count();
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      role: userCount === 0 ? 'admin' : 'staff',
    },
  });
  const role: Role = isRole(user.role) ? user.role : 'viewer';
  await issueSession(res, { id: user.id, email: user.email, name: user.name, role }, !!rememberMe);
  // Fire-and-forget welcome email.
  sendEmail({
    to: user.email,
    subject: 'Welcome to Abu-Rabee',
    text: `Hi ${user.name}, your ${role} account is ready.`,
  }).catch(() => null);
  res.json({ id: user.id, email: user.email, name: user.name, role });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

router.post('/login', authLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const { email, password, rememberMe } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    // Log failed attempts so admins can see them in the activity feed.
    if (user) {
      await prisma.activityLog
        .create({
          data: { entity: 'user', action: 'login_failed', entityId: user.id, label: email, userId: user.id },
        })
        .catch(() => null);
    }
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }
  const role: Role = isRole(user.role) ? user.role : 'viewer';
  await issueSession(res, { id: user.id, email: user.email, name: user.name, role }, !!rememberMe);
  await prisma.activityLog
    .create({
      data: { entity: 'user', action: 'login', entityId: user.id, label: user.name, userId: user.id },
    })
    .catch(() => null);
  res.json({ id: user.id, email: user.email, name: user.name, role });
});

router.post('/logout', async (req, res) => {
  const u = readAuthCookie(req);
  if (u) {
    await prisma.activityLog
      .create({ data: { entity: 'user', action: 'logout', entityId: u.id, label: u.name, userId: u.id } })
      .catch(() => null);
  }
  await clearSession(res, req);
  res.json({ ok: true });
});

router.post('/refresh', refreshLimit, async (req, res) => {
  const user = await rotateRefresh(req, res);
  if (!user) {
    await clearSession(res, req);
    res.status(401).json({ error: 'invalid_refresh' });
    return;
  }
  res.json(user);
});

router.get('/me', (req, res) => {
  const user = readAuthCookie(req);
  if (!user) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }
  res.json(user);
});

const profileSchema = z.object({ name: z.string().min(1).max(120) });
router.patch('/me', requireAuth, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name: parsed.data.name },
    select: { id: true, email: true, name: true, role: true },
  });
  // Re-issue the access cookie so the JWT picks up the new display name.
  const role: Role = isRole(updated.role) ? updated.role : 'viewer';
  await issueSession(res, { ...updated, role });
  res.json({ ...updated, role });
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
router.post('/change-password', requireAuth, async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    res.status(401).json({ error: 'invalid_password' });
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  // Revoke every other refresh token so other devices need to sign in again.
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  // Mint a fresh session for the current device.
  const role: Role = isRole(user.role) ? user.role : 'viewer';
  await issueSession(res, { id: user.id, email: user.email, name: user.name, role });
  res.json({ ok: true });
});

router.get('/users', requireAuth, async (req, res) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  res.json(users);
});

const updateRoleSchema = z.object({ role: z.enum(['admin', 'staff', 'viewer']) });
router.patch('/users/:id/role', requireAuth, async (req, res) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, name: true, role: true },
  });
  res.json(updated);
});

export default router;
