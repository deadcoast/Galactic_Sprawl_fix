import { SpaceRatShip } from "./SpaceRatShip";
import { WeaponMount } from "../../common/WeaponMount";
import { WeaponType } from "../../../../types/combat/CombatTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";
import { AlertTriangle } from "lucide-react";

type ShipStatus =
  | "idle"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled"
  | "damaged";

interface AsteroidMarauderProps {
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

export function AsteroidMarauder({
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
}: AsteroidMarauderProps) {
  return (
    <div className="relative">
      {/* Ship Base Component */}
      <SpaceRatShip
        id={id}
        name="Asteroid Marauder"
        type="asteroidMarauder"
        status={status === "damaged" ? "disabled" : status === "idle" ? "patrolling" : status}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        tactics="aggressive"
        specialAbility={{
          name: "Scavenger Boost",
          description: "Temporarily increases ship speed and maneuverability",
          cooldown: 15,
          active: stats.energy > stats.maxEnergy * 0.5
        }}
      />

      {/* Action Buttons */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
        <button
          onClick={onEngage}
          disabled={status === "disabled"}
          className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg"
        >
          Engage
        </button>
        <button
          onClick={onRetreat}
          disabled={status === "disabled"}
          className="flex-1 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg"
        >
          Retreat
        </button>
        <button
          onClick={() => onSpecialAbility?.()}
          disabled={status === "disabled" || stats.energy <= stats.maxEnergy * 0.5}
          className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg disabled:opacity-50"
        >
          Boost
        </button>
      </div>

      {/* Weapon Mounts */}
      <div className="absolute inset-0 pointer-events-none">
        {weapons.map((weapon, index) => (
          <WeaponMount
            key={weapon.id}
            weapon={weapon}
            position={{
              x: 40 + index * 25,
              y: 40,
            }}
            rotation={0}
            isFiring={status === "engaging"}
            onFire={() => onFire?.(weapon.id)}
            className="absolute"
          />
        ))}
      </div>

      {/* Warning indicator for damaged state */}
      {status === "damaged" && (
        <div className="absolute top-0 right-0 p-2">
          <AlertTriangle className="w-6 h-6 text-yellow-500 animate-pulse" />
        </div>
      )}
    </div>
  );
}
