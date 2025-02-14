import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeaponUpgradeSystem } from '../../../components/weapons/WeaponUpgradeSystem';
import {
  WeaponCategory,
  WeaponUpgrade,
  CombatWeaponStats,
} from '../../../types/weapons/WeaponTypes';

// Mock data
const mockStats: CombatWeaponStats = {
  damage: 10,
  range: 100,
  accuracy: 0.8,
  rateOfFire: 10,
  energyCost: 5,
  cooldown: 1,
  effects: [],
};

const mockWeapon = {
  id: 'test-weapon',
  name: 'Test Weapon',
  type: 'machineGun' as WeaponCategory,
  tier: 1 as const,
  currentStats: mockStats,
  availableUpgrades: [],
  resources: {
    plasma: 150,
    energy: 50,
  },
};

const mockUpgrade: WeaponUpgrade = {
  id: 'test-upgrade',
  name: 'Enhanced Damage',
  type: 'damage',
  description: 'Increases weapon damage',
  stats: {
    damage: 15,
    energyCost: 7,
  },
  specialEffect: {
    name: 'Damage Boost',
    description: 'Increases base damage',
  },
  requirements: {
    tech: ['Advanced Weaponry'],
    resources: [
      { type: 'plasma', amount: 100 },
      { type: 'energy', amount: 50 },
    ],
  },
  unlocked: true,
};

describe('WeaponUpgradeSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders available upgrades', () => {
    const weapon = { ...mockWeapon, availableUpgrades: [mockUpgrade] };
    render(<WeaponUpgradeSystem weapon={weapon} onUpgrade={vi.fn()} />);

    expect(screen.getByText('Enhanced Damage')).toBeInTheDocument();
    expect(screen.getByText('Increases weapon damage')).toBeInTheDocument();
  });

  it('shows upgrade requirements', () => {
    const weapon = { ...mockWeapon, availableUpgrades: [mockUpgrade] };
    render(<WeaponUpgradeSystem weapon={weapon} onUpgrade={vi.fn()} />);

    expect(screen.getByText('Advanced Weaponry')).toBeInTheDocument();
    expect(screen.getByText('plasma: 150/100')).toBeInTheDocument();
    expect(screen.getByText('energy: 50/50')).toBeInTheDocument();
  });

  it('shows stat changes correctly', () => {
    const weapon = { ...mockWeapon, availableUpgrades: [mockUpgrade] };
    render(<WeaponUpgradeSystem weapon={weapon} onUpgrade={vi.fn()} />);

    expect(screen.getByText('+15')).toBeInTheDocument();
    expect(screen.getByText('+7')).toBeInTheDocument();
  });

  it('disables upgrade button for locked upgrades', () => {
    const lockedUpgrade = { ...mockUpgrade, unlocked: false };
    const weapon = { ...mockWeapon, availableUpgrades: [lockedUpgrade] };
    render(<WeaponUpgradeSystem weapon={weapon} onUpgrade={vi.fn()} />);

    const upgradeButtons = screen.getAllByRole('button');
    expect(upgradeButtons[upgradeButtons.length - 1]).toHaveAttribute('disabled');
  });

  it('disables upgrade button when resources are insufficient', () => {
    const weapon = {
      ...mockWeapon,
      availableUpgrades: [mockUpgrade],
      resources: {
        plasma: 50, // Less than required 100
        energy: 25, // Less than required 50
      },
    };

    render(<WeaponUpgradeSystem weapon={weapon} onUpgrade={vi.fn()} />);

    const upgradeButtons = screen.getAllByRole('button');
    expect(upgradeButtons[upgradeButtons.length - 1]).toHaveAttribute('disabled');
  });

  it('shows appropriate warning messages', () => {
    const weapon = {
      ...mockWeapon,
      availableUpgrades: [mockUpgrade],
      resources: {
        plasma: 50, // Less than required 100
        energy: 25, // Less than required 50
      },
    };

    render(<WeaponUpgradeSystem weapon={weapon} onUpgrade={vi.fn()} />);

    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('plasma: 50/100')).toBeInTheDocument();
  });

  it('applies upgrade when clicked', async () => {
    const onUpgrade = vi.fn();
    const weapon = { ...mockWeapon, availableUpgrades: [mockUpgrade] };
    const user = userEvent.setup();

    render(<WeaponUpgradeSystem weapon={weapon} onUpgrade={onUpgrade} />);

    const upgradeButtons = screen.getAllByRole('button');
    await user.click(upgradeButtons[upgradeButtons.length - 1]);

    expect(onUpgrade).toHaveBeenCalledWith(mockUpgrade.id);
  });
});
