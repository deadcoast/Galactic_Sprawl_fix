import { Position } from '../core/GameTypes';

export interface Hazard {
  id: string;
  type: 'asteroids' | 'debris' | 'radiation' | 'anomaly';
  position: Position;
  radius: number;
  severity: 'low' | 'medium' | 'high';
  effect: {
    type: 'damage' | 'slow' | 'shield' | 'weapon';
    value: number;
  };
  movement?: {
    speed: number;
    direction: number;
  };
  particles?: number;
  vpr?: {
    type: Hazard['type'];
    severity: Hazard['severity'];
    effectType: Hazard['effect']['type'];
    visualTier: 1 | 2 | 3;
    animationSet: {
      idle: string;
      active: string;
      impact: string;
    };
    particleSystem: {
      density: number;
      color: string;
      pattern: 'circular' | 'radial' | 'directed';
    };
  };
} 