import { ModuleEventType } from '../../lib/modules/ModuleEvents';
import { AutomationRule } from '../../managers/game/AutomationManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';

export const hangarRules: AutomationRule[] = [
  {
    id: 'hangar-auto-repair',
    moduleId: 'hangar',
    name: 'Automated Ship Repair',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'hangar',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
        value: {
          amount: 100,
        },
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'minerals',
        value: {
          amount: 100,
        },
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
        target: 'START_REPAIR',
        value: {
          moduleId: 'hangar',
          moduleType: 'hangar' as ModuleType,
          eventType: 'START_REPAIR' as ModuleEventType,
          data: {
            type: 'repair',
            priority: 1,
          },
        },
      },
    ],
    interval: 10000, // Check every 10 seconds
  },
  {
    id: 'hangar-bay-maintenance',
    moduleId: 'hangar',
    name: 'Automated Bay Maintenance',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'hangar',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
        value: {
          amount: 50,
        },
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'minerals',
        value: {
          amount: 25,
        },
      },
      {
        type: 'STATUS_EQUALS',
        target: 'hangar',
        value: {
          status: 'low_efficiency',
        },
        operator: 'equals',
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'PERFORM_MAINTENANCE',
        value: {
          moduleId: 'hangar',
          moduleType: 'hangar' as ModuleType,
          eventType: 'PERFORM_MAINTENANCE' as ModuleEventType,
          data: {
            type: 'maintenance',
            priority: 2,
          },
        },
      },
    ],
    interval: 30000, // Check every 30 seconds
  },
  {
    id: 'hangar-ship-production',
    moduleId: 'hangar',
    name: 'Automated Ship Production',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'hangar',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
        value: {
          amount: 200,
        },
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'minerals',
        value: {
          amount: 300,
        },
      },
      {
        type: 'STATUS_EQUALS',
        target: 'hangar',
        value: {
          status: 'ready_for_production',
        },
        operator: 'equals',
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'START_SHIP_PRODUCTION',
        value: {
          moduleId: 'hangar',
          moduleType: 'hangar' as ModuleType,
          eventType: 'START_SHIP_PRODUCTION' as ModuleEventType,
          data: {
            type: 'production',
            priority: 3,
          },
        },
      },
    ],
    interval: 60000, // Check every minute
  },
  {
    id: 'hangar-ship-upgrade',
    moduleId: 'hangar',
    name: 'Automated Ship Upgrades',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'hangar',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
        value: {
          amount: 150,
        },
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'minerals',
        value: {
          amount: 200,
        },
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'SHIP_UPGRADE_AVAILABLE',
        value: {
          eventType: 'SHIP_UPGRADE_AVAILABLE',
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'UPGRADE_SHIP',
        value: {
          moduleId: 'hangar',
          moduleType: 'hangar' as ModuleType,
          eventType: 'UPGRADE_SHIP' as ModuleEventType,
          data: {
            type: 'upgrade',
            priority: 2,
          },
        },
      },
    ],
    interval: 60000, // Check every minute
  },
  {
    id: 'hangar-combat-preparation',
    moduleId: 'hangar',
    name: 'Combat Preparation Protocol',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'hangar',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'COMBAT_ALERT',
        value: {
          eventType: 'COMBAT_ALERT',
        },
      },
      {
        type: 'STATUS_EQUALS',
        target: 'hangar',
        value: {
          status: 'in_combat',
        },
        operator: 'equals',
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'PREPARE_COMBAT_SHIPS',
        value: {
          moduleId: 'hangar',
          moduleType: 'hangar' as ModuleType,
          eventType: 'PREPARE_COMBAT_SHIPS' as ModuleEventType,
          data: {
            type: 'combat',
            priority: 5,
          },
        },
      },
    ],
    interval: 5000, // Check every 5 seconds
  },
];
