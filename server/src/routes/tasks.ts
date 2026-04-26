import { Router } from 'express';
import { prisma } from '../db.js';
import { canWrite, requireAuth } from '../auth.js';
import { broadcast } from '../sockets.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    include: { blockedBy: true, children: { select: { id: true } } },
  });
  res.json(tasks);
});

router.get('/:id', async (req, res) => {
  const t = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      committee: true,
      parent: { select: { id: true, title: true } },
      children: { orderBy: { createdAt: 'asc' } },
      blockedBy: { include: { dependsOn: { select: { id: true, title: true, status: true } } } },
      blocks: { include: { task: { select: { id: true, title: true } } } },
    },
  });
  if (!t) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json(t);
});

router.post('/', canWrite, async (req, res) => {
  const body = req.body ?? {};
  const prefix = body.kind === 'routine' ? 'TSK-R' : 'TSK-T';
  const id = body.id || `${prefix}-${Date.now()}`;
  const created = await prisma.task.create({
    data: {
      id,
      title: body.title ?? '',
      description: body.description ?? null,
      kind: body.kind ?? 'team',
      team: body.team ?? null,
      committeeId: body.committeeId ?? null,
      department: body.department ?? null,
      assignee: body.assignee ?? null,
      priority: body.priority ?? 'medium',
      status: body.status ?? 'planned',
      frequency: body.frequency ?? null,
      dueDate: body.dueDate ?? null,
      lastRun: body.lastRun ?? null,
      nextRun: body.nextRun ?? null,
      progress: body.progress ?? 0,
      parentTaskId: body.parentTaskId ?? null,
    },
  });
  await prisma.activityLog.create({
    data: { entity: 'task', action: 'create', entityId: created.id, label: created.title, userId: req.user!.id },
  });
  broadcast('task', 'create');
  res.status(201).json(created);
});

router.patch('/:id', canWrite, async (req, res) => {
  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data: req.body ?? {},
  });
  await prisma.activityLog.create({
    data: { entity: 'task', action: 'update', entityId: updated.id, label: updated.title, userId: req.user!.id },
  });
  broadcast('task', 'update');
  res.json(updated);
});

router.delete('/:id', canWrite, async (req, res) => {
  const removed = await prisma.task.delete({ where: { id: req.params.id } }).catch(() => null);
  if (!removed) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  await prisma.activityLog.create({
    data: { entity: 'task', action: 'delete', entityId: removed.id, label: removed.title, userId: req.user!.id },
  });
  broadcast('task', 'delete');
  res.status(204).end();
});

// --- Sub-tasks ---------------------------------------------------------------

router.get('/:id/subtasks', async (req, res) => {
  const subs = await prisma.task.findMany({
    where: { parentTaskId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json(subs);
});

// --- Dependencies ------------------------------------------------------------

router.get('/:id/dependencies', async (req, res) => {
  const deps = await prisma.taskDependency.findMany({
    where: { taskId: req.params.id },
    include: { dependsOn: { select: { id: true, title: true, status: true } } },
  });
  res.json(deps);
});

router.post('/:id/dependencies', canWrite, async (req, res) => {
  const dependsOnId = String(req.body?.dependsOnId ?? '');
  if (!dependsOnId || dependsOnId === req.params.id) {
    res.status(400).json({ error: 'invalid_dependency' });
    return;
  }

  // Cycle check: walk the existing dependency graph from `dependsOnId` and
  // refuse if it eventually reaches the task we're adding the dep on.
  const visited = new Set<string>();
  async function leadsTo(start: string, target: string): Promise<boolean> {
    if (start === target) return true;
    if (visited.has(start)) return false;
    visited.add(start);
    const next = await prisma.taskDependency.findMany({
      where: { taskId: start },
      select: { dependsOnId: true },
    });
    for (const n of next) {
      if (await leadsTo(n.dependsOnId, target)) return true;
    }
    return false;
  }
  if (await leadsTo(dependsOnId, req.params.id)) {
    res.status(400).json({ error: 'cycle_detected' });
    return;
  }

  const dep = await prisma.taskDependency.create({
    data: { taskId: req.params.id, dependsOnId },
    include: { dependsOn: { select: { id: true, title: true, status: true } } },
  });
  broadcast('task', 'update');
  res.status(201).json(dep);
});

router.delete('/:id/dependencies/:depId', canWrite, async (req, res) => {
  await prisma.taskDependency.delete({ where: { id: req.params.depId } }).catch(() => null);
  broadcast('task', 'update');
  res.status(204).end();
});

export default router;
