/**
 * Resource Type Utilities
 *
 * This file provides utility functions for working with resource types.
 * It complements the StandardizedResourceTypes.ts file and helps with
 * common operations on resource types.
 */

import { ResourceType } from "./ResourceTypes";

/**
 * Gets the display name for a resource type
 * @param resourceType The resource type
 * @returns The display name
 */
export function getResourceDisplayName(resourceType: ResourceType): ResourceType {
  return ResourceTypeInfo[resourceType].displayName;
}

/**
 * Gets the description for a resource type
 * @param resourceType The resource type
 * @returns The description
 */
export function getResourceDescription(resourceType: ResourceType): ResourceType {
  return ResourceTypeInfo[resourceType].description;
}

/**
 * Gets the icon for a resource type
 * @param resourceType The resource type
 * @returns The icon name
 */
export function getResourceIcon(resourceType: ResourceType): ResourceType {
  return ResourceTypeInfo[resourceType].icon;
}

/**
 * Gets the category for a resource type
 * @param resourceType The resource type
 * @returns The resource category
 */
export function getResourceCategory(resourceType: ResourceType): ResourceCategory {
  return ResourceTypeInfo[resourceType].category;
}

/**
 * Gets the default maximum amount for a resource type
 * @param resourceType The resource type
 * @returns The default maximum amount
 */
export function getResourceDefaultMax(resourceType: ResourceType): number {
  return ResourceTypeInfo[resourceType].defaultMax;
}

/**
 * Gets all resource types of a specific category
 * @param category The resource category
 * @returns Array of resource types in that category
 */
export function getResourceTypesByCategory(category: ResourceCategory): ResourceType[] {
  return Object.values(ResourceType).filter(type => ResourceTypeInfo[type].category === category);
}

/**
 * Gets all basic resources
 * @returns Array of basic resource types
 */
export function getBasicResourceTypes(): ResourceType[] {
  return getResourceTypesByCategory(ResourceCategory.BASIC);
}

/**
 * Gets all advanced resources
 * @returns Array of advanced resource types
 */
export function getAdvancedResourceTypes(): ResourceType[] {
  return getResourceTypesByCategory(ResourceCategory.ADVANCED);
}

/**
 * Gets all special resources
 * @returns Array of special resource types
 */
export function getSpecialResourceTypes(): ResourceType[] {
  return getResourceTypesByCategory(ResourceCategory.SPECIAL);
}

/**
 * Checks if a resource type is a basic resource
 * @param resourceType The resource type to check
 * @returns Whether the resource type is a basic resource
 */
export function isBasicResource(resourceType: ResourceType): boolean {
  return ResourceTypeInfo[resourceType].category === ResourceCategory.BASIC;
}

/**
 * Checks if a resource type is an advanced resource
 * @param resourceType The resource type to check
 * @returns Whether the resource type is an advanced resource
 */
export function isAdvancedResource(resourceType: ResourceType): boolean {
  return ResourceTypeInfo[resourceType].category === ResourceCategory.ADVANCED;
}

/**
 * Checks if a resource type is a special resource
 * @param resourceType The resource type to check
 * @returns Whether the resource type is a special resource
 */
export function isSpecialResource(resourceType: ResourceType): boolean {
  return ResourceTypeInfo[resourceType].category === ResourceCategory.SPECIAL;
}

/**
 * Gets a color for a resource type (for visualization)
 * @param resourceType The resource type
 * @returns A color string (hex or CSS color)
 */
export function getResourceTypeColor(resourceType: ResourceType): ResourceType {
  // Define a color mapping for resource types
  const colorMap: Record<ResourceType, string> = {
    [ResourceType.MINERALS]: '#8B4513', // SaddleBrown
    [ResourceType.ENERGY]: '#FFD700', // Gold
    [ResourceType.POPULATION]: '#32CD32', // LimeGreen
    [ResourceType.RESEARCH]: '#1E90FF', // DodgerBlue
    [ResourceType.PLASMA]: '#FF1493', // DeepPink
    [ResourceType.GAS]: '#00FFFF', // Cyan
    [ResourceType.EXOTIC]: '#9932CC', // DarkOrchid
    [ResourceType.IRON]: '#A52A2A', // Brown
    [ResourceType.COPPER]: '#B87333', // Copper
    [ResourceType.TITANIUM]: '#C0C0C0', // Silver
    [ResourceType.URANIUM]: '#7FFF00', // Chartreuse
    [ResourceType.WATER]: '#1E90FF', // DodgerBlue
    [ResourceType.HELIUM]: '#87CEFA', // LightSkyBlue
    [ResourceType.DEUTERIUM]: '#00BFFF', // DeepSkyBlue
    [ResourceType.ANTIMATTER]: '#FF00FF', // Magenta
    [ResourceType.DARK_MATTER]: '#4B0082', // Indigo
    [ResourceType.EXOTIC_MATTER]: '#800080', // Purple
  };

  return colorMap[resourceType] || '#808080'; // Default to gray if not found
}

/**
 * Gets a lighter color variant for a resource type (for highlights)
 * @param resourceType The resource type
 * @returns A lighter color string (hex or CSS color)
 */
export function getResourceTypeHighlightColor(resourceType: ResourceType): ResourceType {
  // Define a highlight color mapping for resource types
  const highlightColorMap: Record<ResourceType, string> = {
    [ResourceType.MINERALS]: '#CD853F', // Peru (lighter brown)
    [ResourceType.ENERGY]: '#FFEC8B', // LightGoldenrod (lighter gold)
    [ResourceType.POPULATION]: '#90EE90', // LightGreen
    [ResourceType.RESEARCH]: '#87CEFA', // LightSkyBlue
    [ResourceType.PLASMA]: '#FF69B4', // HotPink
    [ResourceType.GAS]: '#AFEEEE', // PaleTurquoise
    [ResourceType.EXOTIC]: '#BA55D3', // MediumOrchid
    [ResourceType.IRON]: '#CD5C5C', // IndianRed
    [ResourceType.COPPER]: '#DAA520', // GoldenRod
    [ResourceType.TITANIUM]: '#E0E0E0', // Lighter silver
    [ResourceType.URANIUM]: '#ADFF2F', // GreenYellow
    [ResourceType.WATER]: '#87CEFA', // LightSkyBlue
    [ResourceType.HELIUM]: '#B0E2FF', // LighterSkyBlue
    [ResourceType.DEUTERIUM]: '#87CEFF', // LighterDeepSkyBlue
    [ResourceType.ANTIMATTER]: '#FF77FF', // Lighter magenta
    [ResourceType.DARK_MATTER]: '#9370DB', // MediumPurple
    [ResourceType.EXOTIC_MATTER]: '#BA55D3', // MediumOrchid
  };

  return highlightColorMap[resourceType] || '#C0C0C0'; // Default to light gray if not found
}

/**
 * Gets a darker color variant for a resource type (for shadows or borders)
 * @param resourceType The resource type
 * @returns A darker color string (hex or CSS color)
 */
export function getResourceTypeDarkColor(resourceType: ResourceType): ResourceType {
  // Define a dark color mapping for resource types
  const darkColorMap: Record<ResourceType, string> = {
    [ResourceType.MINERALS]: '#5C2E0E', // Darker brown
    [ResourceType.ENERGY]: '#B8860B', // DarkGoldenrod
    [ResourceType.POPULATION]: '#228B22', // ForestGreen
    [ResourceType.RESEARCH]: '#0000CD', // MediumBlue
    [ResourceType.PLASMA]: '#C71585', // MediumVioletRed
    [ResourceType.GAS]: '#008B8B', // DarkCyan
    [ResourceType.EXOTIC]: '#6A0DAD', // DarkerPurple
    [ResourceType.IRON]: '#8B0000', // DarkRed
    [ResourceType.COPPER]: '#8B4513', // SaddleBrown
    [ResourceType.TITANIUM]: '#A9A9A9', // DarkGray
    [ResourceType.URANIUM]: '#556B2F', // DarkOliveGreen
    [ResourceType.WATER]: '#00008B', // DarkBlue
    [ResourceType.HELIUM]: '#4682B4', // SteelBlue
    [ResourceType.DEUTERIUM]: '#00688B', // DeepSkyBlue4
    [ResourceType.ANTIMATTER]: '#8B008B', // DarkMagenta
    [ResourceType.DARK_MATTER]: '#2E0854', // DarkerIndigo
    [ResourceType.EXOTIC_MATTER]: '#4B0082', // Indigo
  };

  return darkColorMap[resourceType] || '#404040'; // Default to dark gray if not found
}

/**
 * Formats a resource amount for display
 * @param amount The resource amount
 * @param resourceType Optional resource type for specialized formatting
 * @returns Formatted string representation of the amount
 */
export function formatResourceAmount(amount: number, resourceType?: ResourceType): ResourceType {
  // For large numbers, use abbreviations
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  } else if (Number.isInteger(amount)) {
    return amount.toString();
  } else {
    return amount.toFixed(1);
  }
}

/**
 * Calculates the production rate per minute
 * @param amountPerTick Amount produced per tick
 * @param ticksPerSecond Number of ticks per second
 * @returns Production rate per minute
 */
export function calculateProductionRatePerMinute(
  amountPerTick: number,
  ticksPerSecond: number
): number {
  return amountPerTick * ticksPerSecond * 60;
}

/**
 * Calculates time until a target amount is reached
 * @param currentAmount Current amount of the resource
 * @param targetAmount Target amount to reach
 * @param productionRate Production rate per second (positive for production, negative for consumption)
 * @returns Time in seconds until target is reached, or Infinity if impossible
 */
export function calculateTimeToTarget(
  currentAmount: number,
  targetAmount: number,
  productionRate: number
): number {
  if (productionRate === 0) {
    return Infinity;
  }

  const difference = targetAmount - currentAmount;

  // If we're already at or past the target
  if ((productionRate > 0 && difference <= 0) || (productionRate < 0 && difference >= 0)) {
    return 0;
  }

  // If we're consuming and trying to reach a higher amount, or
  // if we're producing and trying to reach a lower amount
  if ((productionRate < 0 && difference > 0) || (productionRate > 0 && difference < 0)) {
    return Infinity;
  }

  return Math.abs(difference / productionRate);
}

/**
 * Formats a time duration in seconds to a human-readable string
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export function formatTimeDuration(seconds: number): string {
  if (!isFinite(seconds)) {
    return 'Never';
  }

  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.ceil(seconds / 60)}m`;
  } else if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ${Math.ceil((seconds % 3600) / 60)}m`;
  } else {
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  }
}
