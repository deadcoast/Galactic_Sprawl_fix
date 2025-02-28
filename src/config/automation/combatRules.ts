import { AutomationRule } from '../../managers/game/AutomationManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';

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
          timeWindow: 10000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'UPDATE_FLEET_FORMATION',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          data: {
            type: 'formation',
            priority: 2,
          },
        },
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
          timeWindow: 5000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'INITIATE_COMBAT',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          data: {
            type: 'engagement',
            priority: 5,
          },
        },
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
          timeWindow: 3000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'ACTIVATE_DAMAGE_CONTROL',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          data: {
            type: 'repair',
            priority: 4,
          },
        },
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
        target: 'energy',
        value: 200,
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'SHIELD_LOW',
        value: {
          timeWindow: 5000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'BOOST_SHIELDS',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          data: {
            type: 'shield',
            priority: 3,
          },
        },
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
        target: 'energy',
        value: 300,
      },
      {
        type: 'EVENT_OCCURRED',
        target: 'TARGET_LOCKED',
        value: {
          timeWindow: 2000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'FIRE_WEAPONS',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          data: {
            type: 'attack',
            priority: 5,
          },
        },
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
          timeWindow: 1000,
        },
      },
    ],
    actions: [
      {
        type: 'EMIT_EVENT',
        target: 'INITIATE_RETREAT',
        value: {
          moduleId: 'combat',
          moduleType: 'combat' as ModuleType,
          data: {
            type: 'retreat',
            priority: 5,
          },
        },
      },
    ],
    interval: 1000, // Check frequently
  },
];
