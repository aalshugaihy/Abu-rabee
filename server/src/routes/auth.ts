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

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

router.post('/register', async (req, res) => {
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

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const { email, password, rememberMe } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }
  const role: Role = isRole(user.role) ? user.role : 'viewer';
  await issueSession(res, { id: user.id, email: user.email, name: user.name, role }, !!rememberMe);
  res.json({ id: user.id, email: user.email, name: user.name, role });
});

router.post('/logout', async (req, res) => {
  await clearSession(res, req);
  res.json({ ok: true });
});

router.post('/refresh', async (req, res) => {
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
