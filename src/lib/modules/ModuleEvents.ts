import { ModuleType } from '../../types/buildings/ModuleTypes';

/**
 * Module event types
 */
export type ModuleEventType =
  // Lifecycle events
  | 'MODULE_CREATED'
  | 'MODULE_ATTACHED'
  | 'MODULE_DETACHED'
  | 'MODULE_UPGRADED'
  | 'MODULE_ACTIVATED'
  | 'MODULE_DEACTIVATED'
  | 'MODULE_UPDATED'
  // Attachment events
  | 'ATTACHMENT_STARTED'
  | 'ATTACHMENT_CANCELLED'
  | 'ATTACHMENT_COMPLETED'
  | 'ATTACHMENT_PREVIEW_SHOWN'
  // Resource events
  | 'RESOURCE_PRODUCED'
  | 'RESOURCE_CONSUMED'
  | 'RESOURCE_TRANSFERRED'
  | 'RESOURCE_PRODUCTION_REGISTERED'
  | 'RESOURCE_PRODUCTION_UNREGISTERED'
  | 'RESOURCE_CONSUMPTION_REGISTERED'
  | 'RESOURCE_CONSUMPTION_UNREGISTERED'
  | 'RESOURCE_FLOW_REGISTERED'
  | 'RESOURCE_FLOW_UNREGISTERED'
  | 'RESOURCE_SHORTAGE'
  | 'RESOURCE_UPDATED'
  // Automation events
  | 'AUTOMATION_STARTED'
  | 'AUTOMATION_STOPPED'
  | 'AUTOMATION_CYCLE_COMPLETE'
  // Status events
  | 'STATUS_CHANGED'
  | 'ERROR_OCCURRED'
  // Mission events
  | 'MISSION_STARTED'
  | 'MISSION_COMPLETED'
  | 'MISSION_FAILED'
  | 'MISSION_PROGRESS_UPDATED'
  | 'MISSION_REWARD_CLAIMED'
  // Sub-module events
  | 'SUB_MODULE_CREATED'
  | 'SUB_MODULE_ATTACHED'
  | 'SUB_MODULE_DETACHED'
  | 'SUB_MODULE_UPGRADED'
  | 'SUB_MODULE_ACTIVATED'
  | 'SUB_MODULE_DEACTIVATED'
  | 'SUB_MODULE_EFFECT_APPLIED'
  | 'SUB_MODULE_EFFECT_REMOVED'
  // Combat events
  | 'COMBAT_UPDATED'
  // Tech events
  | 'TECH_UNLOCKED'
  | 'TECH_UPDATED';

/**
 * Module event interface
 */
export interface ModuleEvent {
  type: ModuleEventType;
  moduleId: string;
  moduleType: ModuleType;
  timestamp: number;
  data?: any;
}

/**
 * Event listener type
 */
type ModuleEventListener = (event: ModuleEvent) => void;

/**
 * Module event bus for handling module communication
 */
export class ModuleEventBus {
  private listeners: Map<ModuleEventType, Set<ModuleEventListener>>;
  private history: ModuleEvent[];
  private maxHistorySize: number;

  constructor(maxHistorySize = 1000) {
    this.listeners = new Map();
    this.history = [];
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Subscribe to module events
   */
  subscribe(type: ModuleEventType, listener: ModuleEventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(listener);

    // Return unsubscribe function
    return () => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.delete(listener);
        if (typeListeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  /**
   * Emit a module event
   */
  emit(event: ModuleEvent): void {
    // Add to history
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify listeners
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in module event listener:', error);
        }
      });
    }
  }

  /**
   * Get event history
   */
  getHistory(): ModuleEvent[] {
    return [...this.history];
  }

  /**
   * Get event history for a specific module
   */
  getModuleHistory(moduleId: string): ModuleEvent[] {
    return this.history.filter(event => event.moduleId === moduleId);
  }

  /**
   * Get event history for a specific type
   */
  getEventTypeHistory(type: ModuleEventType): ModuleEvent[] {
    return this.history.filter(event => event.type === type);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history = [];
  }
}

// Export singleton instance
export const moduleEventBus = new ModuleEventBus();
