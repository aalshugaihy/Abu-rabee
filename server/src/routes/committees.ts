import { Router } from 'express';
import { prisma } from '../db.js';
import { canWrite, requireAuth } from '../auth.js';
import { broadcast } from '../sockets.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  const items = await prisma.committee.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
});

router.get('/:id', async (req, res) => {
  const item = await prisma.committee.findUnique({ where: { id: req.params.id } });
  if (!item) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json(item);
});

router.post('/', canWrite, async (req, res) => {
  const body = req.body ?? {};
  const id = body.id || `CMT-${Date.now()}`;
  const created = await prisma.committee.create({
    data: {
      id,
      name: body.name ?? '',
      nameEn: body.nameEn ?? null,
      type: body.type ?? null,
      scope: body.scope ?? 'internal',
      department: body.department ?? null,
      sector: body.sector ?? null,
      representative: body.representative ?? null,
      head: body.head ?? null,
      organizer: body.organizer ?? null,
      members: body.members ?? null,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      status: body.status ?? 'forming',
      active: body.active ?? true,
      confidentiality: body.confidentiality ?? null,
      budget: body.budget ?? null,
      notes: body.notes ?? null,
    },
  });
  await prisma.activityLog.create({
    data: { entity: 'committee', action: 'create', entityId: created.id, label: created.name, userId: req.user!.id },
  });
  broadcast('committee', 'create');
  res.status(201).json(created);
});

router.patch('/:id', canWrite, async (req, res) => {
  const updated = await prisma.committee.update({
    where: { id: req.params.id },
    data: req.body ?? {},
  });
  await prisma.activityLog.create({
    data: { entity: 'committee', action: 'update', entityId: updated.id, label: updated.name, userId: req.user!.id },
  });
  broadcast('committee', 'update');
  res.json(updated);
});

router.delete('/:id', canWrite, async (req, res) => {
  const removed = await prisma.committee
    .delete({ where: { id: req.params.id } })
    .catch(() => null);
  if (!removed) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  await prisma.activityLog.create({
    data: { entity: 'committee', action: 'delete', entityId: removed.id, label: removed.name, userId: req.user!.id },
  });
  broadcast('committee', 'delete');
  res.status(204).end();
});

export default router;
