import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { ShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { EquatorHorizonShip } from '../../common/EquatorHorizonShip';

interface StellarEquinoxProps {
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

  useEffect(() => {
    if (status === 'disabled') {
      setStellarConvergenceActive(false);
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
        name="Stellar Equinox"
        type="stellarEquinox"
        status={mapStatus(status)}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        tactics="defensive"
        position={position}
        rotation={rotation}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onFire={onFire}
        stats={stats}
        onSpecialAbility={() => {
          setStellarConvergenceActive(!stellarConvergenceActive);
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
        </div>
        <div className="action-buttons">
          <button
            className={`ability-button ${stellarConvergenceActive ? 'active' : ''}`}
            onClick={() => {
              setStellarConvergenceActive(!stellarConvergenceActive);
              onSpecialAbility?.();
            }}
            disabled={status === 'disabled'}
          >
            <Star className="icon" />
            <span>Stellar Convergence</span>
          </button>
        </div>
      </EquatorHorizonShip>
    </div>
  );
}
