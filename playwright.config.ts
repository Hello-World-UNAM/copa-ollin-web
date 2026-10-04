import { defineConfig, devices } from '@playwright/test';
import { tokenSandboxE2e } from './tests/fixtures/registro';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
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
    // @astrojs/vercel no admite `astro preview`; el E2E usa Astro dev local.
    // El endpoint sólo acepta el token ficticio del test y guarda en el mock.
    command: 'pnpm dev --host 127.0.0.1 --port 4337',
    env: {
      // Astro 7 se pone en segundo plano al detectar agentes; Playwright
      // necesita conservar este proceso en primer plano durante la suite.
      ASTRO_DEV_BACKGROUND: '0',
      REGISTRO_SANDBOX_MODE: 'true',
      ENABLE_SANDBOX_REGISTRATION: 'true',
      SANDBOX_REGISTRATION_TOKEN: tokenSandboxE2e,
      USE_MOCK_GOOGLE: 'true',
    },
    url: 'http://127.0.0.1:4337',
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
