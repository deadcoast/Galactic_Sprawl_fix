export interface AIState {
  behaviorState: string;
  targetId?: string;
  fleetStrength: number;
  threatLevel: number;
  lastAction?: string;
  nextAction?: string;
  cooldowns: Record<string, number>;
}

export interface Formation {
  type: string;
  spacing: number;
  facing: number;
  cohesion: number;
  leaderUnit?: string;
}

export interface WeaponEffect {
  type: "machineGun" | "railGun" | "gaussCannon" | "rockets";
  status: string;
  damage: number;
  accuracy: number;
  firing: boolean;
}

export interface ShieldStatus {
  active: boolean;
  health: number;
  impact?: {
    x: number;
    y: number;
    intensity: number;
  };
}

export interface CombatStats {
  damageDealt: number;
  damageReceived: number;
  accuracy: number;
  evasion: number;
  killCount: number;
  assistCount: number;
  weaponEffects: WeaponEffect[];
  shieldStatus: ShieldStatus;
  thrusterIntensity: number;
}

export interface DebugState {
  aiState: AIState;
  formation?: Formation;
  position: { x: number; y: number };
  faction?: string;
  performance: {
    fps: number;
    updateTime: number;
    renderTime: number;
    activeEffects: number;
  };
  combatStats: CombatStats;
  systemState: {
    memory: number;
    activeUnits: number;
    activeProjectiles: number;
    activeCombatZones: number;
  };
  warnings: string[];
} 