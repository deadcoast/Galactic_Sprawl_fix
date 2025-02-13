import { ReactNode } from 'react';
import { ShipProvider } from '../../contexts/ShipContext';
import { CommonShipStats } from '../../types/ships/CommonShipTypes';
import { WeaponMount } from '../../types/weapons/WeaponTypes';

interface TestWrapperProps {
  children: ReactNode;
  initialShipState?: {
    id: string;
    name: string;
    status: "engaging" | "patrolling" | "retreating" | "disabled";
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    weapons: WeaponMount[];
    stats: CommonShipStats;
  };
}

export function TestWrapper({ children, initialShipState }: TestWrapperProps) {
  const defaultShipState = {
    id: 'test-ship',
    name: 'Test Ship',
    status: 'patrolling' as const,
    health: 100,
    maxHealth: 100,
    shield: 50,
    maxShield: 50,
    weapons: [],
    stats: {
      health: 100,
      maxHealth: 100,
      shield: 50,
      maxShield: 50,
      energy: 100,
      maxEnergy: 100,
      speed: 100,
      turnRate: 2,
      cargo: 100,
      weapons: [],
      abilities: [],
      defense: {
        armor: 100,
        shield: 50,
        evasion: 0.3,
        regeneration: 1,
      },
      mobility: {
        speed: 100,
        turnRate: 2,
        acceleration: 200,
      },
    },
  };

  return (
    <ShipProvider initialState={initialShipState || defaultShipState}>
      {children}
    </ShipProvider>
  );
} 