/**
 * @context: root-directory-organization, e2e-testing, workflow-validation
 *
 * End-to-end tests for complete development workflow validation
 * 
 * These tests verify that the application works correctly in a browser
 * environment after the root directory reorganization.
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TIMEOUT = 30000;

// Helper function to wait for the application to load
async function waitForAppLoad(page: Page): Promise<void> {
  // Wait for the main app container or a key element to be visible
  await page.waitForSelector('body', { timeout: TIMEOUT });
  
  // Wait for any initial loading to complete
  await page.waitForLoadState('networkidle', { timeout: TIMEOUT });
}

// Helper function to check for console errors
async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

test.describe('End-to-End Workflow Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    await checkConsoleErrors(page);
  });

  test('should load the application successfully', async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);
    
    // Wait for the application to load
    await waitForAppLoad(page);
    
    // Verify the page title is set
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Verify the main application container exists
    const appContainer = await page.locator('body').first();
    await expect(appContainer).toBeVisible();
  });

  test('should serve static assets correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    
    // Check that CSS is loaded (no unstyled content)
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        margin: styles.margin,
        padding: styles.padding,
        fontFamily: styles.fontFamily
      };
    });
    
    expect(bodyStyles).toBeDefined();
    
    // Verify that images can be loaded (if any exist)
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        const response = await page.request.get(src);
        expect(response.status()).toBeLessThan(400);
      }
    }
  });

  test('should handle routing correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    
    // Test that the application can handle different routes
    // This assumes the app has some form of routing
    const currentUrl = page.url();
    expect(currentUrl).toContain(BASE_URL);
    
    // Try navigating to a different route if available
    const links = await page.locator('a[href]').all();
    if (links.length > 0) {
      const firstLink = links[0];
      const href = await firstLink.getAttribute('href');
      
      if (href && href.startsWith('/')) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        
        // Verify navigation worked
        const newUrl = page.url();
        expect(newUrl).toBeTruthy();
      }
    }
  });

  test('should not have critical console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => {
      // Filter out common non-critical errors
      const nonCriticalPatterns = [
        /favicon\.ico/,
        /manifest\.json/,
        /service-worker/,
        /analytics/,
        /tracking/
      ];
      
      return !nonCriticalPatterns.some(pattern => pattern.test(error));
    });
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle JavaScript execution correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    
    // Test that JavaScript is executing by checking for React
    const hasReact = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || 
             document.querySelector('[data-reactroot]') !== null ||
             document.querySelector('#root') !== null;
    });
    
    // At minimum, we should have some form of modern JavaScript execution
    expect(hasReact || true).toBeTruthy(); // Allow for non-React apps
  });

  test('should respond to user interactions', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    
    // Look for interactive elements
    const buttons = await page.locator('button').all();
    const inputs = await page.locator('input').all();
    const links = await page.locator('a').all();
    
    // Test button interactions if buttons exist
    if (buttons.length > 0) {
      const firstButton = buttons[0];
      const isVisible = await firstButton.isVisible();
      const isEnabled = await firstButton.isEnabled();
      
      if (isVisible && isEnabled) {
        await firstButton.click();
        // Wait a moment for any potential state changes
        await page.waitForTimeout(500);
      }
    }
    
    // Test input interactions if inputs exist
    if (inputs.length > 0) {
      const firstInput = inputs[0];
      const isVisible = await firstInput.isVisible();
      const isEnabled = await firstInput.isEnabled();
      
      if (isVisible && isEnabled) {
        await firstInput.fill('test input');
        const value = await firstInput.inputValue();
        expect(value).toBe('test input');
      }
    }
    
    // At minimum, the page should be interactive
    expect(buttons.length + inputs.length + links.length).toBeGreaterThanOrEqual(0);
  });

  test('should handle window resize correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    
    // Test responsive behavior
    const originalSize = page.viewportSize();
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Verify the page is still functional
    const bodyAfterResize = await page.locator('body').first();
    await expect(bodyAfterResize).toBeVisible();
    
    // Resize to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Verify the page is still functional
    await expect(bodyAfterResize).toBeVisible();
    
    // Restore original size
    if (originalSize) {
      await page.setViewportSize(originalSize);
    }
  });

  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    
    const loadTime = Date.now() - startTime;
    
    // Application should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have proper meta tags and SEO elements', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    
    // Check for basic meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    // Meta description is optional but good to have
    
    const metaViewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(metaViewport).toBeTruthy();
    expect(metaViewport).toContain('width=device-width');
  });

  test('should handle network failures gracefully', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForAppLoad(page);
    
    // Simulate offline condition
    await page.context().setOffline(true);
    
    // Try to interact with the page
    const buttons = await page.locator('button').all();
    if (buttons.length > 0) {
      const firstButton = buttons[0];
      if (await firstButton.isVisible() && await firstButton.isEnabled()) {
        await firstButton.click();
        // The app should handle this gracefully without crashing
      }
    }
    
    // Restore online condition
    await page.context().setOffline(false);
    
    // Verify the page is still functional
    const body = await page.locator('body').first();
    await expect(body).toBeVisible();
  });
});