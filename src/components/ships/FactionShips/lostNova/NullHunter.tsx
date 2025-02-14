import { LostNovaShip } from "../../common/LostNovaShip";
import { WeaponMount } from "../../../../types/weapons/WeaponTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";
import { ShipStatus } from "../../../../types/ships/ShipTypes";
import { Target } from "lucide-react";
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
  position: { x: number; y: number };
  rotation: number;
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
  position,
  rotation,
}: NullHunterProps) {
  const [voidTrackingActive, setVoidTrackingActive] = useState(false);
  const [nullFieldActive, setNullFieldActive] = useState(false);

  useEffect(() => {
    if (status === "disabled") {
      setVoidTrackingActive(false);
      setNullFieldActive(false);
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
        stats={stats}
        position={position}
        rotation={rotation}
        tactics="aggressive"
        onEngage={onEngage}
        onRetreat={onRetreat}
        onFire={onFire}
        onSpecialAbility={() => {
          setNullFieldActive(!nullFieldActive);
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
          {nullFieldActive && (
            <div className="status-effect">
              <Target className="icon" />
              <span>Null Field Active</span>
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
          <button
            className={`ability-button ${nullFieldActive ? 'active' : ''}`}
            onClick={() => {
              setNullFieldActive(!nullFieldActive);
              onSpecialAbility?.();
            }}
            disabled={status === "disabled"}
          >
            <Target className="icon" />
            <span>Null Field</span>
          </button>
        </div>
      </LostNovaShip>
    </div>
  );
}
