import * as React from "react";
import { AlertTriangle } from 'lucide-react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { ShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { SpaceRatShip } from '../../common/SpaceRatShip';

interface AsteroidMarauderProps {
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
        name="Asteroid Marauder"
        type="asteroidMarauder"
        status={mapStatus(status)}
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
      {status === 'damaged' && (
        <div className="absolute right-0 top-0 p-2">
          <AlertTriangle className="h-6 w-6 animate-pulse text-yellow-500" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
        <button
          onClick={onSpecialAbility}
          disabled={
            status === 'disabled' || status === 'damaged' || stats.energy <= stats.maxEnergy * 0.5
          }
          className="flex-1 rounded-lg bg-blue-500/20 px-4 py-2 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
        >
          Boost
        </button>
      </div>
    </div>
  );
}
