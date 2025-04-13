import { Anchor } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { UnifiedShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { EquatorHorizonShip } from './EquatorHorizonShip';

interface EtherealGalleonProps {
  id: string;
  status: UnifiedShipStatus;
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
  const [aetherAnchorActive, setAetherAnchorActive] = useState(false);

  useEffect(() => {
    if (status === UnifiedShipStatus.DISABLED) {
      setAetherAnchorActive(false);
    }
  }, [status]);

  return (
    <div className="relative">
      <EquatorHorizonShip
        id={id}
        name="Ethereal Galleon"
        type="etherealGalleon"
        status={status}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        stats={stats}
        position={position}
        rotation={rotation}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onFire={onFire}
        onSpecialAbility={() => {
          setAetherAnchorActive(!aetherAnchorActive);
          onSpecialAbility?.();
        }}
      >
        <div className="status-effects">
          {aetherAnchorActive && (
            <div className="status-effect">
              <Anchor className="icon" />
              <span>Aether Anchor Active</span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button
            className={`ability-button ${aetherAnchorActive ? 'active' : ''}`}
            onClick={() => {
              setAetherAnchorActive(!aetherAnchorActive);
              onSpecialAbility?.();
            }}
            disabled={status === UnifiedShipStatus.DISABLED}
          >
            <Anchor className="icon" />
            <span>Aether Anchor</span>
          </button>
        </div>
      </EquatorHorizonShip>
    </div>
  );
}
