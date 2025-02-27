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
        target: 'hangar'
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
        value: 100
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'minerals',
        value: 100
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'SHIP_DAMAGED',
        value: {
          timeWindow: 5000 // Last 5 seconds
        }
      }
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'START_REPAIR',
        value: {
          moduleId: 'hangar',
          moduleType: 'hangar' as ModuleType,
          data: {
            type: 'repair',
            priority: 1
          }
        }
      }
    ],
    interval: 10000 // Check every 10 seconds
  },
  {
    id: 'hangar-bay-maintenance',
    moduleId: 'hangar',
    name: 'Automated Bay Maintenance',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'hangar'
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
        value: 50
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'minerals',
        value: 25
      },
      {
        type: 'STATUS_EQUALS',
        target: 'hangar',
        value: 'low_efficiency',
        operator: 'equals'
      }
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'PERFORM_MAINTENANCE',
        value: {
          moduleId: 'hangar',
          moduleType: 'hangar' as ModuleType,
          data: {
            type: 'maintenance',
            priority: 2
          }
        }
      }
    ],
    interval: 30000 // Check every 30 seconds
  },
  {
    id: 'hangar-ship-production',
    moduleId: 'hangar',
    name: 'Automated Ship Production',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'hangar'
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
        value: 200
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'minerals',
        value: 300
      },
      {
        type: 'STATUS_EQUALS',
        target: 'hangar',
        value: 'ready_for_production',
        operator: 'equals'
      }
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'START_SHIP_PRODUCTION',
        value: {
          moduleId: 'hangar',
          moduleType: 'hangar' as ModuleType,
          data: {
            type: 'production',
            priority: 3
          }
        }
      }
    ],
    interval: 60000 // Check every minute
  },
  {
    id: 'hangar-ship-upgrade',
    moduleId: 'hangar',
    name: 'Automated Ship Upgrades',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'hangar'
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'energy',
        value: 300
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'minerals',
        value: 400
      },
      {
        type: 'RESOURCE_ABOVE',
        target: 'plasma',
        value: 100
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'SHIP_EXPERIENCE_THRESHOLD',
        value: {
          timeWindow: 60000 // Last minute
        }
      }
    ],
    actions: [
      {
        type: 'CONSUME_RESOURCES',
        target: 'energy',
        value: 300
      },
      {
        type: 'CONSUME_RESOURCES',
        target: 'minerals',
        value: 400
      },
      {
        type: 'CONSUME_RESOURCES',
        target: 'plasma',
        value: 100
      },
      {
        type: 'EMIT_EVENT',
        target: 'START_SHIP_UPGRADE',
        value: {
          moduleId: 'hangar',
          moduleType: 'hangar' as ModuleType,
          data: {
            type: 'upgrade',
            priority: 4
          }
        }
      }
    ],
    interval: 120000 // Check every 2 minutes
  },
  {
    id: 'hangar-emergency-recall',
    moduleId: 'hangar',
    name: 'Emergency Ship Recall',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'hangar'
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'SHIP_HEALTH_CRITICAL',
        value: {
          timeWindow: 5000 // Last 5 seconds
        }
      },
      {
        type: 'STATUS_EQUALS',
        target: 'hangar',
        value: 'in_combat',
        operator: 'equals'
      }
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'RECALL_DAMAGED_SHIP',
        value: {
          moduleId: 'hangar',
          moduleType: 'hangar' as ModuleType,
          data: {
            type: 'recall',
            priority: 1
          }
        }
      }
    ],
    interval: 5000 // Check every 5 seconds
  }
]; 