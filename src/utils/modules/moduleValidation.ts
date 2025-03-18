import { ResourceType } from "./../../types/resources/ResourceTypes";
import {
  BaseModule,
  BuildingType,
  ModularBuilding,
  ModuleAttachmentPoint,
  ModuleConfig,
  ModuleRequirements,
  ModuleType,
  SubModule,
  SubModuleAttachmentPoint,
  SubModuleConfig,
  SubModuleEffect,
  SubModuleEffectType,
  SubModuleRequirements,
  SubModuleType,
} from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';

/**
 * Type guard for ModuleType
 */
export function isModuleType(value: unknown): value is ModuleType {
  const validTypes: ModuleType[] = [
    'radar',
    'hangar',
    'academy',
    'exploration',
    'mineral',
    'trading',
    ResourceType.POPULATION,
    'infrastructure',
    ResourceType.RESEARCH,
    ResourceType.FOOD,
    'defense',
    'resource-manager',
  ];
  return typeof value === 'string' && validTypes.includes(value as ModuleType);
}

/**
 * Type guard for BuildingType
 */
export function isBuildingType(value: unknown): value is BuildingType {
  const validTypes: BuildingType[] = ['mothership', 'colony'];
  return typeof value === 'string' && validTypes.includes(value as BuildingType);
}

/**
 * Validates a BaseModule object
 */
export function validateBaseModule(module: unknown): module is BaseModule {
  if (!module || typeof module !== 'object') {
    return false;
  }

  const mod = module as Partial<BaseModule>;

  return (
    typeof mod.id === 'string' &&
    typeof mod.name === 'string' &&
    isModuleType(mod.type) &&
    validatePosition(mod.position) &&
    typeof mod.isActive === 'boolean' &&
    typeof mod.level === 'number' &&
    typeof mod.status === 'string'
  );
}

/**
 * Validates a Position object
 */
export function validatePosition(position: unknown): position is Position {
  if (!position || typeof position !== 'object') {
    return false;
  }

  const pos = position as Partial<Position>;

  return typeof pos.x === 'number' && typeof pos.y === 'number';
}

/**
 * Validates ModuleRequirements object
 */
export function validateModuleRequirements(
  requirements: unknown
): requirements is ModuleRequirements {
  if (!requirements || typeof requirements !== 'object') {
    return false;
  }

  const req = requirements as Partial<ModuleRequirements>;

  // Check required properties
  if (
    typeof req.minLevel !== 'number' ||
    !Array.isArray(req.buildingType) ||
    !Array.isArray(req.resourceCosts)
  ) {
    return false;
  }

  // Check buildingType array
  for (const type of req.buildingType) {
    if (!isBuildingType(type)) {
      return false;
    }
  }

  // Check resourceCosts array
  for (const resource of req.resourceCosts) {
    if (
      typeof resource !== 'object' ||
      resource === null ||
      typeof resource.type !== 'string' ||
      typeof resource.amount !== 'number'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Validates ModuleConfig object
 */
export function validateModuleConfig(config: unknown): config is ModuleConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const cfg = config as Partial<ModuleConfig>;

  return (
    isModuleType(cfg.type) &&
    typeof cfg.name === 'string' &&
    typeof cfg.description === 'string' &&
    validateModuleRequirements(cfg.requirements) &&
    typeof cfg.baseStats === 'object' &&
    cfg.baseStats !== null &&
    typeof cfg.baseStats.power === 'number' &&
    typeof cfg.baseStats.crew === 'number' &&
    typeof cfg.baseStats.upkeep === 'number'
  );
}

/**
 * Validates ModuleAttachmentPoint object
 */
export function validateModuleAttachmentPoint(point: unknown): point is ModuleAttachmentPoint {
  if (!point || typeof point !== 'object') {
    return false;
  }

  const pt = point as Partial<ModuleAttachmentPoint>;

  // Check required properties
  if (
    typeof pt.id !== 'string' ||
    !validatePosition(pt.position) ||
    !Array.isArray(pt.allowedTypes)
  ) {
    return false;
  }

  // Check allowedTypes array
  for (const type of pt.allowedTypes) {
    if (!isModuleType(type)) {
      return false;
    }
  }

  // Check currentModule if it exists
  if (pt.currentModule !== undefined && !validateBaseModule(pt.currentModule)) {
    return false;
  }

  return true;
}

/**
 * Validates a ModularBuilding object
 */
export function validateModularBuilding(building: unknown): building is ModularBuilding {
  if (typeof building !== 'object' || building === null) {
    return false;
  }

  // Use type assertion to access properties
  const b = building as Partial<ModularBuilding>;

  if (typeof b.id !== 'string' || b.id.trim() === '') {
    return false;
  }

  if (!isBuildingType(b.type)) {
    return false;
  }

  if (typeof b.level !== 'number' || b.level < 1) {
    return false;
  }

  if (!Array.isArray(b.modules)) {
    return false;
  }

  if (typeof b.status !== 'string' || !['active', 'inactive', 'constructing'].includes(b.status)) {
    return false;
  }

  if (!Array.isArray(b.attachmentPoints)) {
    return false;
  }

  // Validate each module
  for (const module of b.modules ?? []) {
    if (!validateBaseModule(module)) {
      return false;
    }
  }

  // Validate each attachment point
  for (const point of b.attachmentPoints ?? []) {
    if (!validateModuleAttachmentPoint(point)) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if a module can be attached to a specific attachment point
 */
export function canAttachModule(
  module: BaseModule,
  attachmentPoint: ModuleAttachmentPoint
): boolean {
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
      reason: `Building level ${building.level} is below required level ${config.requirements.minLevel}`,
    };
  }

  // Check building type compatibility
  if (!config.requirements.buildingType.includes(building.type)) {
    return {
      canUpgrade: false,
      reason: `Module is not compatible with building type ${building.type}`,
    };
  }

  // Check resource costs
  for (const cost of config.requirements.resourceCosts) {
    const available = availableResources[cost.type] ?? 0;
    if (available < cost.amount) {
      return {
        canUpgrade: false,
        reason: `Insufficient ${cost.type}: ${available}/${cost.amount}`,
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
    amount: Math.ceil(cost.amount * levelMultiplier),
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
      reason: `Module is not compatible with building type ${buildingType}`,
    };
  }

  // Check building level requirement
  if (buildingLevel < config.requirements.minLevel) {
    return {
      compatible: false,
      reason: `Building level ${buildingLevel} is below required level ${config.requirements.minLevel}`,
    };
  }

  return { compatible: true };
}

/**
 * Type guard for SubModuleType
 */
export function isSubModuleType(value: unknown): value is SubModuleType {
  const validTypes: SubModuleType[] = [
    'enhancer',
    'converter',
    'processor',
    'storage',
    'efficiency',
    'automation',
    'specialized',
    'utility',
  ];
  return typeof value === 'string' && validTypes.includes(value as SubModuleType);
}

/**
 * Type guard for SubModuleEffectType
 */
export function isSubModuleEffectType(value: unknown): value is SubModuleEffectType {
  const validTypes: SubModuleEffectType[] = [
    'stat_boost',
    'resource_boost',
    'unlock_ability',
    'reduce_cost',
    'automation',
    'special',
  ];
  return typeof value === 'string' && validTypes.includes(value as SubModuleEffectType);
}

/**
 * Validates a SubModuleEffect object
 */
export function validateSubModuleEffect(effect: unknown): effect is SubModuleEffect {
  if (typeof effect !== 'object' || effect === null) {
    return false;
  }

  // Use type assertion to access properties
  const e = effect as Partial<SubModuleEffect & { duration?: number }>;

  if (!isSubModuleEffectType(e.type)) {
    return false;
  }

  if (typeof e.value !== 'number') {
    return false;
  }

  if (typeof e.duration !== 'number' && e.duration !== undefined) {
    return false;
  }

  return true;
}

/**
 * Validates a SubModuleRequirements object
 */
export function validateSubModuleRequirements(
  requirements: unknown
): requirements is SubModuleRequirements {
  if (typeof requirements !== 'object' || requirements === null) {
    return false;
  }

  // Use type assertion to access properties
  const r = requirements as Partial<
    SubModuleRequirements & {
      moduleLevel?: number;
      moduleTypes?: ModuleType[];
      resources?: Record<string, unknown>;
    }
  >;

  if (r.moduleLevel !== undefined && typeof r.moduleLevel !== 'number') {
    return false;
  }

  if (r.moduleTypes !== undefined && !Array.isArray(r.moduleTypes)) {
    return false;
  }

  if (r.moduleTypes) {
    for (const type of r.moduleTypes) {
      if (!isModuleType(type)) {
        return false;
      }
    }
  }

  if (r.resources !== undefined && typeof r.resources !== 'object') {
    return false;
  }

  return true;
}

/**
 * Validates a SubModule object
 */
export function validateSubModule(subModule: unknown): subModule is SubModule {
  if (typeof subModule !== 'object' || subModule === null) {
    return false;
  }

  // Use type assertion to access properties
  const sm = subModule as Partial<SubModule>;

  if (typeof sm.id !== 'string' || sm.id.trim() === '') {
    return false;
  }

  if (!isSubModuleType(sm.type)) {
    return false;
  }

  if (typeof sm.level !== 'number' || sm.level < 1) {
    return false;
  }

  if (sm.effects !== undefined && !Array.isArray(sm.effects)) {
    return false;
  }

  if (sm.effects) {
    for (const effect of sm.effects) {
      if (!validateSubModuleEffect(effect)) {
        return false;
      }
    }
  }

  if (sm.requirements !== undefined && !validateSubModuleRequirements(sm.requirements)) {
    return false;
  }

  if (
    typeof sm.status !== 'string' ||
    !['active', 'inactive', 'constructing'].includes(sm.status)
  ) {
    return false;
  }

  return true;
}

/**
 * Validates a SubModuleConfig object
 */
export function validateSubModuleConfig(config: unknown): config is SubModuleConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  // Use type assertion to access properties
  const c = config as Partial<
    SubModuleConfig & {
      attachmentPoints?: SubModuleAttachmentPoint[];
    }
  >;

  if (!isSubModuleType(c.type)) {
    return false;
  }

  if (typeof c.name !== 'string' || c.name.trim() === '') {
    return false;
  }

  if (typeof c.description !== 'string') {
    return false;
  }

  if (c.effects !== undefined && !Array.isArray(c.effects)) {
    return false;
  }

  if (c.effects) {
    for (const effect of c.effects) {
      if (!validateSubModuleEffect(effect)) {
        return false;
      }
    }
  }

  if (c.requirements !== undefined && !validateSubModuleRequirements(c.requirements)) {
    return false;
  }

  if (c.attachmentPoints !== undefined && !Array.isArray(c.attachmentPoints)) {
    return false;
  }

  if (c.attachmentPoints) {
    for (const point of c.attachmentPoints) {
      if (!validateSubModuleAttachmentPoint(point)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates a SubModuleAttachmentPoint object
 */
export function validateSubModuleAttachmentPoint(
  point: unknown
): point is SubModuleAttachmentPoint {
  if (typeof point !== 'object' || point === null) {
    return false;
  }

  // Use type assertion to access properties
  const p = point as Partial<
    SubModuleAttachmentPoint & {
      position?: Position;
      occupied?: boolean;
      attachedModuleId?: string;
    }
  >;

  if (typeof p.id !== 'string' || p.id.trim() === '') {
    return false;
  }

  if (!Array.isArray(p.allowedTypes)) {
    return false;
  }

  for (const type of p.allowedTypes ?? []) {
    if (!isSubModuleType(type)) {
      return false;
    }
  }

  if (typeof p.position !== 'object' || p.position === null) {
    return false;
  }

  const pos = p.position as Partial<Position>;

  if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
    return false;
  }

  if (p.occupied !== undefined && typeof p.occupied !== 'boolean') {
    return false;
  }

  if (p.attachedModuleId !== undefined && typeof p.attachedModuleId !== 'string') {
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
  const currentSubModules = parentModule.subModules ?? [];
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
      reason: `Parent module level ${parentModule.level} is below required level ${config.requirements.parentModuleLevel}`,
    };
  }

  // Check resource costs (scaled by level)
  const levelMultiplier = Math.pow(1.5, subModule.level);
  for (const cost of config.requirements.resourceCosts) {
    const scaledAmount = Math.ceil(cost.amount * levelMultiplier);
    const available = availableResources[cost.type] ?? 0;
    if (available < scaledAmount) {
      return {
        canUpgrade: false,
        reason: `Insufficient ${cost.type}: ${available}/${scaledAmount}`,
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
    amount: Math.ceil(cost.amount * levelMultiplier),
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
export function calculateSubModuleComplexity(
  subModule: SubModule,
  config: SubModuleConfig
): number {
  // Base complexity from config
  const baseComplexity = config.baseStats.complexity;

  // Scale by level (15% increase per level)
  const levelMultiplier = 1 + (subModule.level - 1) * 0.15;

  return Math.ceil(baseComplexity * levelMultiplier);
}
