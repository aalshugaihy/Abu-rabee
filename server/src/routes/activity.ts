import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { entity, entityId, limit } = req.query;
  const take = Math.min(Number(limit) || 100, 500);
  const where: { entity?: string; entityId?: string } = {};
  if (typeof entity === 'string') where.entity = entity;
  if (typeof entityId === 'string') where.entityId = entityId;
  const items = await prisma.activityLog.findMany({ where, orderBy: { at: 'desc' }, take });
  res.json(items);
});

export default router;
