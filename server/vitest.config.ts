import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    pool: 'forks',
    fileParallelism: false,
    hookTimeout: 30000,
    env: {
      // Tests use a dedicated SQLite file. `npm test` runs `test:prepare`
      // first to wipe and recreate it via `prisma db push`.
      DATABASE_URL: `file:${path.resolve(__dirname, 'prisma/test.db')}`,
      JWT_SECRET: 'test-secret-please-change',
      NODE_ENV: 'test',
    },
  },
});
