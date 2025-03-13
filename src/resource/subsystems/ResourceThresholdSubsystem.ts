import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import { ResourceState, ResourceType } from '../../types/resources/ResourceTypes';
import { ResourceSystem, ResourceSystemConfig } from '../ResourceSystem';

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
  resourceType: ResourceType;
  thresholdType: ThresholdType;
  comparison: ThresholdComparison;
  value: number;
  action: ThresholdAction;
  actionData?: any;
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
  private thresholds: Map<string, ResourceThreshold> = new Map();
  private resourceTypeThresholds: Map<ResourceType, string[]> = new Map();
  private entityThresholds: Map<string, string[]> = new Map();
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
      this.initializeDefaultThresholds();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ResourceThresholdSubsystem:', error);
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
      this.thresholds.clear();
      this.resourceTypeThresholds.clear();
      this.entityThresholds.clear();
      
      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to dispose ResourceThresholdSubsystem:', error);
      throw error;
    }
  }

  /**
   * Initialize default thresholds
   */
  private initializeDefaultThresholds(): void {
    // Example: Add a low energy threshold
    this.registerThreshold({
      id: 'default-energy-low',
      resourceType: 'energy',
      thresholdType: ThresholdType.PERCENTAGE,
      comparison: ThresholdComparison.LESS_THAN,
      value: 0.1, // 10%
      action: ThresholdAction.ALERT,
      actionData: { message: 'Energy levels critically low!' },
      enabled: true,
      cooldownMs: 60000, // 1 minute cooldown
      repeat: true,
    });

    // Example: Add a high minerals threshold
    this.registerThreshold({
      id: 'default-minerals-high',
      resourceType: 'minerals',
      thresholdType: ThresholdType.PERCENTAGE,
      comparison: ThresholdComparison.GREATER_THAN,
      value: 0.9, // 90%
      action: ThresholdAction.ALERT,
      actionData: { message: 'Mineral storage nearly full!' },
      enabled: true,
      cooldownMs: 120000, // 2 minute cooldown
      repeat: true,
    });
  }

  /**
   * Register a resource threshold
   */
  public registerThreshold(threshold: ResourceThreshold): boolean {
    if (!threshold.id || !threshold.resourceType) {
      console.warn('Invalid threshold:', threshold);
      return false;
    }

    // Store the threshold
    this.thresholds.set(threshold.id, threshold);
    
    // Add to resource type index
    this.addToArray(this.resourceTypeThresholds, threshold.resourceType, threshold.id);
    
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

    // Remove from resource type index
    this.removeFromArray(this.resourceTypeThresholds, threshold.resourceType, id);
    
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
  public getThresholdsByResourceType(type: ResourceType): ResourceThreshold[] {
    const thresholdIds = this.resourceTypeThresholds.get(type) || [];
    return thresholdIds
      .map(id => this.thresholds.get(id))
      .filter(Boolean) as ResourceThreshold[];
  }

  /**
   * Get thresholds for a specific entity
   */
  public getThresholdsByEntity(entityId: string): ResourceThreshold[] {
    const thresholdIds = this.entityThresholds.get(entityId) || [];
    return thresholdIds
      .map(id => this.thresholds.get(id))
      .filter(Boolean) as ResourceThreshold[];
  }

  /**
   * Enable a threshold
   */
  public enableThreshold(id: string): boolean {
    const threshold = this.thresholds.get(id);
    if (!threshold) {
      return false;
    }

    threshold.enabled = true;
    this.thresholds.set(id, threshold);
    return true;
  }

  /**
   * Disable a threshold
   */
  public disableThreshold(id: string): boolean {
    const threshold = this.thresholds.get(id);
    if (!threshold) {
      return false;
    }

    threshold.enabled = false;
    this.thresholds.set(id, threshold);
    return true;
  }

  /**
   * Check if a threshold is triggered for a given resource state
   */
  private isThresholdTriggered(threshold: ResourceThreshold, state: ResourceState): boolean {
    // Skip disabled thresholds
    if (!threshold.enabled) {
      return false;
    }

    // Check cooldown
    if (threshold.cooldownMs && threshold.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - threshold.lastTriggered;
      if (timeSinceLastTrigger < threshold.cooldownMs) {
        return false;
      }
    }

    // If one-time and already triggered, skip
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
        actualValue = state.current / state.max;
        break;
      case ThresholdType.RATE:
        // For rate, we compare production rate or consumption rate
        if (threshold.value >= 0) {
          actualValue = state.production;
        } else {
          actualValue = state.consumption;
        }
        break;
      default:
        return false;
    }

    // Perform the comparison
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
  public checkThresholds(type: ResourceType, state: ResourceState, entityId?: string): void {
    // Get thresholds for this resource type
    const thresholdIds = this.resourceTypeThresholds.get(type) || [];
    
    // If entity ID is provided, also include entity-specific thresholds
    if (entityId) {
      const entityThresholdIds = this.entityThresholds.get(entityId) || [];
      thresholdIds.push(...entityThresholdIds);
    }

    // Process each threshold
    for (const id of thresholdIds) {
      const threshold = this.thresholds.get(id);
      if (!threshold) continue;
      
      // Skip if resource type doesn't match
      if (threshold.resourceType !== type) continue;
      
      // Skip if entity ID doesn't match (for entity-specific thresholds)
      if (threshold.entityId && threshold.entityId !== entityId) continue;

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
  private handleThresholdAction(threshold: ResourceThreshold, state: ResourceState): void {
    switch (threshold.action) {
      case ThresholdAction.ALERT:
        // Emit alert event
        eventSystem.publish({
          type: 'RESOURCE_THRESHOLD_REACHED',
          threshold,
          state,
          message: threshold.actionData?.message || `Resource threshold reached for ${threshold.resourceType}`,
          timestamp: Date.now(),
        });
        break;
        
      case ThresholdAction.AUTOMATE:
        // Trigger automation
        eventSystem.publish({
          type: 'RESOURCE_AUTOMATION_TRIGGERED',
          threshold,
          state,
          automationData: threshold.actionData,
          timestamp: Date.now(),
        });
        break;
        
      case ThresholdAction.TRIGGER_EVENT:
        // Trigger custom event
        eventSystem.publish({
          type: threshold.actionData?.eventType || 'CUSTOM_RESOURCE_EVENT',
          threshold,
          state,
          data: threshold.actionData?.data || {},
          timestamp: Date.now(),
        });
        break;
    }
  }

  /**
   * Add an item to an array in a map
   */
  private addToArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    const array = map.get(key) || [];
    if (!array.includes(value)) {
      array.push(value);
      map.set(key, array);
    }
  }

  /**
   * Remove an item from an array in a map
   */
  private removeFromArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    const array = map.get(key);
    if (array) {
      const index = array.indexOf(value);
      if (index >= 0) {
        array.splice(index, 1);
        map.set(key, array);
      }
    }
  }
}