import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../db.js';

const app = createApp();
let cookieA = '';
let cookieB = '';

beforeAll(async () => {
  await prisma.savedView.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const a = await request(app)
    .post('/api/auth/register')
    .send({ email: 'a@views.test', password: 'password123', name: 'A' });
  cookieA = (a.headers['set-cookie'] as string[]).map((c) => c.split(';')[0]).join('; ');

  const b = await request(app)
    .post('/api/auth/register')
    .send({ email: 'b@views.test', password: 'password123', name: 'B' });
  cookieB = (b.headers['set-cookie'] as string[]).map((c) => c.split(';')[0]).join('; ');
});

afterAll(async () => prisma.$disconnect());

describe('saved views', () => {
  let viewId = '';

  it('creates a view scoped to the current user', async () => {
    const res = await request(app)
      .post('/api/views')
      .set('Cookie', cookieA)
      .send({ page: 'requests', name: 'مفتوحة عاجلة', filters: { status: ['new'], priority: 'high' } });
    expect(res.status).toBe(201);
    viewId = res.body.id;
  });

  it('lists only the caller views', async () => {
    const a = await request(app).get('/api/views?page=requests').set('Cookie', cookieA);
    expect(a.status).toBe(200);
    expect(a.body.length).toBe(1);

    const b = await request(app).get('/api/views?page=requests').set('Cookie', cookieB);
    expect(b.status).toBe(200);
    expect(b.body.length).toBe(0);
  });

  it("won't let user B delete user A's view", async () => {
    const res = await request(app).delete(`/api/views/${viewId}`).set('Cookie', cookieB);
    expect(res.status).toBe(404);
  });

  it("lets the owner delete the view", async () => {
    const res = await request(app).delete(`/api/views/${viewId}`).set('Cookie', cookieA);
    expect(res.status).toBe(204);
  });
});
