# End-to-End Testing with Playwright

This directory contains end-to-end tests for the Galactic Sprawl application using Playwright.

## Setup

1. Install Playwright:

```bash
npm install -D @playwright/test
# or
yarn add -D @playwright/test
```

2. Install browsers:

```bash
npx playwright install
```

3. Create a `playwright.config.ts` file in the project root:

```typescript
import { defineConfig } from '@playwright/test';

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
        baseURL: 'http://localhost:3000',
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
        baseURL: 'http://localhost:3000',
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
      },
    },
  ],
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

4. Add script commands to your `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## Writing Tests

Create test files in this directory with a `.spec.ts` extension. Example:

```typescript
// src/tests/e2e/mining.spec.ts
import { test, expect } from '@playwright/test';

test('Mining window functionality', async ({ page }) => {
  // Go to the mining module page
  await page.goto('/mining');

  // Wait for the page to load
  await page.waitForSelector('h1:has-text("Mining Operations")');

  // Test resource display
  const resourceList = page.locator('.resource-list');
  await expect(resourceList).toBeVisible();

  // Test search functionality
  const searchInput = page.locator('input[placeholder="Search resources"]');
  await searchInput.fill('Iron');

  // Verify search results
  await expect(page.locator('text=Iron Deposit')).toBeVisible();
  await expect(page.locator('text=Energy Field')).not.toBeVisible();

  // Test resource selection
  await page.locator('text=Iron Deposit').click();

  // Verify selection details
  await expect(page.locator('.resource-details')).toBeVisible();
  await expect(page.locator('.resource-details')).toContainText('Abundance: 0.8');
});
```

## Page Object Model

For more complex tests, use the Page Object Model pattern:

```typescript
// src/tests/e2e/models/MiningPage.ts
import { Page, Locator } from '@playwright/test';

export class MiningPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly resourceList: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly viewModeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1:has-text("Mining Operations")');
    this.resourceList = page.locator('.resource-list');
    this.searchInput = page.locator('input[placeholder="Search resources"]');
    this.filterDropdown = page.locator('select[aria-label="Filter by type"]');
    this.viewModeToggle = page.locator('.view-mode-toggle');
  }

  async goto() {
    await this.page.goto('/mining');
    await this.heading.waitFor();
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term);
    // Wait for search results to update
    await this.page.waitForTimeout(300);
  }

  async filterByType(type: string) {
    await this.filterDropdown.selectOption(type);
    // Wait for filter to apply
    await this.page.waitForTimeout(300);
  }

  async selectResourceByName(name: string) {
    await this.page.locator(`text=${name}`).click();
    // Wait for selection details to appear
    await this.page.locator('.resource-details').waitFor();
  }

  async toggleViewMode(mode: 'map' | 'grid') {
    await this.viewModeToggle.locator(`button:has-text("${mode}")`).click();
    // Wait for view mode to change
    await this.page.waitForTimeout(300);
  }
}
```

Then use it in your test:

```typescript
// src/tests/e2e/mining.spec.ts
import { test, expect } from '@playwright/test';
import { MiningPage } from './models/MiningPage';

test('Mining operations workflow', async ({ page }) => {
  const miningPage = new MiningPage(page);

  // Navigate to mining page
  await miningPage.goto();

  // Test search functionality
  await miningPage.searchFor('Iron');
  await expect(page.locator('text=Iron Deposit')).toBeVisible();
  await expect(page.locator('text=Energy Field')).not.toBeVisible();

  // Clear search and filter by type
  await miningPage.searchFor('');
  await miningPage.filterByType('energy');
  await expect(page.locator('text=Energy Field')).toBeVisible();
  await expect(page.locator('text=Iron Deposit')).not.toBeVisible();

  // Select a resource and verify details
  await miningPage.filterByType('all');
  await miningPage.selectResourceByName('Iron Deposit');
  await expect(page.locator('.resource-details')).toContainText('Abundance: 0.8');

  // Toggle view mode
  await miningPage.toggleViewMode('grid');
  await expect(page.locator('.grid-view')).toBeVisible();
});
```

## Running Tests

- Run all tests: `npm run test:e2e`
- Run tests with UI mode: `npm run test:e2e:ui`
- Run tests in headed browsers: `npm run test:e2e:headed`
- Debug tests: `npm run test:e2e:debug`

## CI Integration

For CI integration, add a GitHub Actions workflow:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```
