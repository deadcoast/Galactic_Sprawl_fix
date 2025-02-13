import { SpaceRatShip } from "./SpaceRatShip";
import { WeaponMount } from "../../../../types/weapons/WeaponTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";
import { ShipStatus } from "../../../../types/ships/ShipTypes";
import { AlertTriangle, Sword, Shield, Target, SkullIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface RatKingProps {
  id: string;
  name: string;
  type: "ratKing";
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponMount[];
  stats: FactionShipStats;
  onFire: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
  tactics: "aggressive";
}

export const RatKing: React.FC<RatKingProps> = ({
  id,
  name,
  type,
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
  tactics,
}) => {
  const [plagueRatsActive, setPlagueRatsActive] = useState(false);

  useEffect(() => {
    if (status === "disabled") {
      setPlagueRatsActive(false);
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
    <SpaceRatShip
      id={id}
      name={name}
      type={type}
      status={mapStatus(status)}
      health={health}
      maxHealth={maxHealth}
      shield={shield}
      maxShield={maxShield}
      weapons={weapons}
      onFire={onFire}
      onEngage={onEngage}
      onRetreat={onRetreat}
      onSpecialAbility={onSpecialAbility}
      tactics={tactics}
    >
      <div className="status-effects">
        {plagueRatsActive && (
          <div className="status-effect">
            <SkullIcon className="icon" />
            <span>Plague Rats Active</span>
          </div>
        )}
      </div>
      <div className="action-buttons">
        <button
          className={`ability-button ${plagueRatsActive ? 'active' : ''}`}
          onClick={() => {
            setPlagueRatsActive(!plagueRatsActive);
            onSpecialAbility?.();
          }}
          disabled={status === "disabled"}
        >
          <SkullIcon className="icon" />
          <span>Release Plague Rats</span>
        </button>
      </div>
    </SpaceRatShip>
  );
};
