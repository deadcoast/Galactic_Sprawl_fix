import { createAnimationFrameManager } from './D3AnimationFrameManager';

/**
 * Singleton instance of the animation frame manager to be used across the application
 */
export const animationFrameManager = createAnimationFrameManager({
  targetFps: 60,
  frameBudget: 16, // 16ms for 60fps
  autoPauseHidden: true,
  enableProfiling: true,
  debugMode: process.env.NODE_ENV === 'development',
});
