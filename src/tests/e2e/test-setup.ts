/**
 * E2E Test Setup
 *
 * This file contains setup and teardown functions for E2E tests.
 * It helps prevent WebSocket server conflicts by assigning unique ports
 * to each test run.
 */

import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ExplorationPage } from './models/ExplorationPage';
import { MiningPage } from './models/MiningPage';

// Port range configuration
const PORT_RANGE_START = 8000;
const PORT_RANGE_END = 9000;
const PORT_BLACKLIST = [8080, 8443, 8551]; // Common ports to avoid

// Store used ports to avoid conflicts
const usedPorts = new Set<number>();

// File to track ports across test runs
const PORT_TRACKING_FILE = path.join(os.tmpdir(), 'galactic-sprawl-test-ports.json');

// Load previously used ports from file if it exists
try {
  if (fs.existsSync(PORT_TRACKING_FILE)) {
    const data = JSON.parse(fs.readFileSync(PORT_TRACKING_FILE, 'utf8'));
    if (Array.isArray(data.ports)) {
      data.ports.forEach((port: number) => usedPorts.add(port));
    }
  }
} catch (error) {
  console.warn('Failed to load port tracking file:', error);
}

// Save used ports to file
const saveUsedPorts = () => {
  try {
    fs.writeFileSync(
      PORT_TRACKING_FILE,
      JSON.stringify({ ports: Array.from(usedPorts), timestamp: Date.now() }),
      'utf8'
    );
  } catch (error) {
    console.warn('Failed to save port tracking file:', error);
  }
};

// Clean up old port entries (older than 1 hour)
const cleanupOldPorts = () => {
  try {
    if (fs.existsSync(PORT_TRACKING_FILE)) {
      const data = JSON.parse(fs.readFileSync(PORT_TRACKING_FILE, 'utf8'));
      if (data.timestamp && Date.now() - data.timestamp > 3600000) {
        // Clear ports older than 1 hour
        fs.unlinkSync(PORT_TRACKING_FILE);
        usedPorts.clear();
      }
    }
  } catch (error) {
    console.warn('Failed to clean up old ports:', error);
  }
};

// Clean up old ports on startup
cleanupOldPorts();

// Generate a unique port for each test run to avoid conflicts
const getUniquePort = (): number => {
  // Try to find an unused port in the range
  for (let attempt = 0; attempt < 100; attempt++) {
    const port = Math.floor(Math.random() * (PORT_RANGE_END - PORT_RANGE_START) + PORT_RANGE_START);

    // Skip blacklisted ports and already used ports
    if (PORT_BLACKLIST.includes(port) || usedPorts.has(port)) {
      continue;
    }

    // Mark port as used
    usedPorts.add(port);
    saveUsedPorts();
    return port;
  }

  // If we couldn't find a free port after 100 attempts, use a fallback approach
  const fallbackPort = PORT_RANGE_START + usedPorts.size;
  usedPorts.add(fallbackPort);
  saveUsedPorts();
  return fallbackPort;
};

// Store the current port to be used in the test
let currentPort = getUniquePort();

// Define custom fixtures
type CustomFixtures = {
  miningPage: MiningPage;
  explorationPage: ExplorationPage;
};

// Custom test fixture that includes page objects and port management
export const test = base.extend<CustomFixtures>({
  // Override the baseURL to use our unique port
  baseURL: async (_, use) => {
    // Use the current unique port
    await use(`http://localhost:${currentPort}`);

    // Generate a new port for the next test
    currentPort = getUniquePort();
  },

  // Add the MiningPage fixture
  miningPage: async ({ page }, use) => {
    const miningPage = new MiningPage(page);
    await use(miningPage);
  },

  // Add the ExplorationPage fixture
  explorationPage: async ({ page }, use) => {
    const explorationPage = new ExplorationPage(page);
    await use(explorationPage);
  },
});

// Export the expect function from the base test
export { expect } from '@playwright/test';

// Export a function to get the current port for use in test setup
export const getCurrentPort = () => currentPort;

// Setup function to be called before tests
export const setupTest = async (page: Page) => {
  // Add any global setup logic here
  console.warn(`Setting up test with port: ${currentPort}`);

  // Setup global error handling
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Page error: ${msg.text()}`);
    }
  });

  // Setup global navigation timeout
  page.setDefaultTimeout(10000);
};

// Teardown function to be called after tests
export const teardownTest = async (page: Page) => {
  // Add any global teardown logic here
  console.warn(`Tearing down test with port: ${currentPort}`);

  // Close any open dialogs
  try {
    await page.keyboard.press('Escape');
  } catch (_e) {
    // Ignore errors if no dialog is open
  }
};
