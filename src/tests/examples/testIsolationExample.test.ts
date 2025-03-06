import http from 'http';
import { beforeEach, describe, expect, it } from 'vitest';
import { WebSocketServer } from 'ws';
import { getTestWebSocketPort, registerTestWebSocketServer } from '../setup';
import { createResourceManagerRegistry } from '../utils/resourceManagerCleanup';
import { applyTestIsolation } from '../utils/testTeardown';

// Apply test isolation to this test suite
applyTestIsolation();

// Create a resource manager registry for this test suite
const registry = createResourceManagerRegistry();

// Create a real WebSocket server for testing
function createRealWebSocketServer(
  port?: number
): { server: WebSocketServer; httpServer: http.Server; port: number } | null {
  try {
    // Use provided port or get a new unique port
    const serverPort = port || getTestWebSocketPort();

    // Create HTTP server
    const httpServer = http.createServer();

    // Create real WebSocket server
    const wsServer = new WebSocketServer({ server: httpServer });

    // Start the server
    httpServer.listen(serverPort);

    // Register server for cleanup
    registerTestWebSocketServer(serverPort, () => {
      wsServer.close();
      httpServer.close();
    });

    return { server: wsServer, httpServer, port: serverPort };
  } catch (error) {
    console.error('Failed to create WebSocket server:', error);
    return null;
  }
}

// Example resource manager class
class ExampleResourceManager {
  private resources: Map<string, number> = new Map();

  constructor() {
    console.log('ExampleResourceManager created');
  }

  addResource(id: string, value: number): void {
    this.resources.set(id, value);
  }

  getResource(id: string): number | undefined {
    return this.resources.get(id);
  }

  reset(): void {
    console.log('ExampleResourceManager reset');
    this.resources.clear();
  }
}

describe('Test Isolation Example', () => {
  // Create a manager for each test
  let manager: ExampleResourceManager;

  beforeEach(() => {
    // Create a new manager for each test
    manager = registry.create(() => new ExampleResourceManager(), 'ExampleResourceManager');

    // Add some resources
    manager.addResource('resource1', 100);
    manager.addResource('resource2', 200);
  });

  it('should have isolated resources in test 1', () => {
    // Verify initial resources
    expect(manager.getResource('resource1')).toBe(100);
    expect(manager.getResource('resource2')).toBe(200);

    // Modify resources
    manager.addResource('resource1', 150);
    manager.addResource('resource3', 300);

    // Verify modified resources
    expect(manager.getResource('resource1')).toBe(150);
    expect(manager.getResource('resource2')).toBe(200);
    expect(manager.getResource('resource3')).toBe(300);
  });

  it('should have isolated resources in test 2', () => {
    // Verify initial resources (should be reset between tests)
    expect(manager.getResource('resource1')).toBe(100);
    expect(manager.getResource('resource2')).toBe(200);
    expect(manager.getResource('resource3')).toBeUndefined();

    // Modify resources differently
    manager.addResource('resource2', 250);
    manager.addResource('resource4', 400);

    // Verify modified resources
    expect(manager.getResource('resource1')).toBe(100);
    expect(manager.getResource('resource2')).toBe(250);
    expect(manager.getResource('resource3')).toBeUndefined();
    expect(manager.getResource('resource4')).toBe(400);
  });
});

describe('WebSocket Server Isolation Example', () => {
  it('should create isolated WebSocket servers', () => {
    // Create first real WebSocket server
    const result1 = createRealWebSocketServer();
    const result2 = createRealWebSocketServer();

    // Skip test if WebSocket servers couldn't be created
    if (!result1 || !result2) {
      console.log('WebSocket servers could not be created, skipping test');
      return;
    }

    const { server: server1, port: port1 } = result1;
    const { server: server2, port: port2 } = result2;

    // Verify that the ports are different
    expect(port1).not.toBe(port2);

    // Verify that the servers are different
    expect(server1).not.toBe(server2);
  });

  it('should allocate ports dynamically', () => {
    // Get a port for a specific service
    const port1 = getTestWebSocketPort('Service1');
    const port2 = getTestWebSocketPort('Service2');

    // Verify that the ports are different
    expect(port1).not.toBe(port2);

    // Create a WebSocket server with a specific port
    const result = createRealWebSocketServer(port1 + 1000);

    // Skip verification if WebSocket servers couldn't be created
    if (!result) {
      console.log('WebSocket server could not be created, skipping port verification');
      return;
    }

    const { port: port3 } = result;

    // Verify that the port is as expected
    expect(port3).toBe(port1 + 1000);
  });
});

describe('Multiple Manager Example', () => {
  // Create multiple managers
  let manager1: ExampleResourceManager;
  let manager2: ExampleResourceManager;

  beforeEach(() => {
    // Create managers
    manager1 = registry.create(() => new ExampleResourceManager(), 'Manager1');
    manager2 = registry.create(() => new ExampleResourceManager(), 'Manager2');

    // Initialize managers
    manager1.addResource('resource1', 100);
    manager2.addResource('resource2', 200);
  });

  it('should maintain isolation between managers', () => {
    // Verify initial resources
    expect(manager1.getResource('resource1')).toBe(100);
    expect(manager1.getResource('resource2')).toBeUndefined();
    expect(manager2.getResource('resource1')).toBeUndefined();
    expect(manager2.getResource('resource2')).toBe(200);

    // Modify resources
    manager1.addResource('shared', 300);
    manager2.addResource('shared', 400);

    // Verify that the resources are isolated
    expect(manager1.getResource('shared')).toBe(300);
    expect(manager2.getResource('shared')).toBe(400);
  });
});
