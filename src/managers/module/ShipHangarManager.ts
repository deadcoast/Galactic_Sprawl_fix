import { v4 as uuidv4 } from 'uuid';
import { SHIP_BLUEPRINTS, ShipBlueprint } from '../../config/ShipBlueprints';
import { WeaponEffectType } from '../../effects/types_effects/WeaponEffects';
import { TypedEventEmitter } from '../../lib/events/EventEmitter';
import { ModuleEvent, moduleEventBus } from '../../lib/modules/ModuleEvents';
import {
  ShipHangarManager as IShipHangarManager,
  ShipBuildQueueItem,
  ShipBuildRequirements,
  ShipHangarBay,
  ShipHangarEvents,
  ShipHangarState,
  ShipUpgradeInfo,
  ShipUpgradeRequirement,
  ShipUpgradeStats,
  ShipVisualUpgrade,
} from '../../types/buildings/ShipHangarTypes';
import { Effect, Tier } from '../../types/core/GameTypes';
import { Officer } from '../../types/officers/OfficerTypes';
import { ResourceCost } from '../../types/resources/ResourceTypes';
import { CommonShip, CommonShipAbility, CommonShipStats } from '../../types/ships/CommonShipTypes';
import { PlayerShipCategory, PlayerShipClass } from '../../types/ships/PlayerShipTypes';
import {
  WeaponCategory,
  WeaponConfig,
  WeaponInstance,
  WeaponMount,
  WeaponMountPosition,
  WeaponMountSize,
  WeaponState,
  WeaponStats,
  WeaponStatus,
} from '../../types/weapons/WeaponTypes';
import { ResourceManager } from '../game/ResourceManager';
import { techTreeManager } from '../game/techTreeManager';
import { ResourceType } from './../../types/resources/ResourceTypes';
import { OfficerManager } from './OfficerManager';

// Extend CommonShip to include state
interface ShipWithState extends CommonShip {
  state: ShipState;
}

// Update ShipEffect to extend Effect properly
interface ShipEffect extends Effect {
  name: string;
  description: string;
  type: 'buff' | 'debuff' | 'status';
  magnitude: number;
  duration: number;
  active: boolean;
  cooldown: number;
  source?: {
    type: 'ability' | 'weapon' | 'module';
    id: string;
  };
}

// Add effect management to ship state
interface ShipState {
  activeEffects: ShipEffect[];
  effectHistory: {
    effect: ShipEffect;
    appliedAt: number;
    removedAt?: number;
  }[];
}

/**
 * Implementation of the Ship Hangar Manager
 * Handles ship production, docking, and hangar bay management
 */
export class ShipHangarManager
  extends TypedEventEmitter<ShipHangarEvents>
  implements IShipHangarManager
{
  private state: ShipHangarState;
  private resourceManager: ResourceManager;
  private officerManager: OfficerManager;
  private activeRepairs: Map<
    string,
    {
      timer: NodeJS.Timeout;
      resourceCost: ResourceCost[];
      startTime: number;
      duration: number;
    }
  > = new Map();
  private activeUpgrades: Map<
    string,
    {
      timer: NodeJS.Timeout;
      resourceCost: ResourceCost[];
      startTime: number;
      duration: number;
      targetStats: ShipUpgradeStats;
    }
  > = new Map();
  private activeAbilities: Map<
    string,
    {
      timer: NodeJS.Timeout;
      ability: CommonShipAbility;
      startTime: number;
    }
  > = new Map();
  private abilityCooldowns: Map<
    string,
    {
      timer: NodeJS.Timeout;
      endTime: number;
    }
  > = new Map();
  private bayMaintenanceTimers: Map<
    string,
    {
      timer: NodeJS.Timeout;
      lastMaintenance: number;
      efficiency: number;
    }
  > = new Map();
  private assignedOfficers: Map<string, string> = new Map(); // shipId -> officerId

  constructor(resourceManager: ResourceManager, officerManager: OfficerManager) {
    super();
    this.resourceManager = resourceManager;
    this.officerManager = officerManager;
    this.state = this.initializeState();
    this.setupEventListeners();

    // Subscribe to module events
    moduleEventBus.subscribe('MODULE_ACTIVATED', (event: ModuleEvent) => {
      if (event?.moduleType === 'hangar') {
        this.handleModuleActivation(event?.moduleId);
      }
    });

    moduleEventBus.subscribe('MODULE_DEACTIVATED', (event: ModuleEvent) => {
      if (event?.moduleType === 'hangar') {
        this.handleModuleDeactivation(event?.moduleId);
      }
    });

    moduleEventBus.subscribe('STATUS_CHANGED', (event: ModuleEvent) => {
      if (
        event?.moduleType === 'hangar' &&
        event?.data &&
        typeof event?.data === 'object' &&
        'status' in event.data
      ) {
        const status = String(event.data.status);
        this.handleModuleStatusChange(event.moduleId, status);
      }
    });
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
          status: 'available',
          efficiency: 1.0,
          lastMaintenance: Date.now(),
          maintenanceCost: [
            { type: ResourceType.ENERGY, amount: 10 },
            { type: ResourceType.MINERALS, amount: 5 },
          ],
        },
      ],
      maxQueueSize: 3,
      buildSpeedMultiplier: 1.0,
      resourceEfficiency: 1.0,
    };
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    techTreeManager.on('nodeUnlocked', ((event: {
      nodeId: string;
      node: { type: string; tier: number };
    }) => {
      if (event?.node.type === 'hangar') {
        this.handleTierUpgrade(event?.node.tier as Tier);
      }
    }) as (data: unknown) => void);
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

      // Add new bay with maintenance costs
      const newBay: ShipHangarBay = {
        id: uuidv4(),
        tier,
        capacity: 3 + (tier - 1) * 2,
        ships: [],
        status: 'available',
        efficiency: 1.0,
        lastMaintenance: Date.now(),
        maintenanceCost: [
          { type: ResourceType.ENERGY, amount: 10 * tier },
          { type: ResourceType.MINERALS, amount: 5 * tier },
        ],
      };
      this.state.bays.push(newBay);
      this.setupBayMaintenance(newBay);

      this.emit('tierUpgraded', {
        tier,
        unlockedShips: this.getUnlockedShipsForTier(tier),
      });
    }
  }

  /**
   * Handle module activation
   */
  private handleModuleActivation(moduleId: string): void {
    console.warn(`[ShipHangarManager] Module ${moduleId} activated`);
    const oldEfficiency = this.state.resourceEfficiency;
    const oldSpeed = this.state.buildSpeedMultiplier;

    // Increase resource efficiency when module is activated
    this.state.resourceEfficiency *= 0.9; // 10% reduction in resource costs
    this.state.buildSpeedMultiplier *= 1.1; // 10% increase in build speed

    console.warn(`[ShipHangarManager] Efficiency changes for module ${moduleId}:
      Resource Efficiency: ${oldEfficiency.toFixed(2)} -> ${this.state.resourceEfficiency.toFixed(2)}
      Build Speed: ${oldSpeed.toFixed(2)} -> ${this.state.buildSpeedMultiplier.toFixed(2)}`);
  }

  /**
   * Handle module deactivation
   */
  private handleModuleDeactivation(moduleId: string): void {
    console.warn(`[ShipHangarManager] Module ${moduleId} deactivated`);
    const oldEfficiency = this.state.resourceEfficiency;
    const oldSpeed = this.state.buildSpeedMultiplier;

    // Reset efficiency bonuses when module is deactivated
    this.state.resourceEfficiency /= 0.9; // Remove 10% reduction
    this.state.buildSpeedMultiplier /= 1.1; // Remove 10% increase

    console.warn(`[ShipHangarManager] Efficiency changes for module ${moduleId}:
      Resource Efficiency: ${oldEfficiency.toFixed(2)} -> ${this.state.resourceEfficiency.toFixed(2)}
      Build Speed: ${oldSpeed.toFixed(2)} -> ${this.state.buildSpeedMultiplier.toFixed(2)}`);
  }

  /**
   * Handle module status change
   */
  private handleModuleStatusChange(moduleId: string, status: string): void {
    console.warn(`[ShipHangarManager] Module ${moduleId} status changed to ${status}`);
    const oldEfficiency = this.state.resourceEfficiency;
    const oldSpeed = this.state.buildSpeedMultiplier;

    switch (status) {
      case 'optimized':
        // Additional efficiency bonus for optimized state
        this.state.resourceEfficiency *= 0.85; // 15% reduction in resource costs
        this.state.buildSpeedMultiplier *= 1.15; // 15% increase in build speed
        break;
      case 'degraded':
        // Penalty for degraded state
        this.state.resourceEfficiency /= 0.85; // Remove optimization bonus
        this.state.buildSpeedMultiplier /= 1.15; // Remove speed bonus
        break;
      default:
        // Reset to base values for other states
        this.state.resourceEfficiency = 1.0;
        this.state.buildSpeedMultiplier = 1.0;
        break;
    }

    console.warn(`[ShipHangarManager] Efficiency changes for module ${moduleId}:
      Resource Efficiency: ${oldEfficiency.toFixed(2)} -> ${this.state.resourceEfficiency.toFixed(2)}
      Build Speed: ${oldSpeed.toFixed(2)} -> ${this.state.buildSpeedMultiplier.toFixed(2)}`);
  }

  /**
   * Get unlocked ships for a tier
   */
  private getUnlockedShipsForTier(tier: Tier): PlayerShipClass[] {
    // This should be moved to a configuration file
    switch (tier) {
      case 1:
        return ['spitflare', 'void-dredger-miner', 'andromeda-cutter'];
      case 2:
        return ['star-schooner', 'orion-frigate'];
      case 3:
        return ['harbringer-galleon', 'midway-carrier', 'mother-earth-revenge'];
      default:
        return [];
    }
  }

  /**
   * Start building a ship
   */
  public startBuild(shipClass: PlayerShipClass): void {
    if (this.state.buildQueue.length >= this.state.maxQueueSize) {
      throw new Error('Build queue is full');
    }

    const requirements = this.getBuildRequirements(shipClass);

    // Check tier requirement
    if (requirements.tier > this.state.tier) {
      throw new Error(
        `Insufficient hangar tier. Required: ${requirements.tier}, Current: ${this.state.tier}`
      );
    }

    // Check tech requirements
    if (requirements.prerequisites?.technology) {
      const missingTech = requirements.prerequisites.technology.filter(
        techId => !techTreeManager.getNode(techId)?.unlocked
      );
      if (missingTech.length > 0) {
        throw new Error(`Missing required technologies: ${missingTech.join(', ')}`);
      }
    }

    // Check officer requirements
    if (requirements.prerequisites?.officers) {
      const { minLevel, specialization } = requirements.prerequisites.officers;

      // Find an assigned officer that meets the requirements
      let hasQualifiedOfficer = false;
      for (const [shipId, officerId] of Array.from(this.assignedOfficers.entries())) {
        const officer = this.officerManager.getOfficer(officerId);
        const ship = this.getDockedShips().find(s => s.id === shipId);
        if (
          officer &&
          ship &&
          officer.level >= minLevel &&
          officer.specialization === specialization &&
          ship.status === 'ready'
        ) {
          hasQualifiedOfficer = true;
          break;
        }
      }

      if (!hasQualifiedOfficer) {
        throw new Error(`Requires a level ${minLevel} ${specialization} officer`);
      }
    }

    // Check resources
    const canAfford = requirements.resourceCost.every(
      cost => this.resourceManager.getResourceAmount(cost.type) >= cost.amount
    );
    if (!canAfford) {
      throw new Error('Insufficient resources');
    }

    // Consume resources with efficiency bonus
    requirements.resourceCost.forEach(cost => {
      const adjustedAmount = Math.floor(cost.amount * this.state.resourceEfficiency);
      this.resourceManager.removeResource(cost.type, adjustedAmount);
    });

    // Create queue item with adjusted build time based on speed multiplier
    const queueItem: ShipBuildQueueItem = {
      id: uuidv4(),
      shipClass,
      progress: 0,
      startTime: Date.now(),
      duration: Math.floor(requirements.buildTime / this.state.buildSpeedMultiplier),
      resourceCost: requirements.resourceCost,
      tier: requirements.tier,
      status: 'building',
      totalPausedTime: 0,
    };

    this.state.buildQueue.push(queueItem);
    this.emit('buildStarted', { queueItem });
  }

  /**
   * Cancel a build in progress
   */
  public cancelBuild(queueItemId: string): void {
    const index = this.state.buildQueue.findIndex(item => item?.id === queueItemId);
    if (index === -1) {
      return;
    }

    const item = this.state.buildQueue[index];

    // Calculate refund based on progress
    const refundedResources = item?.resourceCost.map(cost => ({
      type: cost.type,
      amount: Math.floor(cost.amount * (1 - item?.progress) * 0.75), // 75% refund of remaining resources
    }));

    // Return resources
    refundedResources.forEach(refund => {
      this.resourceManager.addResource(refund.type, refund.amount);
    });

    this.state.buildQueue.splice(index, 1);
    this.emit('buildCancelled', { queueItemId, refundedResources });
  }

  /**
   * Pause a build in progress
   */
  public pauseBuild(queueItemId: string): void {
    const item = this.state.buildQueue.find(item => item?.id === queueItemId);
    if (!item || item?.status !== 'building') {
      throw new Error('Cannot pause: Invalid build or already paused');
    }

    item.status = 'paused';
    item.pausedAt = Date.now();
    this.emit('buildPaused', { queueItemId });
  }

  /**
   * Resume a paused build
   */
  public resumeBuild(queueItemId: string): void {
    const item = this.state.buildQueue.find(item => item?.id === queueItemId);
    if (!item || item?.status !== 'paused') {
      throw new Error('Cannot resume: Invalid build or not paused');
    }

    // Calculate total paused time
    if (item?.pausedAt) {
      item.totalPausedTime = (item.totalPausedTime ?? 0) + (Date.now() - item.pausedAt);
    }

    item.status = 'building';
    item.pausedAt = undefined;
    this.emit('buildResumed', { queueItemId });
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
    // Find the ship blueprint
    const blueprint = SHIP_BLUEPRINTS.find(bp => bp.shipClass === shipClass);
    if (!blueprint) {
      throw new Error(`No blueprint found for ship class: ${shipClass}`);
    }

    // Get base requirements from blueprint
    const requirements: ShipBuildRequirements = {
      tier: blueprint.requirements.tier,
      resourceCost: blueprint.requirements.resourceCost,
      buildTime: blueprint.requirements.buildTime,
      prerequisites: blueprint.requirements.prerequisites,
    };

    // Add tech tree requirements based on tier and category
    if (!requirements.prerequisites) {
      requirements.prerequisites = {};
    }

    if (!requirements.prerequisites.technology) {
      requirements.prerequisites.technology = [];
    }

    // Add base tech requirements based on tier
    switch (blueprint.tier) {
      case 3:
        requirements.prerequisites.technology.push('mega-hangar');
        break;
      case 2:
        requirements.prerequisites.technology.push('expanded-hangar');
        break;
      case 1:
        requirements.prerequisites.technology.push('basic-ship-hangar');
        break;
    }

    // Add category-specific tech requirements
    switch (blueprint.category) {
      case 'war':
        requirements.prerequisites.technology.push(
          blueprint.tier === 3
            ? 'advanced-weapons'
            : blueprint.tier === 2
              ? 'enhanced-weapons'
              : 'basic-weapons'
        );
        break;
      case 'recon':
        requirements.prerequisites.technology.push(
          blueprint.tier === 3
            ? 'quantum-recon'
            : blueprint.tier === 2
              ? 'enhanced-sensors'
              : 'basic-sensors'
        );
        break;
      case 'mining':
        requirements.prerequisites.technology.push(
          blueprint.tier === 3
            ? 'exotic-mining'
            : blueprint.tier === 2
              ? 'improved-extraction'
              : 'mining-lasers'
        );
        break;
    }

    return requirements;
  }

  /**
   * Dock a ship in an available bay
   */
  public dockShip(ship: CommonShip): void {
    const availableBays = this.getAvailableBays();
    if (availableBays.length === 0) {
      this.emit('error', { message: 'No available bays for docking' });
      return;
    }

    // Find the bay with the most space
    const targetBay = availableBays.reduce((prev, current) =>
      prev.capacity - prev.ships.length > current.capacity - current.ships.length ? prev : current
    );

    // Initialize ship stats if needed
    if (!ship.stats || Object.keys(ship.stats).length === 0) {
      const shipClass = this.getShipClass(ship);
      ship.stats = this.getBaseStats(shipClass);
    }

    targetBay.ships.push(ship);
    this.emit('shipDocked', { ship, bay: targetBay });
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
        bay.status = 'available';
        this.emit('shipLaunched', { ship, bay });
        return;
      }
    }
  }

  /**
   * Upgrade a hangar bay
   */
  public upgradeBay(bayId: string): void {
    const bay = this.state.bays.find(b => b.id === bayId);
    if (!bay || bay.tier >= this.state.tier) {
      return;
    }

    // Calculate upgrade costs
    const upgradeCosts: ResourceCost[] = [
      { type: ResourceType.MINERALS, amount: 100 * bay.tier },
      { type: ResourceType.ENERGY, amount: 50 * bay.tier },
    ];

    // Add plasma cost for higher tiers
    if (bay.tier >= 2) {
      upgradeCosts.push({ type: ResourceType.PLASMA, amount: 25 * bay.tier });
    }

    // Check if we can afford upgrade
    const canAfford = upgradeCosts.every(
      cost => this.resourceManager.getResourceAmount(cost.type) >= cost.amount
    );

    if (!canAfford) {
      throw new Error('Insufficient resources for bay upgrade');
    }

    // Consume resources
    upgradeCosts.forEach(cost => {
      this.resourceManager.removeResource(cost.type, cost.amount);
    });

    const newTier = (bay.tier + 1) as Tier;
    const newCapacity = bay.capacity + 2;

    // Update bay
    bay.tier = newTier;
    bay.capacity = newCapacity;
    bay.status = bay.ships.length >= newCapacity ? 'full' : 'available';
    bay.efficiency = Math.min(1.0, bay.efficiency + 0.2); // Bonus efficiency from upgrade
    bay.maintenanceCost = [
      { type: ResourceType.ENERGY, amount: 10 * newTier },
      { type: ResourceType.MINERALS, amount: 5 * newTier },
    ];

    // Reset maintenance timer with new values
    this.setupBayMaintenance(bay);

    this.emit('bayUpgraded', {
      bayId,
      newTier,
      newCapacity,
      newEfficiency: bay.efficiency,
    });
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
    return this.state.bays.filter(bay => bay.status === 'available');
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
  public update(): void {
    const now = Date.now();
    const completedItems: ShipBuildQueueItem[] = [];

    // Update progress for each building item
    this.state.buildQueue.forEach(item => {
      if (item?.status !== 'building') {
        return;
      }

      // Calculate elapsed time considering pauses
      const elapsedTime = now - item?.startTime - (item?.totalPausedTime ?? 0);
      const newProgress = Math.min(1, elapsedTime / item?.duration);

      if (newProgress !== item?.progress) {
        item.progress = newProgress;
        this.emit('buildProgressed', { queueItemId: item?.id, progress: newProgress });
      }

      // Check for completion
      if (newProgress >= 1) {
        item.status = 'completed';
        completedItems.push(item);
      }
    });

    // Handle completed items
    completedItems.forEach(item => {
      this.completeBuild(item);
      const index = this.state.buildQueue.indexOf(item);
      if (index !== -1) {
        this.state.buildQueue.splice(index, 1);
      }
    });
  }

  /**
   * Complete a ship build and assign it to a bay
   */
  private completeBuild(item: ShipBuildQueueItem): void {
    // Get ship blueprint
    const blueprint = SHIP_BLUEPRINTS.find((bp: ShipBlueprint) => bp.shipClass === item?.shipClass);
    if (!blueprint) {
      throw new Error(`No blueprint found for ship class: ${item?.shipClass}`);
    }

    // Find an available bay
    const availableBay = this.state.bays.find(
      bay => bay.status === 'available' && bay.ships.length < bay.capacity
    );
    if (!availableBay) {
      throw new Error('No available bay to dock the completed ship');
    }

    // Create the ship instance
    const ship: CommonShip = {
      id: uuidv4(),
      name: blueprint.name,
      category: blueprint.category,
      status: 'ready',
      stats: {
        health: blueprint.baseStats.hull,
        maxHealth: blueprint.baseStats.hull,
        shield: blueprint.baseStats.shield,
        maxShield: blueprint.baseStats.shield,
        energy: blueprint.baseStats.energy,
        maxEnergy: blueprint.baseStats.energy,
        speed: blueprint.baseStats.speed,
        turnRate: 2,
        cargo: blueprint.baseStats.cargo ?? 0,
        weapons: (blueprint.weapons ?? []).map(weapon =>
          this.createWeaponMount(weapon, blueprint.tier)
        ),
        abilities:
          blueprint.abilities?.map(ability => ({
            id: uuidv4(),
            name: ability.name,
            description: ability.description,
            cooldown: ability.cooldown,
            duration: ability.duration,
            active: false,
            effect: {
              id: uuidv4(),
              name: ability.name,
              description: ability.description,
              type: 'ability',
              magnitude: 1,
              duration: ability.duration,
              active: false,
              cooldown: ability.cooldown,
            },
          })) ?? [],
        defense: {
          armor: Math.floor(blueprint.baseStats.hull * 0.3),
          shield: blueprint.baseStats.shield,
          evasion: 0.2,
          regeneration: Math.floor(blueprint.baseStats.shield * 0.02),
        },
        mobility: {
          speed: blueprint.baseStats.speed,
          turnRate: 2,
          acceleration: blueprint.baseStats.speed * 0.5,
        },
      },
      abilities:
        blueprint.abilities?.map(ability => ({
          id: uuidv4(),
          name: ability.name,
          description: ability.description,
          cooldown: ability.cooldown,
          duration: ability.duration,
          active: false,
          effect: {
            id: uuidv4(),
            name: ability.name,
            description: ability.description,
            type: 'ability',
            magnitude: 1,
            duration: ability.duration,
            active: false,
            cooldown: ability.cooldown,
          },
        })) ?? [],
    };

    // Add ship to bay
    availableBay.ships.push(ship);
    if (availableBay.ships.length >= availableBay.capacity) {
      availableBay.status = 'full';
    }

    // Emit completion event
    this.emit('buildCompleted', { ship, bay: availableBay });
  }

  /**
   * Get ship class from ship
   */
  private getShipClass(ship: CommonShip): PlayerShipClass {
    // Map ship names to their corresponding class
    const classMap: Record<string, PlayerShipClass> = {
      'Harbringer Galleon': 'harbringer-galleon',
      'Midway Carrier': 'midway-carrier',
      "Mother Earth's Revenge": 'mother-earth-revenge',
      'Orion Frigate': 'orion-frigate',
      Spitflare: 'spitflare',
      'Star Schooner': 'star-schooner',
      'Void Dredger Miner': 'void-dredger-miner',
      'Andromeda Cutter': 'andromeda-cutter',
    };

    return classMap[ship.name] || 'spitflare'; // Default to spitflare if name not found
  }

  private getShipCategory(shipClass: PlayerShipClass): PlayerShipCategory {
    if (shipClass.includes('void-dredger')) {
      return 'mining';
    }
    if (shipClass.includes('andromeda') || shipClass.includes('schooner')) {
      return 'recon';
    }
    return 'war';
  }

  private createWeaponMount(
    weapon: { name: string; damage: number; range: number; cooldown: number },
    tier: number
  ): WeaponMount {
    const damageEffect: WeaponEffectType = {
      id: uuidv4(),
      type: 'damage',
      duration: 0,
      strength: weapon.damage,
      magnitude: weapon.damage,
      name: 'Direct Damage',
      description: 'Deals direct damage to target',
      damageType: 'physical',
      penetration: 0,
    };

    const weaponStats: WeaponStats = {
      damage: weapon.damage,
      range: weapon.range,
      accuracy: 0.8,
      rateOfFire: 1 / weapon.cooldown,
      energyCost: 5,
      cooldown: weapon.cooldown,
      effects: [damageEffect],
      special: {
        armorPenetration: 0,
        shieldDamageBonus: 0,
        areaOfEffect: 0,
        disableChance: 0,
      },
    };

    const weaponState: WeaponState = {
      status: 'ready' as WeaponStatus,
      currentStats: weaponStats,
      effects: [damageEffect],
      currentAmmo: undefined,
      maxAmmo: undefined,
    };

    const weaponInstance: WeaponInstance = {
      config: {
        id: weapon.name.toLowerCase().replace(/\s+/g, '-'),
        name: weapon.name,
        category: 'machineGun' as WeaponCategory,
        tier: tier,
        baseStats: weaponStats,
        visualAsset: `weapons/${weapon.name.toLowerCase().replace(/\s+/g, '-')}`,
        mountRequirements: {
          size: 'medium' as WeaponMountSize,
          power: 20,
        },
      },
      state: weaponState,
    };

    return {
      id: uuidv4(),
      size: 'medium' as WeaponMountSize,
      position: 'front' as WeaponMountPosition,
      rotation: 0,
      allowedCategories: ['machineGun' as WeaponCategory],
      currentWeapon: weaponInstance,
    };
  }

  private getBaseStats(shipClass: PlayerShipClass): CommonShipStats {
    const blueprint = SHIP_BLUEPRINTS.find((bp: ShipBlueprint) => bp.shipClass === shipClass);
    if (!blueprint) {
      throw new Error(`No blueprint found for ship class ${shipClass}`);
    }

    const weapons: WeaponMount[] = (blueprint.weapons ?? []).map(weapon =>
      this.createWeaponMount(weapon, blueprint.tier)
    );

    return {
      health: blueprint.baseStats.hull,
      maxHealth: blueprint.baseStats.hull,
      shield: blueprint.baseStats.shield,
      maxShield: blueprint.baseStats.shield,
      energy: blueprint.baseStats.energy,
      maxEnergy: blueprint.baseStats.energy,
      speed: blueprint.baseStats.speed,
      turnRate: 2,
      cargo: blueprint.baseStats.cargo ?? 0,
      weapons,
      abilities:
        blueprint.abilities?.map(ability => ({
          id: uuidv4(),
          name: ability.name,
          description: ability.description,
          cooldown: ability.cooldown,
          duration: ability.duration,
          active: false,
          effect: {
            id: uuidv4(),
            name: ability.name,
            description: ability.description,
            type: 'ability',
            magnitude: 1,
            duration: ability.duration,
            active: false,
            cooldown: ability.cooldown,
          },
        })) ?? [],
      defense: {
        armor: Math.floor(blueprint.baseStats.hull * 0.3),
        shield: blueprint.baseStats.shield,
        evasion: 0.2,
        regeneration: Math.floor(blueprint.baseStats.shield * 0.02),
      },
      mobility: {
        speed: blueprint.baseStats.speed,
        turnRate: 2,
        acceleration: blueprint.baseStats.speed * 0.5,
      },
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
    return this.getDockedShips().filter(ship => {
      const shipClass = this.getShipClass(ship);
      return this.getShipCategory(shipClass) === category;
    });
  }

  /**
   * Start repairing a ship
   */
  public startRepair(shipId: string): void {
    // Find the ship in any bay
    let targetShip: CommonShip | undefined;
    let targetBay: ShipHangarBay | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        targetShip = ship;
        targetBay = bay;
        break;
      }
    }

    if (!targetShip || !targetBay) {
      throw new Error('Ship not found in any bay');
    }

    if (targetShip.status !== 'damaged') {
      throw new Error('Ship does not need repairs');
    }

    // Calculate repair costs based on damage
    const healthDamage = targetShip.stats.maxHealth - targetShip.stats.health;
    const shieldDamage = targetShip.stats.maxShield - targetShip.stats.shield;
    const totalDamage = healthDamage + shieldDamage;

    const resourceCost: ResourceCost[] = [
      { type: ResourceType.MINERALS, amount: Math.ceil(totalDamage * 0.5) }, // Base mineral cost
      { type: ResourceType.ENERGY, amount: Math.ceil(totalDamage * 0.3) }, // Base energy cost
    ];

    // Add plasma cost for higher tier ships
    if (targetShip.stats.maxHealth >= 200) {
      // Higher tier ships have more health
      resourceCost.push({ type: ResourceType.PLASMA, amount: Math.ceil(totalDamage * 0.2) });
    }

    // Check if we have enough resources
    const canAfford = resourceCost.every(
      cost => this.resourceManager.getResourceAmount(cost.type) >= cost.amount
    );
    if (!canAfford) {
      throw new Error('Insufficient resources for repairs');
    }

    // Consume resources
    resourceCost.forEach(cost => {
      this.resourceManager.removeResource(cost.type, cost.amount);
    });

    // Calculate repair time based on damage and tier
    const baseRepairTime = 30000; // 30 seconds base time
    const damageMultiplier = totalDamage / targetShip.stats.maxHealth;
    const estimatedTime = Math.ceil(baseRepairTime * damageMultiplier);

    // Update ship status
    targetShip.status = 'repairing';

    // Start repair timer
    const repairTimer = setTimeout(() => {
      this.completeRepair(shipId);
    }, estimatedTime);

    // Store repair info
    this.activeRepairs.set(shipId, {
      timer: repairTimer,
      resourceCost,
      startTime: Date.now(),
      duration: estimatedTime,
    });

    // Emit event
    this.emit('repairStarted', {
      shipId,
      resourceCost,
      estimatedTime,
    });
  }

  /**
   * Cancel an ongoing repair
   */
  public cancelRepair(shipId: string): void {
    const repairInfo = this.activeRepairs.get(shipId);
    if (!repairInfo) {
      throw new Error('No active repair found for ship');
    }

    // Clear the timer
    clearTimeout(repairInfo.timer);

    // Calculate progress and refund resources
    const progress = Math.min(1, (Date.now() - repairInfo.startTime) / repairInfo.duration);
    const refundedResources = repairInfo.resourceCost.map(cost => ({
      type: cost.type,
      amount: Math.floor(cost.amount * (1 - progress) * 0.75), // 75% refund of remaining resources
    }));

    // Return resources
    refundedResources.forEach(refund => {
      this.resourceManager.addResource(refund.type, refund.amount);
    });

    // Find and update ship status
    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        ship.status = 'damaged';
        break;
      }
    }

    // Clean up
    this.activeRepairs.delete(shipId);

    // Emit event
    this.emit('repairCancelled', {
      shipId,
      refundedResources,
    });
  }

  /**
   * Complete a ship repair
   */
  private completeRepair(shipId: string): void {
    // Find the ship
    let repairedShip: CommonShip | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        repairedShip = ship;
        break;
      }
    }

    if (!repairedShip) {
      console.error('Ship not found for repair completion');
      return;
    }

    // Restore ship to full health
    repairedShip.stats.health = repairedShip.stats.maxHealth;
    repairedShip.stats.shield = repairedShip.stats.maxShield;
    repairedShip.status = 'ready';

    // Clean up
    this.activeRepairs.delete(shipId);

    // Emit event
    this.emit('repairCompleted', { shipId });
  }

  /**
   * Get upgrade info for a ship
   */
  public getUpgradeInfo(shipId: string): ShipUpgradeInfo | undefined {
    // Find the ship
    let targetShip: CommonShip | undefined;
    let targetBay: ShipHangarBay | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        targetShip = ship;
        targetBay = bay;
        break;
      }
    }

    if (!targetShip || !targetBay) {
      return undefined;
    }

    // Find the ship blueprint
    const blueprint = SHIP_BLUEPRINTS.find(bp => bp.shipClass === this.getShipClass(targetShip));
    if (!blueprint) {
      return undefined;
    }

    // Check if upgrade is available
    const upgradeAvailable = targetBay.tier < this.state.tier;

    // Calculate upgrade stats
    const stats: ShipUpgradeStats = {
      hull: {
        current: targetShip.stats.health,
        upgraded: Math.floor(targetShip.stats.health * 1.5),
      },
      shield: {
        current: targetShip.stats.shield,
        upgraded: Math.floor(targetShip.stats.shield * 1.5),
      },
      weapons: {
        current: 100,
        upgraded: 150,
      },
      speed: {
        current: targetShip.stats.speed,
        upgraded: Math.floor(targetShip.stats.speed * 1.2),
      },
    };

    // Calculate resource costs
    const resourceCost: ResourceCost[] = [
      { type: ResourceType.MINERALS, amount: Math.floor(targetShip.stats.health * 0.5) },
      { type: ResourceType.ENERGY, amount: Math.floor(targetShip.stats.shield * 0.5) },
    ];

    // Add plasma cost for higher tier upgrades
    if (targetBay.tier >= 2) {
      resourceCost.push({
        type: ResourceType.PLASMA,
        amount: Math.floor((targetShip.stats.health + targetShip.stats.shield) * 0.2),
      });
    }

    // Check tech requirements
    const requirements: ShipUpgradeRequirement[] = [];

    // Tech tree requirements
    if (blueprint.requirements.prerequisites?.technology) {
      blueprint.requirements.prerequisites.technology.forEach(tech => {
        requirements.push({
          type: 'tech',
          name: tech,
          met: techTreeManager.getNode(tech)?.unlocked || false,
        });
      });
    }

    // Resource requirements
    resourceCost.forEach(cost => {
      requirements.push({
        type: 'resource',
        name: `${cost.type}: ${cost.amount}`,
        met: this.resourceManager.getResourceAmount(cost.type) >= cost.amount,
      });
    });

    // Facility requirements
    requirements.push({
      type: 'facility',
      name: `Tier ${targetBay.tier + 1} Hangar Bay`,
      met: this.state.tier > targetBay.tier,
    });

    // Visual upgrades
    const visualUpgrades: ShipVisualUpgrade[] = [
      {
        name: 'Enhanced Hull Plating',
        description: 'Reinforced armor panels with improved damage resistance',
        preview: `ships/${targetShip.category}/tier${targetBay.tier + 1}/hull`,
      },
      {
        name: 'Advanced Shield Matrix',
        description: 'Upgraded shield emitters with better regeneration',
        preview: `ships/${targetShip.category}/tier${targetBay.tier + 1}/shield`,
      },
    ];

    return {
      shipId,
      tier: targetBay.tier as Tier,
      upgradeAvailable,
      requirements,
      stats,
      resourceCost,
      visualUpgrades,
    };
  }

  /**
   * Start upgrading a ship
   */
  public startUpgrade(shipId: string): void {
    const upgradeInfo = this.getUpgradeInfo(shipId);
    if (!upgradeInfo) {
      throw new Error('Ship not found or upgrade info not available');
    }

    if (!upgradeInfo.upgradeAvailable) {
      throw new Error('Ship is not eligible for upgrade');
    }

    // Check requirements
    if (!upgradeInfo.requirements.every(req => req.met)) {
      throw new Error('Not all upgrade requirements are met');
    }

    // Find the ship
    let targetShip: CommonShip | undefined;
    let targetBay: ShipHangarBay | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        targetShip = ship;
        targetBay = bay;
        break;
      }
    }

    if (!targetShip || !targetBay) {
      throw new Error('Ship not found in any bay');
    }

    // Consume resources
    upgradeInfo.resourceCost.forEach(cost => {
      this.resourceManager.removeResource(cost.type, cost.amount);
    });

    // Calculate upgrade time
    const baseUpgradeTime = 60000; // 1 minute base time
    const tierMultiplier = targetBay.tier;
    const estimatedTime = baseUpgradeTime * tierMultiplier;

    // Update ship status
    targetShip.status = 'upgrading';

    // Start upgrade timer
    const upgradeTimer = setTimeout(() => {
      this.completeUpgrade(shipId, upgradeInfo.stats);
    }, estimatedTime);

    // Store upgrade info
    this.activeUpgrades.set(shipId, {
      timer: upgradeTimer,
      resourceCost: upgradeInfo.resourceCost,
      startTime: Date.now(),
      duration: estimatedTime,
      targetStats: upgradeInfo.stats,
    });

    // Emit event
    this.emit('upgradeStarted', {
      shipId,
      resourceCost: upgradeInfo.resourceCost,
      estimatedTime,
    });
  }

  /**
   * Cancel an ongoing upgrade
   */
  public cancelUpgrade(shipId: string): void {
    const upgradeInfo = this.activeUpgrades.get(shipId);
    if (!upgradeInfo) {
      throw new Error('No active upgrade found for ship');
    }

    // Clear the timer
    clearTimeout(upgradeInfo.timer);

    // Calculate progress and refund resources
    const progress = Math.min(1, (Date.now() - upgradeInfo.startTime) / upgradeInfo.duration);
    const refundedResources = upgradeInfo.resourceCost.map(cost => ({
      type: cost.type,
      amount: Math.floor(cost.amount * (1 - progress) * 0.75), // 75% refund of remaining resources
    }));

    // Return resources
    refundedResources.forEach(refund => {
      this.resourceManager.addResource(refund.type, refund.amount);
    });

    // Find and update ship status
    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        ship.status = 'ready';
        break;
      }
    }

    // Clean up
    this.activeUpgrades.delete(shipId);

    // Emit event
    this.emit('upgradeCancelled', {
      shipId,
      refundedResources,
    });
  }

  /**
   * Complete a ship upgrade
   */
  private completeUpgrade(shipId: string, targetStats: ShipUpgradeStats): void {
    // Find the ship
    let upgradedShip: CommonShip | undefined;
    let upgradedBay: ShipHangarBay | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        upgradedShip = ship;
        upgradedBay = bay;
        break;
      }
    }

    if (!upgradedShip || !upgradedBay) {
      console.error('Ship not found for upgrade completion');
      return;
    }

    // Update ship stats
    upgradedShip.stats.health = targetStats.hull.upgraded;
    upgradedShip.stats.maxHealth = targetStats.hull.upgraded;
    upgradedShip.stats.shield = targetStats.shield.upgraded;
    upgradedShip.stats.maxShield = targetStats.shield.upgraded;
    upgradedShip.stats.speed = targetStats.speed.upgraded;
    upgradedShip.status = 'ready';

    // Update bay tier
    upgradedBay.tier = (upgradedBay.tier + 1) as Tier;

    // Clean up
    this.activeUpgrades.delete(shipId);

    // Emit event
    this.emit('upgradeCompleted', {
      shipId,
      newTier: upgradedBay.tier,
      stats: targetStats,
    });
  }

  /**
   * Apply ship effects when activating abilities
   */
  public activateAbility(shipId: string, abilityName: string): void {
    const ship = this.findShipById(shipId);
    if (!ship || !ship.abilities) {
      this.emit('error', { message: `Ship ${shipId} not found or has no abilities` });
      return;
    }

    const ability = ship.abilities.find(a => a.name === abilityName);
    if (!ability) {
      this.emit('error', { message: `Ability ${abilityName} not found on ship ${shipId}` });
      return;
    }

    // Check if ability is on cooldown
    const cooldownKey = `${shipId}-${abilityName}`;
    if (this.abilityCooldowns.has(cooldownKey)) {
      const remainingCooldown = this.getAbilityCooldown(shipId, abilityName);
      this.emit('error', {
        message: `Ability ${abilityName} is on cooldown for ${remainingCooldown}s`,
      });
      return;
    }

    // Apply ability effect
    if (ability.effect) {
      const shipWithState = ship as ShipWithState;
      // Create a ShipEffect from the ability's Effect
      const shipEffect: ShipEffect = {
        id: `${ability.id}-effect`,
        name: abilityName, // Use ability name since Effect doesn't have name
        description: `Effect of ${abilityName}`, // Use a generated description
        type: 'buff', // Default to buff
        magnitude: ability.effect.magnitude,
        duration: ability.effect.duration,
        active: true,
        cooldown: ability.effect.cooldown ?? 0,
        source: {
          type: 'ability',
          id: ability.id,
        },
      };
      this.applyShipEffect(shipWithState, shipEffect);
    }

    // Set up ability timer
    const timer = setTimeout(() => {
      this.deactivateAbility(shipId, abilityName);
    }, ability.duration * 1000);

    this.activeAbilities.set(`${shipId}-${abilityName}`, {
      timer,
      ability,
      startTime: Date.now(),
    });

    this.emit('abilityActivated', {
      shipId,
      abilityName,
      duration: ability.duration,
      effect: ability.effect,
    });
  }

  /**
   * Deactivate a ship's ability
   */
  private deactivateAbility(shipId: string, abilityName: string): void {
    // Find the ship
    let targetShip: CommonShip | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        targetShip = ship;
        break;
      }
    }

    if (!targetShip) {
      console.error('Ship not found for ability deactivation');
      return;
    }

    // Find and update the ability
    const ability = targetShip.abilities.find(a => a.name === abilityName);
    if (ability) {
      ability.active = false;
      ability.effect.active = false;
    }

    // Clean up active ability
    const activeKey = `${shipId}-${abilityName}`;
    const activeInfo = this.activeAbilities.get(activeKey);
    if (activeInfo) {
      clearTimeout(activeInfo.timer);
      this.activeAbilities.delete(activeKey);
    }

    // Emit event
    this.emit('abilityDeactivated', {
      shipId,
      abilityName,
    });
  }

  /**
   * Get ability cooldown info
   */
  public getAbilityCooldown(shipId: string, abilityName: string): number {
    const cooldownInfo = this.abilityCooldowns.get(`${shipId}-${abilityName}`);
    if (!cooldownInfo) {
      return 0;
    }

    const remainingTime = Math.max(0, cooldownInfo.endTime - Date.now());
    return Math.ceil(remainingTime / 1000);
  }

  /**
   * Get active abilities for a ship
   */
  public getActiveAbilities(shipId: string): string[] {
    const shipAbilities = Array.from(this.activeAbilities.entries()).filter(([key]) =>
      key.startsWith(`${shipId}-`)
    );

    return shipAbilities.map(([key]) => key.split('-')[1]);
  }

  /**
   * Cancel all active abilities for a ship
   */
  public cancelShipAbilities(shipId: string): void {
    // Find all active abilities for this ship
    const shipAbilities = Array.from(this.activeAbilities.entries()).filter(([key]) =>
      key.startsWith(`${shipId}-`)
    );

    // Deactivate each ability
    shipAbilities.forEach(([key]) => {
      const abilityName = key.split('-')[1];
      this.deactivateAbility(shipId, abilityName);
    });
  }

  /**
   * Get available weapons for a ship
   */
  public getAvailableWeapons(shipId: string): WeaponConfig[] {
    // Find the ship
    let targetShip: CommonShip | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        targetShip = ship;
        break;
      }
    }

    if (!targetShip) {
      throw new Error('Ship not found');
    }

    // Get ship blueprint
    const blueprint = SHIP_BLUEPRINTS.find(bp => bp.shipClass === this.getShipClass(targetShip));
    if (!blueprint) {
      return [];
    }

    // Return available weapons based on ship tier and requirements
    return (
      blueprint.weapons?.map(weapon => ({
        id: weapon.name.toLowerCase().replace(/\s+/g, '-'),
        name: weapon.name,
        category: 'machineGun' as WeaponCategory,
        tier: blueprint.tier,
        baseStats: {
          damage: weapon.damage,
          range: weapon.range,
          accuracy: 0.8,
          rateOfFire: 1 / weapon.cooldown,
          energyCost: 5,
          cooldown: weapon.cooldown,
          effects: [
            {
              id: uuidv4(),
              type: 'damage',
              duration: 0,
              magnitude: weapon.damage,
              strength: weapon.damage,
              name: 'Direct Damage',
              description: 'Deals direct damage to target',
              damageType: 'physical',
              penetration: 0,
            },
          ] as WeaponEffectType[],
        },
        visualAsset: `weapons/${weapon.name.toLowerCase().replace(/\s+/g, '-')}`,
        mountRequirements: {
          size: 'medium' as WeaponMountSize,
          power: 20,
        },
      })) ?? []
    );
  }

  /**
   * Equip a weapon to a ship's mount
   */
  public equipWeapon(shipId: string, mountId: string, weaponId: string): void {
    // Find the ship
    let targetShip: CommonShip | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        targetShip = ship;
        break;
      }
    }

    if (!targetShip) {
      throw new Error('Ship not found');
    }

    // Find the mount
    const mount = targetShip.stats.weapons.find(m => m.id === mountId);
    if (!mount) {
      throw new Error('Mount not found');
    }

    // Find the weapon config
    const availableWeapons = this.getAvailableWeapons(shipId);
    const weaponConfig = availableWeapons.find(w => w.id === weaponId);
    if (!weaponConfig) {
      throw new Error('Weapon not found');
    }

    // Check mount compatibility
    if (mount.size !== weaponConfig.mountRequirements.size) {
      throw new Error('Incompatible mount size');
    }

    if (!mount.allowedCategories.includes(weaponConfig.category)) {
      throw new Error('Incompatible weapon category');
    }

    // Create weapon instance
    mount.currentWeapon = {
      config: weaponConfig,
      state: {
        status: 'ready',
        currentStats: { ...weaponConfig.baseStats },
        effects: [
          {
            id: uuidv4(),
            type: 'damage',
            duration: 0,
            magnitude: weaponConfig.baseStats.damage,
            strength: weaponConfig.baseStats.damage,
            name: 'Direct Damage',
            description: 'Deals direct damage to target',
            damageType: 'physical',
            penetration: 0,
          },
        ] as WeaponEffectType[],
      },
    };

    // Emit event
    this.emit('weaponEquipped', {
      shipId,
      mountId,
      weaponId,
    });
  }

  /**
   * Unequip a weapon from a ship's mount
   */
  public unequipWeapon(shipId: string, mountId: string): void {
    // Find the ship
    let targetShip: CommonShip | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        targetShip = ship;
        break;
      }
    }

    if (!targetShip) {
      throw new Error('Ship not found');
    }

    // Find the mount
    const mount = targetShip.stats.weapons.find(m => m.id === mountId);
    if (!mount) {
      throw new Error('Mount not found');
    }

    if (!mount.currentWeapon) {
      throw new Error('No weapon equipped');
    }

    // Store weapon info for event
    const weaponId = mount.currentWeapon.config.id;

    // Remove weapon
    mount.currentWeapon = undefined;

    // Emit event
    this.emit('weaponUnequipped', {
      shipId,
      mountId,
      weaponId,
    });
  }

  /**
   * Get weapon loadout for a ship
   */
  public getWeaponLoadout(shipId: string): WeaponMount[] {
    // Find the ship
    let targetShip: CommonShip | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        targetShip = ship;
        break;
      }
    }

    if (!targetShip) {
      throw new Error('Ship not found');
    }

    return targetShip.stats.weapons;
  }

  /**
   * Set up maintenance timer for a bay
   */
  private setupBayMaintenance(bay: ShipHangarBay): void {
    // Clear existing timer if any
    const existingTimer = this.bayMaintenanceTimers.get(bay.id);
    if (existingTimer) {
      clearTimeout(existingTimer.timer);
    }

    // Set up new maintenance timer
    const maintenanceInterval = 300000; // 5 minutes
    const timer = setInterval(() => {
      this.performBayMaintenance(bay.id);
    }, maintenanceInterval);

    this.bayMaintenanceTimers.set(bay.id, {
      timer,
      lastMaintenance: bay.lastMaintenance,
      efficiency: bay.efficiency,
    });
  }

  /**
   * Perform maintenance on a bay
   */
  private performBayMaintenance(bayId: string): void {
    const bay = this.state.bays.find(b => b.id === bayId);
    if (!bay) {
      return;
    }

    // Check if we have enough resources for maintenance
    const canAfford = bay.maintenanceCost.every(cost => {
      const currentAmount = this.resourceManager.getResourceAmount(cost.type);
      return currentAmount >= cost.amount;
    });

    if (!canAfford) {
      // Reduce efficiency if maintenance is skipped
      bay.efficiency = Math.max(0.5, bay.efficiency - 0.1);
      this.emit('bayMaintenanceSkipped', {
        bayId,
        newEfficiency: bay.efficiency,
        reason: 'insufficient_resources',
      });
      return;
    }

    // Deduct maintenance costs
    bay.maintenanceCost.forEach(cost => {
      this.resourceManager.removeResource(cost.type, cost.amount);
    });

    // Update efficiency based on bay status
    const efficiencyBonus = this.getBayEfficiencyBonus(bay);
    bay.efficiency = Math.min(1.0, bay.efficiency + 0.1 * efficiencyBonus);
    bay.lastMaintenance = Date.now();

    this.emit('bayMaintained', {
      bayId,
      newEfficiency: bay.efficiency,
      maintenanceCost: bay.maintenanceCost,
    });
  }

  /**
   * Get bay efficiency bonus
   */
  private getBayEfficiencyBonus(bay: ShipHangarBay): number {
    // Base multiplier from tier
    const tierMultiplier = 1 + (bay.tier - 1) * 0.1; // 10% per tier

    // Efficiency factor
    const efficiencyFactor = bay.efficiency;

    // Capacity utilization bonus
    const utilizationBonus =
      bay.ships.length > 0 ? Math.min(1.2, 1 + (bay.ships.length / bay.capacity) * 0.2) : 1.0;

    return tierMultiplier * efficiencyFactor * utilizationBonus;
  }

  /**
   * Assign an officer to a ship
   */
  public assignOfficer(shipId: string, officerId: string): void {
    // Find the ship
    let targetShip: CommonShip | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        targetShip = ship;
        break;
      }
    }

    if (!targetShip) {
      throw new Error('Ship not found');
    }

    // Get the officer
    const officer = this.officerManager.getOfficer(officerId);
    if (!officer) {
      throw new Error('Officer not found');
    }

    // Check if officer is available
    if (officer.status !== 'available') {
      throw new Error('Officer is not available');
    }

    // Calculate bonuses based on officer skills and specialization
    const bonuses = this.calculateOfficerBonuses(officer, targetShip);

    // Assign officer
    this.assignedOfficers.set(shipId, officerId);
    this.officerManager.assignOfficer(officerId, shipId);

    // Apply bonuses to ship
    this.applyOfficerBonuses(targetShip, bonuses);

    // Emit event
    this.emit('officerAssigned', {
      shipId,
      officerId,
      bonuses,
    });
  }

  /**
   * Unassign an officer from a ship
   */
  public unassignOfficer(shipId: string): void {
    const officerId = this.assignedOfficers.get(shipId);
    if (!officerId) {
      return;
    }

    // Find the ship
    let targetShip: CommonShip | undefined;

    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        targetShip = ship;
        break;
      }
    }

    if (!targetShip) {
      return;
    }

    // Remove bonuses
    this.removeOfficerBonuses(targetShip);

    // Unassign officer
    this.assignedOfficers.delete(shipId);
    this.officerManager.assignOfficer(officerId, null as unknown as string);

    // Emit event
    this.emit('officerUnassigned', {
      shipId,
      officerId,
    });
  }

  /**
   * Calculate bonuses provided by an officer
   */
  private calculateOfficerBonuses(
    officer: Officer,
    ship: CommonShip
  ): {
    buildSpeed?: number;
    resourceEfficiency?: number;
    combatEffectiveness?: number;
  } {
    const bonuses = {
      buildSpeed: 0,
      resourceEfficiency: 0,
      combatEffectiveness: 0,
    };

    // Base bonuses from level
    const levelBonus = (officer.level - 1) * 0.05; // 5% per level

    // Specialization bonuses
    switch (officer.specialization) {
      case 'War':
        if (ship.category === 'war') {
          bonuses.combatEffectiveness = 0.2 + levelBonus; // 20% base + level bonus
          bonuses.buildSpeed = 0.1 + levelBonus; // 10% base + level bonus
        }
        break;
      case 'Mining':
        bonuses.resourceEfficiency = 0.2 + levelBonus; // 20% base + level bonus
        break;
      case 'Recon':
        bonuses.buildSpeed = 0.15 + levelBonus; // 15% base + level bonus
        bonuses.resourceEfficiency = 0.1 + levelBonus; // 10% base + level bonus
        break;
    }

    // Skill bonuses
    bonuses.combatEffectiveness += officer.skills.combat * 0.01; // 1% per combat skill
    bonuses.resourceEfficiency += officer.skills.technical * 0.01; // 1% per technical skill
    bonuses.buildSpeed += officer.skills.leadership * 0.01; // 1% per leadership skill

    return bonuses;
  }

  /**
   * Apply officer bonuses to a ship
   */
  private applyOfficerBonuses(
    ship: CommonShip,
    bonuses: {
      buildSpeed?: number;
      resourceEfficiency?: number;
      combatEffectiveness?: number;
    }
  ): void {
    if (bonuses.combatEffectiveness) {
      // Apply combat bonuses
      ship.stats.weapons?.forEach(mount => {
        if (mount.currentWeapon) {
          const stats = mount.currentWeapon.state.currentStats;
          stats.damage *= 1 + bonuses.combatEffectiveness!;
          stats.accuracy *= 1 + bonuses.combatEffectiveness! * 0.5;
        }
      });
    }

    // Store bonuses for build speed and resource efficiency
    ship.officerBonuses = bonuses;
  }

  /**
   * Remove officer bonuses from a ship
   */
  private removeOfficerBonuses(ship: CommonShip): void {
    if (!ship.officerBonuses) {
      return;
    }

    if (ship.officerBonuses.combatEffectiveness) {
      // Remove combat bonuses
      ship.stats.weapons?.forEach(mount => {
        if (mount.currentWeapon) {
          const stats = mount.currentWeapon.state.currentStats;
          stats.damage /= 1 + ship.officerBonuses!.combatEffectiveness!;
          stats.accuracy /= 1 + ship.officerBonuses!.combatEffectiveness! * 0.5;
        }
      });
    }

    // Clear stored bonuses
    delete ship.officerBonuses;
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Clear all repair timers
    this.activeRepairs.forEach((repair, shipId) => {
      clearTimeout(repair.timer);
      // Update ship status
      const ship = this.getDockedShips().find(s => s.id === shipId);
      if (ship) {
        ship.status = 'damaged'; // Revert to damaged state if repair was interrupted
      }
    });
    this.activeRepairs.clear();

    // Clear all upgrade timers
    this.activeUpgrades.forEach((upgrade, shipId) => {
      clearTimeout(upgrade.timer);
      // Revert ship status and refund resources for interrupted upgrades
      const ship = this.getDockedShips().find(s => s.id === shipId);
      if (ship) {
        ship.status = 'ready';
        // Refund 75% of remaining upgrade costs
        const remainingProgress = 1 - (Date.now() - upgrade.startTime) / upgrade.duration;
        upgrade.resourceCost.forEach(cost => {
          const refundAmount = Math.floor(cost.amount * remainingProgress * 0.75);
          this.resourceManager.addResource(cost.type, refundAmount);
        });
      }
    });
    this.activeUpgrades.clear();

    // Clear all ability timers
    this.activeAbilities.forEach((active, key) => {
      clearTimeout(active.timer);
      // Parse shipId and ability name from compound key
      const [shipId, abilityName] = key.split('-');
      const ship = this.getDockedShips().find(s => s.id === shipId);
      if (ship) {
        const ability = ship.abilities.find(a => a.name === abilityName);
        if (ability) {
          ability.active = false;
          ability.effect.active = false;
        }
      }
    });
    this.activeAbilities.clear();

    // Clear all cooldown timers
    this.abilityCooldowns.forEach((cooldown, key) => {
      clearTimeout(cooldown.timer);
      // Parse shipId and ability name from compound key
      const [shipId, abilityName] = key.split('-');
      const ship = this.getDockedShips().find(s => s.id === shipId);
      if (ship) {
        const ability = ship.abilities.find(a => a.name === abilityName);
        if (ability) {
          ability.effect.cooldown = 0; // Reset cooldown
        }
      }
    });
    this.abilityCooldowns.clear();

    // Clear all weapon states
    this.state.bays.forEach(bay => {
      bay.ships.forEach(ship => {
        ship.stats.weapons.forEach(mount => {
          if (mount.currentWeapon) {
            mount.currentWeapon.state.status = 'ready';
            // Ensure effects array exists
            if (!mount.currentWeapon.state.effects) {
              mount.currentWeapon.state.effects = [];
            }
          }
        });
      });
    });

    // Clear all bay maintenance timers
    this.bayMaintenanceTimers.forEach((info, bayId) => {
      clearTimeout(info.timer);
      // Update bay maintenance state
      const bay = this.state.bays.find(b => b.id === bayId);
      if (bay) {
        bay.lastMaintenance = info.lastMaintenance;
        bay.efficiency = info.efficiency;
        // Emit maintenance failed event since cleanup interrupts maintenance
        this.emit('bayMaintenanceFailed', {
          bayId,
          newEfficiency: bay.efficiency,
          requiredResources: bay.maintenanceCost,
        });
      }
    });
    this.bayMaintenanceTimers.clear();

    // Clean up officer assignments and remove bonuses
    for (const [shipId, officerId] of Array.from(this.assignedOfficers.entries())) {
      const ship = this.getDockedShips().find(s => s.id === shipId);
      if (ship) {
        this.removeOfficerBonuses(ship); // Remove any active bonuses
        this.officerManager.assignOfficer(officerId, null as unknown as string); // Free up the officer
      }
      this.unassignOfficer(shipId);
    }
    this.assignedOfficers.clear();
  }

  /**
   * Get all assigned officers
   */
  public getAssignedOfficers(): { shipId: string; officerId: string }[] {
    const assignments: { shipId: string; officerId: string }[] = [];
    for (const [shipId, officerId] of Array.from(this.assignedOfficers.entries())) {
      assignments.push({ shipId, officerId });
    }
    return assignments;
  }

  // Add effect handling methods
  /**
   * Apply an effect to a ship
   */
  private applyShipEffect(ship: ShipWithState, effect: ShipEffect): void {
    // Initialize ship state if needed
    if (!ship.state) {
      ship.state = { activeEffects: [], effectHistory: [] };
    }

    // Apply effect modifiers
    switch (effect.type) {
      case 'buff':
        if (effect.name.includes('damage')) {
          ship.stats.weapons?.forEach(mount => {
            if (mount.currentWeapon) {
              mount.currentWeapon.state.currentStats.damage *= 1 + effect.magnitude;
            }
          });
        }
        break;
      case 'debuff':
        if (effect.name.includes('shield')) {
          ship.stats.shield *= 1 - effect.magnitude;
        }
        break;
      case 'status':
        // Just track status effects
        break;
    }

    // Add to active effects
    ship.state.activeEffects.push(effect);
    ship.state.effectHistory.push({
      effect,
      appliedAt: Date.now(),
    });

    // Set up effect expiration
    if (effect.duration > 0) {
      setTimeout(() => {
        this.removeShipEffect(ship, effect);
      }, effect.duration * 1000);
    }
  }

  private removeShipEffect(ship: ShipWithState, effect: ShipEffect): void {
    if (!ship.state) {
      return;
    }

    // Remove effect modifiers
    switch (effect.type) {
      case 'buff':
        if (effect.name.includes('damage')) {
          ship.stats.weapons?.forEach(mount => {
            if (mount.currentWeapon) {
              mount.currentWeapon.state.currentStats.damage /= 1 + effect.magnitude;
            }
          });
        }
        break;
      case 'debuff':
        if (effect.name.includes('shield')) {
          ship.stats.shield /= 1 - effect.magnitude;
        }
        break;
    }

    // Remove from active effects
    ship.state.activeEffects = ship.state.activeEffects.filter(e => e !== effect);

    // Update history
    const historyEntry = ship.state.effectHistory.find(h => h.effect === effect && !h.removedAt);
    if (historyEntry) {
      historyEntry.removedAt = Date.now();
    }
  }

  public hasOfficerMeetingRequirements(minLevel: number, specialization: string): boolean {
    // Check all assigned officers for one that meets requirements
    for (const [_, officerId] of Array.from(this.assignedOfficers.entries())) {
      const officer = this.officerManager.getOfficer(officerId);
      if (officer && officer.level >= minLevel && officer.specialization === specialization) {
        return true;
      }
    }
    return false;
  }

  /**
   * Find a ship by ID across all bays
   */
  private findShipById(shipId: string): CommonShip | undefined {
    for (const bay of this.state.bays) {
      const ship = bay.ships.find(s => s.id === shipId);
      if (ship) {
        return ship;
      }
    }
    return undefined;
  }
}
