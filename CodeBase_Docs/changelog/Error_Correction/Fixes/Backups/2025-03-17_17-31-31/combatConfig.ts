export interface CombatConfig {
  // Combat Thresholds
  engagementRange: number;
  retreatHealthThreshold: number;
  reinforcementThreshold: number;
  maxUnitsPerZone: number;

  // Automation Settings
  automationEnabled: boolean;
  automationIntervals: {
    formation: number;
    engagement: number;
    repair: number;
    shield: number;
    attack: number;
    retreat: number;
  };
  automationThresholds: {
    shieldBoostThreshold: number;
    repairThreshold: number;
    retreatThreshold: number;
    reinforcementThreshold: number;
  };

  // Combat Effects
  effectDurations: {
    weaponEffect: number;
    shieldEffect: number;
    repairEffect: number;
    formationEffect: number;
  };
  effectIntensities: {
    weaponEffect: number;
    shieldEffect: number;
    repairEffect: number;
    formationEffect: number;
  };

  // Formation Settings
  formations: {
    offensive: {
      spacing: number;
      facing: number;
      pattern: 'offensive';
      adaptiveSpacing: boolean;
      transitionSpeed: number;
      preferredTypes: Array<'spearhead' | 'arrow' | 'wedge'>;
    };
    defensive: {
      spacing: number;
      facing: number;
      pattern: 'defensive';
      adaptiveSpacing: boolean;
      transitionSpeed: number;
      preferredTypes: Array<'shield' | 'circle' | 'diamond'>;
    };
    balanced: {
      spacing: number;
      facing: number;
      pattern: 'balanced';
      adaptiveSpacing: boolean;
      transitionSpeed: number;
      preferredTypes: Array<'line' | 'scattered' | 'diamond'>;
    };
  };

  // Formation Transitions
  formationTransitions: {
    defaultDuration: number;
    minSpacing: number;
    maxSpacing: number;
    adaptiveSpeedFactor: number;
    patterns: {
      [key: string]: {
        to: {
          [key: string]: {
            duration: number;
            easingFunction: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
          };
        };
      };
    };
  };
}

export const defaultCombatConfig: CombatConfig = {
  // Combat Thresholds
  engagementRange: 500,
  retreatHealthThreshold: 0.3,
  reinforcementThreshold: 0.5,
  maxUnitsPerZone: 10,

  // Automation Settings
  automationEnabled: true,
  automationIntervals: {
    formation: 10000, // 10 seconds
    engagement: 5000, // 5 seconds
    repair: 3000, // 3 seconds
    shield: 5000, // 5 seconds
    attack: 2000, // 2 seconds
    retreat: 1000, // 1 second
  },
  automationThresholds: {
    shieldBoostThreshold: 0.5, // 50% shield
    repairThreshold: 0.7, // 70% health
    retreatThreshold: 0.3, // 30% health
    reinforcementThreshold: 0.5, // 50% fleet strength
  },

  // Combat Effects
  effectDurations: {
    weaponEffect: 1000, // 1 second
    shieldEffect: 2000, // 2 seconds
    repairEffect: 3000, // 3 seconds
    formationEffect: 2000, // 2 seconds
  },
  effectIntensities: {
    weaponEffect: 1.0,
    shieldEffect: 1.0,
    repairEffect: 1.0,
    formationEffect: 1.0,
  },

  // Formation Settings
  formations: {
    offensive: {
      spacing: 100,
      facing: 0,
      pattern: 'offensive',
      adaptiveSpacing: true,
      transitionSpeed: 2.0,
      preferredTypes: ['spearhead', 'arrow', 'wedge'],
    },
    defensive: {
      spacing: 150,
      facing: 180,
      pattern: 'defensive',
      adaptiveSpacing: true,
      transitionSpeed: 1.5,
      preferredTypes: ['shield', 'circle', 'diamond'],
    },
    balanced: {
      spacing: 120,
      facing: 90,
      pattern: 'balanced',
      adaptiveSpacing: true,
      transitionSpeed: 1.2,
      preferredTypes: ['line', 'scattered', 'diamond'],
    },
  },

  // Formation Transitions
  formationTransitions: {
    defaultDuration: 2000,
    minSpacing: 50,
    maxSpacing: 300,
    adaptiveSpeedFactor: 1.2,
    patterns: {
      spearhead: {
        to: {
          shield: { duration: 3000, easingFunction: 'easeInOut' },
          scattered: { duration: 1500, easingFunction: 'easeOut' },
          diamond: { duration: 2500, easingFunction: 'easeInOut' },
        },
      },
      shield: {
        to: {
          spearhead: { duration: 3000, easingFunction: 'easeInOut' },
          circle: { duration: 2000, easingFunction: 'easeInOut' },
          diamond: { duration: 2500, easingFunction: 'easeInOut' },
        },
      },
      diamond: {
        to: {
          shield: { duration: 2500, easingFunction: 'easeInOut' },
          spearhead: { duration: 2500, easingFunction: 'easeInOut' },
          arrow: { duration: 2000, easingFunction: 'easeInOut' },
        },
      },
      arrow: {
        to: {
          spearhead: { duration: 2000, easingFunction: 'easeInOut' },
          wedge: { duration: 1500, easingFunction: 'easeInOut' },
          line: { duration: 1500, easingFunction: 'easeInOut' },
        },
      },
      circle: {
        to: {
          shield: { duration: 2000, easingFunction: 'easeInOut' },
          scattered: { duration: 1500, easingFunction: 'easeOut' },
          diamond: { duration: 2500, easingFunction: 'easeInOut' },
        },
      },
      wedge: {
        to: {
          arrow: { duration: 1500, easingFunction: 'easeInOut' },
          spearhead: { duration: 2000, easingFunction: 'easeInOut' },
          line: { duration: 1500, easingFunction: 'easeInOut' },
        },
      },
      line: {
        to: {
          arrow: { duration: 1500, easingFunction: 'easeInOut' },
          wedge: { duration: 1500, easingFunction: 'easeInOut' },
          scattered: { duration: 1500, easingFunction: 'easeOut' },
        },
      },
      scattered: {
        to: {
          line: { duration: 1500, easingFunction: 'easeIn' },
          circle: { duration: 1500, easingFunction: 'easeIn' },
          shield: { duration: 2000, easingFunction: 'easeIn' },
        },
      },
    },
  },
};
