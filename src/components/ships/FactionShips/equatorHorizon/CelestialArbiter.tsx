import { Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { UnifiedShipStatus } from '../../../../types/ships/UnifiedShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { EquatorHorizonShip } from '../../common/EquatorHorizonShip';

interface CelestialArbiterProps {
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
    if (status === UnifiedShipStatus.DISABLED) {
      setCelestialJudgementActive(false);
    }
  }, [status]);

  return (
    <div className="relative">
      <EquatorHorizonShip
        id={id}
        name="Celestial Arbiter"
        type="celestialArbiter"
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
            disabled={status === UnifiedShipStatus.DISABLED}
          >
            <Sun className="icon" />
            <span>Celestial Judgement</span>
          </button>
        </div>
      </EquatorHorizonShip>
    </div>
  );
}
