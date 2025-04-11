import { Ghost, Skull } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { FactionBehaviorConfig, FactionBehaviorType } from '../../../../types/ships/FactionTypes';
import { UnifiedShipStatus } from '../../../../types/ships/UnifiedShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { LostNovaShip } from '../../common/LostNovaShip';

interface EclipseScytheProps {
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
  position,
  rotation,
}: EclipseScytheProps) {
  const [voidShroudActive, setVoidShroudActive] = useState(false);
  const [entropyCascadeActive, setEntropyCascadeActive] = useState(false);

  useEffect(() => {
    if (status === UnifiedShipStatus.DISABLED) {
      setVoidShroudActive(false);
      setEntropyCascadeActive(false);
    }
  }, [status]);

  // Create a proper FactionBehaviorConfig for tactics
  const tactics = createFactionBehavior('hit-and-run');

  return (
    <div className="relative">
      <LostNovaShip
        id={id}
        name="Eclipse Scythe"
        type="eclipseScythe"
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
          setVoidShroudActive(!voidShroudActive);
          setEntropyCascadeActive(!entropyCascadeActive);
          onSpecialAbility?.();
        }}
      >
        <div className="status-effects">
          {voidShroudActive && (
            <div className="status-effect">
              <Ghost className="icon" />
              <span>Void Shroud Active</span>
            </div>
          )}
          {entropyCascadeActive && (
            <div className="status-effect">
              <Skull className="icon" />
              <span>Entropy Cascade Active</span>
            </div>
          )}
        </div>
        <div className="action-buttons grid grid-cols-2 gap-2">
          <button
            className={`ability-button ${voidShroudActive ? 'active' : ''}`}
            onClick={() => {
              setVoidShroudActive(!voidShroudActive);
              onSpecialAbility?.();
            }}
            disabled={status === UnifiedShipStatus.DISABLED}
          >
            <Ghost className="icon" />
            <span>Void Shroud</span>
          </button>
          <button
            className={`ability-button ${entropyCascadeActive ? 'active' : ''}`}
            onClick={() => {
              setEntropyCascadeActive(!entropyCascadeActive);
              onSpecialAbility?.();
            }}
            disabled={status === UnifiedShipStatus.DISABLED}
          >
            <Skull className="icon" />
            <span>Entropy Cascade</span>
          </button>
        </div>
      </LostNovaShip>
    </div>
  );
}
