/**
 * Network Degradation Simulator
 *
 * This utility provides tools for simulating various network conditions to test
 * application performance and resilience under different network scenarios.
 *
 * Key capabilities:
 * - Simulate latency, bandwidth limitations, and packet loss
 * - Apply network degradation to fetch, WebSocket, and XMLHttpRequest
 * - Create realistic network profiles matching common scenarios
 * - Offer programmatic and declarative APIs for testing
 */

export interface NetworkCondition {
  /** Name describing this network condition */
  name: string;

  /** Description with more details about the network condition */
  description: string;

  /** Network latency in milliseconds (one-way) */
  latencyMs: number;

  /** Throughput in kilobits per second */
  throughputKbps: number;

  /** Packet loss probability (0-1) */
  packetLoss: number;

  /** Latency jitter in milliseconds (variance in latency) */
  jitterMs: number;

  /** Whether to simulate connection pauses/stalls */
  enableConnectionStalls: boolean;

  /** Duration of connection stalls in milliseconds */
  stallDurationMs?: number;

  /** Probability of a stall occurring (0-1) */
  stallProbability?: number;
}

/**
 * Pre-defined network condition profiles based on real-world scenarios
 */
export const NetworkProfiles: Record<string, NetworkCondition> = {
  PERFECT: {
    name: 'Perfect Connection',
    description: 'Ideal network conditions with no degradation',
    latencyMs: 0,
    throughputKbps: 1000000, // 1 Gbps
    packetLoss: 0,
    jitterMs: 0,
    enableConnectionStalls: false,
  },

  FAST_WIFI: {
    name: 'Fast WiFi',
    description: 'Strong, fast home WiFi connection',
    latencyMs: 5,
    throughputKbps: 50000, // 50 Mbps
    packetLoss: 0.001, // 0.1%
    jitterMs: 2,
    enableConnectionStalls: false,
  },

  AVERAGE_WIFI: {
    name: 'Average WiFi',
    description: 'Typical home WiFi connection',
    latencyMs: 20,
    throughputKbps: 15000, // 15 Mbps
    packetLoss: 0.005, // 0.5%
    jitterMs: 5,
    enableConnectionStalls: false,
  },

  SLOW_WIFI: {
    name: 'Slow WiFi',
    description: 'Weak or distant WiFi connection',
    latencyMs: 40,
    throughputKbps: 3000, // 3 Mbps
    packetLoss: 0.02, // 2%
    jitterMs: 10,
    enableConnectionStalls: true,
    stallDurationMs: 500,
    stallProbability: 0.01,
  },

  FIVE_G: {
    name: '5G Connection',
    description: 'Strong 5G mobile connection',
    latencyMs: 30,
    throughputKbps: 30000, // 30 Mbps
    packetLoss: 0.003, // 0.3%
    jitterMs: 8,
    enableConnectionStalls: false,
  },

  FOUR_G: {
    name: '4G Connection',
    description: 'Typical 4G/LTE mobile connection',
    latencyMs: 80,
    throughputKbps: 5000, // 5 Mbps
    packetLoss: 0.01, // 1%
    jitterMs: 15,
    enableConnectionStalls: true,
    stallDurationMs: 300,
    stallProbability: 0.015,
  },

  THREE_G: {
    name: '3G Connection',
    description: 'Older 3G mobile connection',
    latencyMs: 200,
    throughputKbps: 750, // 750 Kbps
    packetLoss: 0.03, // 3%
    jitterMs: 25,
    enableConnectionStalls: true,
    stallDurationMs: 800,
    stallProbability: 0.03,
  },

  EDGE: {
    name: 'EDGE Connection',
    description: 'Edge/2G mobile connection in rural areas',
    latencyMs: 400,
    throughputKbps: 250, // 250 Kbps
    packetLoss: 0.05, // 5%
    jitterMs: 40,
    enableConnectionStalls: true,
    stallDurationMs: 1500,
    stallProbability: 0.05,
  },

  SATELLITE: {
    name: 'Satellite Connection',
    description: 'High-latency satellite internet',
    latencyMs: 600,
    throughputKbps: 1000, // 1 Mbps
    packetLoss: 0.02, // 2%
    jitterMs: 50,
    enableConnectionStalls: true,
    stallDurationMs: 2000,
    stallProbability: 0.025,
  },

  POOR_NETWORK: {
    name: 'Poor Network',
    description: 'Unreliable network with high packet loss',
    latencyMs: 300,
    throughputKbps: 500, // 500 Kbps
    packetLoss: 0.1, // 10%
    jitterMs: 100,
    enableConnectionStalls: true,
    stallDurationMs: 3000,
    stallProbability: 0.08,
  },

  AIRPLANE_WIFI: {
    name: 'Airplane WiFi',
    description: 'Typical in-flight WiFi connection',
    latencyMs: 750,
    throughputKbps: 300, // 300 Kbps
    packetLoss: 0.08, // 8%
    jitterMs: 150,
    enableConnectionStalls: true,
    stallDurationMs: 5000,
    stallProbability: 0.1,
  },

  INTERNATIONAL: {
    name: 'International Connection',
    description: 'Connection to server in a different continent',
    latencyMs: 350,
    throughputKbps: 2000, // 2 Mbps
    packetLoss: 0.03, // 3%
    jitterMs: 30,
    enableConnectionStalls: true,
    stallDurationMs: 1000,
    stallProbability: 0.02,
  },

  // This is effectively a disconnected state with occasional successful packets
  SEVERELY_DEGRADED: {
    name: 'Severely Degraded',
    description: 'Almost unusable connection with extreme packet loss',
    latencyMs: 1000,
    throughputKbps: 50, // 50 Kbps
    packetLoss: 0.5, // 50%
    jitterMs: 500,
    enableConnectionStalls: true,
    stallDurationMs: 10000,
    stallProbability: 0.2,
  },

  OFFLINE: {
    name: 'Offline',
    description: 'No connectivity (100% packet loss)',
    latencyMs: 0,
    throughputKbps: 0,
    packetLoss: 1.0, // 100%
    jitterMs: 0,
    enableConnectionStalls: false,
  },
};

/**
 * Stores original network-related methods to restore them later
 */
const originalMethods = {
  fetch: typeof window !== 'undefined' ? window.fetch : null,
  XMLHttpRequest:
    typeof XMLHttpRequest !== 'undefined'
      ? {
          open: XMLHttpRequest.prototype.open,
          send: XMLHttpRequest.prototype.send,
        }
      : null,
  setTimeout: setTimeout,
  WebSocket: typeof WebSocket !== 'undefined' ? WebSocket : null,
};

/**
 * Network degradation simulation state
 */
interface SimulationState {
  enabled: boolean;
  currentCondition: NetworkCondition | null;
  proxiedFetch: boolean;
  proxiedXHR: boolean;
  proxiedWebSocket: boolean;
}

/**
 * Current state of the network degradation simulator
 */
const simulationState: SimulationState = {
  enabled: false,
  currentCondition: null,
  proxiedFetch: false,
  proxiedXHR: false,
  proxiedWebSocket: false,
};

/**
 * Calculate actual delay based on network condition parameters
 * @param condition The network condition
 */
function calculateDelay(condition: NetworkCondition): number {
  if (!condition) return 0;

  // Base latency
  let delay = condition.latencyMs;

  // Add jitter (random variance in latency)
  if (condition.jitterMs > 0) {
    delay += (Math.random() * 2 - 1) * condition.jitterMs;
  }

  // Ensure delay is never negative
  return Math.max(0, delay);
}

/**
 * Simulate connection stall if enabled in the network condition
 * @param condition The network condition
 */
function simulateConnectionStall(condition: NetworkCondition): Promise<void> {
  if (
    !condition.enableConnectionStalls ||
    typeof condition.stallProbability !== 'number' ||
    typeof condition.stallDurationMs !== 'number'
  ) {
    return Promise.resolve();
  }

  // Determine if a stall should occur
  if (Math.random() < condition.stallProbability) {
    return new Promise(resolve => {
      setTimeout(resolve, condition.stallDurationMs);
    });
  }

  return Promise.resolve();
}

/**
 * Simulate packet loss based on the network condition
 * @param condition The network condition
 * @throws Error if packet is "lost"
 */
function simulatePacketLoss(condition: NetworkCondition): void {
  if (Math.random() < condition.packetLoss) {
    throw new Error(`Network error: Simulated packet loss (${condition.name})`);
  }
}

/**
 * Calculate delay for a data transfer based on throughput
 * @param byteSize Size of data in bytes
 * @param condition The network condition
 */
function calculateThroughputDelay(byteSize: number, condition: NetworkCondition): number {
  if (!condition || condition.throughputKbps <= 0) return 0;

  // Convert bytes to bits and calculate transfer time in seconds
  const bits = byteSize * 8;
  const seconds = bits / (condition.throughputKbps * 1000);

  // Convert to milliseconds
  return seconds * 1000;
}

/**
 * Apply network degradation to fetch API
 * @param condition The network condition to apply
 */
function proxyFetch(condition: NetworkCondition): void {
  if (typeof window === 'undefined' || !window.fetch || simulationState.proxiedFetch) return;

  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch with degraded version
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!simulationState.enabled) {
      return originalFetch(input, init);
    }

    try {
      // Simulate initial latency (request)
      const latency = calculateDelay(condition);
      await new Promise(resolve => setTimeout(resolve, latency));

      // Simulate connection stalls
      await simulateConnectionStall(condition);

      // Simulate packet loss
      simulatePacketLoss(condition);

      // Make the actual request
      const response = await originalFetch(input, init);

      // Clone the response to access its body
      const clone = response.clone();
      const text = await clone.text();

      // Calculate throughput delay based on response size
      const byteSize = new TextEncoder().encode(text).length;
      const throughputDelay = calculateThroughputDelay(byteSize, condition);

      // Simulate response latency + throughput delay
      await new Promise(resolve => setTimeout(resolve, latency + throughputDelay));

      // Simulate packet loss again (for response)
      simulatePacketLoss(condition);

      // Create a new response with the same data
      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      if (error.message.includes('Simulated packet loss')) {
        throw new TypeError('NetworkError when attempting to fetch resource');
      }
      throw error;
    }
  };

  simulationState.proxiedFetch = true;
}

/**
 * Apply network degradation to XMLHttpRequest
 * @param condition The network condition to apply
 */
function proxyXHR(condition: NetworkCondition): void {
  if (typeof XMLHttpRequest === 'undefined' || simulationState.proxiedXHR) return;

  // Store original XHR methods
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  // Override XHR open method
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: any[]) {
    // Store network condition in the XHR instance
    (this as any).__networkCondition = simulationState.enabled ? condition : null;
    return originalOpen.apply(this, args);
  };

  // Override XHR send method
  XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...args: any[]) {
    const xhrNetworkCondition = (this as any).__networkCondition;

    if (!xhrNetworkCondition) {
      return originalSend.apply(this, args);
    }

    // Calculate request latency
    const latency = calculateDelay(xhrNetworkCondition);

    // Store original callbacks
    const originalOnload = this.onload;
    const originalOnerror = this.onerror;
    const originalOnreadystatechange = this.onreadystatechange;

    // Simulate packet loss
    if (Math.random() < xhrNetworkCondition.packetLoss) {
      setTimeout(() => {
        if (typeof originalOnerror === 'function') {
          const errorEvent = new ErrorEvent('error', {
            message: 'Simulated packet loss',
          });
          originalOnerror.call(this, errorEvent);
        }
      }, latency);

      return;
    }

    // Handle readystatechange
    this.onreadystatechange = function (this: XMLHttpRequest, ...rsArgs: any[]) {
      if (this.readyState === 4) {
        // Calculate throughput delay for the response
        let throughputDelay = 0;
        if (this.responseText) {
          const byteSize = new TextEncoder().encode(this.responseText).length;
          throughputDelay = calculateThroughputDelay(byteSize, xhrNetworkCondition);
        }

        // Delay the readystatechange with both latency and throughput delay
        setTimeout(() => {
          if (typeof originalOnreadystatechange === 'function') {
            originalOnreadystatechange.apply(this, rsArgs);
          }
        }, latency + throughputDelay);

        return;
      }

      if (typeof originalOnreadystatechange === 'function') {
        originalOnreadystatechange.apply(this, rsArgs);
      }
    };

    // Delay the actual send
    setTimeout(() => {
      originalSend.apply(this, args);
    }, latency);
  };

  simulationState.proxiedXHR = true;
}

/**
 * Apply network degradation to WebSocket
 * @param condition The network condition to apply
 */
function proxyWebSocket(condition: NetworkCondition): void {
  if (typeof WebSocket === 'undefined' || simulationState.proxiedWebSocket) return;

  // Store original WebSocket constructor
  const OriginalWebSocket = WebSocket;

  // Create a proxy WebSocket class
  class DegradedWebSocket extends OriginalWebSocket {
    constructor(...args: any[]) {
      super(...args);

      if (!simulationState.enabled) return;

      // Store original event handlers
      const originalOnopen = this.onopen;
      const originalOnmessage = this.onmessage;
      const originalOnclose = this.onclose;
      const originalOnerror = this.onerror;

      // Apply connection latency for open event
      this.onopen = function (this: WebSocket, ev: Event) {
        setTimeout(() => {
          if (typeof originalOnopen === 'function') {
            originalOnopen.call(this, ev);
          }
        }, calculateDelay(condition));
      };

      // Apply latency and packet loss to messages
      this.onmessage = function (this: WebSocket, ev: MessageEvent) {
        // Simulate packet loss
        if (Math.random() < condition.packetLoss) {
          return; // Message lost
        }

        // Calculate message throughput delay
        let throughputDelay = 0;
        if (typeof ev.data === 'string') {
          const byteSize = new TextEncoder().encode(ev.data).length;
          throughputDelay = calculateThroughputDelay(byteSize, condition);
        } else if (ev.data instanceof Blob) {
          throughputDelay = calculateThroughputDelay(ev.data.size, condition);
        } else if (ev.data instanceof ArrayBuffer) {
          throughputDelay = calculateThroughputDelay(ev.data.byteLength, condition);
        }

        // Delay message by latency + throughput
        setTimeout(
          () => {
            if (typeof originalOnmessage === 'function') {
              originalOnmessage.call(this, ev);
            }
          },
          calculateDelay(condition) + throughputDelay
        );
      };

      // Store other callbacks
      this.onclose = originalOnclose;
      this.onerror = originalOnerror;

      // Override send method to add latency and packet loss
      const originalSend = this.send;
      this.send = function (
        this: WebSocket,
        data: string | ArrayBufferLike | Blob | ArrayBufferView
      ) {
        // Simulate packet loss for outgoing messages
        if (Math.random() < condition.packetLoss) {
          // Trigger error for lost packet
          if (typeof this.onerror === 'function') {
            const errorEvent = new ErrorEvent('error', {
              message: 'Simulated packet loss for outgoing message',
            });
            this.onerror.call(this, errorEvent as Event);
          }
          return;
        }

        // Calculate latency
        setTimeout(() => {
          try {
            originalSend.call(this, data);
          } catch (e) {
            if (typeof this.onerror === 'function') {
              this.onerror.call(this, new Event('error'));
            }
          }
        }, calculateDelay(condition));
      };
    }
  }

  // Replace global WebSocket with our degraded version
  window.WebSocket = DegradedWebSocket as any;

  simulationState.proxiedWebSocket = true;
}

/**
 * Interface for options when enabling network degradation
 */
export interface EnableOptions {
  /** Whether to proxy fetch API */
  proxyFetch?: boolean;

  /** Whether to proxy XMLHttpRequest */
  proxyXHR?: boolean;

  /** Whether to proxy WebSocket */
  proxyWebSocket?: boolean;
}

/**
 * Enable network degradation simulation with specified conditions
 * @param condition The network condition to simulate
 * @param options Options for enabling network degradation
 */
export function enableNetworkDegradation(
  condition: NetworkCondition,
  options: EnableOptions = { proxyFetch: true, proxyXHR: true, proxyWebSocket: true }
): void {
  // Already enabled with same condition - do nothing
  if (simulationState.enabled && simulationState.currentCondition?.name === condition.name) {
    return;
  }

  // If previously enabled with different condition, disable first
  if (simulationState.enabled) {
    disableNetworkDegradation();
  }

  // Update simulation state
  simulationState.enabled = true;
  simulationState.currentCondition = condition;

  // Apply proxies based on options
  if (options.proxyFetch !== false) {
    proxyFetch(condition);
  }

  if (options.proxyXHR !== false) {
    proxyXHR(condition);
  }

  if (options.proxyWebSocket !== false) {
    proxyWebSocket(condition);
  }

  console.log(`Network degradation simulation enabled: ${condition.name}`);
  console.log(
    `  Latency: ${condition.latencyMs}ms, Throughput: ${condition.throughputKbps}Kbps, Packet Loss: ${condition.packetLoss * 100}%`
  );
}

/**
 * Disable network degradation simulation and restore original behavior
 */
export function disableNetworkDegradation(): void {
  if (!simulationState.enabled) return;

  // Restore original methods
  if (simulationState.proxiedFetch && typeof window !== 'undefined' && originalMethods.fetch) {
    window.fetch = originalMethods.fetch;
    simulationState.proxiedFetch = false;
  }

  if (
    simulationState.proxiedXHR &&
    typeof XMLHttpRequest !== 'undefined' &&
    originalMethods.XMLHttpRequest
  ) {
    XMLHttpRequest.prototype.open = originalMethods.XMLHttpRequest.open;
    XMLHttpRequest.prototype.send = originalMethods.XMLHttpRequest.send;
    simulationState.proxiedXHR = false;
  }

  if (
    simulationState.proxiedWebSocket &&
    typeof window !== 'undefined' &&
    originalMethods.WebSocket
  ) {
    window.WebSocket = originalMethods.WebSocket;
    simulationState.proxiedWebSocket = false;
  }

  // Reset simulation state
  simulationState.enabled = false;
  simulationState.currentCondition = null;

  console.log('Network degradation simulation disabled');
}

/**
 * Get the current network condition being simulated
 * @returns The current network condition or null if disabled
 */
export function getCurrentNetworkCondition(): NetworkCondition | null {
  return simulationState.enabled ? simulationState.currentCondition : null;
}

/**
 * Check if network degradation simulation is enabled
 * @returns True if enabled, false otherwise
 */
export function isNetworkDegradationEnabled(): boolean {
  return simulationState.enabled;
}

/**
 * Create a custom network condition
 * @param config Configuration for the custom network condition
 * @returns A new NetworkCondition object
 */
export function createCustomNetworkCondition(
  config: Partial<NetworkCondition> & { name: string }
): NetworkCondition {
  return {
    description: config.description || 'Custom network condition',
    latencyMs: config.latencyMs || 0,
    throughputKbps: config.throughputKbps || 1000000,
    packetLoss: config.packetLoss || 0,
    jitterMs: config.jitterMs || 0,
    enableConnectionStalls: config.enableConnectionStalls || false,
    stallDurationMs: config.stallDurationMs,
    stallProbability: config.stallProbability,
    ...config,
  };
}

/**
 * Apply network degradation to a specific function or Promise
 * Useful for targeted testing without affecting the entire application
 *
 * @param condition The network condition to simulate
 * @param fn The function to degrade
 * @returns A new function with network degradation applied
 */
export function withNetworkDegradation<T extends (...args: any[]) => any>(
  condition: NetworkCondition,
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Initial request latency
    const latency = calculateDelay(condition);
    await new Promise(resolve => setTimeout(resolve, latency));

    // Simulate connection stall
    await simulateConnectionStall(condition);

    // Simulate packet loss
    if (Math.random() < condition.packetLoss) {
      throw new Error(`Network error: Simulated packet loss (${condition.name})`);
    }

    // Call the original function
    const result = await fn(...args);

    // Calculate response size for throughput
    let byteSize = 1000; // Default size estimate

    if (result && typeof result === 'object') {
      try {
        const resultString = JSON.stringify(result);
        byteSize = new TextEncoder().encode(resultString).length;
      } catch (e) {
        // Ignore, use default size
      }
    } else if (typeof result === 'string') {
      byteSize = new TextEncoder().encode(result).length;
    }

    // Calculate throughput delay
    const throughputDelay = calculateThroughputDelay(byteSize, condition);

    // Response latency
    await new Promise(resolve => setTimeout(resolve, latency + throughputDelay));

    // Response packet loss
    if (Math.random() < condition.packetLoss) {
      throw new Error(`Network error: Simulated packet loss (${condition.name})`);
    }

    return result;
  };
}

/**
 * Run a test under simulated network conditions
 * @param condition The network condition to simulate
 * @param testFn The test function to run
 * @param options Options for enabling network degradation
 * @returns The result of the test function
 */
export async function runWithNetworkCondition<T>(
  condition: NetworkCondition,
  testFn: () => Promise<T>,
  options?: EnableOptions
): Promise<T> {
  try {
    // Enable network degradation
    enableNetworkDegradation(condition, options);

    // Run the test
    return await testFn();
  } finally {
    // Always disable network degradation when done
    disableNetworkDegradation();
  }
}

/**
 * Run the same test across multiple network conditions
 * @param testFn The test function to run
 * @param conditions The network conditions to test with
 * @param options Options for enabling network degradation
 * @returns Array of results for each network condition
 */
export async function runAcrossNetworkConditions<T>(
  testFn: (condition: NetworkCondition) => Promise<T>,
  conditions: NetworkCondition[] = Object.values(NetworkProfiles),
  options?: EnableOptions
): Promise<Array<{ condition: NetworkCondition; result: T }>> {
  const results: Array<{ condition: NetworkCondition; result: T }> = [];

  for (const condition of conditions) {
    try {
      // Enable network degradation for this condition
      enableNetworkDegradation(condition, options);

      // Run the test
      const result = await testFn(condition);

      // Store result
      results.push({ condition, result });
    } catch (error) {
      // Store error as result
      results.push({
        condition,
        result: { error, message: error.message } as unknown as T,
      });
    } finally {
      // Disable network degradation between tests
      disableNetworkDegradation();
    }
  }

  return results;
}
