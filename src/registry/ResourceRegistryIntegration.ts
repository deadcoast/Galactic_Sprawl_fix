/**
 * ResourceRegistryIntegration.ts
 *
 * Integration between ResourceRegistry and ResourceFlowManager to standardize
 * resource type handling throughout the application.
 */

import { ResourceType } from '../types/resources/ResourceTypes';
// Import specific functions from the canonical converter
import { stringToResourceType } from '../utils/resources/ResourceTypeConverter';
import { RegistryEventData, ResourceRegistry } from './ResourceRegistry';

// Forcombatd declaration of ResourceFlowManager to avoid circular dependencies
interface ResourceFlowManager {
  // Add minimal interface needed for this integration
  getAllResourceStates?: () => Map<string, { available: number }>;
  getAllConversionRecipes?: () => {
    input: { type: string; amount: number };
    output: { type: string; amount: number };
  }[];
  setConversionRate?: (sourceType: string, targetType: string, rate: number) => void;
}

/**
 * ResourceRegistryIntegration class
 *
 * Provides integration methods between ResourceRegistry and other resource-related systems.
 * This class serves as a bridge to help transition from string-based resource types to enum-based types.
 */
export class ResourceRegistryIntegration {
  private static _instance: ResourceRegistryIntegration | null = null;
  private registry: ResourceRegistry;
  private resourceFlowManager: ResourceFlowManager | null = null;

  /**
   * Get the singleton instance of ResourceRegistryIntegration
   */
  public static getInstance(): ResourceRegistryIntegration {
    if (!ResourceRegistryIntegration._instance) {
      ResourceRegistryIntegration._instance = new ResourceRegistryIntegration();
    }
    return ResourceRegistryIntegration._instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.registry = ResourceRegistry.getInstance();
    this.initializeIntegration();
  }

  /**
   * Initialize the integration
   */
  private initializeIntegration(): void {
    // Subscribe to registry events to sync with other systems
    this.registry.subscribe('resourceRegistered', (data: RegistryEventData) => {
      if ('resourceType' in data && 'metadata' in data) {
        console.warn(`Resource registered: ${data?.resourceType}`);
        // Here you would notify other systems about the new resource
      }
    });

    this.registry.subscribe('conversionRateChanged', (data: RegistryEventData) => {
      if ('sourceType' in data && 'targetType' in data && 'rate' in data) {
        console.warn(
          `Conversion rate changed: ${data?.sourceType} -> ${data?.targetType} = ${data?.rate}`
        );
        // Here you would update conversion rates in other systems
      }
    });
  }

  /**
   * Get resource availability from ResourceFlowManager and register with ResourceRegistry
   *
   * @param resourceFlowManager The ResourceFlowManager instance
   */
  public syncResourceAvailability(resourceFlowManager: ResourceFlowManager): void {
    // This is a placeholder for actual integration code
    // In a real implementation, you would:
    // 1. Get all resource states from ResourceFlowManager
    // 2. Update the ResourceRegistry with the current availability
    // Example (pseudo-code):
    // const resourceStates = resourceFlowManager.getAllResourceStates();
    // resourceStates.forEach((state, resourceType) => {
    //   const standardizedType = stringToResourceType(resourceType);
    //   if (standardizedType) {
    //     // Update registry with availability information
    //     const metadata = this.registry.getResourceMetadata(standardizedType);
    //     if (metadata) {
    //       this.registry.updateResourceMetadata(standardizedType, {
    //         currentAvailability: state.available
    //       });
    //     }
    //   }
    // });
  }

  /**
   * Register conversion recipes from ResourceFlowManager with ResourceRegistry
   *
   * @param resourceFlowManager The ResourceFlowManager instance
   */
  public syncConversionRecipes(resourceFlowManager: ResourceFlowManager): void {
    // This is a placeholder for actual integration code
    // In a real implementation, you would:
    // 1. Get all conversion recipes from ResourceFlowManager
    // 2. Register them with the ResourceRegistry
    // Example (pseudo-code):
    // const recipes = resourceFlowManager.getAllConversionRecipes();
    // recipes.forEach(recipe => {
    //   const inputType = stringToResourceType(recipe.input.type);
    //   const outputType = stringToResourceType(recipe.output.type);
    //
    //   if (inputType && outputType) {
    //     this.registry.setConversionRate(
    //       inputType,
    //       outputType,
    //       recipe.output.amount / recipe.input.amount
    //     );
    //   }
    // });
  }

  // TODO: Implement this placeholder function
  /**
   * Get conversion rates from ResourceRegistry and update ResourceFlowManager
   *
   * @param resourceFlowManager The ResourceFlowManager instance
   */
  public applyConversionRatesToFlowManager(resourceFlowManager: ResourceFlowManager): void {
    // This is a placeholder for actual integration code
    // In a real implementation, you would:
    // 1. Get all conversion rates from ResourceRegistry
    // 2. Apply them to ResourceFlowManager
    // Example (pseudo-code):
    // const resourceTypes = this.registry.getAllResourceTypes();
    //
    // resourceTypes.forEach(sourceType => {
    //   const conversionRates = this.registry.getAllConversionRates(sourceType);
    //
    //   conversionRates.forEach((rate, targetType) => {
    //     const stringSourceType = enumToStringResourceType(sourceType);
    //     const stringTargetType = enumToStringResourceType(targetType);
    //
    //     if (stringSourceType && stringTargetType) {
    //       resourceFlowManager.setConversionRate(
    //         stringSourceType,
    //         stringTargetType,
    //         rate
    //       );
    //     }
    //   });
    // });
  }

  /**
   * Get resource metadata from ResourceRegistry
   *
   * @param resourceType The resource type (string or enum)
   * @returns The resource metadata or undefined if not found
   */
  public getResourceMetadata(resourceType: ResourceType | string): unknown {
    if (typeof resourceType === 'string') {
      const enumType = stringToResourceType(resourceType);
      if (!enumType) {
        return undefined;
      }
      return this.registry.getResourceMetadata(enumType);
    }

    return this.registry.getResourceMetadata(resourceType);
  }

  /**
   * Get display name for a resource type
   *
   * @param resourceType The resource type (string or enum)
   * @returns The display name or the resource type string if not found
   */
  public getDisplayName(resourceType: ResourceType | string): string {
    if (typeof resourceType === 'string') {
      const enumType = stringToResourceType(resourceType);
      if (!enumType) {
        console.warn(
          `[ResourceRegistryIntegration] Invalid resource type string provided to getDisplayName: ${resourceType}`
        );
        return resourceType;
      }
      return this.registry.getDisplayName(enumType);
    }

    return this.registry.getDisplayName(resourceType);
  }

  /**
   * Get icon for a resource type
   *
   * @param resourceType The resource type (string or enum)
   * @returns The icon or undefined if not found
   */
  public getIcon(resourceType: ResourceType | string): string | undefined {
    if (typeof resourceType === 'string') {
      const enumType = stringToResourceType(resourceType);
      if (!enumType) {
        return undefined;
      }
      return this.registry.getIcon(enumType);
    }

    return this.registry.getIcon(resourceType);
  }

  /**
   * Check if a resource is of a specific category
   *
   * @param resourceType The resource type (string or enum)
   * @param category The category to check
   * @returns True if the resource is of the category, false otherwise
   */
  public isResourceOfCategory(resourceType: ResourceType | string, category: string): boolean {
    let enumType: ResourceType | undefined;

    if (typeof resourceType === 'string') {
      enumType = stringToResourceType(resourceType);
      if (!enumType) {
        return false;
      }
    } else {
      enumType = resourceType;
    }

    const metadata = this.registry.getResourceMetadata(enumType);
    return metadata ? metadata?.category === category : false;
  }

  /**
   * Check if a resource has a specific tag
   *
   * @param resourceType The resource type (string or enum)
   * @param tag The tag to check
   * @returns True if the resource has the tag, false otherwise
   */
  public hasTag(resourceType: ResourceType | string, tag: string): boolean {
    let enumType: ResourceType | undefined;

    if (typeof resourceType === 'string') {
      enumType = stringToResourceType(resourceType);
      if (!enumType) {
        return false;
      }
    } else {
      enumType = resourceType;
    }

    return this.registry.hasTag(enumType, tag);
  }

  /**
   * Get all resources with a specific tag
   *
   * @param tag The tag to filter by
   * @returns Array of resource types with the tag
   */
  public getResourcesByTag(tag: string): ResourceType[] {
    return this.registry.getResourcesByTag(tag);
  }

  /**
   * Get all resources that can be converted to a specific resource
   *
   * @param targetType The target resource type (string or enum)
   * @returns Array of resource types that can be converted to the target
   */
  public getConversionSources(targetType: ResourceType | string): ResourceType[] {
    let enumType: ResourceType | undefined;

    if (typeof targetType === 'string') {
      enumType = stringToResourceType(targetType);
      if (!enumType) {
        return [];
      }
    } else {
      enumType = targetType;
    }

    const sources = this.registry.findConversionSources(enumType);
    return Array.from(sources.keys());
  }

  /**
   * Get conversion rate between resources
   *
   * @param sourceType Source resource type (string or enum)
   * @param targetType Target resource type (string or enum)
   * @returns Conversion rate or undefined if not found
   */
  public getConversionRate(
    sourceType: ResourceType | string,
    targetType: ResourceType | string
  ): number | undefined {
    let enumSourceType: ResourceType | undefined;
    let enumTargetType: ResourceType | undefined;

    if (typeof sourceType === 'string') {
      enumSourceType = stringToResourceType(sourceType);
      if (!enumSourceType) {
        return undefined;
      }
    } else {
      enumSourceType = sourceType;
    }

    if (typeof targetType === 'string') {
      enumTargetType = stringToResourceType(targetType);
      if (!enumTargetType) {
        return undefined;
      }
    } else {
      enumTargetType = targetType;
    }

    return this.registry.getConversionRate(enumSourceType, enumTargetType);
  }

  public setResourceFlowManager(manager: ResourceFlowManager): void {
    this.resourceFlowManager = manager;
  }

  /**
   * Integrates resource flow data into the registry.
   * Requires ResourceFlowManager to be set.
   * @param _resourceFlowManager - The ResourceFlowManager instance (unused, retained for potential future use).
   */
  public integrateResourceFlowData(_resourceFlowManager?: ResourceFlowManager): void {
    if (!this.resourceFlowManager) {
      console.warn('ResourceFlowManager not set. Cannot integrate flow data.');
      return;
    }
    // Implementation of integrateResourceFlowData method
  }

  /**
   * Example integration point for resource production data.
   * @param _resourceFlowManager - The ResourceFlowManager instance (unused).
   */
  public integrateProductionData(_resourceFlowManager?: ResourceFlowManager): void {
    if (!this.resourceFlowManager) {
      console.warn('ResourceFlowManager not set. Cannot integrate production data.');
      return;
    }
    // Implementation of integrateProductionData method
  }

  /**
   * Example integration point for resource consumption data.
   * @param _resourceFlowManager - The ResourceFlowManager instance (unused).
   */
  public integrateConsumptionData(_resourceFlowManager?: ResourceFlowManager): void {
    if (!this.resourceFlowManager) {
      console.warn('ResourceFlowManager not set. Cannot integrate consumption data.');
      return;
    }
    // Implementation of integrateConsumptionData method
  }
}
