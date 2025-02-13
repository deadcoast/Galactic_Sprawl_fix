import { EquatorHorizonShip } from "./EquatorHorizonShip";
import { WeaponMount } from "../../common/WeaponMount";
import { WeaponStats } from "../../../../types/weapons/WeaponTypes";
import { WeaponType, CombatWeaponStats } from "../../../../types/combat/CombatTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";

type ShipStatus =
  | "idle"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled"
  | "damaged";

interface EtherealGalleonProps {
  id: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponType[];
  stats: FactionShipStats;
  onFire: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat: () => void;
  onSpecialAbility?: () => void;
}

// Default weapon configuration for Ethereal Galleon from shipConfig.ts
const DEFAULT_WEAPON: WeaponType = {
  id: "mgss-ancient",
  category: "mgss",
  variant: "engineAssistedSpool", // Using existing MGSS variant
  stats: {
    damage: 80,
    range: 1200,
    accuracy: 0.9,
    rateOfFire: 1/3, // From cooldown: 3
    energyCost: 30,
    cooldown: 3,
    effects: [], // No default effects
    special: {
      armorPenetration: 0.1,
      shieldDamageBonus: 0.2,
    }
  },
  visualAsset: "weapons/equator-horizon/mgss/ancient-mgss"
};

export function EtherealGalleon({
  id,
  status,
  health,
  maxHealth,
  shield,
  maxShield,
  weapons = [DEFAULT_WEAPON],
  stats,
  onFire,
  onEngage,
  onRetreat,
  onSpecialAbility,
}: EtherealGalleonProps) {
  // Filter status for base component compatibility
  const baseStatus = status === "damaged" ? "disabled" : 
    status === "idle" ? "patrolling" : status as "engaging" | "patrolling" | "retreating" | "disabled";

  // Calculate weapon stats based on ancient energy levels
  const calculateWeaponStats = (weapon: WeaponType): CombatWeaponStats => {
    const energyEfficiency = stats.energy / stats.maxEnergy;
    
    // Start with the base weapon stats
    const baseStats: WeaponStats = {
      damage: weapon.stats.damage * (1 + energyEfficiency * 0.5),
      range: weapon.stats.range,
      accuracy: weapon.stats.accuracy * (0.9 + energyEfficiency * 0.1),
      rateOfFire: weapon.stats.rateOfFire,
      energyCost: weapon.stats.energyCost * (1 - energyEfficiency * 0.3),
      cooldown: weapon.stats.cooldown || 2,
      effects: weapon.stats.effects || [],
    };

    // Add combat-specific stats
    return {
      ...baseStats,
      special: {
        armorPenetration: 0.1,
        shieldDamageBonus: 0.2,
      }
    };
  };

  return (
    <div className="relative">
      {/* Equator Horizon Ship Base Component */}
      <EquatorHorizonShip
        id={id}
        name="Ethereal Galleon"
        type="etherealGalleon"
        status={baseStatus}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        tactics={stats.energy / stats.maxEnergy > 0.7 ? "aggressive" : "defensive"}
        specialAbility={{
          name: "Ancient Energy",
          description: "Channel ancient energy to enhance weapon systems",
          cooldown: 40,
          active: false
        }}
        onEngage={onEngage}
        onRetreat={onRetreat}
      />

      {/* Weapon Mounts */}
      <div className="absolute inset-0 pointer-events-none">
        {weapons.map((weapon, index) => (
          <WeaponMount
            key={weapon.id}
            weapon={{
              category: weapon.category,
              variant: weapon.variant,
              visualAsset: `weapons/equator-horizon/${weapon.category}/ancient-${weapon.category}`,
              stats: calculateWeaponStats(weapon)
            }}
            position={{
              x: 45 + index * 30,
              y: 45,
            }}
            rotation={0}
            isFiring={status === "engaging"}
            onFire={() => {
              onFire?.(weapon.id);
              // Trigger special ability when energy is high
              if (stats.energy / stats.maxEnergy > 0.9) {
                onSpecialAbility?.();
              }
            }}
            className="absolute"
          />
        ))}
      </div>
    </div>
  );
}
