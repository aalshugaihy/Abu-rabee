import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../db.js';

const app = createApp();
let cookie = '';

beforeAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.user.deleteMany();

  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'profile@test.com', password: 'password123', name: 'Original' });
  cookie = (reg.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
});
afterAll(async () => prisma.$disconnect());

describe('profile + change password', () => {
  it('updates the display name and reflects it on /me', async () => {
    const update = await request(app)
      .patch('/api/auth/me')
      .set('Cookie', cookie)
      .send({ name: 'New Name' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('New Name');
    // The PATCH re-issues the access cookie with the new name baked in.
    cookie = (update.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');

    const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(me.body.name).toBe('New Name');
  });

  it('rejects an empty display name', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Cookie', cookie)
      .send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('rejects a wrong current password', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'wrong', newPassword: 'newpassword123' });
    expect(res.status).toBe(401);
  });

  it('rejects a too-short new password', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'password123', newPassword: 'short' });
    expect(res.status).toBe(400);
  });

  it('changes password and lets the new one log in', async () => {
    const change = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'password123', newPassword: 'newpassword456' });
    expect(change.status).toBe(200);

    const loginOld = await request(app)
      .post('/api/auth/login')
      .send({ email: 'profile@test.com', password: 'password123' });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app)
      .post('/api/auth/login')
      .send({ email: 'profile@test.com', password: 'newpassword456' });
    expect(loginNew.status).toBe(200);
  });
});

describe('readiness probe', () => {
  it('responds OK with db: up', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.db).toBe('up');
  });
});
