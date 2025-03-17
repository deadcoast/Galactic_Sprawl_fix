import { ResourceType } from "./../../types/resources/ResourceTypes";
import { ModuleEventType } from '../../lib/modules/ModuleEvents';
import {
  AutomationRule,
  EmitEventValue,
  EventConditionValue,
} from '../../managers/game/AutomationManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';

/**
 * Automation rules for colony management
 */
export const colonyRules: AutomationRule[] = [
  // Population Growth Management
  {
    id: 'population-growth',
    moduleId: 'colony',
    name: 'Population Growth Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'colony',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: ResourceType.FOOD,
        value: 500,
      },
      {
        type: 'RESOURCE_ABOVE',
        target: ResourceType.ENERGY,
        value: 300,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'INCREASE_POPULATION',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          eventType: 'INCREASE_POPULATION' as ModuleEventType,
          data: {
            type: 'growth',
            priority: 1,
          },
        } as EmitEventValue,
      },
    ],
    interval: 60000, // Check every minute
  },

  // Food Production
  {
    id: 'food-production',
    moduleId: 'colony',
    name: 'Food Production Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'colony',
      },
      {
        type: 'RESOURCE_BELOW',
        target: ResourceType.FOOD,
        value: 1000,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'INCREASE_FOOD_PRODUCTION',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          eventType: 'INCREASE_FOOD_PRODUCTION' as ModuleEventType,
          data: {
            type: 'production',
            priority: 2,
          },
        } as EmitEventValue,
      },
    ],
    interval: 30000, // Check every 30 seconds
  },

  // Infrastructure Development
  {
    id: 'infrastructure-development',
    moduleId: 'colony',
    name: 'Infrastructure Development',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'colony',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: ResourceType.MINERALS,
        value: 1000,
      },
      {
        type: 'RESOURCE_ABOVE',
        target: ResourceType.ENERGY,
        value: 800,
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'INFRASTRUCTURE_NEEDED',
        value: {
          eventType: 'INFRASTRUCTURE_NEEDED',
          eventData: {
            timeElapsed: 300000, // Last 5 minutes
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'BUILD_INFRASTRUCTURE',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          eventType: 'BUILD_INFRASTRUCTURE' as ModuleEventType,
          data: {
            type: 'construction',
            priority: 3,
          },
        } as EmitEventValue,
      },
    ],
    interval: 60000, // Check every minute
  },

  // Trade Route Management
  {
    id: 'trade-route-management',
    moduleId: 'colony',
    name: 'Trade Route Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'colony',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'TRADE_OPPORTUNITY',
        value: {
          eventType: 'TRADE_OPPORTUNITY',
          eventData: {
            timeElapsed: 60000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'ESTABLISH_TRADE_ROUTE',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          eventType: 'ESTABLISH_TRADE_ROUTE' as ModuleEventType,
          data: {
            type: 'trade',
            priority: 2,
          },
        } as EmitEventValue,
      },
    ],
    interval: 60000, // Check every minute
  },

  // Colony Defense
  {
    id: 'colony-defense',
    moduleId: 'colony',
    name: 'Colony Defense Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'colony',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'THREAT_DETECTED',
        value: {
          eventType: 'THREAT_DETECTED',
          eventData: {
            timeElapsed: 10000, // Last 10 seconds
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'ACTIVATE_DEFENSE_SYSTEMS',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          eventType: 'ACTIVATE_DEFENSE_SYSTEMS' as ModuleEventType,
          data: {
            type: 'defense',
            priority: 5, // Highest priority
          },
        } as EmitEventValue,
      },
    ],
    interval: 10000, // Check every 10 seconds
  },

  // Resource Distribution
  {
    id: 'resource-distribution',
    moduleId: 'colony',
    name: 'Resource Distribution',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'colony',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'RESOURCE_IMBALANCE',
        value: {
          eventType: 'RESOURCE_IMBALANCE',
          eventData: {
            timeElapsed: 30000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'OPTIMIZE_RESOURCE_DISTRIBUTION',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          eventType: 'OPTIMIZE_RESOURCE_DISTRIBUTION' as ModuleEventType,
          data: {
            type: 'distribution',
            priority: 2,
          },
        } as EmitEventValue,
      },
    ],
    interval: 30000, // Check every 30 seconds
  },

  // Research & Development
  {
    id: 'research-development',
    moduleId: 'colony',
    name: 'Research & Development',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'colony',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'knowledge',
        value: 500,
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'RESEARCH_OPPORTUNITY',
        value: {
          eventType: 'RESEARCH_OPPORTUNITY',
          eventData: {
            timeElapsed: 300000, // Last 5 minutes
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'INITIATE_RESEARCH',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          eventType: 'INITIATE_RESEARCH' as ModuleEventType,
          data: {
            type: ResourceType.RESEARCH,
            priority: 3,
          },
        } as EmitEventValue,
      },
    ],
    interval: 300000, // Check every 5 minutes
  },

  // Energy Management
  {
    id: 'energy-management',
    moduleId: 'colony',
    name: 'Energy Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'colony',
      },
      {
        type: 'RESOURCE_BELOW',
        target: ResourceType.ENERGY,
        value: 500,
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'ENERGY_SHORTAGE',
        value: {
          eventType: 'ENERGY_SHORTAGE',
          eventData: {
            timeElapsed: 60000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'INCREASE_ENERGY_PRODUCTION',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          eventType: 'INCREASE_ENERGY_PRODUCTION' as ModuleEventType,
          data: {
            type: 'production',
            priority: 4,
          },
        } as EmitEventValue,
      },
    ],
    interval: 60000, // Check every minute
  },

  // Population Happiness
  {
    id: 'population-happiness',
    moduleId: 'colony',
    name: 'Population Happiness Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'colony',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'HAPPINESS_DECLINE',
        value: {
          eventType: 'HAPPINESS_DECLINE',
          eventData: {
            timeElapsed: 5000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'IMPROVE_LIVING_CONDITIONS',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          eventType: 'IMPROVE_LIVING_CONDITIONS' as ModuleEventType,
          data: {
            type: 'social',
            priority: 3,
          },
        } as EmitEventValue,
      },
    ],
    interval: 60000, // Check every minute
  },

  // Emergency Protocols
  {
    id: 'emergency-protocols',
    moduleId: 'colony',
    name: 'Emergency Colony Protocols',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'colony',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'EMERGENCY_SITUATION',
        value: {
          eventType: 'EMERGENCY_SITUATION',
          eventData: {
            timeElapsed: 5000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'ACTIVATE_EMERGENCY_PROTOCOLS',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          eventType: 'ACTIVATE_EMERGENCY_PROTOCOLS' as ModuleEventType,
          data: {
            type: 'emergency',
            priority: 5, // Highest priority
          },
        } as EmitEventValue,
      },
    ],
    interval: 5000, // Check frequently
  },
];
