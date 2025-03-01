import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { moduleEventBus } from '../../../lib/modules/ModuleEvents';
import {
  cleanupAllSystemCommunications,
  EventCommunication,
  getSystemCommunication,
  MessageAcknowledgment,
  MessagePriority,
  SystemMessage,
} from '../../../utils/events/EventCommunication';

// Define handler types to replace any
type SystemMessageHandler = (event: { data: { message: SystemMessage } }) => void;
type SystemMessageAckHandler = (event: { data: { acknowledgment: MessageAcknowledgment } }) => void;

// Define a type for the mock emit calls
interface MockEmitCall {
  type: string;
  moduleId: string;
  data: {
    message: SystemMessage;
  };
}

// Define a type for the mock function
type MockFunction = ReturnType<typeof vi.fn>;

// Mock the moduleEventBus
vi.mock('../../../lib/modules/ModuleEvents', () => {
  return {
    moduleEventBus: {
      emit: vi.fn(),
      subscribe: vi.fn().mockImplementation((type, handler) => {
        // Store the handler so we can call it in tests
        if (type === 'SYSTEM_MESSAGE') {
          systemMessageHandler = handler;
        } else if (type === 'SYSTEM_MESSAGE_ACK') {
          systemMessageAckHandler = handler;
        }
        return () => {}; // Return unsubscribe function
      }),
    },
    ModuleEventType: {
      SYSTEM_MESSAGE: 'SYSTEM_MESSAGE',
      SYSTEM_MESSAGE_ACK: 'SYSTEM_MESSAGE_ACK',
    },
  };
});

// Store handlers for testing
let systemMessageHandler: SystemMessageHandler;
let systemMessageAckHandler: SystemMessageAckHandler;

describe('EventCommunication', () => {
  let resourceSystem: EventCommunication;
  let combatSystem: EventCommunication;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset handlers
    systemMessageHandler = null as unknown as SystemMessageHandler;
    systemMessageAckHandler = null as unknown as SystemMessageAckHandler;

    // Create system instances
    resourceSystem = getSystemCommunication('resource-system');
    combatSystem = getSystemCommunication('combat-system');
  });

  afterEach(() => {
    // Clean up
    cleanupAllSystemCommunications();
  });

  describe('initialization', () => {
    it('should subscribe to system message events', () => {
      // Check that it subscribed to the moduleEventBus
      expect(moduleEventBus.subscribe).toHaveBeenCalledWith('SYSTEM_MESSAGE', expect.any(Function));
      expect(moduleEventBus.subscribe).toHaveBeenCalledWith(
        'SYSTEM_MESSAGE_ACK',
        expect.any(Function)
      );
    });

    it('should create a singleton instance for each system ID', () => {
      // Get the same system again
      const resourceSystem2 = getSystemCommunication('resource-system');

      // Should be the same instance
      expect(resourceSystem2).toBe(resourceSystem);

      // Different systems should be different instances
      expect(combatSystem).not.toBe(resourceSystem);
    });
  });

  describe('message handling', () => {
    it('should register and call message handlers', () => {
      // Create a handler
      const handler = vi.fn();

      // Register the handler
      resourceSystem.registerHandler('test-message', handler);

      // Create a message
      const message: SystemMessage = {
        id: 'test-id',
        source: 'combat-system',
        target: 'resource-system',
        type: 'test-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that the handler was called with the message
      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should not call handlers for messages targeted at other systems', () => {
      // Create a handler
      const handler = vi.fn();

      // Register the handler
      resourceSystem.registerHandler('test-message', handler);

      // Create a message targeted at a different system
      const message: SystemMessage = {
        id: 'test-id',
        source: 'resource-system',
        target: 'combat-system', // Different target
        type: 'test-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that the handler was not called
      expect(handler).not.toHaveBeenCalled();
    });

    it('should call handlers for broadcast messages', () => {
      // Create handlers for both systems
      const resourceHandler = vi.fn();
      const combatHandler = vi.fn();

      // Register the handlers
      resourceSystem.registerHandler('broadcast-message', resourceHandler);
      combatSystem.registerHandler('broadcast-message', combatHandler);

      // Create a broadcast message
      const message: SystemMessage = {
        id: 'test-id',
        source: 'ui-system',
        target: 'broadcast',
        type: 'broadcast-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that both handlers were called
      expect(resourceHandler).toHaveBeenCalledWith(message);
      expect(combatHandler).toHaveBeenCalledWith(message);
    });

    it('should unregister handlers correctly', () => {
      // Create a handler
      const handler = vi.fn();

      // Register the handler and get the unregister function
      const unregister = resourceSystem.registerHandler('test-message', handler);

      // Unregister the handler
      unregister();

      // Create a message
      const message: SystemMessage = {
        id: 'test-id',
        source: 'combat-system',
        target: 'resource-system',
        type: 'test-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that the handler was not called
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('message sending', () => {
    it('should send messages through the event bus', () => {
      // Send a message
      resourceSystem.sendMessage('combat-system', 'test-message', { test: 'data' });

      // Check that it emitted through the moduleEventBus
      expect(moduleEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SYSTEM_MESSAGE',
          moduleId: 'system-resource-system',
          data: expect.objectContaining({
            message: expect.objectContaining({
              source: 'resource-system',
              target: 'combat-system',
              type: 'test-message',
              payload: { test: 'data' },
            }),
          }),
        })
      );
    });

    it('should send messages with custom priority', () => {
      // Send a message with high priority
      resourceSystem.sendMessage(
        'combat-system',
        'priority-message',
        { test: 'data' },
        { priority: MessagePriority.HIGH }
      );

      // Check that it emitted with the correct priority
      expect(moduleEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: expect.objectContaining({
              priority: MessagePriority.HIGH,
            }),
          }),
        })
      );
    });

    it('should return a promise when acknowledgment is required', async () => {
      // Mock Date.now to return a consistent value for testing
      const originalDateNow = Date.now;
      Date.now = vi.fn().mockReturnValue(1000);

      // Send a message that requires acknowledgment
      const promise = resourceSystem.sendMessage(
        'combat-system',
        'ack-message',
        { test: 'data' },
        { requiresAck: true }
      ) as Promise<MessageAcknowledgment>;

      // Check that it's a promise
      expect(promise).toBeInstanceOf(Promise);

      // Get the message ID from the emit call
      const emitCall = (moduleEventBus.emit as MockFunction).mock.calls[0][0] as MockEmitCall;
      const messageId = emitCall.data.message.id;

      // Create an acknowledgment
      const ack: MessageAcknowledgment = {
        messageId,
        source: 'combat-system',
        target: 'resource-system',
        timestamp: Date.now(),
        success: true,
      };

      // Simulate receiving the acknowledgment
      systemMessageAckHandler({
        data: { acknowledgment: ack },
      });

      // Check that the promise resolves with the acknowledgment
      const result = await promise;
      expect(result).toEqual(ack);

      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should reject the promise when acknowledgment fails', async () => {
      // Mock Date.now to return a consistent value for testing
      const originalDateNow = Date.now;
      Date.now = vi.fn().mockReturnValue(1000);

      // Send a message that requires acknowledgment
      const promise = resourceSystem.sendMessage(
        'combat-system',
        'ack-message',
        { test: 'data' },
        { requiresAck: true }
      ) as Promise<MessageAcknowledgment>;

      // Get the message ID from the emit call
      const emitCall = (moduleEventBus.emit as MockFunction).mock.calls[0][0] as MockEmitCall;
      const messageId = emitCall.data.message.id;

      // Create a failed acknowledgment
      const ack: MessageAcknowledgment = {
        messageId,
        source: 'combat-system',
        target: 'resource-system',
        timestamp: Date.now(),
        success: false,
        error: 'Test error',
      };

      // Simulate receiving the acknowledgment
      systemMessageAckHandler({
        data: { acknowledgment: ack },
      });

      // Check that the promise rejects with the error
      await expect(promise).rejects.toThrow('Test error');

      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should reject the promise when acknowledgment times out', async () => {
      // Mock timers
      vi.useFakeTimers();

      // Send a message that requires acknowledgment with a short timeout
      const promise = resourceSystem.sendMessage(
        'combat-system',
        'timeout-message',
        { test: 'data' },
        { requiresAck: true, timeout: 1000 }
      ) as Promise<MessageAcknowledgment>;

      // Advance time past the timeout
      await vi.advanceTimersByTimeAsync(1100);

      // Check that the promise rejects with a timeout error
      await expect(promise).rejects.toThrow('Acknowledgment timeout');

      // Restore timers
      vi.useRealTimers();
    });
  });

  describe('acknowledgment handling', () => {
    it('should send acknowledgments for messages that require them', () => {
      // Create a handler that doesn't throw
      const handler = vi.fn();

      // Register the handler
      resourceSystem.registerHandler('ack-message', handler);

      // Create a message that requires acknowledgment
      const message: SystemMessage = {
        id: 'test-id',
        source: 'combat-system',
        target: 'resource-system',
        type: 'ack-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
        requiresAck: true,
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that it sent a successful acknowledgment
      expect(moduleEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SYSTEM_MESSAGE_ACK',
          data: expect.objectContaining({
            ack: expect.objectContaining({
              messageId: 'test-id',
              source: 'resource-system',
              target: 'combat-system',
              success: true,
            }),
          }),
        })
      );
    });

    it('should send error acknowledgments when handlers throw', () => {
      // Create a handler that throws
      const handler = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      // Register the handler
      resourceSystem.registerHandler('error-message', handler);

      // Create a message that requires acknowledgment
      const message: SystemMessage = {
        id: 'test-id',
        source: 'combat-system',
        target: 'resource-system',
        type: 'error-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
        requiresAck: true,
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that it sent a failed acknowledgment with the error
      expect(moduleEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SYSTEM_MESSAGE_ACK',
          data: expect.objectContaining({
            ack: expect.objectContaining({
              messageId: 'test-id',
              source: 'resource-system',
              target: 'combat-system',
              success: false,
              error: 'Test error',
            }),
          }),
        })
      );
    });

    it('should send negative acknowledgments when no handlers exist', () => {
      // Create a message for a type with no handlers
      const message: SystemMessage = {
        id: 'test-id',
        source: 'combat-system',
        target: 'resource-system',
        type: 'no-handler-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
        requiresAck: true,
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that it sent a failed acknowledgment
      expect(moduleEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SYSTEM_MESSAGE_ACK',
          data: expect.objectContaining({
            ack: expect.objectContaining({
              messageId: 'test-id',
              source: 'resource-system',
              target: 'combat-system',
              success: false,
              error: expect.stringContaining('No handlers registered'),
            }),
          }),
        })
      );
    });

    it('should handle async handlers and wait for them to complete', async () => {
      // Create an async handler
      const handler = vi.fn().mockImplementation(async () => {
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Register the handler
      resourceSystem.registerHandler('async-message', handler);

      // Create a message that requires acknowledgment
      const message: SystemMessage = {
        id: 'test-id',
        source: 'combat-system',
        target: 'resource-system',
        type: 'async-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
        requiresAck: true,
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that the handler was called
      expect(handler).toHaveBeenCalled();

      // Wait for the async handler to complete
      await vi.advanceTimersByTimeAsync(100);

      // Check that it sent a successful acknowledgment after the handler completed
      expect(moduleEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SYSTEM_MESSAGE_ACK',
          data: expect.objectContaining({
            ack: expect.objectContaining({
              messageId: 'test-id',
              success: true,
            }),
          }),
        })
      );
    });
  });

  describe('observables', () => {
    it('should provide an observable of messages', () => {
      // Create a mock observer
      const nextFn = vi.fn();

      // Subscribe to messages
      const subscription = resourceSystem.getMessages().subscribe({
        next: nextFn,
      });

      // Create a message
      const message: SystemMessage = {
        id: 'test-id',
        source: 'combat-system',
        target: 'resource-system',
        type: 'test-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that the observer was called with the message
      expect(nextFn).toHaveBeenCalledWith(message);

      // Clean up
      subscription.unsubscribe();
    });

    it('should provide an observable of messages filtered by type', () => {
      // Create a mock observer
      const nextFn = vi.fn();

      // Subscribe to messages of a specific type
      const subscription = resourceSystem.getMessages('filtered-message').subscribe({
        next: nextFn,
      });

      // Create messages of different types
      const message1: SystemMessage = {
        id: 'test-id-1',
        source: 'combat-system',
        target: 'resource-system',
        type: 'filtered-message', // This should be received
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data-1' },
      };

      const message2: SystemMessage = {
        id: 'test-id-2',
        source: 'combat-system',
        target: 'resource-system',
        type: 'other-message', // This should be filtered out
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data-2' },
      };

      // Simulate receiving the messages
      systemMessageHandler({
        data: { message: message1 },
      });

      systemMessageHandler({
        data: { message: message2 },
      });

      // Check that the observer was called only with the filtered message
      expect(nextFn).toHaveBeenCalledTimes(1);
      expect(nextFn).toHaveBeenCalledWith(message1);

      // Clean up
      subscription.unsubscribe();
    });

    it('should provide an observable of acknowledgments', () => {
      // Create a mock observer
      const nextFn = vi.fn();

      // Subscribe to acknowledgments
      const subscription = resourceSystem.getAcknowledgments().subscribe({
        next: nextFn,
      });

      // Create an acknowledgment
      const ack: MessageAcknowledgment = {
        messageId: 'test-id',
        source: 'combat-system',
        target: 'resource-system',
        timestamp: Date.now(),
        success: true,
      };

      // Simulate receiving the acknowledgment
      systemMessageAckHandler({
        data: { acknowledgment: ack },
      });

      // Check that the observer was called with the acknowledgment
      expect(nextFn).toHaveBeenCalledWith(ack);

      // Clean up
      subscription.unsubscribe();
    });

    it('should provide an observable of message payloads', () => {
      // Create a mock observer
      const nextFn = vi.fn();

      // Subscribe to message payloads of a specific type
      const subscription = resourceSystem
        .getMessagePayloads<{ test: string }>('payload-message')
        .subscribe({
          next: nextFn,
        });

      // Create a message
      const message: SystemMessage = {
        id: 'test-id',
        source: 'combat-system',
        target: 'resource-system',
        type: 'payload-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that the observer was called with just the payload
      expect(nextFn).toHaveBeenCalledWith({ test: 'data' });

      // Clean up
      subscription.unsubscribe();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources', () => {
      // Create a handler
      const handler = vi.fn();

      // Register the handler
      resourceSystem.registerHandler('test-message', handler);

      // Create a mock observer
      const nextFn = vi.fn();

      // Subscribe to messages
      const subscription = resourceSystem.getMessages().subscribe({
        next: nextFn,
      });

      // Clean up
      resourceSystem.cleanup();

      // Create a message
      const message: SystemMessage = {
        id: 'test-id',
        source: 'combat-system',
        target: 'resource-system',
        type: 'test-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that the handler was not called
      expect(handler).not.toHaveBeenCalled();

      // Check that the observer was not called
      expect(nextFn).not.toHaveBeenCalled();

      // Clean up subscription
      subscription.unsubscribe();
    });

    it('should clean up all system communications', () => {
      // Create handlers for both systems
      const resourceHandler = vi.fn();
      const combatHandler = vi.fn();

      // Register the handlers
      resourceSystem.registerHandler('test-message', resourceHandler);
      combatSystem.registerHandler('test-message', combatHandler);

      // Clean up all systems
      cleanupAllSystemCommunications();

      // Create a broadcast message
      const message: SystemMessage = {
        id: 'test-id',
        source: 'ui-system',
        target: 'broadcast',
        type: 'test-message',
        priority: MessagePriority.NORMAL,
        timestamp: Date.now(),
        payload: { test: 'data' },
      };

      // Simulate receiving the message
      systemMessageHandler({
        data: { message },
      });

      // Check that neither handler was called
      expect(resourceHandler).not.toHaveBeenCalled();
      expect(combatHandler).not.toHaveBeenCalled();
    });

    it('should reject pending acknowledgments on cleanup', async () => {
      // Send a message that requires acknowledgment
      const promise = resourceSystem.sendMessage(
        'combat-system',
        'ack-message',
        { test: 'data' },
        { requiresAck: true }
      ) as Promise<MessageAcknowledgment>;

      // Clean up
      resourceSystem.cleanup();

      // Check that the promise rejects
      await expect(promise).rejects.toThrow('System communication cleanup');
    });
  });
});
