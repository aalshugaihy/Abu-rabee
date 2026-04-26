import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../db.js';

const app = createApp();

let adminCookie = '';
let viewerCookie = '';

beforeAll(async () => {
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create an admin (first registered user is auto-admin) and a viewer.
  const admin = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin@test.com', password: 'password123', name: 'Admin' });
  adminCookie = admin.headers['set-cookie'][0].split(';')[0];

  const staff = await request(app)
    .post('/api/auth/register')
    .send({ email: 'viewer@test.com', password: 'password123', name: 'Viewer' });
  // Demote to viewer.
  await prisma.user.update({ where: { email: 'viewer@test.com' }, data: { role: 'viewer' } });
  // Re-login to mint a viewer-flavoured token.
  const re = await request(app)
    .post('/api/auth/login')
    .send({ email: 'viewer@test.com', password: 'password123' });
  viewerCookie = re.headers['set-cookie'][0].split(';')[0];
  void staff;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('tasks CRUD + dependencies', () => {
  let createdId = '';
  let blockerId = '';

  it('viewer cannot create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', viewerCookie)
      .send({ title: 'denied', kind: 'team' });
    expect(res.status).toBe(403);
  });

  it('admin can create tasks', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', adminCookie)
      .send({ title: 'Root task', kind: 'team' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Root task');
    createdId = res.body.id;

    const second = await request(app)
      .post('/api/tasks')
      .set('Cookie', adminCookie)
      .send({ title: 'Blocker', kind: 'team' });
    blockerId = second.body.id;
  });

  it('lists tasks for an authenticated viewer', async () => {
    const res = await request(app).get('/api/tasks').set('Cookie', viewerCookie);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('creates a dependency and rejects cycles', async () => {
    const ok = await request(app)
      .post(`/api/tasks/${createdId}/dependencies`)
      .set('Cookie', adminCookie)
      .send({ dependsOnId: blockerId });
    expect(ok.status).toBe(201);

    // Try to make blocker depend on createdId — that would create a cycle.
    const bad = await request(app)
      .post(`/api/tasks/${blockerId}/dependencies`)
      .set('Cookie', adminCookie)
      .send({ dependsOnId: createdId });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe('cycle_detected');
  });

  it('deletes a task', async () => {
    const res = await request(app).delete(`/api/tasks/${createdId}`).set('Cookie', adminCookie);
    expect(res.status).toBe(204);
    const after = await request(app).get(`/api/tasks/${createdId}`).set('Cookie', adminCookie);
    expect(after.status).toBe(404);
  });
});
