// src/tests/setup.ts
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => {
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    length: 0,
  };
})();

// Mock moduleEventBus
const moduleEventBusMock = {
  emit: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
};

// Assign mocks to global object
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Define WebSocket server type
interface WebSocketServerInfo {
  port: number;
  close: () => void;
  server?: unknown;
}

// Create a global store for WebSocket servers
const webSocketServers: WebSocketServerInfo[] = [];

// Port range for WebSocket servers (to prevent conflicts)
const MIN_PORT = 8000;
const MAX_PORT = 9000;
let nextPort = MIN_PORT;

// Track if WebSocket servers are disabled globally
let disableWebSocketServers = false;

// Function to globally disable WebSocket servers for testing
export function disableAllWebSocketServers() {
  disableWebSocketServers = true;
  console.warn('[WebSocket] All WebSocket servers disabled for testing');
}

// Function to re-enable WebSocket servers for testing
export function enableAllWebSocketServers() {
  disableWebSocketServers = false;
  console.warn('[WebSocket] WebSocket servers re-enabled for testing');
}

// Setup for each test - standard test environment setup
function setupTestEnvironment() {
  // Reset mocks
  vi.clearAllMocks();

  // Clear localStorage
  localStorageMock.clear();
}

// Standard test environment teardown
function teardownTestEnvironment() {
  // Add any global teardown logic here
}

// Register the setup and teardown for each test
beforeEach(() => {
  setupTestEnvironment();
});

// Explicitly close all WebSocket servers after each test
afterEach(() => {
  // Run teardown
  teardownTestEnvironment();

  // Close all WebSocket servers registered for this test
  if (webSocketServers.length > 0) {
    console.warn(`[WebSocket] Cleaning up ${webSocketServers.length} WebSocket servers...`);

    for (const serverInfo of webSocketServers) {
      try {
        console.warn(`[WebSocket] Closing server on port ${serverInfo.port}`);
        serverInfo.close();
      } catch (err) {
        console.error(
          `[WebSocket] Error closing WebSocket server on port ${serverInfo.port}:`,
          err
        );
      }
    }

    // Clear the server list
    webSocketServers.length = 0;
  }
});

// Final cleanup after all tests
afterAll(() => {
  // Make sure we've closed all servers
  if (webSocketServers.length > 0) {
    console.warn(
      `[WebSocket] Found ${webSocketServers.length} unclosed WebSocket servers after all tests`
    );

    for (const serverInfo of webSocketServers) {
      try {
        console.warn(`[WebSocket] Closing leftover server on port ${serverInfo.port}`);
        serverInfo.close();
      } catch (err) {
        console.error(`[WebSocket] Error closing leftover WebSocket server:`, err);
      }
    }

    // Clear the server list
    webSocketServers.length = 0;
  }
});

// Register a WebSocket server for cleanup
export function registerTestWebSocketServer(port: number, closeFunction: () => void): void {
  console.warn(`[WebSocket] Registering WebSocket server on port ${port} for cleanup`);
  webSocketServers.push({ port, close: closeFunction });
}

// Get a unique WebSocket port for a test
export function getTestWebSocketPort(serviceName = 'WebSocketServer'): number {
  // Get a port in our test range
  const port = nextPort++;

  // Wrap around if we've used all ports
  if (nextPort > MAX_PORT) {
    nextPort = MIN_PORT;
  }

  console.warn(`[WebSocket] Allocated port ${port} for ${serviceName}`);
  return port;
}

// Create a test WebSocket server with automatic cleanup
export function createTestWebSocketServer(port?: number): { server: unknown; port: number } | null {
  // Skip if WebSocket servers are disabled
  if (disableWebSocketServers) {
    console.warn('[WebSocket] WebSocket servers are disabled, returning null');
    return null;
  }

  // Use provided port or get a new unique port
  const serverPort = port || getTestWebSocketPort();

  // Mock WebSocket server (would be a real one in actual implementation)
  const server = {
    clients: new Set(),
    close: () => {
      console.warn(`[WebSocket] Closed server on port ${serverPort}`);
    },
  };

  // Register for cleanup
  registerTestWebSocketServer(serverPort, server.close);

  return { server, port: serverPort };
}

// Export mocks and helper functions
export {
  disableWebSocketServers,
  moduleEventBusMock,
  setupTestEnvironment,
  teardownTestEnvironment,
};
