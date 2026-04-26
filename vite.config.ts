/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Allow deploying under a sub-path (e.g. GitHub Pages: /<repo>/) via VITE_BASE.
declare const process: { env: Record<string, string | undefined> };
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // The `server/` workspace has its own vitest config and Prisma-backed
    // tests; do not pull them into the frontend test run.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['server/**', 'node_modules/**', 'dist/**'],
  },
});
