import { SkullIcon } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { ShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { SpaceRatShip } from '../../common/SpaceRatShip';

interface RatKingProps {
  id: string;
  name: string;
  type: 'ratKing';
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
  tactics: 'aggressive';
  position: { x: number; y: number };
  rotation: number;
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
  position,
  rotation,
}) => {
  const [plagueRatsActive, setPlagueRatsActive] = useState(false);

  useEffect(() => {
    if (status === 'disabled') {
      setPlagueRatsActive(false);
    }
  }, [status]);

  const mapStatus = (status: ShipStatus) => {
    switch (status) {
      case 'engaging':
        return 'engaging';
      case 'patrolling':
        return 'patrolling';
      case 'retreating':
        return 'retreating';
      case 'disabled':
        return 'disabled';
      default:
        return 'patrolling';
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
      stats={stats}
      position={position}
      rotation={rotation}
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
          disabled={status === 'disabled'}
        >
          <SkullIcon className="icon" />
          <span>Release Plague Rats</span>
        </button>
      </div>
    </SpaceRatShip>
  );
};
