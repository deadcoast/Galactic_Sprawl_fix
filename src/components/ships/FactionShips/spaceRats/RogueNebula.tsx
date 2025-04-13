import { AlertTriangle, Ghost, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { FactionBehaviorConfig, FactionBehaviorType } from '../../../../types/ships/FactionTypes';
import { UnifiedShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { SpaceRatShip } from './SpaceRatShip';

interface RogueNebulaProps {
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
  onSpecialAbility?: (abilityName: string) => void;
  position: { x: number; y: number };
  rotation: number;
}

// Helper function to create a FactionBehaviorConfig from string
const createFactionBehavior = (behavior: string): FactionBehaviorConfig => {
  return {
    formation: 'chaotic',
    behavior: behavior as FactionBehaviorType,
  };
};

export function RogueNebula({
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
}: RogueNebulaProps) {
  const [plasmaVentActive, setPlasmaVentActive] = useState(false);
  const [cloakActive, setCloakActive] = useState(false);

  useEffect(() => {
    if (status === UnifiedShipStatus.DISABLED) {
      setPlasmaVentActive(false);
      setCloakActive(false);
    }
  }, [status]);

  // Create a proper FactionBehaviorConfig for tactics
  const tactics = createFactionBehavior('stealth'); // Example behavior

  return (
    <div className="relative">
      {/* Ship Base Component */}
      <SpaceRatShip
        id={id}
        name="Rogue Nebula"
        type="rogueNebula"
        status={status}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        tactics={tactics}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={() => onSpecialAbility?.('plasmaVent')}
        onFire={onFire}
        position={position}
        rotation={rotation}
        stats={stats}
      />

      {/* Status Effects */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {plasmaVentActive && (
          <div className="flex items-center gap-2 rounded-lg bg-violet-500/20 px-2 py-1 text-sm text-violet-300">
            <Zap className="h-4 w-4" />
            Plasma Vent Active
          </div>
        )}
        {cloakActive && (
          <div className="flex items-center gap-2 rounded-lg bg-cyan-500/20 px-2 py-1 text-sm text-cyan-300">
            <Ghost className="h-4 w-4" />
            Cloaking Field Active
          </div>
        )}
      </div>

      {/* warning indicator for damaged state */}
      {status === UnifiedShipStatus.DAMAGED && (
        <div className="absolute top-0 right-0 p-2">
          <AlertTriangle className="h-6 w-6 animate-pulse text-yellow-500" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute right-4 bottom-4 left-4 flex gap-2">
        <div className="action-buttons grid grid-cols-2 gap-2">
          <button
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-500/20 px-4 py-2 text-violet-300 hover:bg-violet-500/30 ${plasmaVentActive ? 'active' : ''}`}
            onClick={() => {
              setPlasmaVentActive(!plasmaVentActive);
              onSpecialAbility?.('plasmaVent');
            }}
            disabled={status === UnifiedShipStatus.DISABLED}
          >
            <Zap className="h-4 w-4" />
            <span>Plasma Vent</span>
          </button>
          <button
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-cyan-300 hover:bg-cyan-500/30 ${cloakActive ? 'active' : ''}`}
            onClick={() => {
              setCloakActive(!cloakActive);
              onSpecialAbility?.('cloak');
            }}
            disabled={status === UnifiedShipStatus.DISABLED}
          >
            <Ghost className="h-4 w-4" />
            Cloak
          </button>
        </div>
      </div>
    </div>
  );
}
