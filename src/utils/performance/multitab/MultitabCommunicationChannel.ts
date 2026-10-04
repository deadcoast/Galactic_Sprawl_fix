/**
 * MultitabCommunicationChannel
 *
 * A utility for establishing communication between multiple browser tabs
 * for coordinated performance testing. This enables testing scenarios where
 * multiple tabs are running the application simultaneously to measure performance impact.
 *
 * The communication is based on BroadcastChannel API with localStorage fallback
 * for older browsers.
 */

export interface TabMessage {
  /** Unique ID of the tab that sent the message */
  senderId: string;

  /** Type of message being sent */
  type: 'HELLO' | 'GOODBYE' | 'SYNC' | 'START_TEST' | 'END_TEST' | 'REPORT' | 'CONTROL' | 'ERROR';

  /** Timestamp when the message was sent */
  timestamp: number;

  /** Message data payload */
  payload?: Record<string, unknown>;
}

export interface TabInfo {
  /** Unique ID of the tab */
  id: string;

  /** Role of the tab in the test (coordinator or worker) */
  role: 'coordinator' | 'worker';

  /** When the tab joined the session */
  joinedAt: number;

  /** Current state of the tab */
  state: 'idle' | 'ready' | 'testing' | 'complete' | 'error';

  /** Last time we received a message from this tab */
  lastSeenAt: number;
}

export interface TestConfiguration {
  /** Type of test to run */
  testType: string;

  /** Test-specific parameters */
  parameters: Record<string, unknown>;

  /** Duration of the test in milliseconds */
  durationMs: number;

  /** Whether to synchronize the start of the test across tabs */
  synchronizeStart: boolean;
}

export type MessageHandler = (message: TabMessage) => void;

/**
 * Class for managing communication between tabs
 */
export class MultitabCommunicationChannel {
  /** Unique ID for this tab */
  private tabId: string;

  /** Role of this tab in the test */
  private role: 'coordinator' | 'worker';

  /** BroadcastChannel instance if supported */
  private broadcastChannel: BroadcastChannel | null = null;

  /** Information about all known tabs */
  private knownTabs = new Map<string, TabInfo>();

  /** Whether we're using localStorage fallback */
  private usingLocalStorageFallback = false;

  /** Storage key prefix for localStorage communication */
  private readonly storageKeyPrefix = 'multitab_perf_test_';

  /** Timestamp when we last checked localStorage */
  private lastStorageCheck = 0;

  /** Registered message handlers */
  private messageHandlers: MessageHandler[] = [];

  /** Storage polling interval ID */
  private pollingIntervalId: number | null = null;

  /** Whether the channel is currently active */
  private active = false;

  /**
   * Create a new MultitabCommunicationChannel
   *
   * @param role Role of this tab (coordinator or worker)
   */
  constructor(role: 'coordinator' | 'worker' = 'worker') {
    // Generate a unique ID for this tab
    this.tabId = this.generateTabId();
    this.role = role;

    // Add this tab to the known tabs
    this.knownTabs.set(this.tabId, {
      id: this.tabId,
      role: this.role,
      joinedAt: Date.now(),
      state: 'idle',
      lastSeenAt: Date.now(),
    });

    // Set up communication
    this.setupCommunication();
  }

  /**
   * Generate a unique ID for this tab
   */
  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Set up the communication channel
   */
  private setupCommunication(): void {
    // Try to use BroadcastChannel if available
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('galactic_sprawl_multitab_perf_test');
        this.broadcastChannel.onmessage = event => {
          this.handleIncomingMessage(event?.data);
        };
        console.warn(`[Tab ${this.tabId}] Using BroadcastChannel for communication`);
      } catch (error) {
        console.warn(
          'BroadcastChannel initialization failed, falling back to localStorage:',
          error
        );
        this.setupLocalStorageFallback();
      }
    } else {
      console.warn(
        `[Tab ${this.tabId}] BroadcastChannel not supported, falling back to localStorage`
      );
      this.setupLocalStorageFallback();
    }
  }

  /**
   * Set up localStorage fallback for environments without BroadcastChannel
   */
  private setupLocalStorageFallback(): void {
    this.usingLocalStorageFallback = true;

    // Listen for storage events
    window.addEventListener('storage', event => {
      if (event?.key && event?.key.startsWith(this.storageKeyPrefix)) {
        try {
          const message = JSON.parse(event?.newValue ?? '');
          // Ignore our own messages
          if (message.senderId !== this.tabId) {
            this.handleIncomingMessage(message);
          }
        } catch (error) {
          console.error('Error parsing multitab message:', error);
        }
      }
    });

    // Set up polling to periodically check localStorage in case storage events aren't reliable
    this.pollingIntervalId = window.setInterval(() => {
      this.checkLocalStorageMessages();
    }, 500) as unknown as number;
  }

  /**
   * Check localStorage for new messages
   */
  private checkLocalStorageMessages(): void {
    const now = Date.now();
    // Only check messages newer than our last check
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storageKeyPrefix)) {
        try {
          const messageData = localStorage.getItem(key);
          if (messageData) {
            const message = JSON.parse(messageData) as TabMessage;

            // Only process if it's not our own message and it's newer than our last check
            if (message.senderId !== this.tabId && message.timestamp > this.lastStorageCheck) {
              this.handleIncomingMessage(message);
            }
          }
        } catch (error) {
          console.error('Error checking localStorage message:', error);
        }
      }
    }
    this.lastStorageCheck = now;
  }

  /**
   * Handle an incoming message from another tab
   */
  private handleIncomingMessage(message: TabMessage): void {
    // Update last seen time for the sender tab
    if (this.knownTabs.has(message.senderId)) {
      const tabInfo = this.knownTabs.get(message.senderId)!;
      tabInfo.lastSeenAt = Date.now();
      this.knownTabs.set(message.senderId, tabInfo);
    } else if (message.type === 'HELLO') {
      // New tab joined
      this.knownTabs.set(message.senderId, {
        id: message.senderId,
        role: (message.payload?.role as 'coordinator' | 'worker') || 'worker',
        joinedAt: message.timestamp,
        state:
          (message.payload?.state as 'idle' | 'ready' | 'testing' | 'complete' | 'error') || 'idle',
        lastSeenAt: Date.now(),
      });

      // If we're the coordinator, send a HELLO back to let them know about us
      if (this.role === 'coordinator') {
        this.sendMessage({
          type: 'HELLO',
          payload: {
            role: this.role,
            state: this.getState(),
            knownTabs: Array.from(this.knownTabs.values()),
          },
        });
      }
    } else if (message.type === 'GOODBYE') {
      // Tab left
      this.knownTabs.delete(message.senderId);
    }

    // Notify handlers
    this.notifyHandlers(message);
  }

  /**
   * Notify all registered message handlers
   */
  private notifyHandlers(message: TabMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  /**
   * Send a message to all tabs
   */
  public sendMessage(message: Omit<TabMessage, 'senderId' | 'timestamp'>): void {
    if (!this.active) {
      console.warn('Attempted to send message on inactive channel');
      return;
    }

    const fullMessage: TabMessage = {
      ...message,
      senderId: this.tabId,
      timestamp: Date.now(),
    };

    // Send via BroadcastChannel if available
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(fullMessage);
    }

    // Also send via localStorage if we're using fallback or want to ensure delivery
    if (this.usingLocalStorageFallback) {
      const key = `${this.storageKeyPrefix}${fullMessage.timestamp}_${this.tabId}`;
      localStorage.setItem(key, JSON.stringify(fullMessage));

      // Clean up old messages after a delay
      setTimeout(() => {
        localStorage.removeItem(key);
      }, 10000);
    }
  }

  /**
   * Register a handler for incoming messages
   */
  public addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove a previously registered message handler
   */
  public removeMessageHandler(handler: MessageHandler): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Get information about all known tabs
   */
  public getKnownTabs(): TabInfo[] {
    return Array.from(this.knownTabs.values());
  }

  /**
   * Get the current state of this tab
   */
  public getState(): 'idle' | 'ready' | 'testing' | 'complete' | 'error' {
    const tabInfo = this.knownTabs.get(this.tabId);
    return tabInfo?.state ?? 'idle';
  }

  /**
   * Update the state of this tab
   */
  public setState(state: 'idle' | 'ready' | 'testing' | 'complete' | 'error'): void {
    const tabInfo = this.knownTabs.get(this.tabId);
    if (tabInfo) {
      tabInfo.state = state;
      this.knownTabs.set(this.tabId, tabInfo);

      // Notify other tabs of the state change
      this.sendMessage({
        type: 'SYNC',
        payload: { state },
      });
    }
  }

  /**
   * Clean up old tabs
   * Tabs that haven't sent a message in more than 30 seconds are considered closed
   */
  public cleanupOldTabs(): void {
    const now = Date.now();
    const threshold = now - 30000; // 30 seconds

    for (const [tabId, tabInfo] of this.knownTabs.entries()) {
      if (tabId !== this.tabId && tabInfo.lastSeenAt < threshold) {
        this.knownTabs.delete(tabId);
      }
    }
  }

  /**
   * Activate the communication channel and announce presence
   */
  public activate(): void {
    if (this.active) {
      return;
    }

    this.active = true;

    // Announce our presence
    this.sendMessage({
      type: 'HELLO',
      payload: {
        role: this.role,
        state: this.getState(),
      },
    });

    // Set up cleanup interval
    setInterval(() => {
      this.cleanupOldTabs();
    }, 10000);
  }

  /**
   * Deactivate the communication channel and clean up
   */
  public deactivate(): void {
    if (!this.active) {
      return;
    }

    // Announce our departure
    this.sendMessage({
      type: 'GOODBYE',
      payload: undefined,
    });

    // Clean up
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    if (this.pollingIntervalId !== null) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }

    this.active = false;
  }

  /**
   * Get this tab's ID
   */
  public getTabId(): string {
    return this.tabId;
  }

  /**
   * Get this tab's role
   */
  public getRole(): 'coordinator' | 'worker' {
    return this.role;
  }

  /**
   * Check if this tab is the coordinator
   */
  public isCoordinator(): boolean {
    return this.role === 'coordinator';
  }

  /**
   * Check if this tab is a worker
   */
  public isWorker(): boolean {
    return this.role === 'worker';
  }

  /**
   * Find the coordinator tab
   */
  public findCoordinator(): TabInfo | null {
    for (const tabInfo of this.knownTabs.values()) {
      if (tabInfo.role === 'coordinator') {
        return tabInfo;
      }
    }
    return null;
  }

  /**
   * Check if there are unknown active tabs (including this one)
   */
  public getActiveTabCount(): number {
    return this.knownTabs.size;
  }
}
