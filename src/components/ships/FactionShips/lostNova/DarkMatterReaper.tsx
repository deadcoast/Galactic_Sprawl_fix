import { Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { FactionBehaviorType } from '../../../../types/ships/FactionTypes';
import { ShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { LostNovaShip } from '../../common/LostNovaShip';

interface DarkMatterReaperProps {
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

// Helper function to create a FactionBehaviorType from string
const createFactionBehavior = (behavior: string): FactionBehaviorType => {
  return {
    formation: 'standard',
    behavior: behavior,
  };
};

export function DarkMatterReaper({
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
}: DarkMatterReaperProps) {
  const [voidPulseActive, setVoidPulseActive] = useState(false);

  useEffect(() => {
    if (status === 'disabled') {
      setVoidPulseActive(false);
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

  // Create a proper FactionBehaviorType for tactics
  const tactics = createFactionBehavior('stealth');

  return (
    <div className="relative">
      <LostNovaShip
        id={id}
        name="Dark Matter Reaper"
        type="darkMatterReaper"
        status={mapStatus(status)}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        stats={stats}
        tactics={tactics}
        position={position}
        rotation={rotation}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onFire={onFire}
        onSpecialAbility={() => {
          setVoidPulseActive(!voidPulseActive);
          onSpecialAbility?.();
        }}
      >
        <div className="status-effects">
          {voidPulseActive && (
            <div className="status-effect">
              <Zap className="icon" />
              <span>Void Pulse Active</span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button
            className={`ability-button ${voidPulseActive ? 'active' : ''}`}
            onClick={() => {
              setVoidPulseActive(!voidPulseActive);
              onSpecialAbility?.();
            }}
            disabled={status === 'disabled'}
          >
            <Zap className="icon" />
            <span>Void Pulse</span>
          </button>
        </div>
      </LostNovaShip>
    </div>
  );
}
