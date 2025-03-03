import { Locator, Page, expect } from '@playwright/test';

export class MiningPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly resourceList: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly viewModeToggle: Locator;
  readonly resourceDetails: Locator;
  readonly shipList: Locator;
  readonly assignShipButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1:has-text("Mining Operations")');
    this.resourceList = page.locator('.resource-list');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.filterDropdown = page.locator('select[aria-label*="Filter"]');
    this.viewModeToggle = page.locator('.view-mode-toggle');
    this.resourceDetails = page.locator('.resource-details');
    this.shipList = page.locator('.ship-list');
    this.assignShipButton = page.locator('button:has-text("Assign Ship")');
  }

  async goto() {
    await this.page.goto('/mining');
    await this.heading.waitFor();
    return this;
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term);
    // Wait for search results to update
    await this.page.waitForTimeout(300);
    return this;
  }

  async filterByType(type: string) {
    await this.filterDropdown.selectOption(type);
    // Wait for filter to apply
    await this.page.waitForTimeout(300);
    return this;
  }

  async selectResourceByName(name: string) {
    await this.page.locator(`text="${name}"`).first().click();
    // Wait for selection details to appear
    await this.resourceDetails.waitFor();
    return this;
  }

  async toggleViewMode(mode: 'map' | 'grid') {
    await this.viewModeToggle.locator(`button:has-text("${mode}")`).click();
    // Wait for view mode to change
    await this.page.waitForTimeout(300);
    return this;
  }

  async sortResourcesBy(criteria: 'name' | 'distance' | 'abundance' | 'priority') {
    await this.page.locator(`.sort-button[data-sort="${criteria}"]`).click();
    // Wait for sorting to apply
    await this.page.waitForTimeout(300);
    return this;
  }

  async assignShipToResource(resourceName: string, shipName: string) {
    // First select the resource
    await this.selectResourceByName(resourceName);

    // Click the assign ship button
    await this.assignShipButton.click();

    // Select the ship from the dropdown/modal
    await this.page.locator(`.ship-option:has-text("${shipName}")`).click();

    // Wait for assignment to complete
    await this.page.waitForSelector(`.assigned-ship:has-text("${shipName}")`);
    return this;
  }

  async unassignShip(shipName: string) {
    // Find the ship in the list
    const shipRow = this.page.locator(`.ship-row:has-text("${shipName}")`);

    // Click the unassign button
    await shipRow.locator('button:has-text("Unassign")').click();

    // Wait for unassign to complete
    await this.page.waitForTimeout(300);
    return this;
  }

  async changeResourcePriority(resourceName: string, newPriority: number) {
    // Select the resource
    await this.selectResourceByName(resourceName);

    // Find the priority input
    const priorityInput = this.resourceDetails.locator(
      'input[type="number"][aria-label="Priority"]'
    );

    // Clear and set new priority
    await priorityInput.fill('');
    await priorityInput.fill(newPriority.toString());

    // Submit the change (assuming there's a save button or it auto-saves on blur)
    await priorityInput.blur();

    // Wait for change to apply
    await this.page.waitForTimeout(300);
    return this;
  }

  async verifyResourceVisible(resourceName: string, shouldBeVisible = true) {
    const locator = this.page.locator(`text="${resourceName}"`).first();
    if (shouldBeVisible) {
      await locator.waitFor();
    } else {
      await this.waitForCondition(async () => !(await locator.isVisible()));
    }
    return this;
  }

  async verifyResourceCount(expectedCount: number) {
    // Wait for the count to match
    await this.waitForCondition(async () => {
      const count = await this.resourceList.locator('> *').count();
      return count === expectedCount;
    }, 5000);
    return this;
  }

  async verifyResourceDetails(details: {
    name?: string;
    abundance?: number;
    priority?: number;
    status?: string;
  }) {
    // For each provided detail, verify it's displayed correctly
    for (const [key, value] of Object.entries(details)) {
      if (value !== undefined) {
        await this.resourceDetails.locator(`*:has-text("${key}")`).first().waitFor();
        const detailText = await this.resourceDetails.innerText();

        // Different checks depending on the type of value
        if (typeof value === 'string') {
          expect(detailText).toContain(value);
        } else if (typeof value === 'number') {
          // For numbers, convert to string and look for it
          expect(detailText).toContain(value.toString());
        }
      }
    }
    return this;
  }

  // Helper method for waiting for conditions
  private async waitForCondition(
    condition: () => Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.page.waitForTimeout(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }
}
