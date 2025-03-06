import { defineConfig } from '@playwright/test';
import { getCurrentPort } from './src/tests/e2e/test-setup';

export default defineConfig({
  testDir: './src/tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  reporter: 'html',
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
        baseURL: `http://localhost:${getCurrentPort()}`,
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
      },
    },
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        viewport: { width: 1280, height: 720 },
        baseURL: `http://localhost:${getCurrentPort()}`,
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
      },
    },
  ],
  // Comment out the webServer section for now to run tests without it
  /*
  webServer: {
    command: 'npm run dev',
    port: getCurrentPort(),
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // Increase timeout to 2 minutes
  },
  */
});
