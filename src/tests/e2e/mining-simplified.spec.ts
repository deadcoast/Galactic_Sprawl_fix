import { expect, test } from '@playwright/test';

test.describe('Mining Operations', () => {
  test('basic mining test', async ({ page }) => {
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
          <div class="resource-details" style="display: none;">
            <h2 class="resource-name">Resource Details</h2>
            <div class="resource-info">
              <p>Abundance: <span class="abundance-value">100</span></p>
              <p>Priority: <span class="priority-value">3</span></p>
            </div>
          </div>
        </body>
      </html>
    `);

    // Verify the page content
    await expect(page.locator('h1')).toHaveText('Mining Operations');
    await expect(page.locator('.resource-list')).toBeVisible();

    // Take a screenshot
    await page.screenshot({ path: 'mining-resources.png' });
  });

  test('search functionality', async ({ page }) => {
    // Create a simple HTML page with search functionality
    await page.setContent(`
      <html>
        <head>
          <title>Mining Operations</title>
          <style>
            .resource-list { display: block; border: 1px solid #ccc; padding: 10px; }
            .resource-item { margin: 5px 0; padding: 5px; border-bottom: 1px solid #eee; }
          </style>
          <script>
            function searchResources() {
              const term = document.getElementById('search-input').value.toLowerCase();
              const items = document.querySelectorAll('.resource-item');
              items.forEach(item => {
                if (term === '' || item.textContent.toLowerCase().includes(term)) {
                  item.style.display = 'block';
                } else {
                  item.style.display = 'none';
                }
              });
            }
          </script>
        </head>
        <body>
          <h1>Mining Operations</h1>
          <input id="search-input" placeholder="Search resources" oninput="searchResources()">
          <div class="resource-list">
            <div class="resource-item">Iron Deposit</div>
            <div class="resource-item">Energy Field</div>
            <div class="resource-item">Titanium Deposit</div>
          </div>
        </body>
      </html>
    `);

    // Search for "Iron"
    await page.fill('#search-input', 'Iron');

    // Verify search results
    await expect(page.locator('.resource-item:has-text("Iron Deposit")')).toBeVisible();
    await expect(page.locator('.resource-item:has-text("Energy Field")')).not.toBeVisible();

    // Clear search
    await page.fill('#search-input', '');

    // Verify all resources are visible again
    await expect(page.locator('.resource-item:has-text("Iron Deposit")')).toBeVisible();
    await expect(page.locator('.resource-item:has-text("Energy Field")')).toBeVisible();

    // Take a screenshot
    await page.screenshot({ path: 'mining-search.png' });
  });

  test('resource selection', async ({ page }) => {
    // Create a simple HTML page with resource selection
    await page.setContent(`
      <html>
        <head>
          <title>Mining Operations</title>
          <style>
            .resource-list { display: block; border: 1px solid #ccc; padding: 10px; }
            .resource-item { margin: 5px 0; padding: 5px; border-bottom: 1px solid #eee; cursor: pointer; }
            .resource-details { display: none; border: 1px solid #ccc; padding: 10px; margin-top: 20px; }
          </style>
          <script>
            function selectResource(name) {
              document.querySelector('.resource-name').textContent = name;
              document.querySelector('.resource-details').style.display = 'block';
            }
          </script>
        </head>
        <body>
          <h1>Mining Operations</h1>
          <div class="resource-list">
            <div class="resource-item" onclick="selectResource('Iron Deposit')">Iron Deposit</div>
            <div class="resource-item" onclick="selectResource('Energy Field')">Energy Field</div>
            <div class="resource-item" onclick="selectResource('Titanium Deposit')">Titanium Deposit</div>
          </div>
          <div class="resource-details">
            <h2 class="resource-name">Resource Details</h2>
            <div class="resource-info">
              <p>Abundance: <span class="abundance-value">100</span></p>
              <p>Priority: <span class="priority-value">3</span></p>
            </div>
          </div>
        </body>
      </html>
    `);

    // Select a resource
    await page.click('.resource-item:has-text("Iron Deposit")');

    // Verify resource details are displayed
    await expect(page.locator('.resource-details')).toBeVisible();
    await expect(page.locator('.resource-name')).toHaveText('Iron Deposit');

    // Take a screenshot
    await page.screenshot({ path: 'mining-selection.png' });
  });
});
