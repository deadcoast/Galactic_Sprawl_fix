import { LostNovaShip } from "./LostNovaShip";
import { WeaponMount } from "../../../../types/weapons/WeaponTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";
import { ShipStatus } from "../../../../types/ships/ShipTypes";
import { AlertTriangle, Moon } from "lucide-react";
import { useEffect, useState } from "react";

interface EclipseScytheProps {
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
  const [shadowVeilActive, setShadowVeilActive] = useState(false);

  useEffect(() => {
    if (status === "disabled") {
      setShadowVeilActive(false);
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
        name="Eclipse Scythe"
        type="eclipseScythe"
        status={mapStatus(status)}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        tactics="hit-and-run"
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={() => {
          setShadowVeilActive(!shadowVeilActive);
          onSpecialAbility?.();
        }}
      >
        <div className="status-effects">
          {shadowVeilActive && (
            <div className="status-effect">
              <Moon className="icon" />
              <span>Shadow Veil Active</span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button
            className={`ability-button ${shadowVeilActive ? 'active' : ''}`}
            onClick={() => {
              setShadowVeilActive(!shadowVeilActive);
              onSpecialAbility?.();
            }}
            disabled={status === "disabled"}
          >
            <Moon className="icon" />
            <span>Shadow Veil</span>
          </button>
        </div>
      </LostNovaShip>
    </div>
  );
}
