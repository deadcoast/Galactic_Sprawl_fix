import React from 'react';
import { Skull, Shield, Crosshair } from 'lucide-react';
import { WarShipCombat } from '../../../playerShips/WarShipCombat';
import { ShipBase } from '../../../ships/components/ShipBase';
import { WeaponMount } from '../../../ships/components/WeaponMount';
import { WeaponType } from '../../../types/CombatTypes';
import { ShipStats } from '../../../types/ShipTypes';

interface RogueNebulaProps {
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

export function RogueNebula({
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
}: RogueNebulaProps) {
  return (
    <div className="relative">
      <ShipBase
        id={id}
        name="Rogue Nebula"
        faction="spaceRats"
        status={status}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        stats={stats}
        specialAbility={{
          name: "Nebula Cloak",
          cooldown: 30,
          duration: 8,
          effect: {
            type: 'stealth',
            magnitude: 1
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
              x: 45 + (index * 28),
              y: 45
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

interface RogueNebulaProps {
  id: string;
  status: 'idle' | 'engaging' | 'retreating' | 'damaged';
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  weapons: {
    id: string;
    name: string;
    type: 'gaussCannon' | 'rockets';
    damage: number;
    range: number;
    cooldown: number;
    status: 'ready' | 'charging' | 'cooling';
  }[];
  onFire: (weaponId: string) => void;
  onRetreat: () => void;
}

export function RogueNebula({
  id,
  status,
  hull,
  maxHull,
  shield,
  maxShield,
  weapons,
  onFire,
  onRetreat
}: RogueNebulaProps) {
  return (
    <WarShipCombat
      ship={{
        id,
        name: "Rogue Nebula",
        type: 'spitflare',
        tier: 2,
        status,
        hull,
        maxHull,
        shield,
        maxShield,
        weapons,
        specialAbilities: [
          {
            name: "Nebula Cloak",
            description: "Briefly become invisible to enemy targeting systems",
            cooldown: 30,
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