import { SpaceRatShip } from '../../common/SpaceRatShip';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { ShipStatus } from '../../../../types/ships/ShipTypes';
import { AlertTriangle, Eye, EyeOff, Radar } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RogueNebulaProps {
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
  onSpecialAbility?: (abilityName: string) => void;
  position: { x: number; y: number };
  rotation: number;
}

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
  const [stealthActive, setStealthActive] = useState(false);
  const [scanActive, setScanActive] = useState(false);

  useEffect(() => {
    // Reset abilities when ship is disabled or damaged
    if (status === 'disabled' || status === 'damaged') {
      setStealthActive(false);
      setScanActive(false);
    }
  }, [status]);

  // Map the full ShipStatus to SpaceRatShip's more limited status type
  const mapStatus = (status: ShipStatus): 'engaging' | 'patrolling' | 'retreating' | 'disabled' => {
    switch (status) {
      case 'damaged':
        return 'disabled';
      case 'idle':
      case 'ready':
        return 'patrolling';
      case 'engaging':
      case 'patrolling':
      case 'retreating':
      case 'disabled':
        return status;
    }
  };

  return (
    <div className="relative">
      {/* Ship Base Component */}
      <SpaceRatShip
        id={id}
        name="Rogue Nebula"
        type="rogueNebula"
        status={mapStatus(status)}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        tactics="hit-and-run"
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={() => onSpecialAbility?.(stealthActive ? 'stealth' : 'scan')}
        onFire={onFire}
        position={position}
        rotation={rotation}
        stats={stats}
      />

      {/* Status Effects */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {stealthActive && (
          <div className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-sm flex items-center gap-2">
            <EyeOff className="w-4 h-4" />
            Stealth Active
          </div>
        )}
        {scanActive && (
          <div className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm flex items-center gap-2">
            <Radar className="w-4 h-4" />
            Scan Active
          </div>
        )}
      </div>

      {/* Warning indicator for damaged state */}
      {status === 'damaged' && (
        <div className="absolute top-0 right-0 p-2">
          <AlertTriangle className="w-6 h-6 text-yellow-500 animate-pulse" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
        <button
          onClick={() => {
            setStealthActive(!stealthActive);
            setScanActive(false);
            onSpecialAbility?.('stealth');
          }}
          disabled={status === 'disabled' || status === 'damaged'}
          className="flex-1 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg flex items-center justify-center gap-2"
        >
          {stealthActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          Stealth
        </button>
        <button
          onClick={() => {
            setScanActive(!scanActive);
            setStealthActive(false);
            onSpecialAbility?.('scan');
          }}
          disabled={status === 'disabled' || status === 'damaged'}
          className="flex-1 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg flex items-center justify-center gap-2"
        >
          <Radar className="w-4 h-4" />
          Scan
        </button>
      </div>
    </div>
  );
}
