import { FactionShipBase } from "../FactionShipBase";
import { WeaponMount } from "../../common/WeaponMount";
import { WeaponCategory, WeaponMountPosition, WeaponInstance, WeaponStats } from "../../../../types/weapons/WeaponTypes";
import { CommonShipDisplayStats as ShipStats } from "../../../../types/ships/CommonShipTypes";
import { FactionId, EquatorHorizonShipClass, FactionShipAbility, FactionShipStats } from "../../../../types/ships/FactionShipTypes";
import { BaseStatus, Effect } from "../../../../types/core/GameTypes";

type ShipStatus =
  | "idle"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled"
  | "damaged";

interface CelestialArbiterProps {
  id: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponInstance[];
  stats: ShipStats;
  onFire: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat: () => void;
  onSpecialAbility?: (abilityName: string) => void;
  playerPowerLevel?: number;
  systemBalance?: number;
}

export function CelestialArbiter({
  id,
  status,
  health,
  maxHealth,
  shield,
  maxShield,
  weapons,
  stats,
  onFire,
  onEngage,
  onRetreat,
  onSpecialAbility,
  playerPowerLevel = 0,
  systemBalance = 0,
}: CelestialArbiterProps) {
  // Convert weapon stats based on system balance and player power
  const convertWeaponStats = (currentStats: WeaponStats, balanceMultiplier: number): WeaponStats => {
    const powerScaling = Math.max(0.5, Math.min(2, playerPowerLevel / 100));
    return {
      ...currentStats,
      damage: currentStats.damage * (1 + Math.abs(systemBalance) * balanceMultiplier) * powerScaling,
      accuracy: currentStats.accuracy * (1 - Math.abs(systemBalance) * 0.1), // Balance affects accuracy
      energyCost: currentStats.energyCost * (1 + Math.abs(systemBalance) * 0.2), // Higher energy cost with imbalance
    };
  };

  // Calculate enhanced ship stats
  const enhancedStats: FactionShipStats = {
    health,
    maxHealth,
    shield,
    maxShield,
    energy: stats.systems.power,
    maxEnergy: stats.systems.efficiency,
    speed: stats.mobility.speed,
    turnRate: stats.mobility.agility,
    cargo: stats.systems.efficiency,
    weapons: weapons.map(w => ({
      id: `mount-${w.config.id}`,
      size: "medium",
      position: "front" as WeaponMountPosition,
      currentWeapon: {
        ...w,
        state: {
          ...w.state,
          currentStats: convertWeaponStats(w.state.currentStats, 0.2)
        }
      }
    })),
    tier: 3,
    faction: "equator-horizon" as FactionId
  };

  // Filter status for ShipBase compatibility
  const baseStatus: BaseStatus = status === "damaged" ? "disabled" : status;

  // Enhanced abilities based on system balance and player power
  const abilities: FactionShipAbility[] = [{
    name: "Balance Restoration",
    description: "Create a field that restores balance to nearby ships",
    cooldown: 45,
    duration: 15,
    active: false,
    tier: 3,
    factionRequirement: "equator-horizon",
    effect: {
      type: "shield",
      magnitude: 2 + Math.abs(systemBalance) + (playerPowerLevel / 100),
      duration: 15,
      radius: 500
    } as Effect
  }];

  return (
    <div className="relative">
      {/* Faction Ship Base Component */}
      <FactionShipBase
        ship={{
          id,
          name: "Celestial Arbiter",
          category: "war",
          status: baseStatus as "ready" | "engaging" | "patrolling" | "retreating" | "disabled",
          faction: "equator-horizon" as FactionId,
          class: "celestial-arbiter" as EquatorHorizonShipClass,
          stats: enhancedStats,
          tactics: systemBalance > 0.5 ? "aggressive" : systemBalance < -0.5 ? "defensive" : "hit-and-run",
          abilities
        }}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={() => onSpecialAbility?.("Balance Restoration")}
      />

      {/* Weapon Mounts */}
      <div className="absolute inset-0 pointer-events-none">
        {weapons.map((weapon, index) => {
          const weaponCategory: WeaponCategory = weapon.config.category;
          const enhancedStats = convertWeaponStats(weapon.state.currentStats, 0.2);
          
          return (
            <WeaponMount
              key={`mount-${weapon.config.id}`}
              weapon={{
                category: weaponCategory,
                variant: weapon.config.name.toLowerCase().replace(/\s+/g, '-'),
                visualAsset: weapon.config.visualAsset || `weapons/equator-horizon/${weaponCategory}/${weapon.config.name.toLowerCase().replace(/\s+/g, '-')}`,
                stats: enhancedStats
              }}
              position={{
                x: 55 + index * 35,
                y: 55,
              }}
              rotation={0}
              isFiring={status === "engaging"}
              onFire={() => onFire?.(weapon.config.id)}
              className="absolute"
            />
          );
        })}
      </div>
    </div>
  );
}
