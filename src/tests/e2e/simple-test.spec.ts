import { expect, test } from '@playwright/test';

test('basic test', async ({ page }) => {
  // Create a simple HTML page
  await page.setContent(`
    <html>
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <h1>Hello, World!</h1>
        <button>Click me</button>
      </body>
    </html>
  `);

  // Verify the page content
  await expect(page.locator('h1')).toHaveText('Hello, World!');

  // Interact with the page
  await page.locator('button').click();

  // Take a screenshot
  await page.screenshot({ path: 'simple-test.png' });
});
