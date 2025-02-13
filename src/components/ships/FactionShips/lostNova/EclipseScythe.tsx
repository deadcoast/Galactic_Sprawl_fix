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

interface EclipseScytheProps {
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

export function EclipseScythe({
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
}: EclipseScytheProps) {
  return (
    <div className="relative">
      {/* Ship Base Component */}
      <FactionShipBase
        ship={{
          id,
          name: "Eclipse Scythe",
          faction: "lost-nova",
          class: "eclipse-scythe",
          status: status === "damaged" ? "disabled" : status,
          health,
          maxHealth,
          shield,
          maxShield,
          stats,
          tactics: "hit-and-run",
          specialAbility: {
            name: "Eclipse Field",
            description: "Creates a field of dark energy that disrupts enemy systems",
            cooldown: 45,
            active: false
          }
        }}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={() => onSpecialAbility?.("Eclipse Field")}
      />

      {/* Weapon Mounts */}
      <div className="absolute inset-0 pointer-events-none">
        {weapons.map((weapon, index) => (
          <WeaponMount
            key={weapon.id}
            weapon={weapon}
            position={{
              x: 50 + index * 30,
              y: 50,
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
