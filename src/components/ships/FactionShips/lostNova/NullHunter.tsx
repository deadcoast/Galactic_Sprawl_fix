import { LostNovaShip } from "./LostNovaShip";
import { WeaponMount } from "../../../../types/weapons/WeaponTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";
import { ShipStatus } from "../../../../types/ships/ShipTypes";
import { AlertTriangle, Target } from "lucide-react";
import { useEffect, useState } from "react";

interface NullHunterProps {
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
  const [voidTrackingActive, setVoidTrackingActive] = useState(false);

  useEffect(() => {
    if (status === "disabled") {
      setVoidTrackingActive(false);
    }
  }, [status]);

  const mapStatus = (status: ShipStatus) => {
    switch (status) {
      case "engaging":
        return "engaging";
      case "patrolling":
        return "patrolling";
      case "retreating":
        return "retreating";
      case "disabled":
        return "disabled";
      default:
        return "patrolling";
    }
  };

  return (
    <div className="relative">
      <LostNovaShip
        id={id}
        name="Null Hunter"
        type="nullsRevenge"
        status={mapStatus(status)}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        tactics="stealth"
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={() => {
          setVoidTrackingActive(!voidTrackingActive);
          onSpecialAbility?.();
        }}
      >
        <div className="status-effects">
          {voidTrackingActive && (
            <div className="status-effect">
              <Target className="icon" />
              <span>Void Tracking Active</span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button
            className={`ability-button ${voidTrackingActive ? 'active' : ''}`}
            onClick={() => {
              setVoidTrackingActive(!voidTrackingActive);
              onSpecialAbility?.();
            }}
            disabled={status === "disabled"}
          >
            <Target className="icon" />
            <span>Void Tracking</span>
          </button>
        </div>
      </LostNovaShip>
    </div>
  );
}
