import React from 'react';
import { Skull, Shield, Crosshair, AlertTriangle } from 'lucide-react';
import { WarShipCombat } from '../WarShipCombat';

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