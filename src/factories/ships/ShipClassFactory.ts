import { FactionId } from '../../types/ships/FactionTypes';
import { FactionShipStats, FactionShipConfig, FactionShipClass } from '../../types/ships/FactionShipTypes';
import { SHIP_STATS } from '../../config/ships';
import { WeaponMount, WeaponSystem } from '../../types/weapons/WeaponTypes';
import { CombatUnit } from '../../types/combat/CombatTypes';
import { Position } from '../../types/core/GameTypes';

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

    return {
      id: `${factionId}-${shipClass}-${Date.now()}`,
      type: shipClass as any,
      tier: stats.tier,
      position,
      status: 'idle',
      health: stats.health,
      maxHealth: stats.maxHealth,
      shield: stats.shield,
      maxShield: stats.maxShield,
      weapons: stats.weapons.map(this.convertToWeaponSystem),
      faction: factionId,
      formation,
    };
  }

  private convertToWeaponSystem(mount: WeaponMount): WeaponSystem {
    if (!mount.currentWeapon) {
      return {
        id: mount.id,
        type: mount.allowedCategories[0] as 'machineGun' | 'gaussCannon' | 'railGun' | 'mgss' | 'rockets',
        damage: 0,
        range: 0,
        cooldown: 0,
        status: 'ready',
      };
    }

    const weapon = mount.currentWeapon;
    return {
      id: weapon.config.id,
      type: weapon.config.category as 'machineGun' | 'gaussCannon' | 'railGun' | 'mgss' | 'rockets',
      damage: weapon.config.baseStats.damage,
      range: weapon.config.baseStats.range,
      cooldown: weapon.config.baseStats.cooldown,
      status: weapon.state.status as 'ready' | 'charging' | 'cooling',
    };
  }

  private createWeaponMount(mount: WeaponMount): WeaponMount {
    return {
      ...mount,
      currentWeapon: mount.currentWeapon ? {
        ...mount.currentWeapon,
        state: {
          ...mount.currentWeapon.state,
          status: 'ready',
        },
      } : undefined,
    };
  }

  public createFleet(
    factionId: FactionId,
    shipClasses: FactionShipClass[],
    position: Position,
    formation: { type: 'offensive' | 'defensive' | 'balanced'; spacing: number; facing: number }
  ): CombatUnit[] {
    return shipClasses.map((shipClass, index) => {
      const offset = {
        x: position.x + Math.cos(formation.facing) * formation.spacing * index,
        y: position.y + Math.sin(formation.facing) * formation.spacing * index,
      };
      return this.createShip(shipClass, factionId, offset, formation);
    });
  }
}

export const shipClassFactory = ShipClassFactory.getInstance(); 