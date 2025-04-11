import { Skull, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { FactionBehaviorConfig, FactionBehaviorType } from '../../../../types/ships/FactionTypes';
import { UnifiedShipStatus } from '../../../../types/ships/UnifiedShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { LostNovaShip } from '../../common/LostNovaShip';

interface NullHunterProps {
  id: string;
  status: UnifiedShipStatus;
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

// Helper function to create a FactionBehaviorConfig from string
const createFactionBehavior = (behavior: string): FactionBehaviorConfig => {
  return {
    formation: 'standard',
    behavior: behavior as FactionBehaviorType,
  };
};

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
  const [targetLockActive, setTargetLockActive] = useState(false);
  const [nullFieldActive, setNullFieldActive] = useState(false);

  useEffect(() => {
    if (status === UnifiedShipStatus.DISABLED) {
      setTargetLockActive(false);
      setNullFieldActive(false);
    }
  }, [status]);

  // Create a proper FactionBehaviorConfig for tactics
  const tactics = createFactionBehavior('aggressive');

  return (
    <div className="relative">
      <LostNovaShip
        id={id}
        name="Null Hunter"
        type="nullsRevenge"
        status={status}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        stats={stats}
        position={position}
        rotation={rotation}
        tactics={tactics}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onFire={onFire}
        onSpecialAbility={() => {
          setNullFieldActive(!nullFieldActive);
          onSpecialAbility?.();
        }}
      >
        <div className="status-effects">
          {targetLockActive && (
            <div className="status-effect">
              <Target className="icon" />
              <span>Target Lock Active</span>
            </div>
          )}
          {nullFieldActive && (
            <div className="status-effect">
              <Skull className="icon" />
              <span>Null Field Active</span>
            </div>
          )}
        </div>
        <div className="action-buttons grid grid-cols-2 gap-2">
          <button
            className={`ability-button ${targetLockActive ? 'active' : ''}`}
            onClick={() => {
              setTargetLockActive(!targetLockActive);
              onSpecialAbility?.();
            }}
            disabled={status === UnifiedShipStatus.DISABLED}
          >
            <Target className="icon" />
            <span>Target Lock</span>
          </button>
          <button
            className={`ability-button ${nullFieldActive ? 'active' : ''}`}
            onClick={() => {
              setNullFieldActive(!nullFieldActive);
              onSpecialAbility?.();
            }}
            disabled={status === UnifiedShipStatus.DISABLED}
          >
            <Skull className="icon" />
            <span>Null Field</span>
          </button>
        </div>
      </LostNovaShip>
    </div>
  );
}
