import { Tier, Effect } from "../core/GameTypes";
import { ResourceCost } from "../resources/ResourceTypes";
import { PlayerShipClass, PlayerShipCategory } from "../ships/PlayerShipTypes";
import { CommonShip } from "../ships/CommonShipTypes";

/**
 * Ship build queue item
 */
export interface ShipBuildQueueItem {
  id: string;
  shipClass: PlayerShipClass;
  progress: number;
  startTime: number;
  duration: number;
  resourceCost: ResourceCost[];
  tier: Tier;
  status: 'building' | 'paused' | 'completed';
  pausedAt?: number;
  totalPausedTime?: number;
}

/**
 * Ship hangar bay
 */
export interface ShipHangarBay {
  id: string;
  tier: Tier;
  capacity: number;
  ships: CommonShip[];
  status: "available" | "full" | "upgrading";
  efficiency: number;
  lastMaintenance: number;
  maintenanceCost: ResourceCost[];
}

/**
 * Ship hangar state
 */
export interface ShipHangarState {
  tier: Tier;
  buildQueue: ShipBuildQueueItem[];
  bays: ShipHangarBay[];
  maxQueueSize: number;
  buildSpeedMultiplier: number;
  resourceEfficiency: number;
}

/**
 * Ship upgrade requirements
 */
export interface ShipUpgradeRequirement {
  type: "tech" | "resource" | "facility";
  name: string;
  met: boolean;
}

/**
 * Ship upgrade stats
 */
export interface ShipUpgradeStats {
  hull: {
    current: number;
    upgraded: number;
  };
  shield: {
    current: number;
    upgraded: number;
  };
  weapons: {
    current: number;
    upgraded: number;
  };
  speed: {
    current: number;
    upgraded: number;
  };
}

/**
 * Ship visual upgrade
 */
export interface ShipVisualUpgrade {
  name: string;
  description: string;
  preview: string;
}

/**
 * Ship upgrade info
 */
export interface ShipUpgradeInfo {
  shipId: string;
  tier: Tier;
  upgradeAvailable: boolean;
  requirements: ShipUpgradeRequirement[];
  stats: ShipUpgradeStats;
  resourceCost: ResourceCost[];
  visualUpgrades: ShipVisualUpgrade[];
}

/**
 * Ship hangar events
 */
export interface ShipHangarEvents {
  buildStarted: {
    queueItem: ShipBuildQueueItem;
  };
  buildCompleted: {
    ship: CommonShip;
    bay: ShipHangarBay;
  };
  buildCancelled: {
    queueItemId: string;
    refundedResources: ResourceCost[];
  };
  buildProgressed: {
    queueItemId: string;
    progress: number;
  };
  buildPaused: {
    queueItemId: string;
  };
  buildResumed: {
    queueItemId: string;
  };
  bayUpgraded: {
    bayId: string;
    newTier: Tier;
    newCapacity: number;
    newEfficiency: number;
  };
  bayMaintained: {
    bayId: string;
    newEfficiency: number;
    maintenanceCost: ResourceCost[];
  };
  bayMaintenanceFailed: {
    bayId: string;
    newEfficiency: number;
    requiredResources: ResourceCost[];
  };
  shipDocked: {
    ship: CommonShip;
    bay: ShipHangarBay;
  };
  shipLaunched: {
    ship: CommonShip;
    bay: ShipHangarBay;
  };
  tierUpgraded: {
    tier: Tier;
    unlockedShips: PlayerShipClass[];
  };
  repairStarted: {
    shipId: string;
    resourceCost: ResourceCost[];
    estimatedTime: number;
  };
  repairCompleted: {
    shipId: string;
  };
  repairCancelled: {
    shipId: string;
    refundedResources: ResourceCost[];
  };
  upgradeStarted: {
    shipId: string;
    resourceCost: ResourceCost[];
    estimatedTime: number;
  };
  upgradeCompleted: {
    shipId: string;
    newTier: Tier;
    stats: ShipUpgradeStats;
  };
  upgradeCancelled: {
    shipId: string;
    refundedResources: ResourceCost[];
  };
  abilityActivated: {
    shipId: string;
    abilityName: string;
    duration: number;
    effect: Effect;
  };
  abilityDeactivated: {
    shipId: string;
    abilityName: string;
  };
  weaponEquipped: {
    shipId: string;
    mountId: string;
    weaponId: string;
  };
  weaponUnequipped: {
    shipId: string;
    mountId: string;
    weaponId: string;
  };
  officerAssigned: {
    shipId: string;
    officerId: string;
    bonuses: {
      buildSpeed?: number;
      resourceEfficiency?: number;
      combatEffectiveness?: number;
    };
  };
  officerUnassigned: {
    shipId: string;
    officerId: string;
  };
}

/**
 * Ship build requirements
 */
export interface ShipBuildRequirements {
  tier: Tier;
  resourceCost: ResourceCost[];
  buildTime: number;
  prerequisites?: {
    technology?: string[];
    resources?: ResourceCost[];
    officers?: {
      minLevel: number;
      specialization: string;
    };
  };
}

/**
 * Ship hangar manager interface
 */
export interface ShipHangarManager {
  // Build queue management
  startBuild(shipClass: PlayerShipClass): void;
  cancelBuild(queueItemId: string): void;
  pauseBuild(queueItemId: string): void;
  resumeBuild(queueItemId: string): void;
  getBuildQueue(): ShipBuildQueueItem[];
  getBuildRequirements(shipClass: PlayerShipClass): ShipBuildRequirements;

  // Bay management
  dockShip(ship: CommonShip): void;
  launchShip(shipId: string): void;
  upgradeBay(bayId: string): void;
  getBays(): ShipHangarBay[];
  getAvailableBays(): ShipHangarBay[];

  // State management
  getCurrentTier(): Tier;
  getState(): ShipHangarState;
  update(deltaTime: number): void;

  // Ship management
  getAvailableShips(category?: PlayerShipCategory): CommonShip[];
  getDockedShips(): CommonShip[];
  getShipsByCategory(category: PlayerShipCategory): CommonShip[];
} 