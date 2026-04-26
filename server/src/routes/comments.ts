import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { canWrite, requireAuth } from '../auth.js';
import { broadcast } from '../sockets.js';
import { sendEmail } from '../email.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { entity, entityId } = req.query;
  const where: { entity?: string; entityId?: string } = {};
  if (typeof entity === 'string') where.entity = entity;
  if (typeof entityId === 'string') where.entityId = entityId;
  const items = await prisma.comment.findMany({ where, orderBy: { at: 'desc' } });
  res.json(items);
});

const createSchema = z.object({
  entity: z.enum(['committee', 'request', 'task']),
  entityId: z.string().min(1),
  text: z.string().min(1),
});

router.post('/', canWrite, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const created = await prisma.comment.create({
    data: {
      ...parsed.data,
      authorId: req.user!.id,
      authorName: req.user!.name,
    },
  });
  broadcast('comment', 'create');

  // Notify the task assignee (if any and not the same person) — fire-and-forget.
  if (created.entity === 'task') {
    prisma.task.findUnique({ where: { id: created.entityId } }).then((task) => {
      if (!task?.assignee || task.assignee === req.user?.name) return;
      // Try to find a matching user by display name.
      prisma.user.findFirst({ where: { name: task.assignee } }).then((u) => {
        if (!u) return;
        sendEmail({
          to: u.email,
          subject: `[${task.id}] new comment from ${created.authorName}`,
          text: `${created.text}\n\n— ${created.authorName}`,
        }).catch(() => null);
      });
    });
  }

  res.status(201).json(created);
});

router.delete('/:id', canWrite, async (req, res) => {
  const item = await prisma.comment.findUnique({ where: { id: req.params.id } });
  if (!item) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  // Only the author or an admin may delete a comment.
  if (item.authorId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  await prisma.comment.delete({ where: { id: req.params.id } });
  broadcast('comment', 'delete');
  res.status(204).end();
});

export default router;
