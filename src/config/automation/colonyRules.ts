import { AutomationRule } from '../../managers/game/AutomationManager';
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
        target: 'food',
        value: 500,
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
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
          data: {
            type: 'growth',
            priority: 1,
          },
        },
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
        target: 'food',
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
          data: {
            type: 'production',
            priority: 2,
          },
        },
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
        target: 'minerals',
        value: 1000,
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
        value: 800,
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'INFRASTRUCTURE_NEEDED',
        value: {
          timeWindow: 300000, // Last 5 minutes
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'BUILD_INFRASTRUCTURE',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          data: {
            type: 'construction',
            priority: 2,
          },
        },
      },
    ],
    interval: 300000, // Check every 5 minutes
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
          timeWindow: 60000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'ESTABLISH_TRADE_ROUTE',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          data: {
            type: 'trade',
            priority: 2,
          },
        },
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
          timeWindow: 10000, // Last 10 seconds
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'ACTIVATE_DEFENSE_SYSTEMS',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          data: {
            type: 'defense',
            priority: 5, // Highest priority
          },
        },
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
          timeWindow: 30000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'OPTIMIZE_RESOURCE_DISTRIBUTION',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          data: {
            type: 'distribution',
            priority: 2,
          },
        },
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
        target: 'research',
        value: 500,
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'RESEARCH_OPPORTUNITY',
        value: {
          timeWindow: 300000, // Last 5 minutes
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'START_RESEARCH_PROJECT',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          data: {
            type: 'research',
            priority: 3,
          },
        },
      },
    ],
    interval: 300000, // Check every 5 minutes
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
        target: 'LOW_HAPPINESS_DETECTED',
        value: {
          timeWindow: 60000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'IMPROVE_LIVING_CONDITIONS',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          data: {
            type: 'happiness',
            priority: 2,
          },
        },
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
          timeWindow: 5000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'ACTIVATE_EMERGENCY_PROTOCOLS',
        value: {
          moduleId: 'colony',
          moduleType: 'colony' as ModuleType,
          data: {
            type: 'emergency',
            priority: 5, // Highest priority
          },
        },
      },
    ],
    interval: 5000, // Check frequently
  },
];
