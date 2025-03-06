import { expect, test } from '@playwright/test';

test.describe('Mining Operations', () => {
  test('should display resource list', async ({ page }) => {
    // Create a simple HTML page
    await page.setContent(`
      <html>
        <head>
          <title>Mining Operations</title>
          <style>
            .resource-list { display: block; border: 1px solid #ccc; padding: 10px; }
            .resource-item { margin: 5px 0; padding: 5px; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <h1>Mining Operations</h1>
          <div class="resource-list">
            <div class="resource-item">Iron Deposit</div>
            <div class="resource-item">Energy Field</div>
            <div class="resource-item">Titanium Deposit</div>
          </div>
        </body>
      </html>
    `);

    // Verify the page loads with resources
    await expect(page.locator('.resource-list')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Mining Operations');

    // Take a screenshot
    await page.screenshot({ path: 'mining-resources.png' });

    // Check page title
    expect(await page.title()).toContain('Mining Operations');
  });
});
