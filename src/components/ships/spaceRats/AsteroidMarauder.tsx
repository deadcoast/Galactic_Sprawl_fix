import React from 'react';
import { Skull, Shield, Crosshair } from 'lucide-react';
import { WarShipCombat } from '../WarShipCombat';

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