import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from '../lib/utils/EventEmitter';
import { moduleEventBus } from '../events/moduleEventBus';
import { techTreeManager } from './TechTreeManager';
import { ResourceManager } from '../lib/resources/ResourceManager';
import { Tier } from '../types/core/GameTypes';
import { ResourceCost } from '../types/resources/ResourceTypes';
import { PlayerShipClass, PlayerShipCategory } from '../types/ships/PlayerShipTypes';
import { CommonShip } from '../types/ships/CommonShipTypes';
import {
  ShipHangarManager as IShipHangarManager,
  ShipHangarState,
  ShipHangarEvents,
  ShipBuildQueueItem,
  ShipHangarBay,
  ShipBuildRequirements
} from '../types/buildings/ShipHangarTypes';

/**
 * Implementation of the Ship Hangar Manager
 * Handles ship production, docking, and hangar bay management
 */
export class ShipHangarManager extends EventEmitter<ShipHangarEvents> implements IShipHangarManager {
  private state: ShipHangarState;
  private resourceManager: ResourceManager;

  constructor(resourceManager: ResourceManager) {
    super();
    this.resourceManager = resourceManager;
    this.state = this.initializeState();
    this.setupEventListeners();
  }

  /**
   * Initialize hangar state
   */
  private initializeState(): ShipHangarState {
    return {
      tier: 1,
      buildQueue: [],
      bays: [
        {
          id: uuidv4(),
          tier: 1,
          capacity: 3,
          ships: [],
          status: "available"
        }
      ],
      maxQueueSize: 3,
      buildSpeedMultiplier: 1.0,
      resourceEfficiency: 1.0
    };
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    techTreeManager.on("nodeUnlocked", (event: { nodeId: string; node: any }) => {
      if (event.node.type === "hangar") {
        this.handleTierUpgrade(event.node.tier as Tier);
      }
    });

    moduleEventBus.on("MODULE_ACTIVATED", (event: { moduleType: string; moduleId: string }) => {
      if (event.moduleType === "hangar") {
        this.handleModuleActivation(event.moduleId);
      }
    });
  }

  /**
   * Handle tier upgrades
   */
  private handleTierUpgrade(tier: Tier): void {
    if (tier > this.state.tier) {
      this.state.tier = tier;
      this.state.maxQueueSize += 2;
      this.state.buildSpeedMultiplier *= 1.25;
      this.state.resourceEfficiency *= 0.9;

      // Add new bay
      const newBay: ShipHangarBay = {
        id: uuidv4(),
        tier,
        capacity: 3 + (tier - 1) * 2,
        ships: [],
        status: "available"
      };
      this.state.bays.push(newBay);

      this.emit("tierUpgraded", {
        tier,
        unlockedShips: this.getUnlockedShipsForTier(tier)
      });
    }
  }

  /**
   * Handle module activation
   */
  private handleModuleActivation(moduleId: string): void {
    // Handle any module-specific initialization
  }

  /**
   * Get unlocked ships for a tier
   */
  private getUnlockedShipsForTier(tier: Tier): PlayerShipClass[] {
    // This should be moved to a configuration file
    switch (tier) {
      case 1:
        return ["spitflare", "void-dredger-miner", "andromeda-cutter"];
      case 2:
        return ["star-schooner", "orion-frigate"];
      case 3:
        return ["harbringer-galleon", "midway-carrier", "mother-earth-revenge"];
      default:
        return [];
    }
  }

  /**
   * Start building a ship
   */
  public startBuild(shipClass: PlayerShipClass): void {
    if (this.state.buildQueue.length >= this.state.maxQueueSize) {
      throw new Error("Build queue is full");
    }

    const requirements = this.getBuildRequirements(shipClass);
    
    // Check resources
    const canAfford = requirements.resourceCost.every(cost => 
      this.resourceManager.getResourceAmount(cost.type) >= cost.amount
    );
    if (!canAfford) {
      throw new Error("Insufficient resources");
    }

    // Consume resources
    requirements.resourceCost.forEach(cost => {
      this.resourceManager.removeResource(cost.type, cost.amount);
    });

    // Create queue item
    const queueItem: ShipBuildQueueItem = {
      id: uuidv4(),
      shipClass,
      progress: 0,
      startTime: Date.now(),
      duration: requirements.buildTime,
      resourceCost: requirements.resourceCost,
      tier: requirements.tier
    };

    this.state.buildQueue.push(queueItem);
    this.emit("buildStarted", { queueItem });
  }

  /**
   * Cancel a build in progress
   */
  public cancelBuild(queueItemId: string): void {
    const index = this.state.buildQueue.findIndex(item => item.id === queueItemId);
    if (index === -1) return;

    const item = this.state.buildQueue[index];
    
    // Calculate refund based on progress
    const refundedResources = item.resourceCost.map(cost => ({
      type: cost.type,
      amount: Math.floor(cost.amount * (1 - item.progress) * 0.75) // 75% refund of remaining resources
    }));

    // Return resources
    refundedResources.forEach(refund => {
      this.resourceManager.addResource(refund.type, refund.amount);
    });

    this.state.buildQueue.splice(index, 1);
    this.emit("buildCancelled", { queueItemId, refundedResources });
  }

  /**
   * Pause a build in progress
   */
  public pauseBuild(queueItemId: string): void {
    const item = this.state.buildQueue.find(item => item.id === queueItemId);
    if (!item) return;

    // Implementation depends on how we want to handle paused builds
    // For now, we'll just keep track of the current progress
  }

  /**
   * Resume a paused build
   */
  public resumeBuild(queueItemId: string): void {
    const item = this.state.buildQueue.find(item => item.id === queueItemId);
    if (!item) return;

    // Implementation depends on how we want to handle paused builds
  }

  /**
   * Get the current build queue
   */
  public getBuildQueue(): ShipBuildQueueItem[] {
    return [...this.state.buildQueue];
  }

  /**
   * Get build requirements for a ship class
   */
  public getBuildRequirements(shipClass: PlayerShipClass): ShipBuildRequirements {
    // This should be moved to a configuration file
    const baseRequirements: ShipBuildRequirements = {
      tier: 1,
      resourceCost: [
        { type: 'minerals', amount: 100 },
        { type: 'energy', amount: 50 }
      ],
      buildTime: 60000 // 1 minute
    };

    // Adjust based on ship class
    switch (shipClass) {
      case "mother-earth-revenge":
      case "midway-carrier":
        baseRequirements.tier = 3;
        baseRequirements.resourceCost.forEach(cost => cost.amount *= 4);
        baseRequirements.buildTime *= 3;
        break;
      case "harbringer-galleon":
      case "orion-frigate":
      case "star-schooner":
        baseRequirements.tier = 2;
        baseRequirements.resourceCost.forEach(cost => cost.amount *= 2);
        baseRequirements.buildTime *= 2;
        break;
      default:
        // Base requirements for tier 1 ships
        break;
    }

    return baseRequirements;
  }

  /**
   * Dock a ship in an available bay
   */
  public dockShip(ship: CommonShip): void {
    const availableBay = this.state.bays.find(bay => 
      bay.status === "available" && bay.ships.length < bay.capacity
    );

    if (!availableBay) {
      throw new Error("No available docking bays");
    }

    availableBay.ships.push(ship);
    if (availableBay.ships.length === availableBay.capacity) {
      availableBay.status = "full";
    }

    this.emit("shipDocked", { ship, bay: availableBay });
  }

  /**
   * Launch a ship from its bay
   */
  public launchShip(shipId: string): void {
    for (const bay of this.state.bays) {
      const index = bay.ships.findIndex(ship => ship.id === shipId);
      if (index !== -1) {
        const ship = bay.ships[index];
        bay.ships.splice(index, 1);
        bay.status = "available";
        this.emit("shipLaunched", { ship, bay });
        return;
      }
    }
  }

  /**
   * Upgrade a hangar bay
   */
  public upgradeBay(bayId: string): void {
    const bay = this.state.bays.find(b => b.id === bayId);
    if (!bay || bay.tier >= this.state.tier) return;

    const newTier = (bay.tier + 1) as Tier;
    const newCapacity = bay.capacity + 2;

    bay.tier = newTier;
    bay.capacity = newCapacity;
    bay.status = bay.ships.length >= newCapacity ? "full" : "available";

    this.emit("bayUpgraded", { bayId, newTier, newCapacity });
  }

  /**
   * Get all hangar bays
   */
  public getBays(): ShipHangarBay[] {
    return [...this.state.bays];
  }

  /**
   * Get available hangar bays
   */
  public getAvailableBays(): ShipHangarBay[] {
    return this.state.bays.filter(bay => bay.status === "available");
  }

  /**
   * Get current hangar tier
   */
  public getCurrentTier(): Tier {
    return this.state.tier;
  }

  /**
   * Get current hangar state
   */
  public getState(): ShipHangarState {
    return { ...this.state };
  }

  /**
   * Update build progress
   */
  public update(deltaTime: number): void {
    // Update build queue
    for (const item of this.state.buildQueue) {
      item.progress += (deltaTime / item.duration) * this.state.buildSpeedMultiplier;

      if (item.progress >= 1) {
        this.completeBuild(item);
      } else {
        this.emit("buildProgressed", {
          queueItemId: item.id,
          progress: item.progress
        });
      }
    }

    // Remove completed builds
    this.state.buildQueue = this.state.buildQueue.filter(item => item.progress < 1);
  }

  /**
   * Complete a build
   */
  private completeBuild(item: ShipBuildQueueItem): void {
    // Create the ship (this should be moved to a ship factory)
    const ship: CommonShip = {
      id: uuidv4(),
      name: `${item.shipClass}-${Date.now()}`,
      category: this.getShipCategory(item.shipClass),
      status: "ready",
      stats: this.getBaseStats(item.shipClass),
      abilities: []
    };

    // Try to dock the ship
    try {
      this.dockShip(ship);
    } catch (error) {
      // If no bay is available, we might want to handle this differently
      console.error("No bay available for completed ship:", error);
    }
  }

  /**
   * Get ship category from class
   */
  private getShipCategory(shipClass: PlayerShipClass): PlayerShipCategory {
    if (shipClass.includes("void-dredger")) return "mining";
    if (shipClass.includes("andromeda") || shipClass.includes("schooner")) return "recon";
    return "war";
  }

  /**
   * Get base stats for a ship class
   */
  private getBaseStats(shipClass: PlayerShipClass): any {
    // This should be moved to a configuration file
    return {
      // Basic stats that all ships have
      health: 100,
      shield: 50,
      energy: 100,
      speed: 10
    };
  }

  /**
   * Get available ships
   */
  public getAvailableShips(category?: PlayerShipCategory): CommonShip[] {
    const ships = this.state.bays.flatMap(bay => bay.ships);
    if (category) {
      return ships.filter(ship => ship.category === category);
    }
    return ships;
  }

  /**
   * Get all docked ships
   */
  public getDockedShips(): CommonShip[] {
    return this.state.bays.flatMap(bay => bay.ships);
  }

  /**
   * Get ships by category
   */
  public getShipsByCategory(category: PlayerShipCategory): CommonShip[] {
    return this.getDockedShips().filter(ship => ship.category === category);
  }
} 