import { ResourceType } from "./ResourceTypes";
/**
 * StandardizedResourceTypes.ts
 *
 * This file re-exports the enum-based resource types from ResourceTypes.ts
 * to provide backward compatibility for components that import from this file.
 *
 * This is part of the resource type standardization effort to migrate from
 * string-based resource types to enum-based resource types.
 */

export {
  ResourceCategory,
  ResourceConsumption,
  ResourceFlow,
  ResourceProduction,
  ResourceState,
  ResourceStateClass,
  ResourceThreshold,
  ResourceTransfer,
  ResourceType,
  ResourceTypeHelpers,
  ResourceTypeInfo,
  ResourceTypeMetadata,
  ResourceTypeString,
  createResourceState,
} from './ResourceTypes';

// Add a comment to indicate that this file is for backward compatibility
// and that new code should import directly from ResourceTypes.ts
/**
 * @deprecated Import directly from ResourceTypes.ts instead.
 * This file exists only for backward compatibility during the migration process.
 */
