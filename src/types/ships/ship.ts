// Core types that everything will use
export type FactionId = 'space-rats' | 'lost-nova' | 'equator-horizon';

export type ShipStatus = 'idle' | 'engaging' | 'patrolling' | 'retreating' | 'disabled';

export type ShipClass = 
  // Space Rats Ships
  | 'rat-king' | 'asteroid-marauder' | 'rogue-nebula' | 'rats-revenge' 
  | 'dark-sector-corsair' | 'wailing-wreck' | 'galactic-scourge'
  | 'plasma-fang' | 'vermin-vanguard' | 'black-void-buccaneer'
  // Lost Nova Ships
  | 'eclipse-scythe' | 'nulls-revenge' | 'dark-matter-reaper' | 'quantum-pariah'
  | 'entropy-scale' | 'void-revenant' | 'scythe-of-andromeda'
  | 'nebular-persistence' | 'oblivions-wake' | 'forbidden-vanguard'
  // Equator Horizon Ships
  | 'celestial-arbiter' | 'ethereal-galleon' | 'stellar-equinox' | 'chronos-sentinel'
  | 'nebulas-judgement' | 'aetherial-horizon' | 'cosmic-crusader'
  | 'balancekeepers-wrath' | 'ecliptic-watcher' | 'harmonys-vanguard';

// Weapon related types
export interface ShipWeaponStats {
  type: 'machineGun' | 'gaussCannon' | 'railGun' | 'MGSS' | 'rockets';
  damage: number;
  range: number;
  cooldown: number;
  accuracy: number;
  effects: WeaponEffect[];
}

export interface WeaponEffect {
  type: 'plasma' | 'spark' | 'gauss' | 'explosive';
  damage: number;
  duration: number;
  radius?: number;
}

// Ability related types
export interface ShipAbility {
  name: string;
  cooldown: number;
  duration: number;
  effect: AbilityEffect;
}

export interface AbilityEffect {
  type: 'stealth' | 'shield' | 'speed' | 'damage';
  magnitude: number;
  radius?: number;
}

// Core ship stats
export interface ShipStats {
  health: number;
  shield: number;
  armor: number;
  speed: number;
  turnRate: number;
  weapons: ShipWeaponStats[];
  abilities: ShipAbility[];
}

// UI display stats (used by ShipStats.tsx component)
export interface ShipDisplayStats {
  weapons: {
    damage: number;
    range: number;
    accuracy: number;
  };
  defense: {
    hull: number;
    shield: number;
    armor: number;
  };
  mobility: {
    speed: number;
    agility: number;
    jumpRange: number;
  };
  systems: {
    power: number;
    radar: number;
    efficiency: number;
  };
}

// Ship instance types
export interface FactionShip {
  id: string;
  name: string;
  faction: FactionId;
  class: ShipClass;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  tactics: 'aggressive' | 'defensive' | 'hit-and-run';
  specialAbility?: ShipAbility;
}

// Component prop types
export interface FactionShipProps {
  ship: FactionShip;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
  className?: string;
} 