import { ModuleEventType } from '../../lib/modules/ModuleEvents';
import {
  AutomationRule,
  EmitEventValue,
  EventConditionValue,
} from '../../managers/game/AutomationManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { ResourceType } from './../../types/resources/ResourceTypes';

/**
 * Automation rules for combat system
 */
export const combatRules: AutomationRule[] = [
  // Fleet Formation Management
  {
    id: 'fleet-formation',
    moduleId: 'combat',
    name: 'Fleet Formation Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'combat',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'FLEET_POSITION_CHANGED',
        value: {
          eventType: 'FLEET_POSITION_CHANGED',
          eventData: {
            timeElapsed: 10000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'UPDATE_FLEET_FORMATION',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          eventType: 'UPDATE_FLEET_FORMATION' as ModuleEventType,
          data: {
            type: 'formation',
            priority: 2,
          },
        } as EmitEventValue,
      },
    ],
    interval: 10000, // Check every 10 seconds
  },

  // Combat Engagement
  {
    id: 'combat-engagement',
    moduleId: 'combat',
    name: 'Combat Engagement Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'combat',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'HOSTILE_DETECTED',
        value: {
          eventType: 'HOSTILE_DETECTED',
          eventData: {
            timeElapsed: 5000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'INITIATE_COMBAT',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          eventType: 'INITIATE_COMBAT' as ModuleEventType,
          data: {
            type: 'engagement',
            priority: 5,
          },
        } as EmitEventValue,
      },
    ],
    interval: 5000, // Check every 5 seconds
  },

  // Damage Control
  {
    id: 'damage-control',
    moduleId: 'combat',
    name: 'Damage Control Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'combat',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'SHIP_DAMAGED',
        value: {
          eventType: 'SHIP_DAMAGED',
          eventData: {
            timeElapsed: 3000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'ACTIVATE_DAMAGE_CONTROL',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          eventType: 'ACTIVATE_DAMAGE_CONTROL' as ModuleEventType,
          data: {
            type: 'repair',
            priority: 4,
          },
        } as EmitEventValue,
      },
    ],
    interval: 3000, // Check every 3 seconds
  },

  // Shield Management
  {
    id: 'shield-management',
    moduleId: 'combat',
    name: 'Shield Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'combat',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: ResourceType.ENERGY,
        value: 200,
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'SHIELD_LOW',
        value: {
          eventType: 'SHIELD_LOW',
          eventData: {
            timeElapsed: 5000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'BOOST_SHIELDS',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          eventType: 'BOOST_SHIELDS' as ModuleEventType,
          data: {
            type: 'shield',
            priority: 3,
          },
        } as EmitEventValue,
      },
    ],
    interval: 5000, // Check every 5 seconds
  },

  // Weapon Systems
  {
    id: 'weapon-systems',
    moduleId: 'combat',
    name: 'Weapon Systems Management',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'combat',
      },
      {
        type: 'RESOURCE_ABOVE',
        target: ResourceType.ENERGY,
        value: 300,
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'TARGET_LOCKED',
        value: {
          eventType: 'TARGET_LOCKED',
          eventData: {
            timeElapsed: 2000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'FIRE_WEAPONS',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          eventType: 'FIRE_WEAPONS' as ModuleEventType,
          data: {
            type: 'attack',
            priority: 5,
          },
        } as EmitEventValue,
      },
    ],
    interval: 2000, // Check every 2 seconds
  },

  // Emergency Retreat
  {
    id: 'emergency-retreat',
    moduleId: 'combat',
    name: 'Emergency Retreat Protocol',
    enabled: true,
    conditions: [
      {
        type: 'MODULE_ACTIVE',
        target: 'combat',
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'CRITICAL_DAMAGE',
        value: {
          eventType: 'CRITICAL_DAMAGE',
          eventData: {
            timeElapsed: 1000,
          },
        } as EventConditionValue,
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'INITIATE_RETREAT',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          eventType: 'INITIATE_RETREAT' as ModuleEventType,
          data: {
            type: 'retreat',
            priority: 5,
          },
        } as EmitEventValue,
      },
    ],
    interval: 1000, // Check frequently
  },
];
