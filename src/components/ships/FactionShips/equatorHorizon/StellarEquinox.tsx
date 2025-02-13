import { EquatorHorizonShip } from "./EquatorHorizonShip";
import { WeaponMount } from "../../common/WeaponMount";
import { WeaponType } from "../../../../types/combat/CombatTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";

type ShipStatus =
  | "idle"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled"
  | "damaged";

interface StellarEquinoxProps {
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
}

// Default weapon configuration from shipConfig.ts
const DEFAULT_WEAPON: WeaponType = {
  id: "gauss-standard",
  category: "gaussCannon",
  variant: "gaussPlaner",
  stats: {
    damage: 200,
    range: 1300,
    accuracy: 0.93,
    rateOfFire: 1/3, // From cooldown: 3
    energyCost: 30,
    cooldown: 3,
    effects: []
  },
  visualAsset: "weapons/equator-horizon/gaussCannon/standard"
};

export function StellarEquinox({
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
}: StellarEquinoxProps) {
  // Filter status for base component compatibility
  const baseStatus = status === "damaged" ? "disabled" : 
    status === "idle" ? "patrolling" : status as "engaging" | "patrolling" | "retreating" | "disabled";

  return (
    <div className="relative">
      {/* Ship Base Component */}
      <EquatorHorizonShip
        id={id}
        name="Stellar Equinox"
        type="stellarEquinox"
        status={baseStatus}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        tactics={stats.energy > stats.maxEnergy * 0.7 ? "aggressive" : "defensive"}
        specialAbility={{
          name: "Perfect Harmony",
          description: "Create a harmonious field that enhances nearby allies",
          cooldown: 35,
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
              visualAsset: `weapons/equator-horizon/${weapon.category}/standard`,
              stats: {
                ...weapon.stats,
                energyCost: weapon.stats.energyCost * (stats.energy / stats.maxEnergy)
              }
            }}
            position={{
              x: 45 + index * 30,
              y: 45,
            }}
            rotation={0}
            isFiring={status === "engaging"}
            onFire={() => onFire?.(weapon.id)}
            className="absolute"
          />
        ))}
      </div>
    </div>
  );
}
