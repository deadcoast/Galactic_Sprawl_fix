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
  type: 'mineral' | 'gas' | 'exotic';
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
 * Mining tech bonuses interface
 */
export interface MiningTechBonuses {
  extractionRate: number;
  efficiency: number;
  storageCapacity?: number;
}
