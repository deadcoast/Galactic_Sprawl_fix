import React from 'react';
import { Skull, Shield, Crosshair } from 'lucide-react';
import { WarShipCombat } from '../WarShipCombat';

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