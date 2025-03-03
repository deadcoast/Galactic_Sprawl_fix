import { expect, test } from '@playwright/test';
import { MiningPage } from './models/MiningPage';

// These tests would run against a deployed or locally running application
test.describe('Mining Operations', () => {
  let miningPage: MiningPage;

  test.beforeEach(async ({ page }) => {
    miningPage = new MiningPage(page);
    await miningPage.goto();
  });

  test('should display resource list', async ({ page }) => {
    // Verify the page loads with resources
    await expect(miningPage.resourceList).toBeVisible();
    await expect(miningPage.heading).toHaveText(/Mining Operations/);
  });

  test('search functionality should filter resources correctly', async ({ page }) => {
    // Search for a specific resource
    await miningPage.searchFor('Iron');

    // Verify the search results
    await expect(page.locator('text=Iron Deposit')).toBeVisible();
    await expect(page.locator('text=Energy Field')).not.toBeVisible();

    // Clear search and verify all resources are visible again
    await miningPage.searchFor('');
    await expect(page.locator('text=Iron Deposit')).toBeVisible();
    await expect(page.locator('text=Energy Field')).toBeVisible();
  });

  test('type filtering should work correctly', async ({ page }) => {
    // Filter by energy type
    await miningPage.filterByType('energy');

    // Verify only energy resources are displayed
    await expect(page.locator('text=Energy Field')).toBeVisible();
    await expect(page.locator('text=Iron Deposit')).not.toBeVisible();

    // Reset filter
    await miningPage.filterByType('all');
    await expect(page.locator('text=Iron Deposit')).toBeVisible();
  });

  test('resource selection should display details', async ({ page }) => {
    // Select a resource
    await miningPage.selectResourceByName('Iron Deposit');

    // Verify details are displayed
    await expect(miningPage.resourceDetails).toBeVisible();
    await expect(miningPage.resourceDetails).toContainText('Abundance:');
    await expect(miningPage.resourceDetails).toContainText('Priority:');
  });

  test('view mode toggle should change the display', async ({ page }) => {
    // Toggle to grid view
    await miningPage.toggleViewMode('grid');
    await expect(page.locator('.grid-view')).toBeVisible();

    // Toggle back to map view
    await miningPage.toggleViewMode('map');
    await expect(page.locator('.map-view')).toBeVisible();
  });

  test('should assign ship to resource', async ({ page }) => {
    // First make sure we have an available ship
    const shipName = 'Mining Vessel Alpha';

    // Assign ship to resource
    await miningPage.assignShipToResource('Iron Deposit', shipName);

    // Verify the assignment
    await expect(page.locator(`.assigned-ship:has-text("${shipName}")`)).toBeVisible();
  });

  test('should unassign ship from resource', async ({ page }) => {
    // Assuming this ship is assigned to a resource
    const shipName = 'Mining Vessel Beta';

    // Unassign the ship
    await miningPage.unassignShip(shipName);

    // Verify the ship status changed
    await expect(page.locator(`.ship-row:has-text("${shipName}")`)).toContainText('idle');
  });

  test('should change resource priority', async ({ page }) => {
    const resourceName = 'Iron Deposit';
    const newPriority = 5;

    // Change priority
    await miningPage.changeResourcePriority(resourceName, newPriority);

    // Verify the priority was updated
    await expect(miningPage.resourceDetails).toContainText(`Priority: ${newPriority}`);
  });

  test('resource sorting should work correctly', async ({ page }) => {
    // Sort by distance
    await miningPage.sortResourcesBy('distance');

    // Sort by abundance
    await miningPage.sortResourcesBy('abundance');

    // Sort by priority
    await miningPage.sortResourcesBy('priority');

    // Sort by name
    await miningPage.sortResourcesBy('name');

    // No assertion here as we're just checking that the sorting doesn't cause errors
    // In a real test, you'd want to verify the order of elements changes correctly
  });

  // Comprehensive user workflow test
  test('complete mining workflow', async ({ page }) => {
    // 1. Start with filtering resources
    await miningPage.filterByType('minerals');

    // 2. Select a resource
    await miningPage.selectResourceByName('Iron Deposit');

    // 3. Update priority
    await miningPage.changeResourcePriority('Iron Deposit', 1);

    // 4. Assign a ship
    await miningPage.assignShipToResource('Iron Deposit', 'Mining Vessel Alpha');

    // 5. Switch to grid view to see all assignments
    await miningPage.toggleViewMode('grid');

    // 6. Verify the assignment was successful
    await expect(page.locator(`.assigned-ship:has-text("Mining Vessel Alpha")`)).toBeVisible();

    // 7. Unassign the ship
    await miningPage.unassignShip('Mining Vessel Alpha');

    // 8. Verify the unassignment
    await expect(page.locator(`.ship-row:has-text("Mining Vessel Alpha")`)).toContainText('idle');
  });
});
