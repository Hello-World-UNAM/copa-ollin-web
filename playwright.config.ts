import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:4337',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    // @astrojs/vercel no admite `astro preview`. En CI sólo se ejercita el
    // formulario ficticio; el endpoint y Google permanecen deshabilitados.
    command: 'pnpm dev --host 127.0.0.1 --port 4337',
    env: {
      // Astro 7 se pone en segundo plano al detectar agentes; Playwright
      // necesita conservar este proceso en primer plano durante la suite.
      ASTRO_DEV_BACKGROUND: '0',
      REGISTRO_SANDBOX_MODE: 'true',
      ENABLE_SANDBOX_REGISTRATION: 'false',
    },
    url: 'http://127.0.0.1:4337',
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
