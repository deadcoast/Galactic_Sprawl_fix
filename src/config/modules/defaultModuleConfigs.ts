import { ModuleConfig, ModuleType } from '../../types/buildings/ModuleTypes';

export const defaultModuleConfigs: Record<ModuleType, ModuleConfig> = {
  radar: {
    type: 'radar',
    name: 'Radar System',
    description: 'Advanced scanning and detection system',
    requirements: {
      minLevel: 1,
      buildingType: ['mothership', 'colony'],
      resourceCosts: [
        { type: 'minerals', amount: 300 },
        { type: 'energy', amount: 200 },
      ],
    },
    baseStats: {
      power: 50,
      crew: 10,
      upkeep: 5,
    },
  },
  hangar: {
    type: 'hangar',
    name: 'Ship Hangar',
    description: 'Fleet management and ship construction facility',
    requirements: {
      minLevel: 1,
      buildingType: ['mothership', 'colony'],
      resourceCosts: [
        { type: 'minerals', amount: 600 },
        { type: 'energy', amount: 400 },
      ],
    },
    baseStats: {
      power: 100,
      crew: 50,
      upkeep: 20,
    },
  },
  academy: {
    type: 'academy',
    name: 'Officer Academy',
    description: 'Training facility for fleet officers',
    requirements: {
      minLevel: 1,
      buildingType: ['mothership'],
      resourceCosts: [
        { type: 'minerals', amount: 400 },
        { type: 'energy', amount: 300 },
      ],
    },
    baseStats: {
      power: 75,
      crew: 30,
      upkeep: 15,
    },
  },
  exploration: {
    type: 'exploration',
    name: 'Exploration Hub',
    description: 'Coordinates exploration missions and scout ships',
    requirements: {
      minLevel: 1,
      buildingType: ['colony'],
      resourceCosts: [
        { type: 'minerals', amount: 400 },
        { type: 'energy', amount: 300 },
      ],
    },
    baseStats: {
      power: 60,
      crew: 20,
      upkeep: 10,
    },
  },
  mineral: {
    type: 'mineral',
    name: 'Mineral Processing',
    description: 'Resource extraction and processing facility',
    requirements: {
      minLevel: 1,
      buildingType: ['colony'],
      resourceCosts: [
        { type: 'minerals', amount: 500 },
        { type: 'energy', amount: 300 },
      ],
    },
    baseStats: {
      power: 80,
      crew: 40,
      upkeep: 25,
    },
  },
  trading: {
    type: 'trading',
    name: 'Trade Hub',
    description: 'Manages trade routes and resource exchange',
    requirements: {
      minLevel: 1,
      buildingType: ['colony'],
      resourceCosts: [
        { type: 'minerals', amount: 400 },
        { type: 'energy', amount: 300 },
      ],
    },
    baseStats: {
      power: 70,
      crew: 25,
      upkeep: 15,
    },
  },
  'resource-manager': {
    type: 'resource-manager',
    name: 'Resource Management',
    description: 'Advanced resource monitoring and distribution',
    requirements: {
      minLevel: 1,
      buildingType: ['mothership', 'colony'],
      resourceCosts: [
        { type: 'minerals', amount: 300 },
        { type: 'energy', amount: 200 },
      ],
    },
    baseStats: {
      power: 40,
      crew: 15,
      upkeep: 10,
    },
  },
  population: {
    type: 'population',
    name: 'Population Center',
    description: 'Manages colony population growth and housing',
    requirements: {
      minLevel: 1,
      buildingType: ['colony'],
      resourceCosts: [
        { type: 'minerals', amount: 500 },
        { type: 'energy', amount: 300 },
      ],
    },
    baseStats: {
      power: 60,
      crew: 30,
      upkeep: 20,
    },
  },
  infrastructure: {
    type: 'infrastructure',
    name: 'Infrastructure Hub',
    description: 'Manages colony infrastructure development',
    requirements: {
      minLevel: 1,
      buildingType: ['colony'],
      resourceCosts: [
        { type: 'minerals', amount: 600 },
        { type: 'energy', amount: 400 },
      ],
    },
    baseStats: {
      power: 80,
      crew: 40,
      upkeep: 30,
    },
  },
  research: {
    type: 'research',
    name: 'Research Center',
    description: 'Conducts scientific research and development',
    requirements: {
      minLevel: 1,
      buildingType: ['colony'],
      resourceCosts: [
        { type: 'minerals', amount: 400 },
        { type: 'energy', amount: 500 },
      ],
    },
    baseStats: {
      power: 100,
      crew: 50,
      upkeep: 40,
    },
  },
  food: {
    type: 'food',
    name: 'Food Production',
    description: 'Manages food production and biodomes',
    requirements: {
      minLevel: 1,
      buildingType: ['colony'],
      resourceCosts: [
        { type: 'minerals', amount: 300 },
        { type: 'energy', amount: 200 },
      ],
    },
    baseStats: {
      power: 50,
      crew: 25,
      upkeep: 15,
    },
  },
  defense: {
    type: 'defense',
    name: 'Defense Center',
    description: 'Manages colony defense systems',
    requirements: {
      minLevel: 1,
      buildingType: ['colony'],
      resourceCosts: [
        { type: 'minerals', amount: 700 },
        { type: 'energy', amount: 500 },
      ],
    },
    baseStats: {
      power: 120,
      crew: 60,
      upkeep: 50,
    },
  },
}; 