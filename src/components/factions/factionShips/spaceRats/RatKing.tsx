import React from 'react';
import { Skull, Shield, Crosshair, AlertTriangle } from 'lucide-react';
import { WarShipCombat } from '../../../playerShips/WarShipCombat';
import { ShipBase } from '../../../ships/components/ShipBase';
import { WeaponMount } from '../../../ships/components/WeaponMount';
import { WeaponType } from '../../../types/CombatTypes';
import { ShipStats } from '../../../types/ShipTypes';

interface RatKingProps {
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

export function RatKing({
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
}: RatKingProps) {
  return (
    <div className="relative">
      <ShipBase
        id={id}
        name="The Rat King"
        faction="spaceRats"
        status={status}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        stats={stats}
        specialAbility={{
          name: "Pirate's Fury",
          cooldown: 30,
          duration: 10,
          effect: {
            type: 'damage',
            magnitude: 2
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
              x: 50 + (index * 30),
              y: 50
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

interface RatKingProps {
  id: string;
  status: 'idle' | 'engaging' | 'retreating' | 'damaged';
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  weapons: {
    id: string;
    name: string;
    type: 'machineGun' | 'railGun' | 'gaussCannon' | 'rockets';
    damage: number;
    range: number;
    cooldown: number;
    status: 'ready' | 'charging' | 'cooling';
  }[];
  specialAbilities: {
    name: string;
    description: string;
    cooldown: number;
    active: boolean;
  }[];
  onFire: (weaponId: string) => void;
  onActivateAbility: (abilityName: string) => void;
  onRetreat: () => void;
}

export function RatKing({
  id,
  status,
  hull,
  maxHull,
  shield,
  maxShield,
  weapons,
  specialAbilities,
  onFire,
  onActivateAbility,
  onRetreat
}: RatKingProps) {
  return (
    <WarShipCombat
      ship={{
        id,
        name: "The Rat King",
        type: 'spitflare',
        tier: 3,
        status,
        hull,
        maxHull,
        shield,
        maxShield,
        weapons,
        specialAbilities: [
          {
            name: "Swarm Command",
            description: "Boost nearby Space Rat ships' attack speed",
            cooldown: 45,
            active: false
          },
          {
            name: "Scavenger's Fury",
            description: "Increased damage against damaged targets",
            cooldown: 30,
            active: false
          }
        ]
      }}
      onFireWeapon={onFire}
      onActivateAbility={onActivateAbility}
      onRetreat={onRetreat}
    />
  );
}