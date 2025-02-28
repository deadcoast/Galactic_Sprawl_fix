import { ModuleUpgradePath } from '../../managers/module/ModuleUpgradeManager';

/**
 * Sample upgrade paths for different module types
 */
export const moduleUpgradePaths: ModuleUpgradePath[] = [
  // Radar module upgrade path
  {
    moduleType: 'radar',
    levels: [
      {
        level: 2,
        name: 'Enhanced Radar Array',
        description: 'Improved scanning capabilities with extended range and better resolution.',
        requirements: {
          minLevel: 1,
          resourceCosts: [
            { type: 'minerals', amount: 100 },
            { type: 'energy', amount: 50 },
          ],
          buildingLevel: 2,
        },
        effects: [
          {
            type: 'stat',
            target: 'range',
            value: 20,
            isPercentage: true,
            description: 'Increases radar range',
          },
          {
            type: 'stat',
            target: 'resolution',
            value: 15,
            isPercentage: true,
            description: 'Improves scan resolution',
          },
        ],
        visualChanges: [
          {
            type: 'size',
            description: 'Larger radar dish',
            value: 'medium',
          },
          {
            type: 'color',
            description: 'Enhanced emitter glow',
            value: 'cyan',
          },
        ],
      },
      {
        level: 3,
        name: 'Advanced Sensor Suite',
        description: 'Cutting-edge sensor technology with deep space scanning capabilities.',
        requirements: {
          minLevel: 2,
          resourceCosts: [
            { type: 'minerals', amount: 200 },
            { type: 'energy', amount: 100 },
            { type: 'plasma', amount: 50 },
          ],
          techRequirements: ['advanced_sensors'],
          buildingLevel: 3,
        },
        effects: [
          {
            type: 'stat',
            target: 'range',
            value: 50,
            isPercentage: true,
            description: 'Greatly increases radar range',
          },
          {
            type: 'stat',
            target: 'resolution',
            value: 30,
            isPercentage: true,
            description: 'Significantly improves scan resolution',
          },
          {
            type: 'ability',
            target: 'deep_scan',
            value: 1,
            isPercentage: false,
            description: 'Unlocks deep space scanning',
          },
        ],
        visualChanges: [
          {
            type: 'size',
            description: 'Large radar array',
            value: 'large',
          },
          {
            type: 'color',
            description: 'Advanced emitter glow',
            value: 'blue',
          },
          {
            type: 'effect',
            description: 'Scanning beam effect',
            value: 'pulse',
          },
        ],
      },
    ],
  },

  // Hangar module upgrade path
  {
    moduleType: 'hangar',
    levels: [
      {
        level: 2,
        name: 'Expanded Hangar Bay',
        description: 'Larger hangar with improved ship maintenance facilities.',
        requirements: {
          minLevel: 1,
          resourceCosts: [
            { type: 'minerals', amount: 150 },
            { type: 'energy', amount: 75 },
          ],
          buildingLevel: 2,
        },
        effects: [
          {
            type: 'stat',
            target: 'capacity',
            value: 2,
            isPercentage: false,
            description: 'Increases ship capacity',
          },
          {
            type: 'stat',
            target: 'maintenance_efficiency',
            value: 15,
            isPercentage: true,
            description: 'Improves maintenance efficiency',
          },
        ],
        visualChanges: [
          {
            type: 'size',
            description: 'Wider hangar doors',
            value: 'medium',
          },
          {
            type: 'texture',
            description: 'Reinforced plating',
            value: 'metallic',
          },
        ],
      },
      {
        level: 3,
        name: 'Advanced Docking System',
        description: 'State-of-the-art docking facilities with automated maintenance.',
        requirements: {
          minLevel: 2,
          resourceCosts: [
            { type: 'minerals', amount: 300 },
            { type: 'energy', amount: 150 },
            { type: 'plasma', amount: 75 },
          ],
          techRequirements: ['automated_docking'],
          buildingLevel: 3,
        },
        effects: [
          {
            type: 'stat',
            target: 'capacity',
            value: 3,
            isPercentage: false,
            description: 'Further increases ship capacity',
          },
          {
            type: 'stat',
            target: 'maintenance_efficiency',
            value: 30,
            isPercentage: true,
            description: 'Greatly improves maintenance efficiency',
          },
          {
            type: 'ability',
            target: 'auto_repair',
            value: 1,
            isPercentage: false,
            description: 'Unlocks automated ship repairs',
          },
        ],
        visualChanges: [
          {
            type: 'size',
            description: 'Large hangar complex',
            value: 'large',
          },
          {
            type: 'texture',
            description: 'Advanced composite plating',
            value: 'composite',
          },
          {
            type: 'effect',
            description: 'Docking guidance beams',
            value: 'beam',
          },
        ],
      },
    ],
  },

  // Mineral module upgrade path
  {
    moduleType: 'mineral',
    levels: [
      {
        level: 2,
        name: 'Enhanced Mining Facility',
        description: 'Improved mining equipment with better extraction rates.',
        requirements: {
          minLevel: 1,
          resourceCosts: [
            { type: 'minerals', amount: 120 },
            { type: 'energy', amount: 60 },
          ],
          buildingLevel: 2,
        },
        effects: [
          {
            type: 'resource',
            target: 'minerals',
            value: 25,
            isPercentage: true,
            description: 'Increases mineral production',
          },
          {
            type: 'stat',
            target: 'efficiency',
            value: 15,
            isPercentage: true,
            description: 'Improves mining efficiency',
          },
        ],
        visualChanges: [
          {
            type: 'size',
            description: 'Larger mining equipment',
            value: 'medium',
          },
          {
            type: 'color',
            description: 'Industrial coloring',
            value: 'orange',
          },
        ],
      },
      {
        level: 3,
        name: 'Automated Mining Complex',
        description: 'Fully automated mining operation with advanced extraction technology.',
        requirements: {
          minLevel: 2,
          resourceCosts: [
            { type: 'minerals', amount: 250 },
            { type: 'energy', amount: 125 },
            { type: 'plasma', amount: 60 },
          ],
          techRequirements: ['automated_mining'],
          buildingLevel: 3,
        },
        effects: [
          {
            type: 'resource',
            target: 'minerals',
            value: 50,
            isPercentage: true,
            description: 'Greatly increases mineral production',
          },
          {
            type: 'stat',
            target: 'efficiency',
            value: 30,
            isPercentage: true,
            description: 'Significantly improves mining efficiency',
          },
          {
            type: 'ability',
            target: 'deep_mining',
            value: 1,
            isPercentage: false,
            description: 'Unlocks deep mining capabilities',
          },
        ],
        visualChanges: [
          {
            type: 'size',
            description: 'Large mining complex',
            value: 'large',
          },
          {
            type: 'color',
            description: 'Advanced industrial coloring',
            value: 'deep-orange',
          },
          {
            type: 'effect',
            description: 'Mining operation particles',
            value: 'dust',
          },
        ],
      },
    ],
  },
];

/**
 * Initialize module upgrade paths
 */
export function initializeModuleUpgradePaths(moduleUpgradeManager: any): void {
  for (const path of moduleUpgradePaths) {
    moduleUpgradeManager.registerUpgradePath(path);
  }
}
