import { FactionShipBase } from "../FactionShipBase";
import { WeaponMount } from "../../common/WeaponMount";
import { WeaponType } from "../../../../types/combat/CombatTypes";
import { CommonShipStats } from "../../../../types/ships/CommonShipTypes";

type ShipStatus =
  | "idle"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled"
  | "damaged";

interface NullHunterProps {
  id: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponType[];
  stats: CommonShipStats;
  onFire: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat: () => void;
  onSpecialAbility?: (abilityName: string) => void;
}

export function NullHunter({
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
}: NullHunterProps) {
  return (
    <div className="relative">
      {/* Ship Base Component */}
      <FactionShipBase
        ship={{
          id,
          name: "Null Hunter",
          faction: "lost-nova",
          class: "null-hunter",
          status: status === "damaged" ? "disabled" : status,
          health,
          maxHealth,
          shield,
          maxShield,
          stats,
          specialAbility: {
            name: "Void Shield",
            description: "Generate a powerful shield that absorbs incoming damage",
            cooldown: 30,
            active: false
          }
        }}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={() => onSpecialAbility?.("Void Shield")}
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
    </div>
  );
}
