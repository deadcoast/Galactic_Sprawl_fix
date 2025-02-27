import { AutomationRule } from '../../managers/game/AutomationManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';

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
        target: 'energy',
        value: 100,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'DISPATCH_RECON',
        value: {
          moduleId: 'exploration-hub',
          moduleType: 'exploration' as ModuleType,
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
          timeWindow: 5000, // Last 5 seconds
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'UPDATE_MINING_MAP',
        value: {
          moduleId: 'exploration-hub',
          moduleType: 'exploration' as ModuleType,
          data: {
            type: 'resource-update',
            priority: 2,
          },
        },
      },
    ],
    interval: 5000, // Check every 5 seconds
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
          timeWindow: 10000, // Last 10 seconds
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
          data: {
            type: 'investigation',
            priority: 3,
          },
        },
      },
    ],
    interval: 10000, // Check every 10 seconds
  },

  // Experience-Based Ship Upgrades
  {
    id: 'recon-ship-upgrade',
    moduleId: 'exploration-hub',
    name: 'Recon Ship Experience Upgrade',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'exploration-hub',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'SHIP_EXPERIENCE_THRESHOLD',
        value: {
          timeWindow: 60000, // Last minute
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
        target: 'UPGRADE_RECON_SHIP',
        value: {
          moduleId: 'exploration-hub',
          moduleType: 'exploration' as ModuleType,
          data: {
            type: 'upgrade',
            priority: 4,
          },
        },
      },
    ],
    interval: 60000, // Check every minute
  },
]; 