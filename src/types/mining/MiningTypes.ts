import { ResourceType } from './../resources/ResourceTypes';

/**
 * Mining experience interface
 */
export interface MiningExperience {
  baseAmount: number;
  bonusFactors: {
    resourceRarity: number; // Exotic > Gas > Mineral
    extractionEfficiency: number;
    resourceQuality: number; // Based on abundance
    distanceModifier: number; // Further = more XP
    techBonus: number; // Bonus from tech tree upgrades
  };
  totalXP: number; // Calculated total XP
  unlockedTech: string[]; // Tech tree nodes that can be unlocked
}

/**
 * Mining resource interface
 */
export interface MiningResource {
  id: string;
  name: string;
  type: ResourceType;
  abundance: number;
  distance: number;
  extractionRate: number;
  depletion: number;
  priority: number;
  thresholds: {
    min: number;
    max: number;
  };
}

/**
 * Mining ship interface
 */
export interface MiningShip {
  id: string;
  name: string;
  type: 'rockBreaker' | 'voidDredger';
  status: 'idle' | 'mining' | 'returning' | 'maintenance';
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}

/**
 * Mining tech bonuses interface
 */
export interface MiningTechBonuses {
  extractionRate: number;
  efficiency: number;
  storageCapacity?: number;
}
