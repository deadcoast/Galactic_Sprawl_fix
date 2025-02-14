import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { animationManager, AnimationState } from '../../managers/game/animationManager';

interface UseAnimationProps {
  id: string;
  sprite: PIXI.Sprite | null;
  textures: PIXI.Texture[];
  state: AnimationState;
  frameStart?: number;
  frameCount?: number;
  frameDelay?: number;
  loop?: boolean;
}

export function useAnimation({
  id,
  sprite,
  textures,
  state,
  frameStart = 0,
  frameCount = 4,
  frameDelay = 150,
  loop = true,
}: UseAnimationProps): void {
  const currentState = useRef(state);

  useEffect(() => {
    if (!sprite || textures.length === 0) return;

    // Register animation with initial config
    animationManager.registerAnimation(id, sprite, textures, {
      frameStart,
      frameCount,
      frameDelay,
      loop,
    });

    // Start initial animation
    animationManager.updateAnimationState(id, state);

    return () => {
      animationManager.stopAnimation(id);
    };
  }, [id, sprite, textures, frameStart, frameCount, frameDelay, loop]);

  useEffect(() => {
    if (state !== currentState.current) {
      currentState.current = state;
      animationManager.updateAnimationState(id, state);
    }
  }, [id, state]);
}
