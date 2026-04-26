import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../db.js';

const app = createApp();

beforeAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});
afterAll(async () => prisma.$disconnect());

describe('refresh tokens', () => {
  let cookies: string[] = [];

  it('issues both access and refresh cookies on login', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'rt@example.com', password: 'password123', name: 'RT', rememberMe: true });
    expect(reg.status).toBe(200);
    cookies = reg.headers['set-cookie'] as unknown as string[];
    const names = cookies.map((c) => c.split(';')[0].split('=')[0]);
    expect(names).toContain('ab_token');
    expect(names).toContain('ab_refresh');
  });

  it('rotates the refresh token and reissues access', async () => {
    const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
    const refresh = await request(app).post('/api/auth/refresh').set('Cookie', cookieHeader);
    expect(refresh.status).toBe(200);
    expect(refresh.body.email).toBe('rt@example.com');

    // The original refresh token must now be revoked: re-using it must fail.
    const replay = await request(app).post('/api/auth/refresh').set('Cookie', cookieHeader);
    expect(replay.status).toBe(401);
  });

  it('rejects refresh without any cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});
