import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../db.js';

const app = createApp();

beforeAll(async () => {
  // Clean tables before each suite run.
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.committee.deleteMany();
  await prisma.requestRecord.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('auth flow', () => {
  let adminCookie = '';
  let staffCookie = '';

  it('rejects /api/auth/me when no cookie is present', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('registers the very first user as admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'first@example.com', password: 'password123', name: 'First' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toContain('ab_token=');
    adminCookie = cookie.split(';')[0];
  });

  it('registers further users as staff', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'second@example.com', password: 'password123', name: 'Second' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('staff');
    staffCookie = res.headers['set-cookie'][0].split(';')[0];
  });

  it('rejects duplicate emails', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'first@example.com', password: 'password123', name: 'Dup' });
    expect(res.status).toBe(409);
  });

  it('logs in with the right password and rejects the wrong one', async () => {
    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: 'first@example.com', password: 'password123' });
    expect(ok.status).toBe(200);
    expect(ok.body.email).toBe('first@example.com');

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'first@example.com', password: 'wrong-password' });
    expect(bad.status).toBe(401);
  });

  it('returns the current user via /api/auth/me with cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('only admins can list users', async () => {
    const forbidden = await request(app).get('/api/auth/users').set('Cookie', staffCookie);
    expect(forbidden.status).toBe(403);

    const ok = await request(app).get('/api/auth/users').set('Cookie', adminCookie);
    expect(ok.status).toBe(200);
    expect(ok.body.length).toBe(2);
  });

  it('admin can change a user role', async () => {
    const list = await request(app).get('/api/auth/users').set('Cookie', adminCookie);
    const target = list.body.find((u: { email: string }) => u.email === 'second@example.com');
    const res = await request(app)
      .patch(`/api/auth/users/${target.id}/role`)
      .set('Cookie', adminCookie)
      .send({ role: 'viewer' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('viewer');
  });
});
