import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

/**
 * Filterable activity log with paging.
 *
 *   /api/activity?entity=task&action=update&from=2026-01-01&to=2026-04-30&q=marine&page=1&limit=50
 *
 * `from` / `to` are inclusive ISO dates; `q` is a free-text match on the
 * `label` column. Returns `{ items, total, page, limit }`.
 */
router.get('/', async (req, res) => {
  const { entity, action, entityId, q, from, to, userId } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 50), 200);

  const where: {
    entity?: string;
    action?: string;
    entityId?: string;
    userId?: string;
    label?: { contains: string };
    at?: { gte?: Date; lte?: Date };
  } = {};
  if (typeof entity === 'string') where.entity = entity;
  if (typeof action === 'string') where.action = action;
  if (typeof entityId === 'string') where.entityId = entityId;
  if (typeof userId === 'string') where.userId = userId;
  if (typeof q === 'string' && q.trim()) where.label = { contains: q.trim() };
  if (typeof from === 'string' || typeof to === 'string') {
    where.at = {};
    if (typeof from === 'string' && from) where.at.gte = new Date(from);
    if (typeof to === 'string' && to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.at.lte = end;
    }
  }

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);

  res.json({ items, total, page, limit });
});

export default router;
