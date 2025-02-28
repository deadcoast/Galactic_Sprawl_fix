import { Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { FactionBehaviorType } from '../../../../types/ships/FactionTypes';
import { ShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { LostNovaShip } from '../../common/LostNovaShip';

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
  const [shadowVeilActive, setShadowVeilActive] = useState(false);

  useEffect(() => {
    if (status === 'disabled') {
      setShadowVeilActive(false);
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
  const tactics = createFactionBehavior('hit-and-run');

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
        stats={stats}
        position={position}
        rotation={rotation}
        tactics={tactics}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onFire={onFire}
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
            disabled={status === 'disabled'}
          >
            <Moon className="icon" />
            <span>Shadow Veil</span>
          </button>
        </div>
      </LostNovaShip>
    </div>
  );
}
