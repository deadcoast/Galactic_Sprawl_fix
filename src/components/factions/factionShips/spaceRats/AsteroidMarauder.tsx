import React from 'react';
import { Skull, Shield, Crosshair } from 'lucide-react';
import { WarShipCombat } from '../../../playerShips/WarShipCombat';
import { ShipBase } from '../../../ships/components/ShipBase';
import { WeaponMount } from '../../../ships/components/WeaponMount';
import { WeaponType } from '../../../types/CombatTypes';
import { ShipStats } from '../../../types/ShipTypes';

interface AsteroidMarauderProps {
  id: string;
  status: 'idle' | 'engaging' | 'patrolling' | 'retreating' | 'disabled';
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponType[];
  stats: ShipStats;
  onFire?: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
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
  onFire,
  onEngage,
  onRetreat,
  onSpecialAbility
}: AsteroidMarauderProps) {
  return (
    <div className="relative">
      <ShipBase
        id={id}
        name="Asteroid Marauder"
        faction="spaceRats"
        status={status}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        stats={stats}
        specialAbility={{
          name: "Asteroid Cover",
          cooldown: 20,
          duration: 8,
          effect: {
            type: 'shield',
            magnitude: 1.5
          }
        }}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={onSpecialAbility}
      />

      {/* Weapon Mounts */}
      <div className="absolute inset-0 pointer-events-none">
        {weapons.map((weapon, index) => (
          <WeaponMount
            key={weapon.id}
            weapon={weapon}
            position={{
              x: 40 + (index * 25),
              y: 40
            }}
            rotation={0}
            isFiring={status === 'engaging'}
            onFire={() => onFire?.(weapon.id)}
            className="absolute"
          />
        ))}
      </div>
    </div>
  );
} 

interface AsteroidMarauderProps {
  id: string;
  status: 'idle' | 'engaging' | 'retreating' | 'damaged';
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  weapons: {
    id: string;
    name: string;
    type: 'machineGun' | 'railGun';
    damage: number;
    range: number;
    cooldown: number;
    status: 'ready' | 'charging' | 'cooling';
  }[];
  onFire: (weaponId: string) => void;
  onRetreat: () => void;
}

export function AsteroidMarauder({
  id,
  status,
  hull,
  maxHull,
  shield,
  maxShield,
  weapons,
  onFire,
  onRetreat
}: AsteroidMarauderProps) {
  return (
    <WarShipCombat
      ship={{
        id,
        name: "Asteroid Marauder",
        type: 'spitflare',
        tier: 1,
        status,
        hull,
        maxHull,
        shield,
        maxShield,
        weapons,
        specialAbilities: [
          {
            name: "Asteroid Cover",
            description: "Temporarily increases shield regeneration",
            cooldown: 20,
            active: false
          }
        ]
      }}
      onFireWeapon={onFire}
      onActivateAbility={() => {}}
      onRetreat={onRetreat}
    />
  );
}