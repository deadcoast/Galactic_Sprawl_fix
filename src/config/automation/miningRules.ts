import { AutomationRule } from '../../managers/game/AutomationManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';

/**
 * Enhanced automation rules for mining modules
 */
export const miningRules: AutomationRule[] = [
  // Automated Mining Ship Dispatch
  {
    id: 'mining-dispatch',
    moduleId: 'mineral-processing',
    name: 'Automated Mining Dispatch',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'mineral-processing',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
        value: 150,
      },
      {
        type: 'STATUS_EQUALS',
        target: 'mineral-processing',
        value: 'ready_for_mining',
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'DISPATCH_MINING_SHIP',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          data: {
            type: 'mining',
            priority: 1,
          },
        },
      },
    ],
    interval: 20000, // Check every 20 seconds
  },

  // Resource Threshold Management
  {
    id: 'threshold-management',
    moduleId: 'mineral-processing',
    name: 'Resource Threshold Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'mineral-processing',
      },
      {
        type: 'RESOURCE_BELOW',
        target: 'minerals',
        value: 1000, // Minimum threshold
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'INCREASE_MINING_PRIORITY',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          data: {
            resourceType: 'minerals',
            priority: 2,
          },
        },
      },
    ],
    interval: 10000, // Check every 10 seconds
  },

  // Ship Maintenance
  {
    id: 'ship-maintenance',
    moduleId: 'mineral-processing',
    name: 'Mining Ship Maintenance',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'mineral-processing',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'SHIP_DAMAGE_REPORTED',
        value: {
          timeWindow: 30000, // Last 30 seconds
        },
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'minerals',
        value: 200,
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
        value: 150,
      },
    ],
    actions: [
      {
        type: 'CONSUME_RESOURCES',
        target: 'minerals',
        value: 200,
      },
      {
        type: 'CONSUME_RESOURCES',
        target: 'energy',
        value: 150,
      },
      {
        type: 'EMIT_EVENT',
        target: 'REPAIR_MINING_SHIP',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          data: {
            type: 'repair',
            priority: 3,
          },
        },
      },
    ],
    interval: 30000, // Check every 30 seconds
  },

  // Resource Storage Optimization
  {
    id: 'storage-optimization',
    moduleId: 'mineral-processing',
    name: 'Storage Optimization',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'mineral-processing',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'minerals',
        value: 8000, // Near max storage
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'OPTIMIZE_STORAGE',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          data: {
            type: 'storage',
            priority: 2,
            action: 'transfer',
          },
        },
      },
    ],
    interval: 15000, // Check every 15 seconds
  },

  // Efficiency Monitoring
  {
    id: 'efficiency-monitor',
    moduleId: 'mineral-processing',
    name: 'Mining Efficiency Monitor',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'mineral-processing',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'LOW_EFFICIENCY_DETECTED',
        value: {
          timeWindow: 60000, // Last minute
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'OPTIMIZE_MINING_ROUTES',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          data: {
            type: 'optimization',
            priority: 1,
          },
        },
      },
    ],
    interval: 60000, // Check every minute
  },

  // Dynamic Resource Prioritization
  {
    id: 'resource-prioritization',
    moduleId: 'mineral-processing',
    name: 'Dynamic Resource Prioritization',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'mineral-processing',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'RESOURCE_DEMAND_CHANGED',
        value: {
          timeWindow: 30000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'UPDATE_MINING_PRIORITIES',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          data: {
            type: 'prioritization',
            priority: 1,
          },
        },
      },
    ],
    interval: 30000,
  },

  // Automated Ship Upgrades
  {
    id: 'mining-ship-upgrade',
    moduleId: 'mineral-processing',
    name: 'Mining Ship Upgrades',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'mineral-processing',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'MINING_MILESTONE_REACHED',
        value: {
          timeWindow: 300000, // Last 5 minutes
        },
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'minerals',
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
        type: 'CONSUME_RESOURCES',
        target: 'minerals',
        value: 500,
      },
      {
        type: 'CONSUME_RESOURCES',
        target: 'energy',
        value: 300,
      },
      {
        type: 'EMIT_EVENT',
        target: 'UPGRADE_MINING_SHIP',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          data: {
            type: 'upgrade',
            priority: 2,
          },
        },
      },
    ],
    interval: 300000, // Check every 5 minutes
  },

  // Resource Depletion Management
  {
    id: 'depletion-management',
    moduleId: 'mineral-processing',
    name: 'Resource Depletion Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'mineral-processing',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'RESOURCE_NODE_DEPLETING',
        value: {
          timeWindow: 60000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'FIND_NEW_RESOURCE_NODE',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          data: {
            type: 'exploration',
            priority: 1,
          },
        },
      },
    ],
    interval: 60000,
  },

  // Emergency Resource Collection
  {
    id: 'emergency-collection',
    moduleId: 'mineral-processing',
    name: 'Emergency Resource Collection',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'mineral-processing',
      },
      {
        type: 'RESOURCE_BELOW',
        target: 'minerals',
        value: 100, // Critical low
      },
      {
        type: 'RESOURCE_BELOW',
        target: 'energy',
        value: 50, // Critical low
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'EMERGENCY_MINING_PROTOCOL',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
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
