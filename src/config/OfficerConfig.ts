import { OfficerTrait, TrainingConfig, SquadConfig } from '../types/officers/OfficerTypes';

/**
 * Officer trait configurations
 */
export const OFFICER_TRAITS: OfficerTrait[] = [
  {
    id: "natural_leader",
    name: "Natural Leader",
    description: "Born with exceptional leadership qualities",
    effects: {
      skills: {
        leadership: 2
      },
      bonuses: {
        squadBonus: 0.1
      }
    }
  },
  {
    id: "combat_expert",
    name: "Combat Expert",
    description: "Highly skilled in combat tactics",
    effects: {
      skills: {
        combat: 2
      },
      bonuses: {
        xpGain: 0.1
      }
    }
  },
  {
    id: "tech_savvy",
    name: "Tech Savvy",
    description: "Natural affinity for technical systems",
    effects: {
      skills: {
        technical: 2
      },
      bonuses: {
        trainingSpeed: 0.1
      }
    }
  },
  {
    id: "quick_learner",
    name: "Quick Learner",
    description: "Absorbs new knowledge rapidly",
    effects: {
      bonuses: {
        xpGain: 0.2,
        trainingSpeed: 0.1
      }
    }
  },
  {
    id: "inspiring",
    name: "Inspiring",
    description: "Naturally inspires those around them",
    effects: {
      skills: {
        leadership: 1
      },
      bonuses: {
        squadBonus: 0.15
      }
    }
  }
];

/**
 * Training configuration
 */
export const TRAINING_CONFIG: TrainingConfig = {
  baseTime: 300000, // 5 minutes
  levelModifier: 0.1, // 10% faster per level
  specializationModifier: 0.2, // 20% faster for matching specialization
  xpMultiplier: 1.0,
  skillGainRate: 1.0
};

/**
 * Squad configuration
 */
export const SQUAD_CONFIG: SquadConfig = {
  maxSize: 5,
  bonusMultipliers: {
    combat: 0.05, // 5% per point
    efficiency: 0.05,
    survival: 0.025
  },
  leadershipBonus: 0.1 // 10% per leadership point
}; 