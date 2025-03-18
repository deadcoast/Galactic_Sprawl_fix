interface AnimationSet {
  idle: string;
  active: string;
  impact: string;
}

// Define a specific interface for VPR state
interface VPRState {
  active: boolean;
  animationState?: 'idle' | 'active' | 'impact';
  intensity?: number;
  duration?: number;
  customClass?: string;
}

export function useVPR() {
  const getVPRAnimationSet = (type: string, tier: number): AnimationSet => {
    // Base animations
    const baseSet: AnimationSet = {
      idle: 'animate-pulse',
      active: 'animate-float',
      impact: 'animate-impact',
    };

    // Customize animations based on type
    let typeModifiers: Partial<AnimationSet> = {};

    switch (type) {
      case 'shield':
        typeModifiers = {
          idle: 'text-blue-400',
          active: 'text-blue-300',
          impact: 'text-blue-200',
        };
        break;
      case 'weapon':
        typeModifiers = {
          idle: 'text-red-400',
          active: 'text-red-300',
          impact: 'text-red-200',
        };
        break;
      case 'engine':
        typeModifiers = {
          idle: 'text-green-400',
          active: 'text-green-300',
          impact: 'text-green-200',
        };
        break;
      case 'sensor':
        typeModifiers = {
          idle: 'text-purple-400',
          active: 'text-purple-300',
          impact: 'text-purple-200',
        };
        break;
      default:
        // No type-specific modifiers for unknown types
        break;
    }

    // Apply type modifiers to base set
    const typeModifiedSet: AnimationSet = {
      idle: `${baseSet.idle} ${typeModifiers.idle || ''}`,
      active: `${baseSet.active} ${typeModifiers.active || ''}`,
      impact: `${baseSet.impact} ${typeModifiers.impact || ''}`,
    };

    // Enhance animations based on tier
    switch (tier) {
      case 2:
        return {
          idle: `${typeModifiedSet.idle} opacity-80`,
          active: `${typeModifiedSet.active} scale-110`,
          impact: `${typeModifiedSet.impact} duration-700`,
        };
      case 3:
        return {
          idle: `${typeModifiedSet.idle} opacity-90 scale-110`,
          active: `${typeModifiedSet.active} scale-125`,
          impact: `${typeModifiedSet.impact} duration-500`,
        };
      default:
        return typeModifiedSet;
    }
  };

  const updateVPR = (elementId: string, newState: VPRState) => {
    // This would be used to update VPR state in a real implementation
    console.warn('Updating VPR for:', elementId, newState);
  };

  return {
    getVPRAnimationSet,
    updateVPR,
  };
}
