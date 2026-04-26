import { Router } from 'express';
import { prisma } from '../db.js';
import { canWrite, requireAuth } from '../auth.js';
import { broadcast } from '../sockets.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  const items = await prisma.requestRecord.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
});

router.get('/:id', async (req, res) => {
  const item = await prisma.requestRecord.findUnique({ where: { id: req.params.id } });
  if (!item) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json(item);
});

router.post('/', canWrite, async (req, res) => {
  const body = req.body ?? {};
  const id = body.id || `REQ-${new Date().getFullYear()}-${Date.now()}`;
  const created = await prisma.requestRecord.create({
    data: {
      id,
      name: body.name ?? '',
      type: body.type ?? null,
      requester: body.requester ?? null,
      classification: body.classification ?? null,
      priority: body.priority ?? null,
      sector: body.sector ?? null,
      department: body.department ?? null,
      purpose: body.purpose ?? null,
      direction: body.direction ?? null,
      txnNumber: body.txnNumber ?? null,
      txnName: body.txnName ?? null,
      status: body.status ?? 'new',
      owner: body.owner ?? null,
      date: body.date ?? null,
      dueDate: body.dueDate ?? null,
    },
  });
  await prisma.activityLog.create({
    data: { entity: 'request', action: 'create', entityId: created.id, label: created.name, userId: req.user!.id },
  });
  broadcast('request', 'create');
  res.status(201).json(created);
});

router.patch('/:id', canWrite, async (req, res) => {
  const updated = await prisma.requestRecord.update({
    where: { id: req.params.id },
    data: req.body ?? {},
  });
  await prisma.activityLog.create({
    data: { entity: 'request', action: 'update', entityId: updated.id, label: updated.name, userId: req.user!.id },
  });
  broadcast('request', 'update');
  res.json(updated);
});

router.delete('/:id', canWrite, async (req, res) => {
  const removed = await prisma.requestRecord
    .delete({ where: { id: req.params.id } })
    .catch(() => null);
  if (!removed) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  await prisma.activityLog.create({
    data: { entity: 'request', action: 'delete', entityId: removed.id, label: removed.name, userId: req.user!.id },
  });
  broadcast('request', 'delete');
  res.status(204).end();
});

export default router;
