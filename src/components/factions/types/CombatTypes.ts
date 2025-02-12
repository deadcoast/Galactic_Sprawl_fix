export type WeaponCategory = 
  | 'machineGun'
  | 'gaussCannon'
  | 'railGun'
  | 'mgss'
  | 'rockets';

export type WeaponVariant = 
  // Machine Gun variants
  | 'basic'
  | 'plasmaRounds'
  | 'sparkRounds'
  // Gauss Cannon variants
  | 'gaussPlaner'
  | 'recirculatingGauss'
  // Rail Gun variants
  | 'lightShot'
  | 'maurader'
  // MGSS variants
  | 'engineAssistedSpool'
  | 'slugMGSS'
  // Rocket variants
  | 'emprRockets'
  | 'swarmRockets'
  | 'bigBangRockets';

export interface WeaponStats {
  damage: number;
  rateOfFire: number;
  range: number;
  accuracy: number;
  energyCost: number;
  special?: {
    armorPenetration?: number;
    shieldDamageBonus?: number;
    areaOfEffect?: number;
    disableChance?: number;
  };
}

export interface WeaponType {
  id: string;
  category: WeaponCategory;
  variant: WeaponVariant;
  stats: WeaponStats;
  visualAsset: string;
}

export interface CombatState {
  inCombat: boolean;
  targetId?: string;
  currentWeapon?: WeaponType;
  combatMetrics: {
    damageDealt: number;
    damageReceived: number;
    shieldsRemaining: number;
    hitAccuracy: number;
  };
}

export interface CombatAction {
  type: 'attack' | 'defend' | 'evade' | 'support';
  sourceId: string;
  targetId?: string;
  weapon?: WeaponType;
  timestamp: number;
}

export interface CombatResult {
  success: boolean;
  damage?: number;
  effects?: {
    disabled?: boolean;
    shieldDamage?: number;
    areaEffect?: {
      radius: number;
      damage: number;
    };
  };
} 