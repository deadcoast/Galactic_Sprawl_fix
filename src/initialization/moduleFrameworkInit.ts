import { moduleManager } from '../managers/module/ModuleManager';
import { moduleAttachmentManager } from '../managers/module/ModuleAttachmentManager';
import { moduleStatusManager } from '../managers/module/ModuleStatusManager';
import { moduleUpgradeManager } from '../managers/module/ModuleUpgradeManager';
import { subModuleManager } from '../managers/module/SubModuleManager';
import { initializeModuleUpgradePaths } from '../config/modules/upgradePathsConfig';
import { moduleEventBus, ModuleEventType } from '../lib/modules/ModuleEvents';
import { resourceManager } from '../managers/game/ResourceManager';

/**
 * Initialize the module framework
 */
export function initializeModuleFramework(): void {
  console.log('[Initialization] Setting up module framework...');
  
  // Register event handlers for resource integration
  registerResourceIntegration();
  
  // Initialize module upgrade system
  initializeModuleUpgradePaths(moduleUpgradeManager);
  
  // Initialize module status tracking
  initializeStatusTracking();
  
  // Initialize sub-module system
  initializeSubModuleSystem();
  
  console.log('[Initialization] Module framework initialized successfully.');
}

/**
 * Register event handlers for resource integration
 */
function registerResourceIntegration(): void {
  // Handle module activation/deactivation for resource consumption
  moduleEventBus.subscribe('MODULE_ACTIVATED' as ModuleEventType, (event) => {
    const module = moduleManager.getModule(event.moduleId);
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
      resourceManager.registerConsumption({
        id: `module-${module.id}`,
        type: resourceType as any,
        amount: amount as number,
        priority: 'medium',
        description: `${module.name} operation`
      });
    }
  });
  
  moduleEventBus.subscribe('MODULE_DEACTIVATED' as ModuleEventType, (event) => {
    // Remove resource consumption
    resourceManager.unregisterConsumption(`module-${event.moduleId}`);
  });
  
  // Handle module upgrades for resource production boosts
  moduleEventBus.subscribe('MODULE_UPGRADED' as ModuleEventType, (event) => {
    const module = moduleManager.getModule(event.moduleId);
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
      
      resourceManager.registerProduction({
        id: `module-${module.id}`,
        type: resourceType as any,
        amount: amount,
        priority: 'medium',
        description: `${module.name} production`
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
      moduleStatusManager.updateModuleStatus(
        module.id,
        module.status,
        'Periodic update'
      );
    }
  }, 60000); // Update every minute
  
  // Handle resource threshold events for module status
  moduleEventBus.subscribe('RESOURCE_THRESHOLD_TRIGGERED' as ModuleEventType, (event) => {
    if (event.data.thresholdType !== 'min') {
      return;
    }
    
    // Get modules that consume this resource
    const modules = Array.from(moduleManager.getActiveModules());
    const affectedModules = modules.filter(module => {
      const configs = getModuleConfigs();
      const config = configs[module.type];
      return config && 
        config.resourceConsumption && 
        config.resourceConsumption[event.data.resourceType];
    });
    
    // Update status for affected modules
    for (const module of affectedModules) {
      moduleStatusManager.updateModuleStatus(
        module.id,
        'degraded',
        `Low ${event.data.resourceType} supply`
      );
    }
  });
  
  // Handle resource threshold resolution
  moduleEventBus.subscribe('RESOURCE_THRESHOLD_RESOLVED' as ModuleEventType, (event) => {
    if (event.data.thresholdType !== 'min') {
      return;
    }
    
    // Get modules that consume this resource
    const modules = Array.from(moduleManager.getActiveModules());
    const affectedModules = modules.filter(module => {
      const configs = getModuleConfigs();
      const config = configs[module.type];
      return config && 
        config.resourceConsumption && 
        config.resourceConsumption[event.data.resourceType];
    });
    
    // Update status for affected modules
    for (const module of affectedModules) {
      moduleStatusManager.updateModuleStatus(
        module.id,
        'active',
        `${event.data.resourceType} supply restored`
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
  
  for (const [type, config] of Object.entries(subModuleConfigs)) {
    subModuleManager.registerSubModuleConfig({
      type: type as any,
      name: config.name,
      description: config.description,
      resourceCosts: config.resourceCost, // Changed from resourceCost to resourceCosts
      effects: config.effects,
      allowedParentTypes: config.allowedParentTypes,
      maxPerModule: config.maxPerModule || 3
    });
  }
}

/**
 * Get module configurations
 * This would typically come from a configuration file
 */
function getModuleConfigs(): Record<string, any> {
  return {
    'radar': {
      resourceConsumption: {
        'energy': 5
      }
    },
    'mineral': {
      resourceConsumption: {
        'energy': 10
      },
      resourceProduction: {
        'minerals': 20
      }
    },
    'hangar': {
      resourceConsumption: {
        'energy': 15,
        'minerals': 2
      }
    },
    'academy': {
      resourceConsumption: {
        'energy': 8,
        'food': 5
      }
    },
    'exploration': {
      resourceConsumption: {
        'energy': 12
      }
    },
    'trading': {
      resourceConsumption: {
        'energy': 7
      },
      resourceProduction: {
        'credits': 15
      }
    },
    'population': {
      resourceConsumption: {
        'energy': 10,
        'food': 15
      }
    },
    'infrastructure': {
      resourceConsumption: {
        'energy': 20
      }
    },
    'research': {
      resourceConsumption: {
        'energy': 25
      }
    },
    'food': {
      resourceConsumption: {
        'energy': 8,
        'water': 10
      },
      resourceProduction: {
        'food': 25
      }
    },
    'defense': {
      resourceConsumption: {
        'energy': 30
      }
    }
  };
}

/**
 * Get sub-module configurations
 * This would typically come from a configuration file
 */
function getSubModuleConfigs(): Record<string, any> {
  return {
    'efficiency': {
      name: 'Efficiency Module',
      description: 'Improves resource efficiency',
      resourceCost: {
        'energy': 50,
        'minerals': 30
      },
      effects: [
        {
          type: 'stat',
          target: 'efficiency',
          value: 15,
          isPercentage: true,
          description: 'Increases efficiency'
        }
      ],
      allowedParentTypes: ['mineral', 'hangar', 'food', 'trading'],
      maxPerModule: 2
    },
    'booster': {
      name: 'Booster Module',
      description: 'Boosts production output',
      resourceCost: {
        'energy': 75,
        'minerals': 50
      },
      effects: [
        {
          type: 'resource',
          target: 'output',
          value: 25,
          isPercentage: true,
          description: 'Increases production output'
        }
      ],
      allowedParentTypes: ['mineral', 'food', 'trading'],
      maxPerModule: 1
    },
    'range': {
      name: 'Range Extender',
      description: 'Extends operational range',
      resourceCost: {
        'energy': 60,
        'minerals': 40
      },
      effects: [
        {
          type: 'stat',
          target: 'range',
          value: 30,
          isPercentage: true,
          description: 'Increases operational range'
        }
      ],
      allowedParentTypes: ['radar', 'exploration'],
      maxPerModule: 2
    },
    'capacity': {
      name: 'Capacity Expander',
      description: 'Expands storage capacity',
      resourceCost: {
        'energy': 40,
        'minerals': 80
      },
      effects: [
        {
          type: 'stat',
          target: 'capacity',
          value: 50,
          isPercentage: true,
          description: 'Increases storage capacity'
        }
      ],
      allowedParentTypes: ['hangar', 'population', 'infrastructure'],
      maxPerModule: 3
    },
    'automation': {
      name: 'Automation System',
      description: 'Automates routine operations',
      resourceCost: {
        'energy': 100,
        'minerals': 60
      },
      effects: [
        {
          type: 'ability',
          target: 'automation',
          value: 1,
          isPercentage: false,
          description: 'Enables automation'
        }
      ],
      allowedParentTypes: ['mineral', 'hangar', 'food', 'trading', 'infrastructure'],
      maxPerModule: 1
    }
  };
} 