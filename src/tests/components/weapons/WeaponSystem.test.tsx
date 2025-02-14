import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpaceRatShip } from '../../../components/ships/common/SpaceRatShip';
import { LostNovaShip } from '../../../components/ships/common/LostNovaShip';
import { EquatorHorizonShip } from '../../../components/ships/common/EquatorHorizonShip';
import { WeaponSystem } from '../../../components/weapons/WeaponSystem';
import { WeaponInstance, WeaponConfig, WeaponState, CombatWeaponStats, WeaponCategory, WeaponMount, WeaponMountSize, WeaponMountPosition } from '../../../types/weapons/WeaponTypes';
import { TestWrapper } from '../../utils/testUtils';

// Mock weapon data
const mockWeapons: WeaponMount[] = [{
  id: 'weapon-1',
  size: 'medium' as WeaponMountSize,
  position: 'front' as WeaponMountPosition,
  rotation: 0,
  allowedCategories: ['machineGun' as WeaponCategory],
  currentWeapon: {
    config: {
      id: 'mg-1',
      name: 'Machine Gun',
      category: 'machineGun' as WeaponCategory,
      tier: 1,
      baseStats: {
        damage: 10,
        range: 300,
        accuracy: 0.8,
        rateOfFire: 10,
        energyCost: 5,
        cooldown: 0.1,
        effects: []
      },
      visualAsset: 'weapons/machinegun/basic',
      mountRequirements: {
        size: 'medium' as WeaponMountSize,
        power: 10
      }
    },
    state: {
      status: 'ready',
      currentStats: {
        damage: 10,
        range: 300,
        accuracy: 0.8,
        rateOfFire: 10,
        energyCost: 5,
        cooldown: 0.1,
        effects: []
      },
      effects: []
    }
  }
}];

describe('Faction Ship Weapon Systems', () => {
  describe('SpaceRatShip', () => {
    it('should render weapon mounts correctly', () => {
      render(
        <TestWrapper initialShipState={{
          id: 'test-ship',
          name: 'Test Ship',
          status: 'patrolling',
          health: 100,
          maxHealth: 100,
          shield: 50,
          maxShield: 50,
          weapons: mockWeapons,
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
            weapons: mockWeapons,
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
        }}>
          <SpaceRatShip
            id="test-ship"
            name="Test Ship"
            type="ratKing"
            status="patrolling"
            health={100}
            maxHealth={100}
            shield={50}
            maxShield={50}
            weapons={mockWeapons}
            tactics="aggressive"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Machine Gun')).toBeInTheDocument();
    });

    it('should handle weapon effects when rage mode is activated', async () => {
      const user = userEvent.setup();
      const onSpecialAbility = vi.fn();
      render(
        <TestWrapper initialShipState={{
          id: 'test-ship',
          name: 'Test Ship',
          status: 'patrolling',
          health: 100,
          maxHealth: 100,
          shield: 50,
          maxShield: 50,
          weapons: mockWeapons,
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
            weapons: mockWeapons,
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
        }}>
          <SpaceRatShip
            id="test-ship"
            name="Test Ship"
            type="ratKing"
            status="patrolling"
            health={100}
            maxHealth={100}
            shield={50}
            maxShield={50}
            weapons={mockWeapons}
            tactics="aggressive"
            onSpecialAbility={onSpecialAbility}
          />
        </TestWrapper>
      );

      // Find the rage mode button in the action buttons section
      const rageButtons = screen.getAllByRole('button', { name: /rage mode/i });
      const actionButton = rageButtons[rageButtons.length - 1]; // Get the last one (in action buttons)
      await user.click(actionButton);
      expect(onSpecialAbility).toHaveBeenCalled();
    });
  });

  describe('LostNovaShip', () => {
    it('should render weapon mounts correctly', () => {
      render(
        <TestWrapper initialShipState={{
          id: 'test-ship',
          name: 'Test Ship',
          status: 'patrolling',
          health: 100,
          maxHealth: 100,
          shield: 50,
          maxShield: 50,
          weapons: mockWeapons,
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
            weapons: mockWeapons,
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
        }}>
          <LostNovaShip
            id="test-ship"
            name="Test Ship"
            type="eclipseScythe"
            status="patrolling"
            health={100}
            maxHealth={100}
            shield={50}
            maxShield={50}
            weapons={mockWeapons}
            tactics="stealth"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Machine Gun')).toBeInTheDocument();
    });

    it('should handle weapon effects when void pulse is activated', async () => {
      const user = userEvent.setup();
      const onSpecialAbility = vi.fn();
      render(
        <TestWrapper initialShipState={{
          id: 'test-ship',
          name: 'Test Ship',
          status: 'patrolling',
          health: 100,
          maxHealth: 100,
          shield: 50,
          maxShield: 50,
          weapons: mockWeapons,
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
            weapons: mockWeapons,
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
        }}>
          <LostNovaShip
            id="test-ship"
            name="Test Ship"
            type="eclipseScythe"
            status="patrolling"
            health={100}
            maxHealth={100}
            shield={50}
            maxShield={50}
            weapons={mockWeapons}
            tactics="stealth"
            onSpecialAbility={onSpecialAbility}
          />
        </TestWrapper>
      );

      // Find the void pulse button in the action buttons section
      const voidPulseButtons = screen.getAllByRole('button', { name: /void pulse/i });
      const actionButton = voidPulseButtons[voidPulseButtons.length - 1]; // Get the last one (in action buttons)
      await user.click(actionButton);
      expect(onSpecialAbility).toHaveBeenCalled();
    });
  });

  describe('EquatorHorizonShip', () => {
    it('should render weapon mounts correctly', () => {
      render(
        <TestWrapper initialShipState={{
          id: 'test-ship',
          name: 'Test Ship',
          status: 'patrolling',
          health: 100,
          maxHealth: 100,
          shield: 50,
          maxShield: 50,
          weapons: mockWeapons,
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
            weapons: mockWeapons,
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
        }}>
          <EquatorHorizonShip
            id="test-ship"
            name="Test Ship"
            type="celestialArbiter"
            status="patrolling"
            health={100}
            maxHealth={100}
            shield={50}
            maxShield={50}
            weapons={mockWeapons}
            tactics="defensive"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Machine Gun')).toBeInTheDocument();
    });

    it('should handle weapon effects when overcharge is activated', async () => {
      const user = userEvent.setup();
      const onSpecialAbility = vi.fn();
      render(
        <TestWrapper initialShipState={{
          id: 'test-ship',
          name: 'Test Ship',
          status: 'patrolling',
          health: 100,
          maxHealth: 100,
          shield: 50,
          maxShield: 50,
          weapons: mockWeapons,
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
            weapons: mockWeapons,
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
        }}>
          <EquatorHorizonShip
            id="test-ship"
            name="Test Ship"
            type="celestialArbiter"
            status="patrolling"
            health={100}
            maxHealth={100}
            shield={50}
            maxShield={50}
            weapons={mockWeapons}
            tactics="defensive"
            onSpecialAbility={onSpecialAbility}
          />
        </TestWrapper>
      );

      // Find the overcharge button in the action buttons section
      const overchargeButtons = screen.getAllByRole('button', { name: /overcharge/i });
      const actionButton = overchargeButtons[overchargeButtons.length - 1]; // Get the last one (in action buttons)
      await user.click(actionButton);
      expect(onSpecialAbility).toHaveBeenCalled();
    });
  });
});

describe('WeaponSystem', () => {
  const mockStats: CombatWeaponStats = {
    damage: 10,
    range: 100,
    accuracy: 0.8,
    rateOfFire: 1,
    energyCost: 5,
    cooldown: 1000,
    effects: []
  };

  const mockConfig: WeaponConfig = {
    id: 'test-weapon',
    name: 'Test Weapon',
    category: 'machineGun' as WeaponCategory,
    tier: 1,
    baseStats: mockStats,
    visualAsset: 'laser.png',
    mountRequirements: {
      size: 'small',
      power: 10
    }
  };

  const mockState: WeaponState = {
    status: 'ready',
    currentStats: mockStats,
    effects: []
  };

  const mockWeapon: WeaponInstance = {
    config: mockConfig,
    state: mockState
  };

  it('renders weapon name correctly', () => {
    render(
      <WeaponSystem
        weapon={mockWeapon}
        onFire={vi.fn()}
        onToggleEffect={vi.fn()}
      />
    );

    expect(screen.getByText('Test Weapon')).toBeInTheDocument();
  });

  it('handles weapon firing', async () => {
    const onFire = vi.fn();
    const user = userEvent.setup();

    render(
      <WeaponSystem
        weapon={mockWeapon}
        onFire={onFire}
        onToggleEffect={vi.fn()}
      />
    );

    const fireButton = screen.getByRole('button', { name: /fire/i });
    await user.click(fireButton);

    expect(onFire).toHaveBeenCalledWith(mockWeapon.config.id);
  });

  it('displays weapon stats correctly', () => {
    render(
      <WeaponSystem
        weapon={mockWeapon}
        onFire={vi.fn()}
        onToggleEffect={vi.fn()}
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument(); // Damage
    expect(screen.getByText('100')).toBeInTheDocument(); // Range
  });
}); 