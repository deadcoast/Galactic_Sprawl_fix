import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import {
    errorLoggingService,
    ErrorSeverity,
    ErrorType
} from '../../services/logging/ErrorLoggingService';
import {
    ResourceState as StringResourceState,
    ResourceType as StringResourceType,
    toEnumResourceType
} from '../../types/resources/ResourceTypes';
import { ensureStringResourceType } from '../../utils/resources/ResourceTypeConverter';
// Use type-only import to break circular dependency with ResourceSystem
import type { ResourceSystem, ResourceSystemConfig } from '../ResourceSystem';
import { ResourceType } from './../../types/resources/ResourceTypes';

/**
 * Threshold type enumeration
 */
export enum ThresholdType {
  ABSOLUTE = 'absolute',
  PERCENTAGE = 'percentage',
  RATE = 'rate',
}

/**
 * Threshold comparison type
 */
export enum ThresholdComparison {
  LESS_THAN = 'less_than',
  GREATER_THAN = 'greater_than',
  EQUAL_TO = 'equal_to',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
}

/**
 * Threshold action type
 */
export enum ThresholdAction {
  ALERT = 'alert',
  AUTOMATE = 'automate',
  TRIGGER_EVENT = 'trigger_event',
}

/**
 * Resource threshold configuration
 */
export interface ResourceThreshold {
  id: string;
  resourceType: StringResourceType  ;
  thresholdType: ThresholdType;
  comparison: ThresholdComparison;
  value: number;
  action: ThresholdAction;
  actionData?: Record<string, unknown>;
  enabled: boolean;
  cooldownMs?: number;
  lastTriggered?: number;
  repeat?: boolean;
  entityId?: string; // Optional entity ID for entity-specific thresholds
}

/**
 * ResourceThresholdSubsystem
 *
 * Monitors resource levels and triggers actions when thresholds are reached
 */
export class ResourceThresholdSubsystem {
  private thresholds = new Map<string, ResourceThreshold>();
  private resourceTypeThresholds = new Map<StringResourceType, string[]>();
  private entityThresholds = new Map<string, string[]>();
  private parentSystem: ResourceSystem;
  private config: ResourceSystemConfig;
  private isInitialized = false;

  constructor(parentSystem: ResourceSystem, config: ResourceSystemConfig) {
    this.parentSystem = parentSystem;
    this.config = config;
  }

  /**
   * Initialize the subsystem
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize default thresholds if needed
      await Promise.resolve();
      this.initializeDefaultThresholds();

      this.isInitialized = true;
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error
          ? error
          : new Error('Failed to initialize ResourceThresholdSubsystem'),
        ErrorType.INITIALIZATION,
        ErrorSeverity.CRITICAL,
        { componentName: 'ResourceThresholdSubsystem', action: 'initialize' }
      );
      throw error;
    }
  }

  /**
   * Dispose of the subsystem
   */
  public async dispose(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Clear thresholds
      await Promise.resolve();
      this.thresholds.clear();
      this.resourceTypeThresholds.clear();
      this.entityThresholds.clear();

      this.isInitialized = false;
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Failed to dispose ResourceThresholdSubsystem'),
        ErrorType.RUNTIME,
        ErrorSeverity.HIGH,
        { componentName: 'ResourceThresholdSubsystem', action: 'dispose' }
      );
      throw error;
    }
  }

  /**
   * Initialize default thresholds
   */
  private initializeDefaultThresholds(): void {
    // Add default low energy threshold
    this.registerThreshold({
      id: 'default-low-energy',
      resourceType: ResourceType.ENERGY,
      thresholdType: ThresholdType.PERCENTAGE,
      comparison: ThresholdComparison.LESS_THAN,
      value: 0.2, // 20%
      action: ThresholdAction.ALERT,
      actionData: {
        message: 'Low energy levels detected',
        severity: 'warning',
      },
      enabled: true,
      cooldownMs: 60000, // 1 minute cooldown
      repeat: true,
    });

    // Add default low minerals threshold
    this.registerThreshold({
      id: 'default-low-minerals',
      resourceType: ResourceType.MINERALS,
      thresholdType: ThresholdType.PERCENTAGE,
      comparison: ThresholdComparison.LESS_THAN,
      value: 0.15, // 15%
      action: ThresholdAction.ALERT,
      actionData: {
        message: 'Low mineral levels detected',
        severity: 'warning',
      },
      enabled: true,
      cooldownMs: 60000, // 1 minute cooldown
      repeat: true,
    });
  }

  /**
   * Register a resource threshold
   */
  public registerThreshold(threshold: ResourceThreshold): boolean {
    if (!threshold.id || !threshold.resourceType) {
      errorLoggingService.logError(
        new Error(`Invalid threshold configuration: ${JSON.stringify(threshold)}`),
        ErrorType.CONFIGURATION,
        ErrorSeverity.MEDIUM,
        { componentName: 'ResourceThresholdSubsystem', action: 'registerThreshold' }
      );
      return false;
    }

    // Convert resource type to string for internal storage
    const stringType = ensureStringResourceType(threshold.resourceType);

    // Create a copy with the string resource type
    const internalThreshold = {
      ...threshold,
      resourceType: ResourceType.ENERGY,
    };

    // Store the threshold
    this.thresholds.set(threshold.id, internalThreshold);

    // Add to resource type index
    this.addToArray(this.resourceTypeThresholds, stringType, threshold.id);

    // Add to entity index if entity-specific
    if (threshold.entityId) {
      this.addToArray(this.entityThresholds, threshold.entityId, threshold.id);
    }

    return true;
  }

  /**
   * Unregister a resource threshold
   */
  public unregisterThreshold(id: string): boolean {
    const threshold = this.thresholds.get(id);
    if (!threshold) {
      return false;
    }

    // Get the string resource type
    const stringType = ensureStringResourceType(threshold.resourceType);

    // Remove from resource type index
    this.removeFromArray(this.resourceTypeThresholds, stringType, id);

    // Remove from entity index if entity-specific
    if (threshold.entityId) {
      this.removeFromArray(this.entityThresholds, threshold.entityId, id);
    }

    // Remove the threshold
    this.thresholds.delete(id);

    return true;
  }

  /**
   * Get a specific threshold
   */
  public getThreshold(id: string): ResourceThreshold | undefined {
    return this.thresholds.get(id);
  }

  /**
   * Get all thresholds
   */
  public getAllThresholds(): ResourceThreshold[] {
    return Array.from(this.thresholds.values());
  }

  /**
   * Get thresholds for a specific resource type
   */
  public getThresholdsByResourceType(type: StringResourceType  ): ResourceThreshold[] {
    // Convert to string resource type for internal use
    const stringType = ensureStringResourceType(type);

    // We need ResourceType enum value for resource system
    const resourceType = toEnumResourceType(stringType);

    const thresholdIds = this.resourceTypeThresholds.get(resourceType) ?? [];
    return thresholdIds.map(id => this.thresholds.get(id)!).filter(Boolean);
  }

  /**
   * Get thresholds for a specific entity
   */
  public getThresholdsByEntity(entityId: string): ResourceThreshold[] {
    const thresholdIds = this.entityThresholds.get(entityId) ?? [];
    return thresholdIds.map(id => this.thresholds.get(id)!).filter(Boolean);
  }

  /**
   * Update a threshold
   */
  public updateThreshold(id: string, updates: Partial<ResourceThreshold>): boolean {
    const threshold = this.thresholds.get(id);
    if (!threshold) {
      return false;
    }

    // Handle resource type change
    if (updates.resourceType && updates.resourceType !== threshold.resourceType) {
      // Remove from old resource type index
      this.removeFromArray(
        this.resourceTypeThresholds,
        ensureStringResourceType(threshold.resourceType),
        id
      );

      // Add to new resource type index
      this.addToArray(
        this.resourceTypeThresholds,
        ensureStringResourceType(updates.resourceType),
        id
      );
    }

    // Handle entity ID change
    if ('entityId' in updates && updates.entityId !== threshold.entityId) {
      // Remove from old entity index if it existed
      if (threshold.entityId) {
        this.removeFromArray(this.entityThresholds, threshold.entityId, id);
      }

      // Add to new entity index if it exists
      if (updates.entityId) {
        this.addToArray(this.entityThresholds, updates.entityId, id);
      }
    }

    // Update the threshold
    this.thresholds.set(id, { ...threshold, ...updates });

    return true;
  }

  /**
   * Enable a threshold
   */
  public enableThreshold(id: string): boolean {
    return this.updateThreshold(id, { enabled: true });
  }

  /**
   * Disable a threshold
   */
  public disableThreshold(id: string): boolean {
    return this.updateThreshold(id, { enabled: false });
  }

  /**
   * Check if a threshold is triggered
   */
  private isThresholdTriggered(threshold: ResourceThreshold, state: StringResourceState): boolean {
    if (!threshold.enabled) {
      return false;
    }

    // Check cooldown
    if (threshold.lastTriggered && threshold.cooldownMs) {
      const timeSinceLastTrigger = Date.now() - threshold.lastTriggered;
      if (timeSinceLastTrigger < threshold.cooldownMs) {
        return false;
      }
    }

    // If it's a one-time threshold and has been triggered before, don't trigger again
    if (!threshold.repeat && threshold.lastTriggered) {
      return false;
    }

    // Get the actual value to compare
    let actualValue: number;
    switch (threshold.thresholdType) {
      case ThresholdType.ABSOLUTE:
        actualValue = state.current;
        break;
      case ThresholdType.PERCENTAGE:
        actualValue = state.max > 0 ? state.current / state.max : 0;
        break;
      case ThresholdType.RATE:
        actualValue = state.production - state.consumption;
        break;
      default:
        return false;
    }

    // Compare with the threshold value
    switch (threshold.comparison) {
      case ThresholdComparison.LESS_THAN:
        return actualValue < threshold.value;
      case ThresholdComparison.GREATER_THAN:
        return actualValue > threshold.value;
      case ThresholdComparison.EQUAL_TO:
        return Math.abs(actualValue - threshold.value) < 0.001; // Float comparison with small epsilon
      case ThresholdComparison.LESS_THAN_OR_EQUAL:
        return actualValue <= threshold.value;
      case ThresholdComparison.GREATER_THAN_OR_EQUAL:
        return actualValue >= threshold.value;
      default:
        return false;
    }
  }

  /**
   * Check thresholds for a specific resource type
   */
  public checkThresholds(
    type: StringResourceType  ,
    state: StringResourceState,
    entityId?: string
  ): void {
    // Convert to string resource type for internal use
    const stringType = ensureStringResourceType(type);

    // We need ResourceType enum value for resource system
    const resourceType = toEnumResourceType(stringType);

    // Get thresholds for this resource type
    const thresholdIds = this.resourceTypeThresholds.get(resourceType) ?? [];

    // If entity ID is provided, also include entity-specific thresholds
    if (entityId) {
      const entityThresholdIds = this.entityThresholds.get(entityId) ?? [];
      thresholdIds.push(...entityThresholdIds);
    }

    // Process each threshold
    for (const id of thresholdIds) {
      const threshold = this.thresholds.get(id);
      if (!threshold) {
        continue;
      }

      // Skip if resource type doesn't match
      if (ensureStringResourceType(threshold.resourceType) !== stringType) {
        continue;
      }

      // Skip if entity ID doesn't match (for entity-specific thresholds)
      if (threshold.entityId && threshold.entityId !== entityId) {
        continue;
      }

      // Check if triggered
      if (this.isThresholdTriggered(threshold, state)) {
        // Update last triggered time
        threshold.lastTriggered = Date.now();
        this.thresholds.set(id, threshold);

        // Handle the action
        this.handleThresholdAction(threshold, state);
      }
    }
  }

  /**
   * Handle a threshold action
   */
  private handleThresholdAction(threshold: ResourceThreshold, state: StringResourceState): void {
    switch (threshold.action) {
      case ThresholdAction.ALERT:
        this.handleAlertAction(threshold, state);
        break;
      case ThresholdAction.AUTOMATE:
        this.handleAutomateAction(threshold, state);
        break;
      case ThresholdAction.TRIGGER_EVENT:
        this.handleTriggerEventAction(threshold, state);
        break;
    }
  }

  /**
   * Handle an alert action
   */
  private handleAlertAction(threshold: ResourceThreshold, state: StringResourceState): void {
    // Publish alert event
    eventSystem.publish({
      type: 'RESOURCE_THRESHOLD_ALERT',
      threshold: { ...threshold },
      resourceState: { ...state },
      message:
        threshold.actionData?.message ?? `Resource threshold reached for ${threshold.resourceType}`,
      severity: threshold.actionData?.severity ?? 'info',
      timestamp: Date.now(),
    });
  }

  /**
   * Handle an automate action
   */
  private handleAutomateAction(threshold: ResourceThreshold, state: StringResourceState): void {
    // Publish automation event
    eventSystem.publish({
      type: 'RESOURCE_THRESHOLD_AUTOMATE',
      threshold: { ...threshold },
      resourceState: { ...state },
      automationAction: threshold.actionData?.automationAction ?? 'default',
      parameters: threshold.actionData?.parameters ?? {},
      timestamp: Date.now(),
    });
  }

  /**
   * Handle a trigger event action
   */
  private handleTriggerEventAction(threshold: ResourceThreshold, state: StringResourceState): void {
    // Publish custom event
    eventSystem.publish({
      type: (threshold.actionData?.eventType as string) || 'RESOURCE_THRESHOLD_TRIGGERED',
      threshold: { ...threshold },
      resourceState: { ...state },
      data: threshold.actionData?.eventData ?? {},
      timestamp: Date.now(),
    });
  }

  /**
   * Utility function to add an item to an array in a map
   */
  private addToArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    if (!map.has(key)) {
      map.set(key, []);
    }

    const array = map.get(key)!;
    if (!array.includes(value)) {
      array.push(value);
    }
  }

  /**
   * Utility function to remove an item from an array in a map
   */
  private removeFromArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    if (!map.has(key)) {
      return;
    }

    const array = map.get(key)!;
    const index = array.indexOf(value);

    if (index !== -1) {
      array.splice(index, 1);

      // Remove the key if the array is empty
      if (array.length === 0) {
        map.delete(key);
      }
    }
  }
}
