import {
  BaseModule,
  ModuleType,
  ModuleConfig,
  ModuleRequirements,
  ModuleAttachmentPoint,
  ModularBuilding,
  BuildingType,
  SubModuleType,
  SubModuleEffectType,
  SubModule,
  SubModuleEffect,
  SubModuleRequirements,
  SubModuleConfig,
  SubModuleAttachmentPoint
} from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';

/**
 * Type guard for ModuleType
 */
export function isModuleType(value: any): value is ModuleType {
  const validTypes: ModuleType[] = [
    'radar',
    'hangar',
    'academy',
    'exploration',
    'mineral',
    'trading',
    'population',
    'infrastructure',
    'research',
    'food',
    'defense',
    'resource-manager'
  ];
  return typeof value === 'string' && validTypes.includes(value as ModuleType);
}

/**
 * Type guard for BuildingType
 */
export function isBuildingType(value: any): value is BuildingType {
  const validTypes: BuildingType[] = ['mothership', 'colony'];
  return typeof value === 'string' && validTypes.includes(value as BuildingType);
}

/**
 * Validates a BaseModule object
 */
export function validateBaseModule(module: any): module is BaseModule {
  if (typeof module !== 'object' || module === null) {
    return false;
  }

  return (
    typeof module.id === 'string' &&
    typeof module.name === 'string' &&
    isModuleType(module.type) &&
    validatePosition(module.position) &&
    typeof module.isActive === 'boolean' &&
    typeof module.level === 'number' &&
    (module.status === 'active' || module.status === 'constructing' || module.status === 'inactive') &&
    (module.progress === undefined || typeof module.progress === 'number')
  );
}

/**
 * Validates a Position object
 */
export function validatePosition(position: any): position is Position {
  if (typeof position !== 'object' || position === null) {
    return false;
  }

  return (
    typeof position.x === 'number' &&
    typeof position.y === 'number' &&
    (position.z === undefined || typeof position.z === 'number')
  );
}

/**
 * Validates a ModuleRequirements object
 */
export function validateModuleRequirements(requirements: any): requirements is ModuleRequirements {
  if (typeof requirements !== 'object' || requirements === null) {
    return false;
  }

  // Check minLevel
  if (typeof requirements.minLevel !== 'number' || requirements.minLevel < 1) {
    return false;
  }

  // Check buildingType
  if (!Array.isArray(requirements.buildingType) || requirements.buildingType.length === 0) {
    return false;
  }
  
  for (const type of requirements.buildingType) {
    if (!isBuildingType(type)) {
      return false;
    }
  }

  // Check resourceCosts
  if (!Array.isArray(requirements.resourceCosts)) {
    return false;
  }

  for (const cost of requirements.resourceCosts) {
    if (
      typeof cost !== 'object' ||
      cost === null ||
      typeof cost.type !== 'string' ||
      typeof cost.amount !== 'number' ||
      cost.amount <= 0
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a ModuleConfig object
 */
export function validateModuleConfig(config: any): config is ModuleConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  return (
    isModuleType(config.type) &&
    typeof config.name === 'string' &&
    typeof config.description === 'string' &&
    validateModuleRequirements(config.requirements) &&
    typeof config.baseStats === 'object' &&
    config.baseStats !== null &&
    typeof config.baseStats.power === 'number' &&
    typeof config.baseStats.crew === 'number' &&
    typeof config.baseStats.upkeep === 'number'
  );
}

/**
 * Validates a ModuleAttachmentPoint object
 */
export function validateModuleAttachmentPoint(point: any): point is ModuleAttachmentPoint {
  if (typeof point !== 'object' || point === null) {
    return false;
  }

  // Check basic properties
  if (
    typeof point.id !== 'string' ||
    !validatePosition(point.position) ||
    !Array.isArray(point.allowedTypes) ||
    point.allowedTypes.length === 0
  ) {
    return false;
  }

  // Check that all allowed types are valid
  for (const type of point.allowedTypes) {
    if (!isModuleType(type)) {
      return false;
    }
  }

  // Check currentModule if present
  if (point.currentModule !== undefined && !validateBaseModule(point.currentModule)) {
    return false;
  }

  return true;
}

/**
 * Validates a ModularBuilding object
 */
export function validateModularBuilding(building: any): building is ModularBuilding {
  if (typeof building !== 'object' || building === null) {
    return false;
  }

  // Check basic properties
  if (
    typeof building.id !== 'string' ||
    !isBuildingType(building.type) ||
    typeof building.level !== 'number' ||
    !Array.isArray(building.modules) ||
    (building.status !== 'active' && building.status !== 'constructing' && building.status !== 'inactive') ||
    !Array.isArray(building.attachmentPoints)
  ) {
    return false;
  }

  // Check modules
  for (const module of building.modules) {
    if (!validateBaseModule(module)) {
      return false;
    }
  }

  // Check attachment points
  for (const point of building.attachmentPoints) {
    if (!validateModuleAttachmentPoint(point)) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if a module can be attached to a specific attachment point
 */
export function canAttachModule(module: BaseModule, attachmentPoint: ModuleAttachmentPoint): boolean {
  // Check if the attachment point already has a module
  if (attachmentPoint.currentModule) {
    return false;
  }

  // Check if the module type is allowed at this attachment point
  if (!attachmentPoint.allowedTypes.includes(module.type)) {
    return false;
  }

  return true;
}

/**
 * Checks if a module can be upgraded
 */
export function canUpgradeModule(
  module: BaseModule,
  building: ModularBuilding,
  config: ModuleConfig,
  availableResources: Record<string, number>
): { canUpgrade: boolean; reason?: string } {
  // Check if module is active
  if (!module.isActive) {
    return { canUpgrade: false, reason: 'Module must be active to upgrade' };
  }

  // Check if module is already at max level (arbitrary max level of 10 for now)
  if (module.level >= 10) {
    return { canUpgrade: false, reason: 'Module is already at maximum level' };
  }

  // Check building level requirement
  if (building.level < config.requirements.minLevel) {
    return {
      canUpgrade: false,
      reason: `Building level ${building.level} is below required level ${config.requirements.minLevel}`
    };
  }

  // Check building type compatibility
  if (!config.requirements.buildingType.includes(building.type)) {
    return {
      canUpgrade: false,
      reason: `Module is not compatible with building type ${building.type}`
    };
  }

  // Check resource costs
  for (const cost of config.requirements.resourceCosts) {
    const available = availableResources[cost.type] || 0;
    if (available < cost.amount) {
      return {
        canUpgrade: false,
        reason: `Insufficient ${cost.type}: ${available}/${cost.amount}`
      };
    }
  }

  return { canUpgrade: true };
}

/**
 * Calculates the upgrade costs for a module
 */
export function calculateUpgradeCosts(
  module: BaseModule,
  config: ModuleConfig
): { type: string; amount: number }[] {
  // Scale costs based on current level
  const levelMultiplier = Math.pow(1.5, module.level - 1);
  
  return config.requirements.resourceCosts.map(cost => ({
    type: cost.type,
    amount: Math.ceil(cost.amount * levelMultiplier)
  }));
}

/**
 * Calculates the power consumption of a module
 */
export function calculateModulePower(module: BaseModule, config: ModuleConfig): number {
  // Base power consumption from config
  const basePower = config.baseStats.power;
  
  // Scale by level (10% increase per level)
  const levelMultiplier = 1 + (module.level - 1) * 0.1;
  
  return Math.ceil(basePower * levelMultiplier);
}

/**
 * Calculates the crew requirement of a module
 */
export function calculateModuleCrew(module: BaseModule, config: ModuleConfig): number {
  // Base crew requirement from config
  const baseCrew = config.baseStats.crew;
  
  // Scale by level (5% increase per level)
  const levelMultiplier = 1 + (module.level - 1) * 0.05;
  
  return Math.ceil(baseCrew * levelMultiplier);
}

/**
 * Calculates the upkeep cost of a module
 */
export function calculateModuleUpkeep(module: BaseModule, config: ModuleConfig): number {
  // Base upkeep from config
  const baseUpkeep = config.baseStats.upkeep;
  
  // Scale by level (15% increase per level)
  const levelMultiplier = 1 + (module.level - 1) * 0.15;
  
  return Math.ceil(baseUpkeep * levelMultiplier);
}

/**
 * Validates module compatibility with a building
 */
export function validateModuleCompatibility(
  moduleType: ModuleType,
  buildingType: BuildingType,
  buildingLevel: number,
  config: ModuleConfig
): { compatible: boolean; reason?: string } {
  // Check module type matches config
  if (moduleType !== config.type) {
    return { compatible: false, reason: 'Module type does not match configuration' };
  }

  // Check building type compatibility
  if (!config.requirements.buildingType.includes(buildingType)) {
    return {
      compatible: false,
      reason: `Module is not compatible with building type ${buildingType}`
    };
  }

  // Check building level requirement
  if (buildingLevel < config.requirements.minLevel) {
    return {
      compatible: false,
      reason: `Building level ${buildingLevel} is below required level ${config.requirements.minLevel}`
    };
  }

  return { compatible: true };
}

/**
 * Type guard for SubModuleType
 */
export function isSubModuleType(value: any): value is SubModuleType {
  const validTypes: SubModuleType[] = [
    'enhancer',
    'converter',
    'processor',
    'storage',
    'efficiency',
    'automation',
    'specialized',
    'utility'
  ];
  return typeof value === 'string' && validTypes.includes(value as SubModuleType);
}

/**
 * Type guard for SubModuleEffectType
 */
export function isSubModuleEffectType(value: any): value is SubModuleEffectType {
  const validTypes: SubModuleEffectType[] = [
    'stat_boost',
    'resource_boost',
    'unlock_ability',
    'reduce_cost',
    'automation',
    'special'
  ];
  return typeof value === 'string' && validTypes.includes(value as SubModuleEffectType);
}

/**
 * Validates a SubModuleEffect object
 */
export function validateSubModuleEffect(effect: any): effect is SubModuleEffect {
  if (typeof effect !== 'object' || effect === null) {
    return false;
  }

  return (
    isSubModuleEffectType(effect.type) &&
    typeof effect.target === 'string' &&
    typeof effect.value === 'number' &&
    typeof effect.isPercentage === 'boolean' &&
    typeof effect.description === 'string'
  );
}

/**
 * Validates a SubModuleRequirements object
 */
export function validateSubModuleRequirements(requirements: any): requirements is SubModuleRequirements {
  if (typeof requirements !== 'object' || requirements === null) {
    return false;
  }

  // Check parentModuleLevel
  if (typeof requirements.parentModuleLevel !== 'number' || requirements.parentModuleLevel < 1) {
    return false;
  }

  // Check parentModuleTypes
  if (!Array.isArray(requirements.parentModuleTypes) || requirements.parentModuleTypes.length === 0) {
    return false;
  }
  
  for (const type of requirements.parentModuleTypes) {
    if (!isModuleType(type)) {
      return false;
    }
  }

  // Check resourceCosts
  if (!Array.isArray(requirements.resourceCosts)) {
    return false;
  }

  for (const cost of requirements.resourceCosts) {
    if (
      typeof cost !== 'object' ||
      cost === null ||
      typeof cost.type !== 'string' ||
      typeof cost.amount !== 'number' ||
      cost.amount <= 0
    ) {
      return false;
    }
  }

  // Check incompatibleWith if present
  if (requirements.incompatibleWith !== undefined) {
    if (!Array.isArray(requirements.incompatibleWith)) {
      return false;
    }

    for (const type of requirements.incompatibleWith) {
      if (!isSubModuleType(type)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates a SubModule object
 */
export function validateSubModule(subModule: any): subModule is SubModule {
  if (typeof subModule !== 'object' || subModule === null) {
    return false;
  }

  // Check basic properties
  if (
    typeof subModule.id !== 'string' ||
    typeof subModule.name !== 'string' ||
    !isSubModuleType(subModule.type) ||
    typeof subModule.parentModuleId !== 'string' ||
    typeof subModule.isActive !== 'boolean' ||
    typeof subModule.level !== 'number' ||
    (subModule.status !== 'active' && subModule.status !== 'constructing' && subModule.status !== 'inactive') ||
    (subModule.progress !== undefined && typeof subModule.progress !== 'number')
  ) {
    return false;
  }

  // Check effects
  if (!Array.isArray(subModule.effects)) {
    return false;
  }

  for (const effect of subModule.effects) {
    if (!validateSubModuleEffect(effect)) {
      return false;
    }
  }

  // Check requirements if present
  if (subModule.requirements !== undefined && !validateSubModuleRequirements(subModule.requirements)) {
    return false;
  }

  return true;
}

/**
 * Validates a SubModuleConfig object
 */
export function validateSubModuleConfig(config: any): config is SubModuleConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  // Check basic properties
  if (
    !isSubModuleType(config.type) ||
    typeof config.name !== 'string' ||
    typeof config.description !== 'string' ||
    !validateSubModuleRequirements(config.requirements)
  ) {
    return false;
  }

  // Check effects
  if (!Array.isArray(config.effects)) {
    return false;
  }

  for (const effect of config.effects) {
    if (!validateSubModuleEffect(effect)) {
      return false;
    }
  }

  // Check baseStats
  if (
    typeof config.baseStats !== 'object' ||
    config.baseStats === null ||
    typeof config.baseStats.power !== 'number' ||
    typeof config.baseStats.space !== 'number' ||
    typeof config.baseStats.complexity !== 'number'
  ) {
    return false;
  }

  return true;
}

/**
 * Validates a SubModuleAttachmentPoint object
 */
export function validateSubModuleAttachmentPoint(point: any): point is SubModuleAttachmentPoint {
  if (typeof point !== 'object' || point === null) {
    return false;
  }

  // Check basic properties
  if (
    typeof point.id !== 'string' ||
    typeof point.parentModuleId !== 'string' ||
    !Array.isArray(point.allowedTypes) ||
    point.allowedTypes.length === 0 ||
    typeof point.maxSubModules !== 'number' ||
    point.maxSubModules < 1
  ) {
    return false;
  }

  // Check that all allowed types are valid
  for (const type of point.allowedTypes) {
    if (!isSubModuleType(type)) {
      return false;
    }
  }

  // Check currentSubModule if present
  if (point.currentSubModule !== undefined && !validateSubModule(point.currentSubModule)) {
    return false;
  }

  return true;
}

/**
 * Checks if a sub-module can be attached to a parent module
 */
export function canAttachSubModule(
  subModule: SubModule,
  parentModule: BaseModule,
  parentConfig: ModuleConfig
): boolean {
  // Check if parent module supports sub-modules
  if (!parentConfig.subModuleSupport) {
    return false;
  }

  // Check if parent module allows this sub-module type
  if (!parentConfig.subModuleSupport.allowedTypes.includes(subModule.type)) {
    return false;
  }

  // Check if parent module has reached max sub-modules
  const currentSubModules = parentModule.subModules || [];
  if (currentSubModules.length >= parentConfig.subModuleSupport.maxSubModules) {
    return false;
  }

  // Check if sub-module is compatible with existing sub-modules
  if (subModule.requirements?.incompatibleWith && currentSubModules.length > 0) {
    for (const existingSubModule of currentSubModules) {
      if (subModule.requirements.incompatibleWith.includes(existingSubModule.type)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Checks if a sub-module can be upgraded
 */
export function canUpgradeSubModule(
  subModule: SubModule,
  parentModule: BaseModule,
  config: SubModuleConfig,
  availableResources: Record<string, number>
): { canUpgrade: boolean; reason?: string } {
  // Check if sub-module is active
  if (!subModule.isActive) {
    return { canUpgrade: false, reason: 'Sub-module must be active to upgrade' };
  }

  // Check if parent module is active
  if (!parentModule.isActive) {
    return { canUpgrade: false, reason: 'Parent module must be active to upgrade sub-module' };
  }

  // Check if sub-module is already at max level (arbitrary max level of 5 for now)
  if (subModule.level >= 5) {
    return { canUpgrade: false, reason: 'Sub-module is already at maximum level' };
  }

  // Check parent module level requirement
  if (parentModule.level < config.requirements.parentModuleLevel) {
    return {
      canUpgrade: false,
      reason: `Parent module level ${parentModule.level} is below required level ${config.requirements.parentModuleLevel}`
    };
  }

  // Check resource costs (scaled by level)
  const levelMultiplier = Math.pow(1.5, subModule.level);
  for (const cost of config.requirements.resourceCosts) {
    const scaledAmount = Math.ceil(cost.amount * levelMultiplier);
    const available = availableResources[cost.type] || 0;
    if (available < scaledAmount) {
      return {
        canUpgrade: false,
        reason: `Insufficient ${cost.type}: ${available}/${scaledAmount}`
      };
    }
  }

  return { canUpgrade: true };
}

/**
 * Calculates the upgrade costs for a sub-module
 */
export function calculateSubModuleUpgradeCosts(
  subModule: SubModule,
  config: SubModuleConfig
): { type: string; amount: number }[] {
  // Scale costs based on current level
  const levelMultiplier = Math.pow(1.5, subModule.level);
  
  return config.requirements.resourceCosts.map(cost => ({
    type: cost.type,
    amount: Math.ceil(cost.amount * levelMultiplier)
  }));
}

/**
 * Calculates the power consumption of a sub-module
 */
export function calculateSubModulePower(subModule: SubModule, config: SubModuleConfig): number {
  // Base power consumption from config
  const basePower = config.baseStats.power;
  
  // Scale by level (10% increase per level)
  const levelMultiplier = 1 + (subModule.level - 1) * 0.1;
  
  return Math.ceil(basePower * levelMultiplier);
}

/**
 * Calculates the space requirement of a sub-module
 */
export function calculateSubModuleSpace(subModule: SubModule, config: SubModuleConfig): number {
  // Base space requirement from config
  const baseSpace = config.baseStats.space;
  
  // Scale by level (5% increase per level)
  const levelMultiplier = 1 + (subModule.level - 1) * 0.05;
  
  return Math.ceil(baseSpace * levelMultiplier);
}

/**
 * Calculates the complexity of a sub-module
 */
export function calculateSubModuleComplexity(subModule: SubModule, config: SubModuleConfig): number {
  // Base complexity from config
  const baseComplexity = config.baseStats.complexity;
  
  // Scale by level (15% increase per level)
  const levelMultiplier = 1 + (subModule.level - 1) * 0.15;
  
  return Math.ceil(baseComplexity * levelMultiplier);
} 