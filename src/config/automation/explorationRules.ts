import { ModuleEventType } from '../../lib/modules/ModuleEvents';
import { AutomationRule } from '../../managers/game/AutomationManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { ResourceType } from './../../types/resources/ResourceTypes';

/**
 * Default automation rules for exploration modules
 */
export const explorationRules: AutomationRule[] = [
  // Automated Recon Ship Dispatch
  {
    id: 'recon-dispatch',
    moduleId: 'exploration-hub',
    name: 'Automated Recon Dispatch',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'exploration-hub',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: ResourceType.ENERGY,
        value: {
          amount: 100,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'DISPATCH_RECON',
        value: {
          moduleId: 'exploration-hub',
          moduleType: 'exploration' as ModuleType,
          eventType: 'DISPATCH_RECON' as ModuleEventType,
          data: {
            type: 'mapping',
            priority: 1,
          },
        },
      },
    ],
    interval: 30000, // Check every 30 seconds
  },

  // Resource Discovery Processing
  {
    id: 'resource-discovery',
    moduleId: 'exploration-hub',
    name: 'Resource Discovery Processing',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'exploration-hub',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'RESOURCE_DISCOVERED',
        value: {
          eventType: 'RESOURCE_DISCOVERED',
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'PROCESS_DISCOVERY',
        value: {
          moduleId: 'exploration-hub',
          moduleType: 'exploration' as ModuleType,
          eventType: 'PROCESS_DISCOVERY' as ModuleEventType,
          data: {
            type: 'processing',
            priority: 2,
          },
        },
      },
    ],
    interval: 10000, // Check every 10 seconds
  },

  // Anomaly Investigation
  {
    id: 'anomaly-investigation',
    moduleId: 'exploration-hub',
    name: 'Anomaly Investigation',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'exploration-hub',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'ANOMALY_DETECTED',
        value: {
          eventType: 'ANOMALY_DETECTED',
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'INVESTIGATE_ANOMALY',
        value: {
          moduleId: 'exploration-hub',
          moduleType: 'exploration' as ModuleType,
          eventType: 'INVESTIGATE_ANOMALY' as ModuleEventType,
          data: {
            type: 'investigation',
            priority: 3,
          },
        },
      },
    ],
    interval: 15000, // Check every 15 seconds
  },

  // Exploration Ship Maintenance
  {
    id: 'ship-maintenance',
    moduleId: 'exploration-hub',
    name: 'Exploration Ship Maintenance',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'exploration-hub',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'SHIP_DAMAGED',
        value: {
          eventType: 'SHIP_DAMAGED',
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'REPAIR_SHIP',
        value: {
          moduleId: 'exploration-hub',
          moduleType: 'exploration' as ModuleType,
          eventType: 'REPAIR_SHIP' as ModuleEventType,
          data: {
            type: 'maintenance',
            priority: 4,
          },
        },
      },
    ],
    interval: 60000, // Check every minute
  },

  // Exploration Data Analysis
  {
    id: 'data-analysis',
    moduleId: 'exploration-hub',
    name: 'Exploration Data Analysis',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'exploration-hub',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'DATA_COLLECTED',
        value: {
          eventType: 'DATA_COLLECTED',
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'ANALYZE_DATA',
        value: {
          moduleId: 'exploration-hub',
          moduleType: 'exploration' as ModuleType,
          eventType: 'ANALYZE_DATA' as ModuleEventType,
          data: {
            type: 'analysis',
            priority: 2,
          },
        },
      },
    ],
    interval: 20000, // Check every 20 seconds
  },
];
