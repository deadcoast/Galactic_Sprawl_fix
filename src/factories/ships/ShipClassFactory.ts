import { SHIP_STATS } from '../../config/ships';
import { CombatUnit } from '../../types/combat/CombatTypes';
import { Position } from '../../types/core/GameTypes';
import { FactionShipClass } from '../../types/ships/FactionShipTypes';
import { FactionId } from '../../types/ships/FactionTypes';
import { WeaponMount, WeaponSystem } from '../../types/weapons/WeaponTypes';
import { convertToCombatTypesUnit } from '../../utils/typeConversions';

export class ShipClassFactory {
  private static instance: ShipClassFactory;

  private constructor() {}

  public static getInstance(): ShipClassFactory {
    if (!ShipClassFactory.instance) {
      ShipClassFactory.instance = new ShipClassFactory();
    }
    return ShipClassFactory.instance;
  }

  public createShip(
    shipClass: FactionShipClass,
    factionId: FactionId,
    position: Position,
    formation?: { type: 'offensive' | 'defensive' | 'balanced'; spacing: number; facing: number }
  ): CombatUnit {
    const stats = SHIP_STATS[shipClass];
    if (!stats) {
      throw new Error(`Invalid ship class: ${shipClass}`);
    }

    // Initialize weapon mounts with proper state
    const initializedWeaponMounts = stats.weapons.map(mount => this._createWeaponMount(mount));

    // Create a manager-style CombatUnit first
    const managerUnit = {
      id: `${factionId}-${shipClass}-${Date.now()}`,
      type: shipClass,
      tier: stats.tier,
      position,
      status: 'idle',
      health: stats.health,
      maxHealth: stats.maxHealth,
      shield: stats.shield,
      maxShield: stats.maxShield,
      weapons: initializedWeaponMounts.map(this.convertToWeaponSystem),
      faction: factionId,
      formation,
    };

    // Convert to CombatTypes.CombatUnit
    return convertToCombatTypesUnit(managerUnit);
  }

  private convertToWeaponSystem(mount: WeaponMount): WeaponSystem {
    if (!mount.currentWeapon) {
      return {
        id: mount.id,
        type: mount.allowedCategories[0] || 'machineGun',
        damage: 10,
        cooldown: 2,
        range: 100,
        status: 'ready',
      };
    }

    return {
      id: mount.currentWeapon.config.id,
      type: mount.currentWeapon.config.category,
      damage: mount.currentWeapon.config.baseStats.damage,
      cooldown: mount.currentWeapon.config.baseStats.cooldown,
      range: mount.currentWeapon.config.baseStats.range,
      status: mount.currentWeapon.state.status,
    };
  }

  /**
   * Creates a weapon mount with initialized state
   *
   * This function will be used in future implementations to:
   * 1. Create weapon mounts for ship customization in the hangar module
   * 2. Initialize weapon mounts when a new ship is constructed
   * 3. Reset weapon mounts when a ship is repaired or refitted
   * 4. Clone weapon mounts when creating ship templates
   * 5. Validate weapon compatibility when attaching weapons to mounts
   *
   * The function ensures that all weapon mounts have a consistent state structure,
   * particularly setting the weapon status to 'ready' for newly created or reset mounts.
   * This will be critical for the upcoming weapon customization system where players
   * can swap weapons between different mounts.
   *
   * @param mount - The base weapon mount to initialize or clone
   * @returns A new weapon mount with initialized state
   */
  private _createWeaponMount(mount: WeaponMount): WeaponMount {
    return {
      ...mount,
      currentWeapon: mount.currentWeapon
        ? {
            ...mount.currentWeapon,
            state: {
              ...mount.currentWeapon.state,
              status: 'ready',
            },
          }
        : undefined,
    };
  }

  public createFleet(
    factionId: FactionId,
    shipClasses: FactionShipClass[],
    position: Position,
    formation: { type: 'offensive' | 'defensive' | 'balanced'; spacing: number; facing: number }
  ): CombatUnit[] {
    return shipClasses.map((shipClass, index) => {
      const offset = index * formation.spacing;
      const shipPosition = {
        x: position.x + Math.cos(formation.facing) * offset,
        y: position.y + Math.sin(formation.facing) * offset,
      };
      return this.createShip(shipClass, factionId, shipPosition, formation);
    });
  }
}

export const shipClassFactory = ShipClassFactory.getInstance();
