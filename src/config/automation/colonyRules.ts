import { ModuleEventType } from '../../lib/modules/ModuleEvents';
import {
  AutomationRule,
  EmitEventValue,
  EventConditionValue,
} from '../../managers/game/AutomationManager';
import { ResourceType } from './../../types/resources/ResourceTypes';

// Define specific event types used in rules for clarity - Placeholder strings
// TODO: Define these properly in ModuleEventType enum
const INCREASE_POPULATION_EVENT: ModuleEventType = 'INCREASE_POPULATION' as ModuleEventType;
const INCREASE_FOOD_PRODUCTION_EVENT: ModuleEventType =
  'INCREASE_FOOD_PRODUCTION' as ModuleEventType;
const INFRASTRUCTURE_NEEDED_EVENT: ModuleEventType = 'INFRASTRUCTURE_NEEDED' as ModuleEventType;
const BUILD_INFRASTRUCTURE_EVENT: ModuleEventType = 'BUILD_INFRASTRUCTURE' as ModuleEventType;
const TRADE_OPPORTUNITY_EVENT: ModuleEventType = 'TRADE_OPPORTUNITY' as ModuleEventType;
const ESTABLISH_TRADE_ROUTE_EVENT: ModuleEventType = 'ESTABLISH_TRADE_ROUTE' as ModuleEventType;
const THREAT_DETECTED_EVENT: ModuleEventType = 'THREAT_DETECTED' as ModuleEventType;
const ACTIVATE_DEFENSE_SYSTEMS_EVENT: ModuleEventType =
  'ACTIVATE_DEFENSE_SYSTEMS' as ModuleEventType;
const RESOURCE_IMBALANCE_EVENT: ModuleEventType = 'RESOURCE_IMBALANCE' as ModuleEventType;
const OPTIMIZE_RESOURCE_DISTRIBUTION_EVENT: ModuleEventType =
  'OPTIMIZE_RESOURCE_DISTRIBUTION' as ModuleEventType;
const RESEARCH_OPPORTUNITY_EVENT: ModuleEventType = 'RESEARCH_OPPORTUNITY' as ModuleEventType;
const INITIATE_RESEARCH_EVENT: ModuleEventType = 'INITIATE_RESEARCH' as ModuleEventType;
const ENERGY_SHORTAGE_EVENT: ModuleEventType = 'ENERGY_SHORTAGE' as ModuleEventType;
const INCREASE_ENERGY_PRODUCTION_EVENT: ModuleEventType =
  'INCREASE_ENERGY_PRODUCTION' as ModuleEventType;
const HAPPINESS_DECLINE_EVENT: ModuleEventType = 'HAPPINESS_DECLINE' as ModuleEventType;
const IMPROVE_LIVING_CONDITIONS_EVENT: ModuleEventType =
  'IMPROVE_LIVING_CONDITIONS' as ModuleEventType;
const EMERGENCY_SITUATION_EVENT: ModuleEventType = 'EMERGENCY_SITUATION' as ModuleEventType;
const ACTIVATE_EMERGENCY_PROTOCOLS_EVENT: ModuleEventType =
  'ACTIVATE_EMERGENCY_PROTOCOLS' as ModuleEventType;

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
        target: INCREASE_POPULATION_EVENT,
        value: {
          moduleId: 'colony',
          moduleType: 'infrastructure', // Use string literal from ModuleType alias
          eventType: INCREASE_POPULATION_EVENT,
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
        target: INCREASE_FOOD_PRODUCTION_EVENT,
        value: {
          moduleId: 'colony',
          moduleType: 'infrastructure', // Use string literal from ModuleType alias
          eventType: INCREASE_FOOD_PRODUCTION_EVENT,
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
        target: INFRASTRUCTURE_NEEDED_EVENT,
        value: {
          eventType: INFRASTRUCTURE_NEEDED_EVENT,
          eventData: {
            timeElapsed: 300000, // Last 5 minutes
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: BUILD_INFRASTRUCTURE_EVENT,
        value: {
          moduleId: 'colony',
          moduleType: 'infrastructure', // Use string literal from ModuleType alias
          eventType: BUILD_INFRASTRUCTURE_EVENT,
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
        target: TRADE_OPPORTUNITY_EVENT,
        value: {
          eventType: TRADE_OPPORTUNITY_EVENT,
          eventData: {
            timeElapsed: 60000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: ESTABLISH_TRADE_ROUTE_EVENT,
        value: {
          moduleId: 'colony',
          moduleType: 'trading', // Use string literal from ModuleType alias
          eventType: ESTABLISH_TRADE_ROUTE_EVENT,
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
        target: THREAT_DETECTED_EVENT,
        value: {
          eventType: THREAT_DETECTED_EVENT,
          eventData: {
            timeElapsed: 10000, // Last 10 seconds
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: ACTIVATE_DEFENSE_SYSTEMS_EVENT,
        value: {
          moduleId: 'colony',
          moduleType: 'defense', // Use string literal from ModuleType alias
          eventType: ACTIVATE_DEFENSE_SYSTEMS_EVENT,
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
        target: RESOURCE_IMBALANCE_EVENT,
        value: {
          eventType: RESOURCE_IMBALANCE_EVENT,
          eventData: {
            timeElapsed: 30000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: OPTIMIZE_RESOURCE_DISTRIBUTION_EVENT,
        value: {
          moduleId: 'colony',
          moduleType: 'resource-manager', // Use string literal from ModuleType alias
          eventType: OPTIMIZE_RESOURCE_DISTRIBUTION_EVENT,
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
        target: ResourceType.RESEARCH,
        value: 500,
      },
      {
        type: 'EVENT_OCCURRED',
        target: RESEARCH_OPPORTUNITY_EVENT,
        value: {
          eventType: RESEARCH_OPPORTUNITY_EVENT,
          eventData: {
            timeElapsed: 300000, // Last 5 minutes
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: INITIATE_RESEARCH_EVENT,
        value: {
          moduleId: 'colony',
          moduleType: ResourceType.RESEARCH,
          eventType: INITIATE_RESEARCH_EVENT,
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
        target: ENERGY_SHORTAGE_EVENT,
        value: {
          eventType: ENERGY_SHORTAGE_EVENT,
          eventData: {
            timeElapsed: 60000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: INCREASE_ENERGY_PRODUCTION_EVENT,
        value: {
          moduleId: 'colony',
          moduleType: 'infrastructure', // Use string literal from ModuleType alias
          eventType: INCREASE_ENERGY_PRODUCTION_EVENT,
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
        target: HAPPINESS_DECLINE_EVENT,
        value: {
          eventType: HAPPINESS_DECLINE_EVENT,
          eventData: {
            timeElapsed: 5000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: IMPROVE_LIVING_CONDITIONS_EVENT,
        value: {
          moduleId: 'colony',
          moduleType: 'infrastructure', // Use string literal from ModuleType alias
          eventType: IMPROVE_LIVING_CONDITIONS_EVENT,
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
        target: EMERGENCY_SITUATION_EVENT,
        value: {
          eventType: EMERGENCY_SITUATION_EVENT,
          eventData: {
            timeElapsed: 5000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: ACTIVATE_EMERGENCY_PROTOCOLS_EVENT,
        value: {
          moduleId: 'colony',
          moduleType: 'infrastructure', // Use string literal from ModuleType alias
          eventType: ACTIVATE_EMERGENCY_PROTOCOLS_EVENT,
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
