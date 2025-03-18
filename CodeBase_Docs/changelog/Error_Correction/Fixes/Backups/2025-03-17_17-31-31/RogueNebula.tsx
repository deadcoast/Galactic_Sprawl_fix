import * as React from "react";
import { useEffect, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Radar } from 'lucide-react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { FactionBehaviorConfig, FactionBehaviorType } from '../../../../types/ships/FactionTypes';
import { ShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { SpaceRatShip } from '../../common/SpaceRatShip';

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

  // Create a proper FactionBehaviorType for tactics
  const tactics = createFactionBehavior('hit-and-run');

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
        tactics={tactics}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={() => onSpecialAbility?.(stealthActive ? 'stealth' : 'scan')}
        onFire={onFire}
        position={position}
        rotation={rotation}
        stats={stats}
      />

      {/* Status Effects */}
      <div className="absolute right-4 top-4 flex flex-col gap-2">
        {stealthActive && (
          <div className="flex items-center gap-2 rounded-lg bg-violet-500/20 px-2 py-1 text-sm text-violet-300">
            <EyeOff className="h-4 w-4" />
            Stealth Active
          </div>
        )}
        {scanActive && (
          <div className="flex items-center gap-2 rounded-lg bg-cyan-500/20 px-2 py-1 text-sm text-cyan-300">
            <Radar className="h-4 w-4" />
            Scan Active
          </div>
        )}
      </div>

      {/* Warning indicator for damaged state */}
      {status === 'damaged' && (
        <div className="absolute right-0 top-0 p-2">
          <AlertTriangle className="h-6 w-6 animate-pulse text-yellow-500" />
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
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-500/20 px-4 py-2 text-violet-300 hover:bg-violet-500/30"
        >
          {stealthActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          Stealth
        </button>
        <button
          onClick={() => {
            setScanActive(!scanActive);
            setStealthActive(false);
            onSpecialAbility?.('scan');
          }}
          disabled={status === 'disabled' || status === 'damaged'}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-cyan-300 hover:bg-cyan-500/30"
        >
          <Radar className="h-4 w-4" />
          Scan
        </button>
      </div>
    </div>
  );
}
