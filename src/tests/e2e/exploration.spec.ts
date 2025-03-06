import { expect, test } from '@playwright/test';

test.describe('Exploration Operations', () => {
  test('basic exploration test', async ({ page }) => {
    // Create a simple HTML page
    await page.setContent(`
      <html>
        <head>
          <title>Exploration</title>
          <style>
            .star-system-list { display: block; border: 1px solid #ccc; padding: 10px; }
            .star-system { margin: 5px 0; padding: 5px; border-bottom: 1px solid #eee; cursor: pointer; }
            .system-details { display: none; border: 1px solid #ccc; padding: 10px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Exploration</h1>
          <div class="star-system-list">
            <div class="star-system">Alpha Centauri</div>
            <div class="star-system">Sirius</div>
            <div class="star-system">Proxima Centauri</div>
          </div>
        </body>
      </html>
    `);

    // Verify the page content
    await expect(page.locator('h1')).toHaveText('Exploration');
    await expect(page.locator('.star-system-list')).toBeVisible();

    // Take a screenshot
    await page.screenshot({ path: 'exploration-interface.png' });
  });

  test('star system display', async ({ page }) => {
    // Create a simple HTML page
    await page.setContent(`
      <html>
        <head>
          <title>Exploration</title>
          <style>
            .star-system-list { display: block; border: 1px solid #ccc; padding: 10px; }
            .star-system { margin: 5px 0; padding: 5px; border-bottom: 1px solid #eee; cursor: pointer; }
            .system-type { color: #666; font-size: 0.8em; }
          </style>
        </head>
        <body>
          <h1>Exploration</h1>
          <div class="star-system-list">
            <div class="star-system">
              <div class="system-name">Alpha Centauri</div>
              <div class="system-type">Binary Star System</div>
            </div>
            <div class="star-system">
              <div class="system-name">Sirius</div>
              <div class="system-type">Binary Star System</div>
            </div>
            <div class="star-system">
              <div class="system-name">Proxima Centauri</div>
              <div class="system-type">Red Dwarf</div>
            </div>
          </div>
        </body>
      </html>
    `);

    // Verify star systems are displayed
    await expect(page.locator('.star-system').first()).toBeVisible();
    await expect(page.locator('.star-system')).toHaveCount(3);

    // Take a screenshot
    await page.screenshot({ path: 'exploration-star-systems.png' });
  });

  test('star system selection', async ({ page }) => {
    // Create a simple HTML page with system selection
    await page.setContent(`
      <html>
        <head>
          <title>Exploration</title>
          <style>
            .star-system-list { display: block; border: 1px solid #ccc; padding: 10px; }
            .star-system { margin: 5px 0; padding: 5px; border-bottom: 1px solid #eee; cursor: pointer; }
            .system-details { display: none; border: 1px solid #ccc; padding: 10px; margin-top: 20px; }
          </style>
          <script>
            function selectSystem(name, type, planets) {
              document.querySelector('.system-name').textContent = name;
              document.querySelector('.system-type').textContent = type;
              document.querySelector('.system-planets').textContent = planets + ' planets';
              document.querySelector('.system-details').style.display = 'block';
            }
          </script>
        </head>
        <body>
          <h1>Exploration</h1>
          <div class="star-system-list">
            <div class="star-system" onclick="selectSystem('Alpha Centauri', 'Binary Star System', 5)">Alpha Centauri</div>
            <div class="star-system" onclick="selectSystem('Sirius', 'Binary Star System', 3)">Sirius</div>
            <div class="star-system" onclick="selectSystem('Proxima Centauri', 'Red Dwarf', 2)">Proxima Centauri</div>
          </div>
          <div class="system-details">
            <h2 class="system-name">System Details</h2>
            <div class="system-info">
              <p class="system-type"></p>
              <p class="system-planets"></p>
              <p class="system-status">Unexplored</p>
            </div>
            <div class="system-actions">
              <button class="explore-button">Explore</button>
              <button class="scan-button">Scan</button>
            </div>
          </div>
        </body>
      </html>
    `);

    // Select a star system
    await page.click('.star-system:has-text("Alpha Centauri")');

    // Verify system details are displayed
    await expect(page.locator('.system-details')).toBeVisible();
    await expect(page.locator('.system-name')).toHaveText('Alpha Centauri');
    await expect(page.locator('.system-type')).toHaveText('Binary Star System');
    await expect(page.locator('.system-planets')).toHaveText('5 planets');

    // Take a screenshot
    await page.screenshot({ path: 'exploration-system-details.png' });
  });
});
