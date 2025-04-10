import { initializeModuleUpgradePaths } from '../config/modules/upgradePathsConfig';
import { moduleEventBus, ModuleEventType } from '../lib/modules/ModuleEvents';
import { getResourceManager } from '../managers/ManagerRegistry';
import { moduleManager } from '../managers/module/ModuleManager';
import { moduleStatusManager } from '../managers/module/ModuleStatusManager';
import { moduleUpgradeManager } from '../managers/module/ModuleUpgradeManager';
import { subModuleManager } from '../managers/module/SubModuleManager';
import { ModuleType, SubModuleEffect, SubModuleType } from '../types/buildings/ModuleTypes';
import { ResourceType } from './../types/resources/ResourceTypes';

// Mock data for demonstration
// const resourceManager = new ResourceManager();
const resourceManager = getResourceManager(); // Use registry accessor

// Define interfaces for event data types
interface ResourceThresholdEventData {
  thresholdType: 'min' | 'max';
  resourceType: ResourceType;
}

// Type guard for ResourceThresholdEventData
function isResourceThresholdEventData(data: unknown): data is ResourceThresholdEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const thresholdData = data as Record<string, unknown>;

  return (
    (thresholdData.thresholdType === 'min' || thresholdData.thresholdType === 'max') &&
    typeof thresholdData.resourceType === 'string'
  );
}

/**
 * Initialize the module framework
 */
export function initializeModuleFramework(): void {
  console.warn('[Initialization] Setting up module framework...');

  // Register event handlers for resource integration
  registerResourceIntegration();

  // Initialize module upgrade system
  initializeModuleUpgradePaths(moduleUpgradeManager);

  // Initialize module status tracking
  initializeStatusTracking();

  // Initialize sub-module system
  initializeSubModuleSystem();

  console.warn('[Initialization] Module framework initialized successfully.');
}

/**
 * Register event handlers for resource integration
 */
function registerResourceIntegration(): void {
  // Handle module activation/deactivation for resource consumption
  moduleEventBus.subscribe('MODULE_ACTIVATED' as ModuleEventType, event => {
    const module = moduleManager.getModule(event?.moduleId);
    if (!module) {
      return;
    }

    // Get module config
    const configs = getModuleConfigs();
    const config = configs[module.type];
    if (!config || !config.resourceConsumption) {
      return;
    }

    // Register resource consumption
    for (const [resourceType, amount] of Object.entries(config.resourceConsumption)) {
      resourceManager.registerConsumption(`module-${module.id}`, {
        type: resourceType as ResourceType,
        amount: amount as number,
        interval: 60000, // 1 minute
        required: false,
      });
    }
  });

  moduleEventBus.subscribe('MODULE_DEACTIVATED' as ModuleEventType, event => {
    // Remove resource consumption
    resourceManager.unregisterConsumption(`module-${event?.moduleId}`);
  });

  // Handle module upgrades for resource production boosts
  moduleEventBus.subscribe('MODULE_UPGRADED' as ModuleEventType, event => {
    const module = moduleManager.getModule(event?.moduleId);
    if (!module) {
      return;
    }

    // Get module config
    const configs = getModuleConfigs();
    const config = configs[module.type];
    if (!config || !config.resourceProduction) {
      return;
    }

    // Update resource production based on level
    for (const [resourceType, baseAmount] of Object.entries(config.resourceProduction)) {
      const levelMultiplier = 1 + (module.level - 1) * 0.25; // 25% increase per level
      const amount = (baseAmount as number) * levelMultiplier;

      resourceManager.registerProduction(`module-${module.id}`, {
        type: resourceType as ResourceType,
        amount: amount,
        rate: amount,
        maxRate: amount,
        interval: 60000, // 1 minute
      });
    }
  });
}

/**
 * Initialize module status tracking
 */
function initializeStatusTracking(): void {
  // Set up periodic status updates
  setInterval(() => {
    // Get all modules
    const modules = Array.from(moduleManager.getActiveModules());

    // Update metrics for each module
    for (const module of modules) {
      // Use updateModuleStatus instead of updateMetrics
      moduleStatusManager.updateModuleStatus(module.id, module.status, 'Periodic update');
    }
  }, 60000); // Update every minute

  // Handle resource threshold events for module status
  moduleEventBus.subscribe('RESOURCE_THRESHOLD_TRIGGERED' as ModuleEventType, event => {
    if (!event.data || !isResourceThresholdEventData(event.data)) {
      console.warn('Invalid resource threshold event data:', event.data);
      return;
    }

    const { thresholdType, resourceType } = event.data;

    if (thresholdType !== 'min') {
      return;
    }

    // Get modules that consume this resource
    const modules = Array.from(moduleManager.getActiveModules());
    const affectedModules = modules.filter(module => {
      const configs = getModuleConfigs();
      const config = configs[module.type];
      return (
        config &&
        config.resourceConsumption &&
        config.resourceConsumption[resourceType as keyof typeof config.resourceConsumption]
      );
    });

    // Update status for affected modules
    for (const module of affectedModules) {
      moduleStatusManager.updateModuleStatus(module.id, 'degraded', `Low ${resourceType} supply`);
    }
  });

  // Handle resource threshold resolution
  moduleEventBus.subscribe('RESOURCE_THRESHOLD_RESOLVED' as ModuleEventType, event => {
    if (!event.data || !isResourceThresholdEventData(event.data)) {
      console.warn('Invalid resource threshold event data:', event.data);
      return;
    }

    const { thresholdType, resourceType } = event.data;

    if (thresholdType !== 'min') {
      return;
    }

    // Get modules that consume this resource
    const modules = Array.from(moduleManager.getActiveModules());
    const affectedModules = modules.filter(module => {
      const configs = getModuleConfigs();
      const config = configs[module.type];
      return (
        config &&
        config.resourceConsumption &&
        config.resourceConsumption[resourceType as keyof typeof config.resourceConsumption]
      );
    });

    // Update status for affected modules
    for (const module of affectedModules) {
      moduleStatusManager.updateModuleStatus(
        module.id,
        'active',
        `${resourceType} supply restored`
      );
    }
  });
}

/**
 * Initialize sub-module system
 */
function initializeSubModuleSystem(): void {
  // Register sub-module configurations
  const subModuleConfigs = getSubModuleConfigs();

  if (subModuleConfigs) {
    for (const [type, config] of Object.entries(subModuleConfigs)) {
      subModuleManager.registerSubModuleConfig({
        type: type as SubModuleType,
        name: config.name,
        description: config.description,
        requirements: {
          parentModuleLevel: 1,
          parentModuleTypes: config.allowedParentTypes ?? [],
          resourceCosts: config.resourceCost
            ? Object.entries(config.resourceCost).map(([type, amount]) => ({
                type: type as ResourceType,
                amount: amount as number,
              }))
            : [],
        },
        effects: config.effects,
        baseStats: {
          power: 10,
          space: 5,
          complexity: 3,
        },
      });
    }
  }
}

/**
 * Get module configurations
 * This would typically come from a configuration file
 */
interface ModuleConfig {
  resourceConsumption?: Record<string, number>;
  resourceProduction?: Record<string, number>;
  upgradeRequirements?: {
    level: number;
    resources: Record<string, number>;
  };
  stats?: Record<string, number>;
}

function getModuleConfigs(): Record<string, ModuleConfig> {
  return {
    radar: {
      resourceConsumption: {
        energy: 5,
      },
    },
    mineral: {
      resourceConsumption: {
        energy: 10,
      },
      resourceProduction: {
        minerals: 20,
      },
    },
    hangar: {
      resourceConsumption: {
        energy: 15,
        minerals: 2,
      },
    },
    academy: {
      resourceConsumption: {
        energy: 8,
        food: 5,
      },
    },
    exploration: {
      resourceConsumption: {
        energy: 12,
      },
    },
    trading: {
      resourceConsumption: {
        energy: 7,
      },
      resourceProduction: {
        credits: 15,
      },
    },
    population: {
      resourceConsumption: {
        energy: 10,
        food: 15,
      },
    },
    infrastructure: {
      resourceConsumption: {
        energy: 20,
      },
    },
    research: {
      resourceConsumption: {
        energy: 25,
      },
    },
    food: {
      resourceConsumption: {
        energy: 8,
        water: 10,
      },
      resourceProduction: {
        food: 25,
      },
    },
    defense: {
      resourceConsumption: {
        energy: 30,
      },
    },
  };
}

/**
 * Get sub-module configurations
 * This would typically come from a configuration file
 */
interface SubModuleConfig {
  name: string;
  description: string;
  resourceCost?: Record<string, number>;
  allowedParentTypes?: ModuleType[];
  effects: SubModuleEffect[];
  baseStats?: {
    power: number;
    space: number;
    complexity: number;
  };
  maxPerModule?: number;
}

function getSubModuleConfigs(): Record<string, SubModuleConfig> {
  return {
    efficiency: {
      name: 'Efficiency Module',
      description: 'Improves resource efficiency',
      resourceCost: {
        energy: 50,
        minerals: 30,
      },
      effects: [
        {
          type: 'stat_boost',
          target: 'efficiency',
          value: 10,
          isPercentage: true,
          description: 'Increases efficiency by 10%',
        },
      ],
      maxPerModule: 2,
    },
    converter: {
      name: 'Resource Converter',
      description: 'Converts resources',
      resourceCost: {
        energy: 75,
        minerals: 50,
      },
      effects: [
        {
          type: 'resource_boost',
          target: 'conversion',
          value: 5,
          isPercentage: true,
          description: 'Enables resource conversion',
        },
      ],
    },
    processor: {
      name: 'Resource Processor',
      description: 'Processes resources more efficiently',
      resourceCost: {
        energy: 60,
        minerals: 40,
      },
      effects: [
        {
          type: 'stat_boost',
          target: 'processing',
          value: 15,
          isPercentage: true,
          description: 'Increases processing efficiency',
        },
      ],
    },
    storage: {
      name: 'Storage Module',
      description: 'Provides additional storage',
      resourceCost: {
        energy: 40,
        minerals: 60,
      },
      effects: [
        {
          type: 'stat_boost',
          target: 'storage',
          value: 20,
          isPercentage: true,
          description: 'Increases storage capacity',
        },
      ],
    },
    automation: {
      name: 'Automation Module',
      description: 'Adds automation capabilities',
      resourceCost: {
        energy: 100,
        minerals: 80,
      },
      effects: [
        {
          type: 'unlock_ability',
          target: 'automation',
          value: 1,
          isPercentage: false,
          description: 'Enables automation',
        },
      ],
    },
  };
}
