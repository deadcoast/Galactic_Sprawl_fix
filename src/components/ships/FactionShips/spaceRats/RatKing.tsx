import { Crown, Skull } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { FactionBehaviorConfig, FactionBehaviorType } from '../../../../types/ships/FactionTypes';
import { UnifiedShipStatus } from '../../../../types/ships/UnifiedShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { SpaceRatShip } from '../../common/SpaceRatShip';

interface RatKingProps {
  id: string;
  name: string;
  type: 'ratKing';
  status: UnifiedShipStatus;
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
  const [rallyCryActive, setRallyCryActive] = useState(false);
  const [callReinforcementsActive, setCallReinforcementsActive] = useState(false);

  useEffect(() => {
    if (status === UnifiedShipStatus.DISABLED) {
      setRallyCryActive(false);
      setCallReinforcementsActive(false);
    }
  }, [status]);

  const createFactionBehavior = (behaviorType: FactionBehaviorType): FactionBehaviorConfig => {
    return {
      formation: 'leader-standard',
      behavior: behaviorType,
    };
  };

  const tactics = createFactionBehavior('aggressive');

  return (
    <SpaceRatShip
      id={id}
      name={name}
      type={type}
      status={status}
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
        {rallyCryActive && (
          <div className="status-effect">
            <Crown className="icon" />
            <span>Rally Cry Active</span>
          </div>
        )}
        {callReinforcementsActive && (
          <div className="status-effect">
            <Skull className="icon" />
            <span>Calling Reinforcements</span>
          </div>
        )}
      </div>
      <div className="action-buttons grid grid-cols-2 gap-2">
        <button
          className={`ability-button ${rallyCryActive ? 'active' : ''}`}
          onClick={() => {
            setRallyCryActive(!rallyCryActive);
            onSpecialAbility?.();
          }}
          disabled={status === UnifiedShipStatus.DISABLED}
        >
          <Crown className="icon" />
          <span>Rally Cry</span>
        </button>
        <button
          className={`ability-button ${callReinforcementsActive ? 'active' : ''}`}
          onClick={() => {
            setCallReinforcementsActive(!callReinforcementsActive);
            onSpecialAbility?.();
          }}
          disabled={status === UnifiedShipStatus.DISABLED}
        >
          <Skull className="icon" />
          <span>Call Reinforcements</span>
        </button>
      </div>
    </SpaceRatShip>
  );
};
