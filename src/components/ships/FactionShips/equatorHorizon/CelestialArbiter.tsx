import { EquatorHorizonShip } from '../../common/EquatorHorizonShip';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { ShipStatus } from '../../../../types/ships/ShipTypes';
import { Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CelestialArbiterProps {
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

export function CelestialArbiter({
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
}: CelestialArbiterProps) {
  const [celestialJudgementActive, setCelestialJudgementActive] = useState(false);

  useEffect(() => {
    if (status === 'disabled') {
      setCelestialJudgementActive(false);
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
    <div className="relative">
      <EquatorHorizonShip
        id={id}
        name="Celestial Arbiter"
        type="celestialArbiter"
        status={mapStatus(status)}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        stats={stats}
        tactics="aggressive"
        position={position}
        rotation={rotation}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onFire={onFire}
        onSpecialAbility={() => {
          setCelestialJudgementActive(!celestialJudgementActive);
          onSpecialAbility?.();
        }}
      >
        <div className="status-effects">
          {celestialJudgementActive && (
            <div className="status-effect">
              <Sun className="icon" />
              <span>Celestial Judgement Active</span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button
            className={`ability-button ${celestialJudgementActive ? 'active' : ''}`}
            onClick={() => {
              setCelestialJudgementActive(!celestialJudgementActive);
              onSpecialAbility?.();
            }}
            disabled={status === 'disabled'}
          >
            <Sun className="icon" />
            <span>Celestial Judgement</span>
          </button>
        </div>
      </EquatorHorizonShip>
    </div>
  );
}
