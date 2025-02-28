import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ModuleEvent, ModuleEventType, moduleEventBus } from '../../lib/modules/ModuleEvents';

/**
 * System identifier type
 */
export type SystemId =
  | 'resource-system'
  | 'module-system'
  | 'combat-system'
  | 'exploration-system'
  | 'mining-system'
  | 'tech-system'
  | 'ui-system'
  | 'game-loop'
  | 'event-system';

/**
 * Message priority levels
 */
export enum MessagePriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
  BACKGROUND = 4,
}

/**
 * System message interface
 */
export interface SystemMessage {
  id: string;
  source: SystemId;
  target: SystemId | 'broadcast';
  type: string;
  priority: MessagePriority;
  timestamp: number;
  payload: unknown;
  requiresAck?: boolean;
  correlationId?: string;
}

/**
 * Message acknowledgment interface
 */
export interface MessageAcknowledgment {
  messageId: string;
  source: SystemId;
  target: SystemId;
  timestamp: number;
  success: boolean;
  error?: string;
  correlationId?: string;
}

/**
 * Message handler type
 */
export type MessageHandler = (message: SystemMessage) => void | Promise<void>;

/**
 * Event communication system
 */
export class EventCommunication {
  private handlers: Map<SystemId, Map<string, Set<MessageHandler>>> = new Map();
  private messageSubject: Subject<SystemMessage> = new Subject();
  private ackSubject: Subject<MessageAcknowledgment> = new Subject();
  private systemId: SystemId;
  private pendingAcks: Map<
    string,
    {
      message: SystemMessage;
      timeout: NodeJS.Timeout;
      resolve: (ack: MessageAcknowledgment) => void;
      reject: (error: Error) => void;
    }
  > = new Map();

  constructor(systemId: SystemId) {
    this.systemId = systemId;
    this.initializeEventBusIntegration();
  }

  /**
   * Initialize integration with the module event bus
   */
  private initializeEventBusIntegration(): void {
    // Subscribe to system communication events
    moduleEventBus.subscribe('SYSTEM_MESSAGE' as ModuleEventType, (event: ModuleEvent) => {
      if (event.data && event.data.message) {
        const message = event.data.message as SystemMessage;

        // Process the message if it's targeted at this system or is a broadcast
        if (message.target === this.systemId || message.target === 'broadcast') {
          this.processIncomingMessage(message);
        }
      }
    });

    // Subscribe to acknowledgment events
    moduleEventBus.subscribe('SYSTEM_MESSAGE_ACK' as ModuleEventType, (event: ModuleEvent) => {
      if (event.data && event.data.ack) {
        const ack = event.data.ack as MessageAcknowledgment;

        // Process the acknowledgment if it's targeted at this system
        if (ack.target === this.systemId) {
          this.processAcknowledgment(ack);
        }
      }
    });
  }

  /**
   * Process an incoming message
   */
  private processIncomingMessage(message: SystemMessage): void {
    // Forward to the message subject
    this.messageSubject.next(message);

    // Get handlers for this message type
    const systemHandlers = this.handlers.get(this.systemId);
    if (!systemHandlers) {
      // If no handlers and message requires acknowledgment, send negative ack
      if (message.requiresAck) {
        this.sendAcknowledgment(
          message.id,
          message.source,
          false,
          'No handlers registered for this system',
        );
      }
      return;
    }

    const typeHandlers = systemHandlers.get(message.type);
    if (!typeHandlers || typeHandlers.size === 0) {
      // If no handlers for this type and message requires acknowledgment, send negative ack
      if (message.requiresAck) {
        this.sendAcknowledgment(
          message.id,
          message.source,
          false,
          `No handlers registered for message type: ${message.type}`,
        );
      }
      return;
    }

    // Call all handlers
    const handlerPromises: Promise<void>[] = [];
    const errors: Error[] = [];

    typeHandlers.forEach(handler => {
      try {
        const result = handler(message);
        if (result instanceof Promise) {
          handlerPromises.push(
            result.catch(error => {
              errors.push(error);
            }),
          );
        }
      } catch (error) {
        errors.push(error as Error);
      }
    });

    // If message requires acknowledgment, wait for all handlers to complete
    if (message.requiresAck) {
      if (handlerPromises.length > 0) {
        // Wait for all promises to resolve
        Promise.all(handlerPromises).then(() => {
          this.sendAcknowledgment(
            message.id,
            message.source,
            errors.length === 0,
            errors.length > 0 ? errors.map(e => e.message).join(', ') : undefined,
          );
        });
      } else {
        // Send acknowledgment immediately
        this.sendAcknowledgment(
          message.id,
          message.source,
          errors.length === 0,
          errors.length > 0 ? errors.map(e => e.message).join(', ') : undefined,
        );
      }
    }
  }

  /**
   * Process an acknowledgment
   */
  private processAcknowledgment(ack: MessageAcknowledgment): void {
    // Forward to the ack subject
    this.ackSubject.next(ack);

    // Resolve pending promise if exists
    const pending = this.pendingAcks.get(ack.messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingAcks.delete(ack.messageId);

      if (ack.success) {
        pending.resolve(ack);
      } else {
        pending.reject(new Error(ack.error || 'Unknown error'));
      }
    }
  }

  /**
   * Send an acknowledgment
   */
  private sendAcknowledgment(
    messageId: string,
    target: SystemId,
    success: boolean,
    error?: string,
  ): void {
    const ack: MessageAcknowledgment = {
      messageId,
      source: this.systemId,
      target,
      timestamp: Date.now(),
      success,
      error,
    };

    // Emit through the module event bus
    moduleEventBus.emit({
      type: 'SYSTEM_MESSAGE_ACK' as ModuleEventType,
      moduleId: `system-${this.systemId}`,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: { ack },
    });
  }

  /**
   * Register a message handler
   */
  public registerHandler(type: string, handler: MessageHandler): () => void {
    // Create system handlers map if it doesn't exist
    if (!this.handlers.has(this.systemId)) {
      this.handlers.set(this.systemId, new Map());
    }

    // Create type handlers set if it doesn't exist
    const systemHandlers = this.handlers.get(this.systemId)!;
    if (!systemHandlers.has(type)) {
      systemHandlers.set(type, new Set());
    }

    // Add the handler
    const typeHandlers = systemHandlers.get(type)!;
    typeHandlers.add(handler);

    // Return unregister function
    return () => {
      const systemHandlers = this.handlers.get(this.systemId);
      if (systemHandlers) {
        const typeHandlers = systemHandlers.get(type);
        if (typeHandlers) {
          typeHandlers.delete(handler);
          if (typeHandlers.size === 0) {
            systemHandlers.delete(type);
          }
        }
        if (systemHandlers.size === 0) {
          this.handlers.delete(this.systemId);
        }
      }
    };
  }

  /**
   * Send a message to another system
   */
  public sendMessage(
    target: SystemId | 'broadcast',
    type: string,
    payload: unknown,
    options: {
      priority?: MessagePriority;
      requiresAck?: boolean;
      timeout?: number;
      correlationId?: string;
    } = {},
  ): Promise<MessageAcknowledgment> | void {
    const {
      priority = MessagePriority.NORMAL,
      requiresAck = false,
      timeout = 5000,
      correlationId,
    } = options;

    const messageId = `${this.systemId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const message: SystemMessage = {
      id: messageId,
      source: this.systemId,
      target,
      type,
      priority,
      timestamp: Date.now(),
      payload,
      requiresAck,
      correlationId,
    };

    // Emit through the module event bus
    moduleEventBus.emit({
      type: 'SYSTEM_MESSAGE' as ModuleEventType,
      moduleId: `system-${this.systemId}`,
      moduleType: 'resource-manager',
      timestamp: Date.now(),
      data: { message },
    });

    // If acknowledgment is required, return a promise
    if (requiresAck) {
      return new Promise<MessageAcknowledgment>((resolve, reject) => {
        // Set timeout for acknowledgment
        const timeoutId = setTimeout(() => {
          this.pendingAcks.delete(messageId);
          reject(new Error(`Acknowledgment timeout for message ${messageId}`));
        }, timeout);

        // Store pending acknowledgment
        this.pendingAcks.set(messageId, {
          message,
          timeout: timeoutId,
          resolve,
          reject,
        });
      });
    }
  }

  /**
   * Get an observable of messages for a specific type
   */
  public getMessages(type?: string): Observable<SystemMessage> {
    return this.messageSubject
      .asObservable()
      .pipe(filter(message => !type || message.type === type));
  }

  /**
   * Get an observable of acknowledgments
   */
  public getAcknowledgments(correlationId?: string): Observable<MessageAcknowledgment> {
    return this.ackSubject
      .asObservable()
      .pipe(filter(ack => !correlationId || ack.correlationId === correlationId));
  }

  /**
   * Get an observable of message payloads for a specific type
   */
  public getMessagePayloads<T>(type: string): Observable<T> {
    return this.getMessages(type).pipe(map(message => message.payload as T));
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Clear all pending acknowledgments
    this.pendingAcks.forEach(pending => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('System communication cleanup'));
    });
    this.pendingAcks.clear();

    // Clear all handlers
    this.handlers.clear();

    // Complete subjects
    this.messageSubject.complete();
    this.ackSubject.complete();
  }
}

// Map of system communication instances
const systemCommunications: Map<SystemId, EventCommunication> = new Map();

/**
 * Get or create a system communication instance
 */
export function getSystemCommunication(systemId: SystemId): EventCommunication {
  if (!systemCommunications.has(systemId)) {
    systemCommunications.set(systemId, new EventCommunication(systemId));
  }
  return systemCommunications.get(systemId)!;
}

/**
 * Clean up all system communications
 */
export function cleanupAllSystemCommunications(): void {
  systemCommunications.forEach(comm => comm.cleanup());
  systemCommunications.clear();
}
