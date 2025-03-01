import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import {
  ResourceAlert,
  ResourceState,
  ResourceThreshold,
  ResourceType,
} from '../../types/resources/ResourceTypes';
import { validateResourceThreshold } from '../../utils/resources/resourceValidation';

// Map our custom event types to the standard ModuleEventType
const RESOURCE_UPDATE: ModuleEventType = 'RESOURCE_UPDATED';
const RESOURCE_THRESHOLD_TRIGGERED: ModuleEventType = 'STATUS_CHANGED';
const RESOURCE_THRESHOLD_RESOLVED: ModuleEventType = 'STATUS_CHANGED';
const RESOURCE_PRODUCTION_ADJUST: ModuleEventType = 'RESOURCE_PRODUCTION_REGISTERED';
const RESOURCE_CONSUMPTION_ADJUST: ModuleEventType = 'RESOURCE_CONSUMPTION_REGISTERED';
const RESOURCE_TRANSFER_REQUEST: ModuleEventType = 'RESOURCE_TRANSFERRED';
const NOTIFICATION_CREATE: ModuleEventType = 'STATUS_CHANGED';
const RESOURCE_ALERT_CREATED: ModuleEventType = 'STATUS_CHANGED';
const RESOURCE_ALERT_CLEARED: ModuleEventType = 'STATUS_CHANGED';

// Resource manager module ID and type
const RESOURCE_MANAGER_ID = 'resource-threshold-manager';
const RESOURCE_MANAGER_TYPE: ModuleType = 'resource-manager';

/**
 * Threshold action types
 */
export type ThresholdActionType = 'production' | 'consumption' | 'transfer' | 'notification';

/**
 * Threshold action
 */
export interface ThresholdAction {
  type: ThresholdActionType;
  target: string;
  amount?: number;
  message?: string;
  priority?: number;
}

/**
 * Threshold configuration
 */
export interface ThresholdConfig {
  id: string;
  threshold: ResourceThreshold;
  actions: ThresholdAction[];
  enabled: boolean;
  autoResolve?: boolean;
}

/**
 * Threshold status
 */
export type ThresholdStatus = 'inactive' | 'warning' | 'critical' | 'resolved';

/**
 * Threshold state
 */
export interface ThresholdState {
  config: ThresholdConfig;
  status: ThresholdStatus;
  lastTriggered?: number;
  lastResolved?: number;
  actionsTaken: number;
}

/**
 * Resource Threshold Manager
 * Manages resource thresholds and triggers actions when thresholds are crossed
 */
export class ResourceThresholdManager {
  private thresholds: Map<string, ThresholdConfig>;
  private thresholdStates: Map<string, ThresholdState>;
  private activeAlerts: Map<string, ResourceAlert>;
  private resourceStates: Map<ResourceType, ResourceState>;
  private checkInterval: number;
  private intervalId: NodeJS.Timeout | null;
  private lastCheck: number;

  constructor(checkInterval = 1000) {
    this.thresholds = new Map();
    this.thresholdStates = new Map();
    this.activeAlerts = new Map();
    this.resourceStates = new Map();
    this.checkInterval = checkInterval;
    this.intervalId = null;
    this.lastCheck = Date.now();

    // Register event listeners
    moduleEventBus.subscribe(RESOURCE_UPDATE, this.handleResourceUpdate);
  }

  /**
   * Start threshold monitoring
   */
  public start(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.checkThresholds();
    }, this.checkInterval);
  }

  /**
   * Stop threshold monitoring
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Register a threshold configuration
   */
  public registerThreshold(config: ThresholdConfig): boolean {
    if (!config.id || !validateResourceThreshold(config.threshold)) {
      console.error('Invalid threshold configuration:', config);
      return false;
    }

    this.thresholds.set(config.id, config);
    this.thresholdStates.set(config.id, {
      config,
      status: 'inactive',
      actionsTaken: 0,
    });

    return true;
  }

  /**
   * Unregister a threshold configuration
   */
  public unregisterThreshold(id: string): boolean {
    if (!this.thresholds.has(id)) {
      return false;
    }

    this.thresholds.delete(id);
    this.thresholdStates.delete(id);
    return true;
  }

  /**
   * Enable a threshold
   */
  public enableThreshold(id: string): boolean {
    const config = this.thresholds.get(id);
    if (!config) {
      return false;
    }

    config.enabled = true;
    return true;
  }

  /**
   * Disable a threshold
   */
  public disableThreshold(id: string): boolean {
    const config = this.thresholds.get(id);
    if (!config) {
      return false;
    }

    config.enabled = false;
    return true;
  }

  /**
   * Update resource state
   */
  private handleResourceUpdate = (event: ModuleEvent): void => {
    if (event.data && event.data.type && event.data.state) {
      this.resourceStates.set(event.data.type, event.data.state);
    }
  };

  /**
   * Check all thresholds
   */
  private checkThresholds(): void {
    const now = Date.now();
    const _deltaTime = now - this.lastCheck;
    this.lastCheck = now;

    // Convert Map entries to array to avoid MapIterator error
    const thresholdEntries = Array.from(this.thresholds.entries());

    for (let i = 0; i < thresholdEntries.length; i++) {
      const [id, config] = thresholdEntries[i];

      if (!config.enabled) {
        continue;
      }

      const state = this.thresholdStates.get(id);
      if (!state) {
        continue;
      }

      const resourceState = this.resourceStates.get(config.threshold.type);
      if (!resourceState) {
        continue;
      }

      const isTriggered = this.isThresholdTriggered(config.threshold, resourceState);

      if (isTriggered && state.status === 'inactive') {
        // Threshold triggered
        state.status = this.getThresholdSeverity(config.threshold, resourceState);
        state.lastTriggered = now;
        this.executeThresholdActions(config, state.status);
        state.actionsTaken++;

        // Create alert
        this.createAlert(config, state.status);

        // Emit event
        moduleEventBus.emit({
          type: RESOURCE_THRESHOLD_TRIGGERED,
          moduleId: RESOURCE_MANAGER_ID,
          moduleType: RESOURCE_MANAGER_TYPE,
          timestamp: now,
          data: {
            id,
            type: config.threshold.type,
            status: state.status,
            timestamp: now,
            severity: state.status === 'critical' ? 'high' : 'medium',
          },
        });
      } else if (!isTriggered && state.status !== 'inactive') {
        // Threshold resolved
        state.status = 'resolved';
        state.lastResolved = now;

        // Clear alert if auto-resolve is enabled
        if (config.autoResolve) {
          this.clearAlert(id);
        }

        // Emit event
        moduleEventBus.emit({
          type: RESOURCE_THRESHOLD_RESOLVED,
          moduleId: RESOURCE_MANAGER_ID,
          moduleType: RESOURCE_MANAGER_TYPE,
          timestamp: now,
          data: {
            id,
            type: config.threshold.type,
            timestamp: now,
            severity: 'info',
          },
        });

        // Reset to inactive after a short delay
        setTimeout(() => {
          if (state.status === 'resolved') {
            state.status = 'inactive';
          }
        }, 5000);
      }
    }
  }

  /**
   * Check if a threshold is triggered
   */
  private isThresholdTriggered(threshold: ResourceThreshold, state: ResourceState): boolean {
    if (threshold.min !== undefined && state.current < threshold.min) {
      return true;
    }

    if (threshold.max !== undefined && state.current > threshold.max) {
      return true;
    }

    if (threshold.target !== undefined) {
      const deviation = Math.abs(state.current - threshold.target);
      const maxDeviation = threshold.target * 0.1; // 10% deviation

      if (deviation > maxDeviation) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get threshold severity based on how far the value is from the threshold
   */
  private getThresholdSeverity(
    threshold: ResourceThreshold,
    state: ResourceState
  ): ThresholdStatus {
    if (threshold.min !== undefined && state.current < threshold.min) {
      const ratio = state.current / threshold.min;

      if (ratio < 0.5) {
        return 'critical';
      } else {
        return 'warning';
      }
    }

    if (threshold.max !== undefined && state.current > threshold.max) {
      const ratio = state.current / threshold.max;

      if (ratio > 1.5) {
        return 'critical';
      } else {
        return 'warning';
      }
    }

    if (threshold.target !== undefined) {
      const deviation = Math.abs(state.current - threshold.target);
      const deviationRatio = deviation / threshold.target;

      if (deviationRatio > 0.25) {
        return 'critical';
      } else {
        return 'warning';
      }
    }

    return 'warning';
  }

  /**
   * Execute threshold actions
   */
  private executeThresholdActions(config: ThresholdConfig, status: ThresholdStatus): void {
    const now = Date.now();

    for (const action of config.actions) {
      switch (action.type) {
        case 'production':
          moduleEventBus.emit({
            type: RESOURCE_PRODUCTION_ADJUST,
            moduleId: RESOURCE_MANAGER_ID,
            moduleType: RESOURCE_MANAGER_TYPE,
            timestamp: now,
            data: {
              type: config.threshold.type,
              target: action.target,
              amount: action.amount || 0,
              priority: action.priority || 1,
              severity: 'info',
            },
          });
          break;

        case 'consumption':
          moduleEventBus.emit({
            type: RESOURCE_CONSUMPTION_ADJUST,
            moduleId: RESOURCE_MANAGER_ID,
            moduleType: RESOURCE_MANAGER_TYPE,
            timestamp: now,
            data: {
              type: config.threshold.type,
              target: action.target,
              amount: action.amount || 0,
              priority: action.priority || 1,
              severity: 'info',
            },
          });
          break;

        case 'transfer':
          moduleEventBus.emit({
            type: RESOURCE_TRANSFER_REQUEST,
            moduleId: RESOURCE_MANAGER_ID,
            moduleType: RESOURCE_MANAGER_TYPE,
            timestamp: now,
            data: {
              type: config.threshold.type,
              target: action.target,
              amount: action.amount || 0,
              priority: action.priority || 1,
              severity: 'info',
            },
          });
          break;

        case 'notification':
          moduleEventBus.emit({
            type: NOTIFICATION_CREATE,
            moduleId: RESOURCE_MANAGER_ID,
            moduleType: RESOURCE_MANAGER_TYPE,
            timestamp: now,
            data: {
              type: 'resource',
              message: action.message || `Resource ${config.threshold.type} threshold triggered`,
              severity: status === 'critical' ? 'high' : 'medium',
              timestamp: now,
            },
          });
          break;
      }
    }
  }

  /**
   * Create a resource alert
   */
  private createAlert(config: ThresholdConfig, status: ThresholdStatus): void {
    const now = Date.now();
    const alert: ResourceAlert = {
      id: config.id,
      type: config.threshold.type,
      threshold: config.threshold,
      message: `Resource ${config.threshold.type} threshold triggered`,
      severity: status === 'critical' ? 'critical' : 'medium',
      autoResolve: config.autoResolve,
      actions: config.actions
        .filter(action => action.type !== 'notification') // Filter out notification actions
        .map(action => ({
          type: action.type as 'production' | 'consumption' | 'transfer',
          target: action.target,
          amount: action.amount || 0,
        })),
    };

    this.activeAlerts.set(config.id, alert);

    moduleEventBus.emit({
      type: RESOURCE_ALERT_CREATED,
      moduleId: RESOURCE_MANAGER_ID,
      moduleType: RESOURCE_MANAGER_TYPE,
      timestamp: now,
      data: {
        ...alert,
        severity: status === 'critical' ? 'high' : 'medium',
      },
    });
  }

  /**
   * Clear a resource alert
   */
  private clearAlert(id: string): void {
    const now = Date.now();
    const alert = this.activeAlerts.get(id);
    if (!alert) {
      return;
    }

    this.activeAlerts.delete(id);

    moduleEventBus.emit({
      type: RESOURCE_ALERT_CLEARED,
      moduleId: RESOURCE_MANAGER_ID,
      moduleType: RESOURCE_MANAGER_TYPE,
      timestamp: now,
      data: {
        id,
        type: alert.type,
        timestamp: now,
        severity: 'info',
      },
    });
  }

  /**
   * Get all active alerts
   */
  public getActiveAlerts(): ResourceAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get all threshold configurations
   */
  public getThresholdConfigs(): ThresholdConfig[] {
    return Array.from(this.thresholds.values());
  }

  /**
   * Get all threshold states
   */
  public getThresholdStates(): ThresholdState[] {
    return Array.from(this.thresholdStates.values());
  }

  /**
   * Get a specific threshold state
   */
  public getThresholdState(id: string): ThresholdState | undefined {
    return this.thresholdStates.get(id);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stop();
    // Use the unsubscribe function returned by subscribe
    moduleEventBus.subscribe(RESOURCE_UPDATE, this.handleResourceUpdate)();
    this.thresholds.clear();
    this.thresholdStates.clear();
    this.activeAlerts.clear();
    this.resourceStates.clear();
  }
}
