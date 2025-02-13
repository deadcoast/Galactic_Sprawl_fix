import { SpaceRatShip } from "./SpaceRatShip";
import { WeaponMount } from "../../../../types/weapons/WeaponTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";
import { ShipStatus } from "../../../../types/ships/ShipTypes";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

interface AsteroidMarauderProps {
  id: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponMount[];
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
  // Map the full ShipStatus to SpaceRatShip's more limited status type
  const mapStatus = (status: ShipStatus): "engaging" | "patrolling" | "retreating" | "disabled" => {
    switch (status) {
      case "damaged":
        return "disabled";
      case "idle":
      case "ready":
        return "patrolling";
      case "engaging":
      case "patrolling":
      case "retreating":
      case "disabled":
        return status;
    }
  };

  return (
    <div className="relative">
      {/* Ship Base Component */}
      <SpaceRatShip
        id={id}
        name="Asteroid Marauder"
        type="asteroidMarauder"
        status={mapStatus(status)}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        tactics="aggressive"
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={onSpecialAbility}
      />

      {/* Warning indicator for damaged state */}
      {status === "damaged" && (
        <div className="absolute top-0 right-0 p-2">
          <AlertTriangle className="w-6 h-6 text-yellow-500 animate-pulse" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
        <button
          onClick={onSpecialAbility}
          disabled={status === "disabled" || status === "damaged" || stats.energy <= stats.maxEnergy * 0.5}
          className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg disabled:opacity-50"
        >
          Boost
        </button>
      </div>
    </div>
  );
}
