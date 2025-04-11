import { ResourceAlert } from '../../hooks/resources/useResourceTracking';
import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import {
  ResourceState,
  ResourceThreshold,
  ResourceType,
} from '../../types/resources/ResourceTypes';
import { validateResourceThreshold } from '../../utils/typeGuards/resourceTypeGuards';

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
 * Interface for resource update event data
 */
interface ResourceUpdateEventData {
  type: ResourceType;
  state: ResourceState;
}

/**
 * Type guard for ResourceUpdateEventData
 */
function isResourceUpdateEventData(data: unknown): data is ResourceUpdateEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const updateData = data as Record<string, unknown>;

  return (
    typeof updateData.type === 'string' &&
    updateData.state !== undefined &&
    typeof updateData.state === 'object'
  );
}

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
  lastValue?: number;
  rateOfChange?: number;
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
    if (!event?.data) {
      console.warn('Resource update event missing data');
      return;
    }

    if (!isResourceUpdateEventData(event?.data)) {
      console.warn('Invalid resource update event data:', event?.data);
      return;
    }

    const { type, state } = event.data;
    this.resourceStates.set(type, state);
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

      // Use _deltaTime to calculate rate of change for time-sensitive thresholds
      if (_deltaTime > 0 && state) {
        const resourceType = config.threshold.resourceId;
        const resourceState = this.resourceStates.get(resourceType);

        if (resourceState && state.lastValue !== undefined) {
          // Calculate rate of change per second
          const currentValue = resourceState.current;
          const rateOfChange = ((currentValue - state.lastValue) / _deltaTime) * 1000;

          // Log significant rate changes for monitoring
          if (Math.abs(rateOfChange) > 0.5) {
            // Threshold for significant change
            console.warn(
              `[ResourceThresholdManager] Significant rate change detected for ${resourceType}: ${rateOfChange.toFixed(2)} units/sec`
            );
          }

          // Update the last value for next calculation
          this.thresholdStates.set(id, {
            ...state,
            lastValue: currentValue,
            rateOfChange,
          });
        } else if (resourceState) {
          // Initialize lastValue if not set
          this.thresholdStates.set(id, {
            ...state,
            lastValue: resourceState.current,
          });
        }
      }

      if (!state) {
        continue;
      }

      const resourceState = this.resourceStates.get(config.threshold.resourceId);
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
            type: config.threshold.resourceId,
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
            type: config.threshold.resourceId,
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
    const resourceType = threshold.resourceId;
    if (!state) {
      return false;
    }

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
    const resourceType = threshold.resourceId;
    if (!state) {
      return 'inactive';
    }

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
    const resourceType = config.threshold.resourceId;
    const state = this.resourceStates.get(resourceType);
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
              type: resourceType,
              target: action.target,
              amount: action.amount ?? 0,
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
              type: resourceType,
              target: action.target,
              amount: action.amount ?? 0,
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
              type: resourceType,
              target: action.target,
              amount: action.amount ?? 0,
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
              message: action.message || `Resource ${resourceType} threshold triggered`,
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
    const resourceType = config.threshold.resourceId;
    const state = this.resourceStates.get(resourceType);
    if (!state) return;

    const alert: ResourceAlert = {
      id: config.id,
      type: resourceType,
      message: `Resource ${resourceType} threshold triggered`,
      severity: status === 'critical' ? 'critical' : 'medium',
      timestamp: Date.now(),
      threshold: config.threshold,
    };

    this.activeAlerts.set(config.id, alert);
    moduleEventBus.emit({
      type: RESOURCE_ALERT_CREATED,
      moduleId: RESOURCE_MANAGER_ID,
      moduleType: RESOURCE_MANAGER_TYPE,
      timestamp: Date.now(),
      data: { ...alert },
    });
  }

  /**
   * Clear a resource alert
   */
  private clearAlert(id: string): void {
    const alert = this.activeAlerts.get(id);
    if (!alert) return;

    const resourceType = alert.type;
    const state = this.resourceStates.get(resourceType);
    if (!state) return;

    this.activeAlerts.delete(id);
    moduleEventBus.emit({
      type: RESOURCE_ALERT_CLEARED,
      moduleId: RESOURCE_MANAGER_ID,
      moduleType: RESOURCE_MANAGER_TYPE,
      timestamp: Date.now(),
      data: {
        id,
        type: resourceType,
        timestamp: Date.now(),
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
