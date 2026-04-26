import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../db.js';

const app = createApp();
let cookie = '';

beforeAll(async () => {
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'a@activity.test', password: 'password123', name: 'Activity Admin' });
  cookie = (reg.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');

  // Generate a few activity entries via task creation.
  for (let i = 0; i < 5; i++) {
    await request(app).post('/api/tasks').set('Cookie', cookie).send({ title: `Task ${i}`, kind: 'team' });
  }
});

afterAll(async () => prisma.$disconnect());

describe('activity log filters', () => {
  it('returns paginated results', async () => {
    const res = await request(app).get('/api/activity?limit=2').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(2);
    expect(res.body.total).toBeGreaterThanOrEqual(5);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
  });

  it('filters by entity', async () => {
    const res = await request(app).get('/api/activity?entity=task').set('Cookie', cookie);
    expect(res.body.items.every((e: { entity: string }) => e.entity === 'task')).toBe(true);
  });

  it('filters by action', async () => {
    const res = await request(app).get('/api/activity?action=create').set('Cookie', cookie);
    expect(res.body.items.every((e: { action: string }) => e.action === 'create')).toBe(true);
  });

  it('filters by free-text label', async () => {
    const res = await request(app).get('/api/activity?q=Task%201').set('Cookie', cookie);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].label).toContain('Task 1');
  });
});
