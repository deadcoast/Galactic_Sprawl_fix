import { AlertTriangle, Bomb, Shield } from 'lucide-react';
import { useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { FactionBehaviorConfig, FactionBehaviorType } from '../../../../types/ships/FactionTypes';
import { UnifiedShipStatus } from '../../../../types/ships/UnifiedShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { SpaceRatShip } from '../../common/SpaceRatShip';

interface AsteroidMarauderProps {
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

const createFactionBehavior = (behavior: string): FactionBehaviorConfig => {
  return {
    formation: 'standard',
    behavior: behavior as FactionBehaviorType,
  };
};

export function AsteroidMarauder({
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
}: AsteroidMarauderProps) {
  const [scrapShieldActive, setScrapShieldActive] = useState(false);
  const [riggedExplosivesActive, setRiggedExplosivesActive] = useState(false);

  const tactics = createFactionBehavior('ambush');

  return (
    <div className="relative">
      {/* Ship Base Component */}
      <SpaceRatShip
        id={id}
        name="Asteroid Marauder"
        type="asteroidMarauder"
        status={status}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        onFire={onFire}
        stats={stats}
        tactics="aggressive"
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={onSpecialAbility}
        position={position}
        rotation={rotation}
      />

      {/* Warning indicator for damaged state */}
      {status === UnifiedShipStatus.DAMAGED && (
        <div className="absolute top-0 right-0 p-2">
          <AlertTriangle className="h-6 w-6 animate-pulse text-yellow-500" />
        </div>
      )}

      {/* Status Effects & Action Buttons */}
      <div className="status-effects">
        {scrapShieldActive && (
          <div className="status-effect">
            <Shield className="icon" />
            <span>Scrap Shield Active</span>
          </div>
        )}
        {riggedExplosivesActive && (
          <div className="status-effect">
            <Bomb className="icon" />
            <span>Explosives Rigged</span>
          </div>
        )}
      </div>
      <div className="action-buttons grid grid-cols-2 gap-2">
        <button
          className={`ability-button ${scrapShieldActive ? 'active' : ''}`}
          onClick={() => {
            setScrapShieldActive(!scrapShieldActive);
            onSpecialAbility?.();
          }}
          disabled={status === UnifiedShipStatus.DISABLED}
        >
          <Shield className="icon" />
          <span>Scrap Shield</span>
        </button>
        <button
          className={`ability-button ${riggedExplosivesActive ? 'active' : ''}`}
          onClick={() => {
            setRiggedExplosivesActive(!riggedExplosivesActive);
            onSpecialAbility?.();
          }}
          disabled={status === UnifiedShipStatus.DISABLED}
        >
          <Bomb className="icon" />
          <span>Rig Explosives</span>
        </button>
      </div>
    </div>
  );
}
