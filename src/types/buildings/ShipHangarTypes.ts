import { Tier } from "../core/GameTypes";
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
  bayUpgraded: {
    bayId: string;
    newTier: Tier;
    newCapacity: number;
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