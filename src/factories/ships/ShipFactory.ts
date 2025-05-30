import { v4 as uuidv4 } from 'uuid';
import { SHIP_BLUEPRINTS, ShipBlueprint } from '../../config/ShipBlueprints';
import { getShipStats, SHIP_STATS } from '../../config/ships/shipStats';
import { moduleEventBus } from '../../lib/events/ModuleEventBus';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position, Tier, Velocity } from '../../types/core/GameTypes';
import { EventType } from '../../types/events/EventTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { CommonShipAbility, CommonShipStats, ShipCargo } from '../../types/ships/CommonShipTypes';
import { FactionShipClass, FactionShipStats } from '../../types/ships/FactionShipTypes';
import { FactionId } from '../../types/ships/FactionTypes';
import { PlayerShipClass } from '../../types/ships/PlayerShipTypes';
import {
  BaseShip,
  CombatShip,
  DetailedShipStats,
  isBlueprintWeaponData,
  isEmptyWeaponMount,
  isWeaponMountWithWeapon,
  MiningShip,
  ReconShip,
  ShipCategory,
  UnifiedShip,
  UnifiedShipStatus,
  WeaponDataSource,
} from '../../types/ships/UnifiedShipTypes';
import {
  WeaponCategory,
  WeaponConfig,
  WeaponInstance,
  WeaponMount,
  WeaponMountPosition,
  WeaponMountSize,
  WeaponState,
  WeaponStats,
} from '../../types/weapons/WeaponTypes';
import { createDamageEffect } from '../../utils/weapons/weaponEffectUtils';

interface CreateShipOptions {
  id?: string;
  name?: string;
  factionId?: FactionId;
  position: Position;
  rotation?: number;
  velocity?: Velocity;
  level?: number;
  status?: UnifiedShipStatus;
}

export class ShipFactory {
  private static instance: ShipFactory;

  private constructor() {}

  public static getInstance(): ShipFactory {
    if (!ShipFactory.instance) {
      ShipFactory.instance = new ShipFactory();
    }
    return ShipFactory.instance;
  }

  public createShip(
    shipClass: PlayerShipClass | FactionShipClass,
    options: CreateShipOptions
  ): UnifiedShip {
    const blueprint = this.findBlueprint(shipClass);
    const factionStats = getShipStats(shipClass as FactionShipClass);

    if (!blueprint && !factionStats) {
      throw new Error(`No blueprint or stats found for ship class: ${shipClass}`);
    }

    const commonStats = this.buildCommonStats(blueprint, factionStats);
    const effectiveName = options.name || blueprint?.name || factionStats?.name || 'Unknown Ship';
    const effectiveCategory =
      (blueprint?.category as ShipCategory) ?? factionStats?.category ?? ShipCategory.FIGHTER;
    const effectiveTier = blueprint?.tier ?? factionStats?.tier ?? 1;
    const effectiveAbilities = blueprint?.abilities ?? factionStats?.abilities ?? [];

    const baseShip: BaseShip = {
      id: options.id || uuidv4(),
      name: effectiveName,
      category: effectiveCategory,
      status: options.status || UnifiedShipStatus.IDLE,
      position: options.position,
      rotation: options.rotation ?? 0,
      velocity: options.velocity ?? { dx: 0, dy: 0 },
      faction: options.factionId ?? factionStats?.faction,
      tier: effectiveTier,
      level: options.level,
      stats: commonStats,
      abilities: effectiveAbilities.map(
        (ability): CommonShipAbility => ({
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
            type: 'buff',
            magnitude: 1,
            duration: ability.duration,
            active: false,
            cooldown: ability.cooldown,
          },
        })
      ),
      fuel: commonStats.maxEnergy,
      maxFuel: commonStats.maxEnergy,
      crew: 0,
      maxCrew: 10,
    };

    let ship: UnifiedShip;

    switch (baseShip.category) {
      case ShipCategory.WAR:
      case ShipCategory.FIGHTER:
      case ShipCategory.CRUISER:
      case ShipCategory.BATTLESHIP:
      case ShipCategory.CARRIER:
        ship = this.createCombatShip(baseShip, shipClass, blueprint, factionStats);
        break;
      case ShipCategory.MINING:
        ship = this.createMiningShip(baseShip, shipClass, blueprint, factionStats);
        break;
      case ShipCategory.RECON:
      case ShipCategory.SCOUT:
        ship = this.createReconShip(baseShip, shipClass, blueprint, factionStats);
        break;
      case ShipCategory.TRANSPORT:
        ship = { ...baseShip, category: ShipCategory.TRANSPORT };
        break;
      default:
        console.warn(`Unknown ship category: ${baseShip.category}. Creating base ship.`);
        ship = baseShip as UnifiedShip;
    }

    moduleEventBus.emit({
      type: EventType.MODULE_CREATED,
      moduleId: ship.id,
      moduleType: 'ship' as ModuleType,
      timestamp: Date.now(),
      data: { ship },
    });

    return ship;
  }

  private findBlueprint(shipClass: PlayerShipClass | FactionShipClass): ShipBlueprint | undefined {
    const playerBlueprint = SHIP_BLUEPRINTS.find(bp => bp.shipClass === shipClass);
    if (playerBlueprint) return playerBlueprint;

    if (shipClass in SHIP_STATS) {
      const stats = SHIP_STATS[shipClass as FactionShipClass];
      console.warn(
        `No specific blueprint found for FactionShipClass: ${shipClass}. Using stats:`,
        stats
      );
      return undefined;
    }

    return undefined;
  }

  private buildCommonStats(
    blueprint: ShipBlueprint | undefined,
    factionStats: FactionShipStats
  ): CommonShipStats {
    const base = blueprint?.baseStats;
    const weaponDataSource = blueprint?.weapons ?? factionStats?.weapons ?? [];
    const weapons = weaponDataSource.map(weapon =>
      this.createWeaponMount(weapon as WeaponDataSource, blueprint?.tier ?? factionStats?.tier ?? 1)
    );

    let cargoCapacity: number | undefined;
    const sourceCargo = factionStats?.cargo ?? base?.cargo;
    if (typeof sourceCargo === 'number') {
      cargoCapacity = sourceCargo;
    } else if (
      typeof sourceCargo === 'object' &&
      sourceCargo !== null &&
      'capacity' in sourceCargo
    ) {
      cargoCapacity = (sourceCargo as ShipCargo).capacity;
    } else if (typeof base?.cargo === 'number') {
      cargoCapacity = base.cargo;
    }

    const finalStats: CommonShipStats = {
      health: base?.hull ?? factionStats?.health ?? 100,
      maxHealth: base?.hull ?? factionStats?.maxHealth ?? 100,
      shield: base?.shield ?? factionStats?.shield ?? 50,
      maxShield: base?.shield ?? factionStats?.maxShield ?? 50,
      energy: base?.energy ?? factionStats?.energy ?? 100,
      maxEnergy: base?.energy ?? factionStats?.maxEnergy ?? 100,
      speed: base?.speed ?? factionStats?.speed ?? 100,
      turnRate: factionStats?.turnRate ?? 2,
      cargo: cargoCapacity ?? 0,
      defense: {
        armor: factionStats?.defense?.armor ?? Math.floor((base?.hull ?? 100) * 0.3),
        shield: factionStats?.defense?.shield ?? base?.shield ?? 50,
        evasion: factionStats?.defense?.evasion ?? 0.2,
        regeneration:
          factionStats?.defense?.regeneration ?? Math.floor((base?.shield ?? 50) * 0.02),
      },
      mobility: {
        speed: factionStats?.mobility?.speed ?? base?.speed ?? 100,
        turnRate: factionStats?.mobility?.turnRate ?? 2,
        acceleration: factionStats?.mobility?.acceleration ?? (base?.speed ?? 100) * 0.5,
      },
      weapons: weapons,
      abilities: factionStats?.abilities ?? [],
    };

    return finalStats;
  }

  private createCombatShip(
    baseShip: BaseShip,
    shipClass: PlayerShipClass | FactionShipClass,
    blueprint: ShipBlueprint | undefined,
    factionStats: FactionShipStats
  ): CombatShip {
    const detailedStats: DetailedShipStats = {
      ...baseShip.stats,
      armor: baseShip.stats.defense?.armor ?? factionStats?.defense?.armor ?? 0,
      accuracy: factionStats?.accuracy ?? 0.8,
      evasion: baseShip.stats.defense?.evasion ?? factionStats?.defense?.evasion ?? 0.2,
      criticalChance: factionStats?.criticalChance ?? 0.05,
      criticalDamage: factionStats?.criticalDamage ?? 1.5,
      armorPenetration: factionStats?.armorPenetration ?? 0.1,
      shieldPenetration: factionStats?.shieldPenetration ?? 0.1,
    };

    const combatShip: CombatShip = {
      ...baseShip,
      category: baseShip.category as
        | ShipCategory.WAR
        | ShipCategory.FIGHTER
        | ShipCategory.CRUISER
        | ShipCategory.BATTLESHIP
        | ShipCategory.CARRIER,
      class: shipClass,
      stats: detailedStats,
      experience: baseShip.experience,
      tactics: factionStats?.tactics,
      formation: factionStats?.formation,
      specialAbility: factionStats?.specialAbility,
      techBonuses: factionStats?.techBonuses,
      combatStats: factionStats?.combatStats,
    };
    return combatShip;
  }

  private createMiningShip(
    baseShip: BaseShip,
    shipClass: PlayerShipClass | FactionShipClass,
    blueprint: ShipBlueprint | undefined,
    factionStats: FactionShipStats
  ): MiningShip {
    const miningShip: MiningShip = {
      ...baseShip,
      category: ShipCategory.MINING,
      class: shipClass as
        | PlayerShipClass.ROCK_BREAKER
        | PlayerShipClass.VOID_DREDGER
        | FactionShipClass,
      currentLoad: 0,
      targetNode: undefined,
      efficiency: blueprint?.baseStats.miningRate ?? factionStats?.miningRate ?? 1.0,
    };
    return miningShip;
  }

  private createReconShip(
    baseShip: BaseShip,
    shipClass: PlayerShipClass | FactionShipClass,
    blueprint: ShipBlueprint | undefined,
    factionStats: FactionShipStats
  ): ReconShip {
    const reconShip: ReconShip = {
      ...baseShip,
      category: baseShip.category as ShipCategory.RECON | ShipCategory.SCOUT,
      class: shipClass as
        | PlayerShipClass.ANDROMEDA_CUTTER
        | PlayerShipClass.STAR_SCHOONER
        | FactionShipClass,
      efficiency: 0.8,
      specialization: 'mapping',
      capabilities: {
        ...(baseShip.capabilities ?? {}),
        canScan: true,
        canSalvage:
          factionStats?.capabilities?.canSalvage ?? baseShip.capabilities?.canSalvage ?? false,
        canMine: factionStats?.capabilities?.canMine ?? baseShip.capabilities?.canMine ?? false,
        canJump: (blueprint?.tier ?? factionStats?.tier ?? 1) >= 2,
        scanning: blueprint?.baseStats.scanRange ?? factionStats?.capabilities?.scanning ?? 100,
        stealth: factionStats?.capabilities?.stealth ?? 0,
        combat: factionStats?.capabilities?.combat ?? 0,
        stealthActive: factionStats?.capabilities?.stealthActive ?? false,
        speed: baseShip.stats.speed,
        range: blueprint?.baseStats.scanRange ?? factionStats?.capabilities?.range ?? 100,
        cargo: baseShip.stats.cargo as number | undefined,
      },
      assignedSectorId: undefined,
      targetSector: undefined,
      currentTask: undefined,
      discoveries: {
        mappedSectors: 0,
        anomaliesFound: 0,
        resourcesLocated: 0,
      },
      stealth: factionStats?.stealth,
      sensors: factionStats?.sensors,
      formationId: factionStats?.formationId,
      formationRole: factionStats?.formationRole,
      coordinationBonus: factionStats?.coordinationBonus,
    };
    return reconShip;
  }

  private createWeaponMount(weaponData: WeaponDataSource, tier: Tier): WeaponMount {
    let name: string;
    let damage: number;
    let range: number;
    let cooldown: number;
    let baseCategory: WeaponCategory = 'machineGun';
    let mountSize: WeaponMountSize = 'medium';
    let mountPosition: WeaponMountPosition = 'front';
    let mountRotation: number = 0;
    let allowedCategories: WeaponCategory[] = [baseCategory];
    let configId: string | undefined;
    let baseStats: WeaponStats | undefined;
    let state: WeaponState | undefined;
    let visualAsset: string | undefined;
    let mountRequirements: { size: WeaponMountSize; power: number } | undefined;
    let extraProps: Record<string, unknown> = {};
    let weaponInstanceFromMount: WeaponInstance | undefined;

    if (isWeaponMountWithWeapon(weaponData)) {
      const mount = weaponData;
      mountSize = mount.size;
      mountPosition = mount.position;
      mountRotation = mount.rotation;
      allowedCategories = mount.allowedCategories;
      weaponInstanceFromMount = mount.currentWeapon;

      if (weaponInstanceFromMount) {
        name = weaponInstanceFromMount.config.name;
        damage = weaponInstanceFromMount.config.baseStats.damage;
        range = weaponInstanceFromMount.config.baseStats.range;
        cooldown = weaponInstanceFromMount.config.baseStats.cooldown;
        baseCategory = weaponInstanceFromMount.config.category;
        configId = weaponInstanceFromMount.config.id;
        baseStats = weaponInstanceFromMount.config.baseStats;
        state = weaponInstanceFromMount.state;
        visualAsset = weaponInstanceFromMount.config.visualAsset;
        mountRequirements = weaponInstanceFromMount.config.mountRequirements;
      } else {
        console.error('WeaponMount marked as having weapon, but currentWeapon is missing:', mount);
        name = 'Error: Missing Weapon';
        damage = 0;
        range = 0;
        cooldown = 1;
      }
      extraProps = { ...mount, currentWeapon: undefined };
    } else if (isEmptyWeaponMount(weaponData)) {
      const mount = weaponData;
      mountSize = mount.size;
      mountPosition = mount.position;
      mountRotation = mount.rotation;
      allowedCategories = mount.allowedCategories;
      name = 'Empty Mount';
      damage = 0;
      range = 0;
      cooldown = 1;
      extraProps = { ...mount };
    } else if (isBlueprintWeaponData(weaponData)) {
      const blueprintWeapon = weaponData;
      name = blueprintWeapon.name;
      damage = blueprintWeapon.damage;
      range = blueprintWeapon.range;
      cooldown = blueprintWeapon.cooldown;
      const nameLower = name.toLowerCase();
      if (nameLower.includes('laser')) baseCategory = 'energyLaser';
      else if (nameLower.includes('plasma')) baseCategory = 'plasmaCannon';
      else if (nameLower.includes('gauss')) baseCategory = 'gaussCannon';
      else if (nameLower.includes('railgun')) baseCategory = 'railGun';
      else if (nameLower.includes('missile')) baseCategory = 'missileLauncher';
      else if (nameLower.includes('rocket')) baseCategory = 'rockets';
      allowedCategories = [baseCategory];
      extraProps = { ...blueprintWeapon };
    } else {
      console.error('Unknown weaponData type in createWeaponMount:', weaponData);
      name = 'Error Mount';
      damage = 0;
      range = 0;
      cooldown = 1;
    }

    // Define the valid damage types directly as a union type
    type ValidDamageType = 'physical' | ResourceType.ENERGY | 'explosive';

    // Define a type guard using the inline union type
    function isDamageType(value: unknown): value is ValidDamageType {
      return (
        typeof value === 'string' &&
        (value === 'physical' || value === 'explosive' || value === ResourceType.ENERGY)
      );
    }

    const weaponId = configId || name.toLowerCase().replace(/\s+/g, '-');
    const damageTypeInput = extraProps.damageType;

    // Validate and assign damageType using the ValidDamageType union
    let validDamageType: ValidDamageType = 'physical'; // Default to physical
    if (isDamageType(damageTypeInput)) {
      validDamageType = damageTypeInput;
    } else if (damageTypeInput) {
      console.warn(
        `Invalid damageType '${damageTypeInput}' provided for weapon ${name}. Defaulting to 'physical'.`
      );
    }

    // Use the createDamageEffect utility (which expects the union type)
    const damageEffect = createDamageEffect({
      id: uuidv4(),
      magnitude: damage,
      duration: typeof extraProps.duration === 'number' ? extraProps.duration : 0,
      strength: damage,
      damageType: validDamageType, // Pass the validated union type
      penetration: typeof extraProps.penetration === 'number' ? extraProps.penetration : 0,
      name: name || 'Direct Damage',
      description:
        typeof extraProps.description === 'string'
          ? extraProps.description
          : 'Deals direct damage to target',
    });

    const finalBaseStats: WeaponStats = baseStats ?? {
      damage: damage,
      range: range,
      accuracy: typeof extraProps.accuracy === 'number' ? extraProps.accuracy : 0.8,
      rateOfFire: cooldown > 0 ? 1 / cooldown : 0,
      energyCost: typeof extraProps.energyCost === 'number' ? extraProps.energyCost : 5,
      cooldown: cooldown,
      effects: damage > 0 ? [damageEffect] : [],
      special:
        typeof extraProps.special === 'object' && extraProps.special !== null
          ? extraProps.special
          : {},
    };

    const finalState: WeaponState = state ?? {
      status: 'ready',
      currentStats: finalBaseStats,
      effects: finalBaseStats.effects ?? [],
    };

    let finalWeaponInstance: WeaponInstance | undefined;
    if (name !== 'Empty Mount' && !name.startsWith('Error:')) {
      const finalConfig: WeaponConfig = {
        id: weaponId,
        name: name,
        category: baseCategory,
        tier: tier,
        baseStats: finalBaseStats,
        visualAsset: visualAsset ?? `weapons/${weaponId}`,
        mountRequirements: mountRequirements ?? {
          size: mountSize,
          power: typeof extraProps.powerCost === 'number' ? extraProps.powerCost : 20,
        },
      };
      finalWeaponInstance = { config: finalConfig, state: finalState };
    }

    return {
      id: 'id' in extraProps && typeof extraProps.id === 'string' ? extraProps.id : uuidv4(),
      size: mountSize,
      position: mountPosition,
      rotation: mountRotation,
      allowedCategories: allowedCategories,
      currentWeapon: finalWeaponInstance,
    };
  }

  public createFleet(
    factionId: FactionId,
    shipClasses: (PlayerShipClass | FactionShipClass)[],
    position: Position,
    formation: { type: 'offensive' | 'defensive' | 'balanced'; spacing: number; facing: number }
  ): UnifiedShip[] {
    return shipClasses.map((shipClass, index) => {
      const offset = index * formation.spacing;
      const shipPosition = {
        x: position.x + Math.cos(formation.facing) * offset,
        y: position.y + Math.sin(formation.facing) * offset,
      };
      return this.createShip(shipClass, { position: shipPosition, factionId: factionId });
    });
  }
}

export const shipFactory = ShipFactory.getInstance();
