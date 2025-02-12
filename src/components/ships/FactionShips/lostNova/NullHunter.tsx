import { ShipBase } from "@/components/ships/common/CommonShipStats";
import { WeaponMount } from "@/components/ships/common/WeaponMount";
import { WarShipCombat } from "@/components/ships/player/variants/warships/PlayerWarShipCombat";
import { WeaponCategory, WeaponType } from "@/types/combat/CombatTypes";
import { ShipStats } from "@/types/ships/CommonShipTypes";

type ShipStatus =
  | "idle"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled"
  | "damaged";
type WarShipType =
  | "spitflare"
  | "starSchooner"
  | "orionFrigate"
  | "harbringerGalleon"
  | "midwayCarrier";
type WarShipStatus = "idle" | "engaging" | "retreating" | "damaged";
type WarShipWeaponType = "machineGun" | "gaussCannon" | "railGun" | "rockets";

interface NullsRevengeProps {
  id: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponType[];
  stats: ShipStats;
  onFire: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat: () => void;
  onSpecialAbility?: () => void;
}

export function NullsRevenge({
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
}: NullsRevengeProps) {
  // Convert status for WarShipCombat compatibility
  const getWarShipStatus = (status: ShipStatus): WarShipStatus => {
    switch (status) {
      case "patrolling":
      case "disabled":
        return "idle";
      case "engaging":
      case "retreating":
      case "damaged":
        return status;
      default:
        return "idle";
    }
  };

  // Convert weapon type for WarShipCombat compatibility
  const getWarShipWeaponType = (
    category: WeaponCategory,
  ): WarShipWeaponType => {
    return category === "mgss" ? "machineGun" : category;
  };

  // For compatibility with WarShipCombat
  const warShipProps = {
    id,
    name: "Null's Revenge",
    type: "starSchooner" as WarShipType,
    tier: 2 as const,
    status: getWarShipStatus(status),
    hull: health,
    maxHull: maxHealth,
    shield,
    maxShield,
    weapons: weapons.map((w) => ({
      id: w.id,
      name: w.category,
      type: getWarShipWeaponType(w.category),
      damage: w.stats.damage,
      range: w.stats.range,
      cooldown: 1 / w.stats.rateOfFire,
      status: "ready" as const,
    })),
    specialAbilities: [
      {
        name: "Void Shield",
        description: "Generate a powerful shield that absorbs incoming damage",
        cooldown: 30,
        active: false,
      },
    ],
  };

  // Filter status for ShipBase compatibility
  const baseStatus = status === "damaged" ? "disabled" : status;

  return (
    <div className="relative">
      {/* New ShipBase Component */}
      <ShipBase
        id={id}
        name="Null's Revenge"
        faction="lostNova"
        status={baseStatus}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        stats={stats}
        specialAbility={{
          name: "Void Shield",
          cooldown: 30,
          duration: 8,
          effect: {
            type: "shield",
            magnitude: 2,
          },
        }}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={onSpecialAbility}
      />

      {/* Weapon Mounts */}
      <div className="absolute inset-0 pointer-events-none">
        {weapons.map((weapon, index) => (
          <WeaponMount
            key={weapon.id}
            weapon={weapon}
            position={{
              x: 45 + index * 28,
              y: 45,
            }}
            rotation={0}
            isFiring={status === "engaging"}
            onFire={() => onFire?.(weapon.id)}
            className="absolute"
          />
        ))}
      </div>

      {/* Legacy WarShipCombat for compatibility */}
      <div className="hidden">
        <WarShipCombat
          ship={warShipProps}
          onFireWeapon={onFire}
          onActivateAbility={() => onSpecialAbility?.()}
          onRetreat={onRetreat}
        />
      </div>
    </div>
  );
}
