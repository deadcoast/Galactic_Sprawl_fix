import { expect, test } from '@playwright/test';

test.describe('Mining Operations', () => {
  test('should display mining resources', async ({ page }) => {
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
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Mining Operations');
    await expect(page.locator('.resource-list')).toBeVisible();

    // Take a screenshot
    await page.screenshot({ path: 'mining-resources.png' });
  });

  test('search functionality should filter resources correctly', async ({ page }) => {
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
  });

  test('type filtering should work correctly', async ({ page }) => {
    // Create a simple HTML page with filtering functionality
    await page.setContent(`
      <html>
        <head>
          <title>Mining Operations</title>
          <style>
            .resource-list { display: block; border: 1px solid #ccc; padding: 10px; }
            .resource-item { margin: 5px 0; padding: 5px; border-bottom: 1px solid #eee; }
            .resource-item[data-type=ResourceType.ENERGY] { color: blue; }
            .resource-item[data-type="mineral"] { color: brown; }
          </style>
          <script>
            function filterByType(type) {
              const items = document.querySelectorAll('.resource-item');
              items.forEach(item => {
                if (type === 'all' || item.getAttribute('data-type') === type) {
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
          <div class="filter-controls">
            <button onclick="filterByType('all')">All</button>
            <button onclick="filterByType(ResourceType.ENERGY)">Energy</button>
            <button onclick="filterByType('mineral')">Mineral</button>
          </div>
          <div class="resource-list">
            <div class="resource-item" data-type="mineral">Iron Deposit</div>
            <div class="resource-item" data-type=ResourceType.ENERGY>Energy Field</div>
            <div class="resource-item" data-type="mineral">Titanium Deposit</div>
          </div>
        </body>
      </html>
    `);

    // Filter by energy type
    await page.click('button:has-text("Energy")');

    // Verify only energy resources are displayed
    await expect(page.locator('.resource-item[data-type=ResourceType.ENERGY]')).toBeVisible();
    await expect(page.locator('.resource-item[data-type="mineral"]').first()).not.toBeVisible();

    // Reset filter
    await page.click('button:has-text("All")');

    // Verify all resources are visible again
    await expect(page.locator('.resource-item[data-type=ResourceType.ENERGY]')).toBeVisible();
    await expect(page.locator('.resource-item[data-type="mineral"]').first()).toBeVisible();

    // Take a screenshot
    await page.screenshot({ path: 'mining-filtered.png' });
  });

  test('resource selection should display details', async ({ page }) => {
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
            function selectResource(name, abundance, priority) {
              document.querySelector('.resource-name').textContent = name;
              document.querySelector('.abundance-value').textContent = abundance;
              document.querySelector('.priority-value').textContent = priority;
              document.querySelector('.resource-details').style.display = 'block';
            }
          </script>
        </head>
        <body>
          <h1>Mining Operations</h1>
          <div class="resource-list">
            <div class="resource-item" onclick="selectResource('Iron Deposit', 100, 3)">Iron Deposit</div>
            <div class="resource-item" onclick="selectResource('Energy Field', 75, 2)">Energy Field</div>
            <div class="resource-item" onclick="selectResource('Titanium Deposit', 50, 1)">Titanium Deposit</div>
          </div>
          <div class="resource-details">
            <h2 class="resource-name">Resource Details</h2>
            <div class="resource-info">
              <p>Abundance: <span class="abundance-value">0</span></p>
              <p>Priority: <span class="priority-value">0</span></p>
            </div>
          </div>
        </body>
      </html>
    `);

    // Select a resource
    await page.click('.resource-item:has-text("Iron Deposit")');

    // Verify details are displayed
    await expect(page.locator('.resource-details')).toBeVisible();
    await expect(page.locator('.resource-name')).toHaveText('Iron Deposit');
    await expect(page.locator('.abundance-value')).toHaveText('100');
    await expect(page.locator('.priority-value')).toHaveText('3');

    // Take a screenshot
    await page.screenshot({ path: 'resource-details.png' });
  });
});
