import { ResourceType } from "./../../../../types/resources/ResourceTypes";
import * as React from "react";
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { FactionShipStats } from '../../../../types/ships/FactionShipTypes';
import { FactionBehaviorConfig, FactionBehaviorType } from '../../../../types/ships/FactionTypes';
import { ShipStatus } from '../../../../types/ships/ShipTypes';
import { WeaponMount } from '../../../../types/weapons/WeaponTypes';
import { LostNovaShip } from '../../common/LostNovaShip';

interface DarkMatterReaperProps {
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

// Ship-specific stats - kept for future implementation of ship stat scaling
// These will be used when implementing dynamic ship stat adjustments based on player progression
const _baseHealth = 1200;
const _baseShield = 800;
const _baseSpeed = 3.5;
const _baseDamage = 120;
const _baseRange = 450;
const _baseFireRate = 1.2;

// Ship-specific weapon template - kept for future implementation of weapon customization
// This will be used when implementing the weapon customization system
const _primaryWeapon = {
  id: 'dark-matter-cannon',
  name: 'Dark Matter Cannon',
  type: ResourceType.ENERGY,
  damage: _baseDamage,
  range: _baseRange,
  fireRate: _baseFireRate,
  status: 'ready',
};

// Helper function to create a FactionBehaviorConfig from string
const createFactionBehavior = (behavior: string): FactionBehaviorConfig => {
  return {
    formation: 'standard',
    behavior: behavior as FactionBehaviorType,
  };
};

export function DarkMatterReaper({
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
}: DarkMatterReaperProps) {
  const [voidPulseActive, setVoidPulseActive] = useState(false);

  // Use the base stats for scaling calculations
  const healthScaling = maxHealth / _baseHealth;
  const shieldScaling = maxShield / _baseShield;
  const speedScaling = stats.speed / _baseSpeed;

  // Create a weapon configuration based on the primary weapon template
  const weaponConfig = {
    ..._primaryWeapon,
    damage: _primaryWeapon.damage * healthScaling,
    range: _primaryWeapon.range * (stats.tier || 1),
    fireRate: _primaryWeapon.fireRate * speedScaling,
  };

  useEffect(() => {
    if (status === 'disabled') {
      setVoidPulseActive(false);
    }

    // Log weapon and shield scaling for debugging
    console.debug('Dark Matter Reaper stats scaling:', {
      healthScaling,
      shieldScaling,
      speedScaling,
      weaponConfig,
    });
  }, [status, healthScaling, shieldScaling, speedScaling, weaponConfig]);

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

  // Create a proper FactionBehaviorConfig for tactics
  const tactics = createFactionBehavior('stealth');

  return (
    <div className="relative">
      <LostNovaShip
        id={id}
        name="Dark Matter Reaper"
        type="darkMatterReaper"
        status={mapStatus(status)}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        weapons={weapons}
        stats={stats}
        tactics={tactics}
        position={position}
        rotation={rotation}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onFire={onFire}
        onSpecialAbility={() => {
          setVoidPulseActive(!voidPulseActive);
          onSpecialAbility?.();
        }}
      >
        <div className="status-effects">
          {voidPulseActive && (
            <div className="status-effect">
              <Zap className="icon" />
              <span>Void Pulse Active</span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button
            className={`ability-button ${voidPulseActive ? 'active' : ''}`}
            onClick={() => {
              setVoidPulseActive(!voidPulseActive);
              onSpecialAbility?.();
            }}
            disabled={status === 'disabled'}
          >
            <Zap className="icon" />
            <span>Void Pulse</span>
          </button>
        </div>
      </LostNovaShip>
    </div>
  );
}
