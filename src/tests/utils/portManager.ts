/**
 * Port Manager Utility for Test Environment
 *
 * This utility helps manage port allocation for services in tests to prevent port conflicts.
 * It keeps track of used ports, provides methods to get available ports, and ensures proper cleanup.
 */

interface PortAllocation {
  port: number;
  service: string;
  timestamp: number;
}

export class PortManager {
  private static usedPorts = new Map<number, PortAllocation>();
  private static portBlacklist = new Set([3000, 8080, 8000, 4173, 5173]); // Common ports to avoid
  private static MIN_PORT = 10000;
  private static MAX_PORT = 65535;
  private static PORT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Get an available port for a service
   * @param serviceName Name of the service requesting the port
   * @returns Available port number
   */
  static getAvailablePort(serviceName = 'unknown'): number {
    // Clean up expired ports first
    this.cleanupExpiredPorts();

    let port = this.generateRandomPort();
    while (this.usedPorts.has(port) || this.portBlacklist.has(port)) {
      port = this.generateRandomPort();
    }

    this.usedPorts.set(port, {
      port,
      service: serviceName,
      timestamp: Date.now(),
    });

    console.log(`[PortManager] Allocated port ${port} for service ${serviceName}`);
    return port;
  }

  /**
   * Release a port when it's no longer needed
   * @param port Port number to release
   */
  static releasePort(port: number): void {
    if (this.usedPorts.has(port)) {
      const allocation = this.usedPorts.get(port);
      console.log(`[PortManager] Released port ${port} for service ${allocation?.service}`);
      this.usedPorts.delete(port);
    }
  }

  /**
   * Generate a random port number within the allowed range
   * @returns Random port number
   */
  private static generateRandomPort(): number {
    return Math.floor(Math.random() * (this.MAX_PORT - this.MIN_PORT) + this.MIN_PORT);
  }

  /**
   * Clean up expired port allocations
   */
  private static cleanupExpiredPorts(): void {
    const now = Date.now();
    const expiredPorts: number[] = [];

    this.usedPorts.forEach((allocation, port) => {
      if (now - allocation.timestamp > this.PORT_EXPIRY_MS) {
        expiredPorts.push(port);
      }
    });

    expiredPorts.forEach(port => {
      const allocation = this.usedPorts.get(port);
      console.log(`[PortManager] Expired port ${port} for service ${allocation?.service}`);
      this.usedPorts.delete(port);
    });
  }

  /**
   * Reset the port manager (typically used in global test teardown)
   */
  static reset(): void {
    console.log(`[PortManager] Reset - cleared ${this.usedPorts.size} port allocations`);
    this.usedPorts.clear();
  }

  /**
   * Get all currently allocated ports (for debugging)
   * @returns Array of port allocations
   */
  static getAllocatedPorts(): PortAllocation[] {
    return Array.from(this.usedPorts.values());
  }

  /**
   * Check if a specific port is available
   * @param port Port number to check
   * @returns True if the port is available
   */
  static isPortAvailable(port: number): boolean {
    return !this.usedPorts.has(port) && !this.portBlacklist.has(port);
  }
}
