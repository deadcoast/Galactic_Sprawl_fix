import { expect, test } from '@playwright/test';

test.describe('Mining Operations', () => {
  // Increase the timeout for the entire test suite
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    console.warn('Starting mining-simplified test...');

    try {
      // Navigate to the mining page of the actual application with improved timeout and wait options
      await page.goto('http://localhost:3001/mining', {
        timeout: 60000,
        waitUntil: 'networkidle',
      });

      console.warn('Mining page loaded, checking for content...');

      // Take a screenshot of the initial state to help with debugging
      await page.screenshot({ path: `mining-simplified-initial-${Date.now()}.png` });

      // Check if the application loaded at all
      const appContent = await page.content();
      if (
        appContent.includes('Failed to Initialize Game') ||
        appContent.includes('Error initializing game')
      ) {
        console.warn('Game initialization error detected in page content. Taking screenshot...');
        await page.screenshot({ path: `mining-simplified-init-error-${Date.now()}.png` });
        throw new Error('Game failed to initialize - error found in page content');
      }

      // Wait for the page to load with a longer timeout
      console.warn('Waiting for Mineral Processing heading...');
      await page.waitForSelector('h1:has-text("Mineral Processing")', { timeout: 30000 });
      console.warn('Mineral Processing heading found');

      // Take a screenshot after successful loading
      await page.screenshot({ path: `mining-simplified-loaded-${Date.now()}.png` });
    } catch (error: unknown) {
      console.error('Error during test setup:', error);

      // Take a screenshot to help with debugging
      try {
        await page.screenshot({ path: `mining-simplified-setup-error-${Date.now()}.png` });
      } catch (screenshotError) {
        console.error(`Failed to take screenshot: ${screenshotError}`);
      }

      throw error;
    }
  });

  test('basic mining test', async ({ page }) => {
    try {
      console.warn('Running basic mining test...');

      // Verify the page content from the actual application
      await expect(page.locator('h1')).toHaveText('Mineral Processing');
      console.warn('Verified heading');

      // Check for resource list with timeout
      await expect(page.locator('.resource-list')).toBeVisible({ timeout: 10000 });
      console.warn('Resource list is visible');

      // Verify specific resources are displayed
      await expect(page.locator('.resource-item:has-text("Iron Belt Alpha")')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('.resource-item:has-text("Helium Cloud Beta")')).toBeVisible({
        timeout: 10000,
      });
      console.warn('Verified specific resources');

      // Take a screenshot
      await page.screenshot({ path: 'mining-resources.png' });
      console.warn('Basic mining test completed successfully');
    } catch (error) {
      console.error('Error in basic mining test:', error);
      await page.screenshot({ path: `mining-basic-test-error-${Date.now()}.png` });
      throw error;
    }
  });

  test('search functionality', async ({ page }) => {
    try {
      console.warn('Running search functionality test...');

      // Get the search input from the actual application
      const searchInput = page.locator('input[placeholder*="Search resources"]');
      await expect(searchInput).toBeVisible({ timeout: 10000 });
      console.warn('Search input is visible');

      // Search for "Iron"
      await searchInput.fill('Iron');
      console.warn('Filled search with "Iron"');
      await page.waitForTimeout(1000); // Wait for search results to update

      // Verify search results in the actual application
      await expect(page.locator('.resource-item:has-text("Iron Belt Alpha")')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('.resource-item:has-text("Helium Cloud Beta")')).not.toBeVisible({
        timeout: 10000,
      });
      console.warn('Verified search results for "Iron"');

      // Clear search
      await searchInput.clear();
      console.warn('Cleared search');
      await page.waitForTimeout(1000); // Wait for search results to update

      // Verify all resources are visible again
      await expect(page.locator('.resource-item:has-text("Iron Belt Alpha")')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('.resource-item:has-text("Helium Cloud Beta")')).toBeVisible({
        timeout: 10000,
      });
      console.warn('Verified all resources are visible after clearing search');

      // Take a screenshot
      await page.screenshot({ path: 'mining-search.png' });
      console.warn('Search functionality test completed successfully');
    } catch (error) {
      console.error('Error in search functionality test:', error);
      await page.screenshot({ path: `mining-search-test-error-${Date.now()}.png` });
      throw error;
    }
  });

  test('resource selection', async ({ page }) => {
    try {
      console.warn('Running resource selection test...');

      // Find a resource item in the actual application
      const resourceItem = page.locator('.resource-item:has-text("Iron Belt Alpha")');
      await expect(resourceItem).toBeVisible({ timeout: 10000 });
      console.warn('Resource item is visible');

      // Select the resource
      await resourceItem.click();
      console.warn('Clicked on resource item');
      await page.waitForTimeout(1000); // Wait for details to load

      // Verify resource details are displayed in the actual application
      await expect(page.locator('.resource-details')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.resource-details')).toContainText('Iron Belt Alpha', {
        timeout: 10000,
      });
      console.warn('Resource details are visible and contain correct text');

      // Check for specific details
      await expect(page.locator('.resource-details')).toContainText('Abundance', {
        timeout: 10000,
      });
      await expect(page.locator('.resource-details')).toContainText('Priority', { timeout: 10000 });
      console.warn('Verified specific details');

      // Take a screenshot
      await page.screenshot({ path: 'mining-selection.png' });
      console.warn('Resource selection test completed successfully');
    } catch (error) {
      console.error('Error in resource selection test:', error);
      await page.screenshot({ path: `mining-selection-test-error-${Date.now()}.png` });
      throw error;
    }
  });

  test('filter functionality', async ({ page }) => {
    try {
      console.warn('Running filter functionality test...');

      // Find the filter dropdown in the actual application
      const filterDropdown = page.locator('select[aria-label="Filter"]');
      await expect(filterDropdown).toBeVisible({ timeout: 10000 });
      console.warn('Filter dropdown is visible');

      // Select the "Gas" filter
      await filterDropdown.selectOption('gas');
      console.warn('Selected "Gas" filter');
      await page.waitForTimeout(1000); // Wait for filter to apply

      // Verify filter results
      await expect(page.locator('.resource-item:has-text("Helium Cloud Beta")')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('.resource-item:has-text("Iron Belt Alpha")')).not.toBeVisible({
        timeout: 10000,
      });
      console.warn('Verified filter results for "Gas"');

      // Reset filter to "All"
      await filterDropdown.selectOption('all');
      console.warn('Reset filter to "All"');
      await page.waitForTimeout(1000); // Wait for filter to apply

      // Verify all resources are visible again
      await expect(page.locator('.resource-item:has-text("Iron Belt Alpha")')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('.resource-item:has-text("Helium Cloud Beta")')).toBeVisible({
        timeout: 10000,
      });
      console.warn('Verified all resources are visible after resetting filter');

      // Take a screenshot
      await page.screenshot({ path: 'mining-filter.png' });
      console.warn('Filter functionality test completed successfully');
    } catch (error) {
      console.error('Error in filter functionality test:', error);
      await page.screenshot({ path: `mining-filter-test-error-${Date.now()}.png` });
      throw error;
    }
  });

  test('view mode switching', async ({ page }) => {
    try {
      console.warn('Running view mode switching test...');

      // Find the view mode button in the actual application
      const viewModeButton = page.locator('button:has-text("Grid View")');
      await expect(viewModeButton).toBeVisible({ timeout: 10000 });
      console.warn('View mode button is visible');

      // Click to change view mode
      await viewModeButton.click();
      console.warn('Clicked view mode button');
      await page.waitForTimeout(1000); // Wait for view to change

      // Verify view mode has changed
      await expect(page.locator('button:has-text("Map View")')).toBeVisible({ timeout: 10000 });
      console.warn('Map View button is now visible');

      // Check that the view has actually changed (grid view should be visible)
      await expect(page.locator('.grid-view')).toBeVisible({ timeout: 10000 });
      console.warn('Grid view is visible');

      // Switch back to map view
      await page.locator('button:has-text("Map View")').click();
      console.warn('Clicked Map View button');
      await page.waitForTimeout(1000); // Wait for view to change

      // Verify map view is now visible
      await expect(page.locator('.map-view')).toBeVisible({ timeout: 10000 });
      console.warn('Map view is visible');

      // Take a screenshot
      await page.screenshot({ path: 'mining-view-mode.png' });
      console.warn('View mode switching test completed successfully');
    } catch (error) {
      console.error('Error in view mode switching test:', error);
      await page.screenshot({ path: `mining-view-mode-test-error-${Date.now()}.png` });
      throw error;
    }
  });
});
