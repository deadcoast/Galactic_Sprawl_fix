import { EquatorHorizonShip } from "../../common/EquatorHorizonShip";
import { WeaponMount } from "../../../../types/weapons/WeaponTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";
import { ShipStatus } from "../../../../types/ships/ShipTypes";
import { Wind } from "lucide-react";
import { useEffect, useState } from "react";

interface EtherealGalleonProps {
  id: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponMount[];
  stats: FactionShipStats;
  position: { x: number; y: number };
  rotation: number;
  onFire: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat: () => void;
  onSpecialAbility?: () => void;
}

export function EtherealGalleon({
  id,
  status,
  health,
  maxHealth,
  shield,
  maxShield,
  weapons,
  stats,
  position,
  rotation,
  onFire,
  onEngage,
  onRetreat,
  onSpecialAbility,
}: EtherealGalleonProps) {
  const [etherealWindsActive, setEtherealWindsActive] = useState(false);

  useEffect(() => {
    if (status === "disabled") {
      setEtherealWindsActive(false);
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
      <EquatorHorizonShip
        id={id}
        name="Ethereal Galleon"
        type="etherealGalleon"
        status={mapStatus(status)}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        tactics="hit-and-run"
        position={position}
        rotation={rotation}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onFire={onFire}
        stats={stats}
        onSpecialAbility={() => {
          setEtherealWindsActive(!etherealWindsActive);
          onSpecialAbility?.();
        }}
      >
        <div className="status-effects">
          {etherealWindsActive && (
            <div className="status-effect">
              <Wind className="icon" />
              <span>Ethereal Winds Active</span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button
            className={`ability-button ${etherealWindsActive ? 'active' : ''}`}
            onClick={() => {
              setEtherealWindsActive(!etherealWindsActive);
              onSpecialAbility?.();
            }}
            disabled={status === "disabled"}
          >
            <Wind className="icon" />
            <span>Ethereal Winds</span>
          </button>
        </div>
      </EquatorHorizonShip>
    </div>
  );
}
