import { Locator, Page } from '@playwright/test';

export class ExplorationPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly starSystemList: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly systemDetails: Locator;
  readonly exploreButton: Locator;
  readonly scanButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1:has-text("Exploration")');
    this.starSystemList = page.locator('.star-system-list');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.filterDropdown = page.locator('select[aria-label*="Filter"]');
    this.systemDetails = page.locator('.system-details');
    this.exploreButton = page.locator('button:has-text("Explore")');
    this.scanButton = page.locator('button:has-text("Scan")');
  }

  async goto() {
    await this.page.goto('/exploration');
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

  async selectStarSystem(name: string) {
    await this.page.locator(`text="${name}"`).first().click();
    // Wait for selection details to appear
    await this.systemDetails.waitFor();
    return this;
  }

  async exploreSystem(systemName: string) {
    await this.selectStarSystem(systemName);
    await this.exploreButton.click();
    // Wait for exploration to start
    await this.page.waitForTimeout(500);
    return this;
  }

  async scanSystem(systemName: string) {
    await this.selectStarSystem(systemName);
    await this.scanButton.click();
    // Wait for scan to complete
    await this.page.waitForTimeout(500);
    return this;
  }

  async verifySystemVisible(systemName: string, shouldBeVisible = true) {
    const locator = this.page.locator(`text="${systemName}"`).first();
    if (shouldBeVisible) {
      await locator.waitFor();
    } else {
      await locator.waitFor({ state: 'hidden' });
    }
    return this;
  }

  async verifySystemCount(expectedCount: number) {
    const count = await this.page.locator('.star-system').count();
    if (count !== expectedCount) {
      throw new Error(`Expected ${expectedCount} systems, but found ${count}`);
    }
    return this;
  }

  async verifySystemDetails(details: {
    name?: string;
    type?: string;
    planets?: number;
    status?: string;
  }) {
    if (details.name) {
      await this.page.locator('.system-name').waitFor();
      const name = await this.page.locator('.system-name').textContent();
      if (!name?.includes(details.name)) {
        throw new Error(`Expected system name to include "${details.name}", but got "${name}"`);
      }
    }

    if (details.type) {
      const type = await this.page.locator('.system-type').textContent();
      if (!type?.includes(details.type)) {
        throw new Error(`Expected system type to include "${details.type}", but got "${type}"`);
      }
    }

    if (details.planets !== undefined) {
      const planetsText = await this.page.locator('.system-planets').textContent();
      const planets = parseInt(planetsText?.replace(/\D/g, '') || '0', 10);
      if (planets !== details.planets) {
        throw new Error(`Expected ${details.planets} planets, but found ${planets}`);
      }
    }

    if (details.status) {
      const status = await this.page.locator('.system-status').textContent();
      if (!status?.includes(details.status)) {
        throw new Error(`Expected status to include "${details.status}", but got "${status}"`);
      }
    }

    return this;
  }
}
