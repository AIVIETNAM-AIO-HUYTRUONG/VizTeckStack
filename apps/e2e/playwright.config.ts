import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'web',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
      testMatch: 'tests/web.spec.ts',
    },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3002' },
      testMatch: 'tests/admin.spec.ts',
    },
    {
      name: 'api',
      // NestJS binds to 0.0.0.0 but not always IPv6 — use 127.0.0.1 explicitly
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3000' },
      testMatch: 'tests/api.spec.ts',
    },
  ],
});
