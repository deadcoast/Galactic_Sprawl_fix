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

    // Enhance animations based on tier
    switch (tier) {
      case 2:
        return {
          idle: `${baseSet.idle} opacity-80`,
          active: `${baseSet.active} scale-110`,
          impact: `${baseSet.impact} duration-700`,
        };
      case 3:
        return {
          idle: `${baseSet.idle} opacity-90 scale-110`,
          active: `${baseSet.active} scale-125`,
          impact: `${baseSet.impact} duration-500`,
        };
      default:
        return baseSet;
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
