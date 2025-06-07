import { Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { UnifiedShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { EquatorHorizonShip } from './EquatorHorizonShip';

interface StellarEquinoxProps {
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

export function StellarEquinox({
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
}: StellarEquinoxProps) {
  const [stellarConvergenceActive, setStellarConvergenceActive] = useState(false);
  const [stellarFlareActive, setStellarFlareActive] = useState(false);

  useEffect(() => {
    if (status === UnifiedShipStatus.DISABLED) {
      setStellarConvergenceActive(false);
      setStellarFlareActive(false);
    }
  }, [status]);

  return (
    <div className="relative">
      <EquatorHorizonShip
        id={id}
        name="Stellar Equinox"
        type="stellarEquinox"
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
          setStellarConvergenceActive(!stellarConvergenceActive);
          setStellarFlareActive(!stellarFlareActive);
          onSpecialAbility?.();
        }}
      >
        <div className="status-effects">
          {stellarConvergenceActive && (
            <div className="status-effect">
              <Star className="icon" />
              <span>Stellar Convergence Active</span>
            </div>
          )}
          {stellarFlareActive && (
            <div className="status-effect">
              <Sparkles className="icon" />
              <span>Stellar Flare Active</span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button
            className={`ability-button ${stellarConvergenceActive ? 'active' : ''}`}
            onClick={() => {
              setStellarConvergenceActive(!stellarConvergenceActive);
              setStellarFlareActive(!stellarFlareActive);
              onSpecialAbility?.();
            }}
            disabled={status === UnifiedShipStatus.DISABLED}
          >
            <Star className="icon" />
            <span>Stellar Convergence</span>
          </button>
        </div>
      </EquatorHorizonShip>
    </div>
  );
}
