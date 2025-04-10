import { EventEmitter } from '../lib/events/EventEmitter';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../services/ErrorLoggingService';
import { ResourceCategory, ResourceType, ResourceTypeMetadata } from '../types/resources/ResourceTypes';
/**
 * ResourceRegistry.ts
 *
 * A centralized registry for resource types and metadata to ensure consistency across the codebase.
 * This registry serves as the single source of truth for resource information and helps standardize
 * the resource type system throughout the application.
 */

/**
 * Resource quality levels
 */
export enum ResourceQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  PREMIUM = 'premium',
}

/**
 * Extended resource metadata with additional properties
 */
export interface ExtendedResourceMetadata extends ResourceTypeMetadata {
  // Additional properties for resource management
  baseValue: number;
  weight: number;
  storageEfficiency: number;
  qualityLevels: Record<ResourceQuality, number>;
  tags: string[];
  relatedResources: ResourceType[];
  conversionRates?: Partial<Record<ResourceType, number>>;
  storageMultiplier: number;
  valueMultiplier: number;
  isRare: boolean;
  isStackable: boolean;
  maxStackSize: number;
}

/**
 * Resource registration options
 */
export interface ResourceRegistrationOptions {
  metadata: ExtendedResourceMetadata;
  overrideExisting?: boolean;
}

/**
 * Event data types for type safety
 */
export interface ResourceRegisteredEvent {
  resourceType: ResourceType;
  metadata: ExtendedResourceMetadata;
}

export interface ResourceUnregisteredEvent {
  resourceType: ResourceType;
}

export interface ConversionRateChangedEvent {
  sourceType: ResourceType;
  targetType: ResourceType;
  rate: number;
}

export interface TagAddedEvent {
  resourceType: ResourceType;
  tag: string;
}

export interface TagRemovedEvent {
  resourceType: ResourceType;
  tag: string;
}

export interface ResourceMetadataUpdatedEvent {
  resourceType: ResourceType;
  updates: Partial<ExtendedResourceMetadata>;
}

export interface QualityLevelChangedEvent {
  resourceType: ResourceType;
  quality: ResourceQuality;
  value: number;
}

export interface InitializationCompleteEvent {
  resourceCount: number;
}

export interface ImportCompleteEvent {
  resourceCount: number;
  conversionRateCount: number;
}

export type RegistryEventData =
  | ResourceRegisteredEvent
  | ResourceUnregisteredEvent
  | ConversionRateChangedEvent
  | TagAddedEvent
  | TagRemovedEvent
  | ResourceMetadataUpdatedEvent
  | QualityLevelChangedEvent
  | InitializationCompleteEvent
  | ImportCompleteEvent;

export type RegistryEventType =
  | 'resourceRegistered'
  | 'resourceUnregistered'
  | 'conversionRateChanged'
  | 'tagAdded'
  | 'tagRemoved'
  | 'resourceMetadataUpdated'
  | 'qualityLevelChanged'
  | 'initializationComplete'
  | 'importComplete';

/**
 * Resource Registry Event interface for use with EventEmitter
 */
export interface ResourceRegistryEvent {
  type: RegistryEventType;
  data: RegistryEventData;
  timestamp: number;
}

/**
 * Resource Registry class
 *
 * Provides a centralized registry for resource types and metadata?.
 * Implements the Singleton pattern to ensure only one instance exists.
 */
export class ResourceRegistry {
  // Singleton instance
  private static _instance: ResourceRegistry | null = null;

  // Resource metadata storage
  private resourceMetadata: Map<ResourceType, ExtendedResourceMetadata> = new Map();

  // Resource category mappings
  private resourcesByCategory: Map<ResourceCategory, Set<ResourceType>> = new Map();

  // Resource tag mappings
  private resourcesByTag: Map<string, Set<ResourceType>> = new Map();

  // Resource quality mappings
  private resourcesByQuality: Map<ResourceQuality, Map<ResourceType, number>> = new Map();

  // Resource conversion mappings
  private conversionRates: Map<ResourceType, Map<ResourceType, number>> = new Map();

  // Event listeners
  private listeners: Map<RegistryEventType, Set<(data: RegistryEventData) => void>> = new Map();

  // Event emitter for typed events
  private eventEmitter: EventEmitter<ResourceRegistryEvent>;

  /**
   * Get the singleton instance of ResourceRegistry
   */
  public static getInstance(): ResourceRegistry {
    if (!ResourceRegistry._instance) {
      ResourceRegistry._instance = new ResourceRegistry();
    }
    return ResourceRegistry._instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.eventEmitter = new EventEmitter<ResourceRegistryEvent>();
    this.initializeRegistry();
  }

  /**
   * Initialize the registry with default resources
   */
  private initializeRegistry(): void {
    // Initialize category maps
    Object.values(ResourceCategory).forEach(category => {
      this.resourcesByCategory.set(category, new Set());
    });

    // Initialize quality maps
    Object.values(ResourceQuality).forEach(quality => {
      this.resourcesByQuality.set(quality, new Map());
    });

    // Register built-in resources from StandardizedResourceTypes
    this.registerBuiltInResources();
  }

  /**
   * Register built-in resources from StandardizedResourceTypes
   */
  private registerBuiltInResources(): void {
    // Register each resource type with extended metadata
    // This would normally come from a configuration file or database
    // For now, we'll hardcode some example values

    // Example for MINERALS
    this.registerResource({
      metadata: {
        id: ResourceType.MINERALS,
        displayName: 'Minerals',
        description: 'Basic building materials',
        icon: 'minerals-icon',
        category: ResourceCategory.BASIC,
        defaultMax: 1000,
        baseValue: 1.0,
        weight: 1.0,
        storageEfficiency: 0.9,
        qualityLevels: {
          [ResourceQuality.LOW]: 0.8,
          [ResourceQuality.MEDIUM]: 1.0,
          [ResourceQuality.HIGH]: 1.2,
          [ResourceQuality.PREMIUM]: 1.5,
        },
        tags: ['basic', 'construction', 'mining'],
        relatedResources: [ResourceType.IRON, ResourceType.COPPER, ResourceType.TITANIUM],
        storageMultiplier: 1.0,
        valueMultiplier: 1.0,
        isRare: false,
        isStackable: true,
        maxStackSize: 100,
      },
    });

    // Example for ENERGY
    this.registerResource({
      metadata: {
        id: ResourceType.ENERGY,
        displayName: 'Energy',
        description: 'Power for modules and systems',
        icon: 'energy-icon',
        category: ResourceCategory.BASIC,
        defaultMax: 1000,
        baseValue: 1.2,
        weight: 0.0,
        storageEfficiency: 0.7,
        qualityLevels: {
          [ResourceQuality.LOW]: 0.7,
          [ResourceQuality.MEDIUM]: 1.0,
          [ResourceQuality.HIGH]: 1.3,
          [ResourceQuality.PREMIUM]: 1.6,
        },
        tags: ['basic', 'power', 'production'],
        relatedResources: [ResourceType.PLASMA],
        conversionRates: {
          [ResourceType.PLASMA]: 0.5,
        },
        storageMultiplier: 1.0,
        valueMultiplier: 1.0,
        isRare: false,
        isStackable: true,
        maxStackSize: 100,
      },
    });

    // Additional resources would be registered here
    // ...
  }

  /**
   * Register a resource with the registry
   *
   * @param options Registration options including metadata
   * @returns True if registration was successful, false otherwise
   */
  public registerResource(options: ResourceRegistrationOptions): boolean {
    const { metadata, overrideExisting = false } = options;
    const { id, category, tags, qualityLevels, conversionRates } = metadata;

    // Check if resource already exists
    if (this.resourceMetadata?.has(id) && !overrideExisting) {
      console.warn(`Resource ${id} already registered. Use overrideExisting=true to replace.`);
      return false;
    }

    // Register metadata
    this.resourceMetadata?.set(id, metadata);

    // Register category
    const categorySet = this.resourcesByCategory.get(category) || new Set();
    categorySet.add(id);
    this.resourcesByCategory.set(category, categorySet);

    // Register tags
    tags.forEach(tag => {
      const tagSet = this.resourcesByTag.get(tag) || new Set();
      tagSet.add(id);
      this.resourcesByTag.set(tag, tagSet);
    });

    // Register quality levels
    Object.entries(qualityLevels).forEach(([quality, value]) => {
      const qualityMap = this.resourcesByQuality.get(quality as ResourceQuality) || new Map();
      qualityMap.set(id, value);
      this.resourcesByQuality.set(quality as ResourceQuality, qualityMap);
    });

    // Register conversion rates
    if (conversionRates) {
      const rateMap = new Map<ResourceType, number>();
      Object.entries(conversionRates).forEach(([targetType, rate]) => {
        rateMap.set(targetType as ResourceType, rate);
      });
      this.conversionRates.set(id, rateMap);
    }

    // Emit resource registered event
    this.emit('resourceRegistered', { resourceType: id, metadata });

    return true;
  }

  /**
   * Unregister a resource from the registry
   *
   * @param resourceType The resource type to unregister
   * @returns True if unregistration was successful, false otherwise
   */
  public unregisterResource(resourceType: ResourceType): boolean {
    if (!this.resourceMetadata?.has(resourceType)) {
      return false;
    }

    const metadata = this.resourceMetadata?.get(resourceType);

    // Remove from metadata
    this.resourceMetadata?.delete(resourceType);

    // Remove from category
    const categorySet = this.resourcesByCategory.get(metadata?.category as ResourceCategory);
    if (categorySet) {
      categorySet.delete(resourceType);
    }

    // Remove from tags
    metadata?.tags.forEach(tag => {
      const tagSet = this.resourcesByTag.get(tag);
      if (tagSet) {
        tagSet.delete(resourceType);
        if (tagSet.size === 0) {
          this.resourcesByTag.delete(tag);
        }
      }
    });

    // Remove from quality levels
    Object.keys(metadata?.qualityLevels ?? {}).forEach(quality => {
      const qualityMap = this.resourcesByQuality.get(quality as ResourceQuality);
      if (qualityMap) {
        qualityMap.delete(resourceType);
      }
    });

    // Remove from conversion rates
    this.conversionRates.delete(resourceType);

    // Emit resource unregistered event
    this.emit('resourceUnregistered', { resourceType });

    return true;
  }

  /**
   * Get resource metadata
   *
   * @param resourceType The resource type
   * @returns The resource metadata or undefined if not found
   */
  public getResourceMetadata(resourceType: ResourceType): ExtendedResourceMetadata | undefined {
    return this.resourceMetadata?.get(resourceType);
  }

  /**
   * Get all registered resource types
   *
   * @returns Array of all registered resource types
   */
  public getAllResourceTypes(): ResourceType[] {
    return Array.from(this.resourceMetadata?.keys());
  }

  /**
   * Get resources by category
   *
   * @param category The resource category
   * @returns Array of resource types in the category
   */
  public getResourcesByCategory(category: ResourceCategory): ResourceType[] {
    const categorySet = this.resourcesByCategory.get(category);
    return categorySet ? Array.from(categorySet) : [];
  }

  /**
   * Get resources by tag
   *
   * @param tag The resource tag
   * @returns Array of resource types with the tag
   */
  public getResourcesByTag(tag: string): ResourceType[] {
    const tagSet = this.resourcesByTag.get(tag);
    return tagSet ? Array.from(tagSet) : [];
  }

  /**
   * Get resources by quality level
   *
   * @param quality The resource quality level
   * @returns Map of resource types to quality values
   */
  public getResourcesByQuality(quality: ResourceQuality): Map<ResourceType, number> {
    return this.resourcesByQuality.get(quality) || new Map();
  }

  /**
   * Get conversion rate between resources
   *
   * @param sourceType Source resource type
   * @param targetType Target resource type
   * @returns Conversion rate or undefined if not found
   */
  public getConversionRate(sourceType: ResourceType, targetType: ResourceType): number | undefined {
    const rateMap = this.conversionRates.get(sourceType);
    return rateMap ? rateMap.get(targetType) : undefined;
  }

  /**
   * Set conversion rate between resources
   *
   * @param sourceType Source resource type
   * @param targetType Target resource type
   * @param rate Conversion rate
   */
  public setConversionRate(sourceType: ResourceType, targetType: ResourceType, rate: number): void {
    let rateMap = this.conversionRates.get(sourceType);
    if (!rateMap) {
      rateMap = new Map();
      this.conversionRates.set(sourceType, rateMap);
    }
    rateMap.set(targetType, rate);

    // Update metadata
    const metadata = this.resourceMetadata?.get(sourceType);
    if (metadata) {
      if (!metadata?.conversionRates) {
        metadata.conversionRates = {};
      }
      metadata.conversionRates[targetType] = rate;
    }

    // Emit conversion rate changed event
    this.emit('conversionRateChanged', { sourceType, targetType, rate });
  }

  /**
   * Get all possible conversion rates for a resource
   *
   * @param resourceType The resource type
   * @returns Map of target resource types to conversion rates
   */
  public getAllConversionRates(resourceType: ResourceType): Map<ResourceType, number> {
    return this.conversionRates.get(resourceType) || new Map();
  }

  /**
   * Find resources that can be converted to the specified resource
   *
   * @param targetType Target resource type
   * @returns Map of source resource types to conversion rates
   */
  public findConversionSources(targetType: ResourceType): Map<ResourceType, number> {
    const sources = new Map<ResourceType, number>();

    this.conversionRates.forEach((rateMap, sourceType) => {
      const rate = rateMap.get(targetType);
      if (rate !== undefined) {
        sources.set(sourceType, rate);
      }
    });

    return sources;
  }

  /**
   * Subscribe to registry events using the EventEmitter
   *
   * @param eventType Event type
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  public subscribe(
    eventType: RegistryEventType,
    callback: (data: RegistryEventData) => void
  ): () => void {
    return this.eventEmitter.subscribe(
      event => event?.type === eventType,
      event => callback(event?.data)
    );
  }

  /**
   * Emit an event to all subscribers using the EventEmitter
   *
   * @param eventType Event type
   * @param data Event data
   */
  private emit(eventType: RegistryEventType, data: RegistryEventData): void {
    this.eventEmitter.emit({
      type: eventType,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get display name for a resource type
   *
   * @param resourceType The resource type
   * @returns The display name or the resource type string if not found
   */
  public getDisplayName(resourceType: ResourceType): ResourceType {
    const metadata = this.resourceMetadata?.get(resourceType);
    return metadata ? (metadata?.displayName as ResourceType) : resourceType;
  }

  /**
   * Get icon for a resource type
   *
   * @param resourceType The resource type
   * @returns The icon or undefined if not found
   */
  public getIcon(resourceType: ResourceType): string | undefined {
    const metadata = this.resourceMetadata?.get(resourceType);
    return metadata ? metadata?.icon : undefined;
  }

  /**
   * Get related resources for a resource type
   *
   * @param resourceType The resource type
   * @returns Array of related resource types
   */
  public getRelatedResources(resourceType: ResourceType): ResourceType[] {
    const metadata = this.resourceMetadata?.get(resourceType);
    return metadata ? metadata?.relatedResources : [];
  }

  /**
   * Check if a resource has a specific tag
   *
   * @param resourceType The resource type
   * @param tag The tag to check
   * @returns True if the resource has the tag, false otherwise
   */
  public hasTag(resourceType: ResourceType, tag: string): boolean {
    const metadata = this.resourceMetadata?.get(resourceType);
    return metadata ? metadata?.tags.includes(tag) : false;
  }

  /**
   * Get all tags for a resource
   *
   * @param resourceType The resource type
   * @returns Array of tags
   */
  public getTags(resourceType: ResourceType): ResourceType[] {
    const metadata = this.resourceMetadata?.get(resourceType);
    return metadata ? (metadata?.tags as ResourceType[]) : [];
  }

  /**
   * Add a tag to a resource
   *
   * @param resourceType The resource type
   * @param tag The tag to add
   * @returns True if the tag was added, false otherwise
   */
  public addTag(resourceType: ResourceType, tag: string): boolean {
    const metadata = this.resourceMetadata?.get(resourceType);
    if (!metadata) {
      return false;
    }

    if (!metadata?.tags.includes(tag)) {
      metadata?.tags.push(tag);

      // Update tag mapping
      const tagSet = this.resourcesByTag.get(tag) || new Set();
      tagSet.add(resourceType);
      this.resourcesByTag.set(tag, tagSet);

      // Emit tag added event
      this.emit('tagAdded', { resourceType, tag });

      return true;
    }

    return false;
  }

  /**
   * Remove a tag from a resource
   *
   * @param resourceType The resource type
   * @param tag The tag to remove
   * @returns True if the tag was removed, false otherwise
   */
  public removeTag(resourceType: ResourceType, tag: string): boolean {
    const metadata = this.resourceMetadata?.get(resourceType);
    if (!metadata) {
      return false;
    }

    const index = metadata?.tags.indexOf(tag);
    if (index !== -1) {
      metadata?.tags.splice(index, 1);

      // Update tag mapping
      const tagSet = this.resourcesByTag.get(tag);
      if (tagSet) {
        tagSet.delete(resourceType);
        if (tagSet.size === 0) {
          this.resourcesByTag.delete(tag);
        }
      }

      // Emit tag removed event
      this.emit('tagRemoved', { resourceType, tag });

      return true;
    }

    return false;
  }

  /**
   * Update resource metadata
   *
   * @param resourceType The resource type
   * @param updates Partial metadata updates
   * @returns True if the update was successful, false otherwise
   */
  public updateResourceMetadata(
    resourceType: ResourceType,
    updates: Partial<ExtendedResourceMetadata>
  ): boolean {
    const metadata = this.resourceMetadata?.get(resourceType);
    if (!metadata) {
      return false;
    }

    // Apply updates
    Object.assign(metadata, updates);

    // Update category if changed
    if (updates.category && updates.category !== metadata?.category) {
      // Remove from old category
      const oldCategorySet = this.resourcesByCategory.get(metadata?.category);
      if (oldCategorySet) {
        oldCategorySet.delete(resourceType);
      }

      // Add to new category
      const newCategorySet = this.resourcesByCategory.get(updates.category) || new Set();
      newCategorySet.add(resourceType);
      this.resourcesByCategory.set(updates.category, newCategorySet);
    }

    // Emit metadata updated event
    this.emit('resourceMetadataUpdated', { resourceType, updates });

    return true;
  }

  /**
   * Get quality level for a resource
   *
   * @param resourceType The resource type
   * @param quality The quality level
   * @returns The quality value or undefined if not found
   */
  public getQualityLevel(resourceType: ResourceType, quality: ResourceQuality): number | undefined {
    const metadata = this.resourceMetadata?.get(resourceType);
    return metadata ? metadata?.qualityLevels[quality] : undefined;
  }

  /**
   * Set quality level for a resource
   *
   * @param resourceType The resource type
   * @param quality The quality level
   * @param value The quality value
   * @returns True if the quality level was set, false otherwise
   */
  public setQualityLevel(
    resourceType: ResourceType,
    quality: ResourceQuality,
    value: number
  ): boolean {
    const metadata = this.resourceMetadata?.get(resourceType);
    if (!metadata) {
      return false;
    }

    metadata.qualityLevels[quality] = value;

    // Update quality mapping
    const qualityMap = this.resourcesByQuality.get(quality) || new Map();
    qualityMap.set(resourceType, value);
    this.resourcesByQuality.set(quality, qualityMap);

    // Emit quality level changed event
    this.emit('qualityLevelChanged', { resourceType, quality, value });

    return true;
  }

  /**
   * Get all quality levels for a resource
   *
   * @param resourceType The resource type
   * @returns Record of quality levels or empty object if not found
   */
  public getAllQualityLevels(resourceType: ResourceType): Record<ResourceQuality, number> {
    const metadata = this.resourceMetadata?.get(resourceType);
    return metadata ? metadata?.qualityLevels : ({} as Record<ResourceQuality, number>);
  }

  /**
   * Initialize the registry from async data source
   * This method can be used to load resource data from an API or database
   *
   * @param dataSource Function that returns a promise with resource data
   * @returns Promise that resolves when initialization is complete
   */
  public async initializeFromDataSource(
    dataSource: () => Promise<ResourceRegistrationOptions[]>
  ): Promise<void> {
    try {
      const resources = await dataSource();

      // Clear existing resources
      this.resourceMetadata?.clear();
      this.resourcesByCategory.clear();
      this.resourcesByTag.clear();
      this.resourcesByQuality.clear();
      this.conversionRates.clear();

      // Initialize category maps
      Object.values(ResourceCategory).forEach(category => {
        this.resourcesByCategory.set(category, new Set());
      });

      // Initialize quality maps
      Object.values(ResourceQuality).forEach(quality => {
        this.resourcesByQuality.set(quality, new Map());
      });

      // Register resources
      resources.forEach(resource => {
        this.registerResource(resource);
      });

      // Emit initialization complete event
      this.emit('initializationComplete', { resourceCount: resources.length });
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Error initializing resource registry'),
        ErrorType.INITIALIZATION,
        ErrorSeverity.CRITICAL,
        { componentName: 'ResourceRegistry', action: 'initializeFromDataSource' }
      );
      throw error;
    }
  }

  /**
   * Export registry data
   * This method can be used to save resource data to a file or database
   *
   * @returns Object containing all registry data
   */
  public exportRegistryData(): {
    resources: Record<string, ExtendedResourceMetadata>;
    conversionRates: Record<string, Record<string, number>>;
  } {
    const resources: Record<string, ExtendedResourceMetadata> = {};
    const conversionRates: Record<string, Record<string, number>> = {};

    // Export resources
    this.resourceMetadata?.forEach((metadata, resourceType) => {
      resources[resourceType] = { ...metadata };
    });

    // Export conversion rates
    this.conversionRates.forEach((rateMap, sourceType) => {
      conversionRates[sourceType] = {};
      rateMap.forEach((rate, targetType) => {
        conversionRates[sourceType][targetType] = rate;
      });
    });

    return { resources, conversionRates };
  }

  /**
   * Import registry data
   * This method can be used to load resource data from a file or database
   *
   * @param data Object containing registry data
   * @returns True if import was successful, false otherwise
   */
  public importRegistryData(data: {
    resources: Record<string, ExtendedResourceMetadata>;
    conversionRates: Record<string, Record<string, number>>;
  }): boolean {
    try {
      // Clear existing data
      this.resourceMetadata?.clear();
      this.resourcesByCategory.clear();
      this.resourcesByTag.clear();
      this.resourcesByQuality.clear();
      this.conversionRates.clear();

      // Initialize category maps
      Object.values(ResourceCategory).forEach(category => {
        this.resourcesByCategory.set(category, new Set());
      });

      // Initialize quality maps
      Object.values(ResourceQuality).forEach(quality => {
        this.resourcesByQuality.set(quality, new Map());
      });

      // Import resources
      Object.entries(data?.resources).forEach(([, metadata]) => {
        this.registerResource({
          metadata: metadata as ExtendedResourceMetadata,
          overrideExisting: true,
        });
      });

      // Import conversion rates
      Object.entries(data?.conversionRates).forEach(([sourceType, rates]) => {
        Object.entries(rates).forEach(([targetType, rate]) => {
          this.setConversionRate(sourceType as ResourceType, targetType as ResourceType, rate);
        });
      });

      // Emit import complete event
      this.emit('importComplete', {
        resourceCount: Object.keys(data?.resources).length,
        conversionRateCount: Object.keys(data?.conversionRates).length,
      });

      return true;
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Error importing registry data'),
        ErrorType.INITIALIZATION,
        ErrorSeverity.HIGH,
        { componentName: 'ResourceRegistry', action: 'importRegistryData' }
      );
      return false;
    }
  }
}
