import * as PIXI from 'pixi.js';

export type AnimationState = 'idle' | 'engaging' | 'retreating' | 'damaged' | 'patrolling' | 'disabled';

interface AnimationConfig {
  frameStart: number;
  frameCount: number;
  frameDelay: number;
  loop?: boolean;
}

interface AnimationInstance {
  sprite: PIXI.Sprite;
  textures: PIXI.Texture[];
  currentFrame: number;
  config: AnimationConfig;
  animationFrameId?: number;
}

export class AnimationManager {
  private static instance: AnimationManager;
  private animations: Map<string, AnimationInstance> = new Map();

  private constructor() {}

  public static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  public registerAnimation(
    id: string,
    sprite: PIXI.Sprite,
    textures: PIXI.Texture[],
    config: AnimationConfig
  ): void {
    if (this.animations.has(id)) {
      this.stopAnimation(id);
    }

    this.animations.set(id, {
      sprite,
      textures,
      currentFrame: 0,
      config,
    });
  }

  public startAnimation(id: string): void {
    const animation = this.animations.get(id);
    if (!animation) return;

    const animate = () => {
      const { sprite, textures, config } = animation;
      const frameIndex = config.frameStart + (animation.currentFrame % config.frameCount);
      
      if (sprite && textures[frameIndex]) {
        sprite.texture = textures[frameIndex];
      }

      animation.currentFrame++;

      // Handle looping
      if (!config.loop && animation.currentFrame >= config.frameCount) {
        this.stopAnimation(id);
        return;
      }

      animation.animationFrameId = requestAnimationFrame(() => {
        setTimeout(animate, config.frameDelay);
      });
    };

    // Start the animation
    animate();
  }

  public stopAnimation(id: string): void {
    const animation = this.animations.get(id);
    if (animation?.animationFrameId) {
      cancelAnimationFrame(animation.animationFrameId);
      animation.animationFrameId = undefined;
    }
  }

  public updateAnimationState(id: string, state: AnimationState): void {
    const animation = this.animations.get(id);
    if (!animation) return;

    // Stop current animation
    this.stopAnimation(id);

    // Configure new animation based on state
    let config: AnimationConfig;
    switch (state) {
      case 'idle':
        config = { frameStart: 0, frameCount: 4, frameDelay: 150, loop: true };
        break;
      case 'engaging':
        config = { frameStart: 4, frameCount: 4, frameDelay: 100, loop: true };
        break;
      case 'retreating':
        config = { frameStart: 8, frameCount: 4, frameDelay: 120, loop: true };
        break;
      case 'damaged':
        config = { frameStart: 12, frameCount: 4, frameDelay: 200, loop: true };
        break;
      case 'patrolling':
        config = { frameStart: 0, frameCount: 4, frameDelay: 200, loop: true };
        break;
      case 'disabled':
        config = { frameStart: 12, frameCount: 1, frameDelay: 0, loop: false };
        break;
      default:
        config = { frameStart: 0, frameCount: 4, frameDelay: 150, loop: true };
    }

    // Update animation config
    animation.config = config;
    animation.currentFrame = 0;

    // Start new animation
    this.startAnimation(id);
  }

  public destroy(): void {
    // Stop all animations
    for (const [id] of this.animations) {
      this.stopAnimation(id);
    }
    this.animations.clear();
  }
}

// Export singleton instance
export const animationManager = AnimationManager.getInstance(); 