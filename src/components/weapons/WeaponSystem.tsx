import * as React from "react";
import { Crosshair } from 'lucide-react';
import {
  CombatWeaponStats,
  WEAPON_COLORS,
  WeaponEffect,
  WeaponSystemProps,
  WeaponUpgrade,
} from '../../types/weapons/WeaponTypes';
import {
  WeaponEffectsDisplay,
  WeaponHeader,
  WeaponStatsDisplay,
  WeaponUpgradeDisplay,
} from './WeaponComponents';

export function WeaponSystem({
  weapon,
  availableUpgrades,
  resources,
  onFire,
  onUpgrade,
  onToggleEffect,
}: WeaponSystemProps) {
  const color = WEAPON_COLORS[weapon.config.category];

  const handleUpgrade = (upgradeId: string, upgrade: WeaponUpgrade) => {
    if (onUpgrade) {
      const updatedStats: CombatWeaponStats = {
        ...weapon.state.currentStats,
        ...upgrade.stats,
      };
      console.warn(`[WeaponSystem] Applying upgrade ${upgradeId}, new stats:`, updatedStats);
      onUpgrade(upgradeId);
    }
  };

  const mapToWeaponEffect = (effect: WeaponEffect): WeaponEffect => ({
    ...effect,
    active: effect.active ?? true,
    cooldown: effect.cooldown ?? 0,
  });

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}>
      <WeaponHeader
        name={weapon.config.name}
        tier={weapon.config.tier}
        type={weapon.config.category}
        status={weapon.state.status}
        color={color}
      />

      {/* Main Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 text-sm text-gray-400">Damage</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">
              {weapon.state.currentStats.damage}
            </span>
            <span className="text-sm text-gray-400">DPS</span>
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm text-gray-400">Range</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">{weapon.state.currentStats.range}</span>
            <span className="text-sm text-gray-400">ly</span>
          </div>
        </div>
      </div>

      <WeaponStatsDisplay
        stats={weapon.state.currentStats}
        color={color}
        showAmmo={weapon.state.currentAmmo !== undefined}
        currentAmmo={weapon.state.currentAmmo}
        maxAmmo={weapon.state.maxAmmo}
      />

      <WeaponEffectsDisplay
        effects={weapon.state.effects.map(mapToWeaponEffect)}
        color={color}
        onToggle={onToggleEffect}
      />

      {/* Available Upgrades */}
      {availableUpgrades && availableUpgrades.length > 0 && resources && (
        <div className="mb-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Available Upgrades</h4>
          {availableUpgrades.map((upgrade: WeaponUpgrade) => (
            <WeaponUpgradeDisplay
              key={upgrade.id}
              upgrade={upgrade}
              currentStats={weapon.state.currentStats}
              resources={resources}
              onUpgrade={id => handleUpgrade(id, upgrade)}
            />
          ))}
        </div>
      )}

      {/* Fire Control */}
      <button
        onClick={() => onFire?.(weapon.config.id)}
        disabled={weapon.state.status !== 'ready'}
        className={`flex w-full items-center justify-center space-x-2 rounded-lg px-4 py-3 ${
          weapon.state.status === 'ready'
            ? `bg-${color}-600 hover:bg-${color}-700 text-white`
            : 'cursor-not-allowed bg-gray-700 text-gray-500'
        }`}
      >
        <Crosshair className="h-5 w-5" />
        <span>Fire Weapon</span>
      </button>
    </div>
  );
}
