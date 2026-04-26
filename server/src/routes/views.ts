import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const where: { userId: string; page?: string } = { userId: req.user!.id };
  const page = req.query.page;
  if (typeof page === 'string') where.page = page;
  const items = await prisma.savedView.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});

const createSchema = z.object({
  page: z.string().min(1),
  name: z.string().min(1),
  filters: z.record(z.unknown()),
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const created = await prisma.savedView.create({
    data: {
      userId: req.user!.id,
      page: parsed.data.page,
      name: parsed.data.name,
      filters: JSON.stringify(parsed.data.filters),
    },
  });
  res.status(201).json(created);
});

router.delete('/:id', async (req, res) => {
  // Only the owner may delete their own view.
  const view = await prisma.savedView.findUnique({ where: { id: req.params.id } });
  if (!view || view.userId !== req.user!.id) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  await prisma.savedView.delete({ where: { id: view.id } });
  res.status(204).end();
});

export default router;
