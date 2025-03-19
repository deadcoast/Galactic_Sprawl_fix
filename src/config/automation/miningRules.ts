import { ModuleEventType } from '../../lib/modules/ModuleEvents';
import {
  AutomationRule,
  EmitEventValue,
  EventConditionValue,
} from '../../managers/game/AutomationManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { ResourceType } from './../../types/resources/ResourceTypes';

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
        target: ResourceType.ENERGY,
        value: {
          amount: 150,
        },
      },
      {
        type: 'STATUS_EQUALS',
        target: 'mineral-processing',
        value: {
          status: 'ready_for_mining',
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'DISPATCH_MINING_SHIP',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          eventType: 'DISPATCH_MINING_SHIP' as ModuleEventType,
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
        target: ResourceType.MINERALS,
        value: {
          amount: 1000, // Minimum threshold
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'INCREASE_MINING_PRIORITY',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          eventType: 'INCREASE_MINING_PRIORITY' as ModuleEventType,
          data: {
            resourceType: ResourceType.MINERALS,
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
          eventType: 'SHIP_DAMAGE_REPORTED',
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'REPAIR_MINING_SHIP',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          eventType: 'REPAIR_MINING_SHIP' as ModuleEventType,
          data: {
            type: 'repair',
            priority: 3,
          },
        },
      },
    ],
    interval: 15000, // Check every 15 seconds
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
        target: ResourceType.MINERALS,
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
          eventType: 'OPTIMIZE_STORAGE' as ModuleEventType,
          data: {
            type: 'storage',
            priority: 2,
            action: 'transfer',
          },
        } as EmitEventValue,
      },
    ],
    interval: 15000, // Check every 15 seconds
  },

  // Mining Route Optimization
  {
    id: 'mining-route-optimization',
    moduleId: 'mineral-processing',
    name: 'Mining Route Optimization',
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
          eventType: 'LOW_EFFICIENCY_DETECTED',
          eventData: {
            timeElapsed: 60000, // Last minute
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'OPTIMIZE_MINING_ROUTES',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          eventType: 'OPTIMIZE_MINING_ROUTES' as ModuleEventType,
          data: {
            type: 'optimization',
            priority: 1,
          },
        } as EmitEventValue,
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
          eventType: 'RESOURCE_DEMAND_CHANGED',
          eventData: {
            timeElapsed: 30000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'UPDATE_MINING_PRIORITIES',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          eventType: 'UPDATE_MINING_PRIORITIES' as ModuleEventType,
          data: {
            type: 'prioritization',
            priority: 1,
          },
        } as EmitEventValue,
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
          eventType: 'MINING_MILESTONE_REACHED',
          eventData: {
            timeElapsed: 300000, // Last 5 minutes
          },
        } as EventConditionValue,
      },
      {
        type: 'RESOURCE_ABOVE',
        target: ResourceType.MINERALS,
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
        type: 'CONSUME_RESOURCES',
        target: ResourceType.MINERALS,
        value: 500,
      },
      {
        type: 'CONSUME_RESOURCES',
        target: ResourceType.ENERGY,
        value: 300,
      },
      {
        type: 'EMIT_EVENT',
        target: 'UPGRADE_MINING_SHIP',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          eventType: 'UPGRADE_MINING_SHIP' as ModuleEventType,
          data: {
            type: 'upgrade',
            priority: 2,
          },
        } as EmitEventValue,
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
          eventType: 'RESOURCE_NODE_DEPLETING',
          eventData: {
            timeElapsed: 60000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'FIND_NEW_RESOURCE_NODE',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          eventType: 'FIND_NEW_RESOURCE_NODE' as ModuleEventType,
          data: {
            type: 'exploration',
            priority: 1,
          },
        } as EmitEventValue,
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
        target: ResourceType.MINERALS,
        value: 100, // Critical low
      },
      {
        type: 'RESOURCE_BELOW',
        target: ResourceType.ENERGY,
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
          eventType: 'EMERGENCY_MINING_PROTOCOL' as ModuleEventType,
          data: {
            type: 'emergency',
            priority: 5, // Highest priority
          },
        } as EmitEventValue,
      },
    ],
    interval: 5000, // Check frequently
  },

  // Asteroid Field Scanning
  {
    id: 'asteroid-field-scanning',
    moduleId: 'mineral-processing',
    name: 'Asteroid Field Scanning',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'mineral-processing',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'NEW_ASTEROID_FIELD_DETECTED',
        value: {
          eventType: 'NEW_ASTEROID_FIELD_DETECTED',
          eventData: {
            timeElapsed: 300000, // Last 5 minutes
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'SCAN_ASTEROID_FIELD',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          eventType: 'SCAN_ASTEROID_FIELD' as ModuleEventType,
          data: {
            type: 'scanning',
            priority: 2,
          },
        } as EmitEventValue,
      },
    ],
    interval: 300000, // Check every 5 minutes
  },

  // Mining Ship Maintenance
  {
    id: 'mining-ship-maintenance',
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
        target: 'SHIP_MAINTENANCE_NEEDED',
        value: {
          eventType: 'SHIP_MAINTENANCE_NEEDED',
          eventData: {
            timeElapsed: 60000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'PERFORM_SHIP_MAINTENANCE',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          eventType: 'PERFORM_SHIP_MAINTENANCE' as ModuleEventType,
          data: {
            type: 'maintenance',
            priority: 3,
          },
        } as EmitEventValue,
      },
    ],
    interval: 60000, // Check every minute
  },

  // Automated Mining Expansion
  {
    id: 'automated-mining-expansion',
    moduleId: 'mineral-processing',
    name: 'Automated Mining Expansion',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'mineral-processing',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'credits',
        value: 10000,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'EXPAND_MINING_OPERATIONS',
        value: {
          moduleId: 'mineral-processing',
          moduleType: 'mineral' as ModuleType,
          eventType: 'EXPAND_MINING_OPERATIONS' as ModuleEventType,
          data: {
            type: 'expansion',
            priority: 2,
          },
        } as EmitEventValue,
      },
    ],
    interval: 300000, // Check every 5 minutes
  },
];
