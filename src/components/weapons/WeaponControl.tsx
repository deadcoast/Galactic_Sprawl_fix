import { Crosshair } from 'lucide-react';
import { WeaponEffect } from '../../effects/types_effects/WeaponEffects';
import {
  CombatWeaponStats,
  WEAPON_COLORS,
  WeaponCategory,
  WeaponStatus,
} from '../../types/weapons/WeaponTypes';

interface WeaponControlProps {
  weapon: {
    id: string;
    name: string;
    type: WeaponCategory;
    tier: 1 | 2 | 3;
    status: WeaponStatus;
    stats: CombatWeaponStats;
    specialEffects?: WeaponEffect[];
  };
  onFire: () => void;
  onToggleEffect: (effectName: string) => void;
}

export function WeaponControl({ weapon, onFire, onToggleEffect }: WeaponControlProps) {
  const color = WEAPON_COLORS[weapon.type];

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}>
      {/* Weapon Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">{weapon.name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span>Tier {weapon.tier}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{weapon.type.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-sm ${
            weapon.status === 'ready'
              ? 'bg-green-900/50 text-green-400'
              : weapon.status === 'charging'
                ? 'bg-yellow-900/50 text-yellow-400'
                : weapon.status === 'cooling'
                  ? 'bg-blue-900/50 text-blue-400'
                  : 'bg-red-900/50 text-red-400'
          }`}
        >
          {weapon.status.charAt(0).toUpperCase() + weapon.status.slice(1)}
        </div>
      </div>

      {/* Weapon Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 text-sm text-gray-400">Damage</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">{weapon.stats.damage}</span>
            <span className="text-sm text-gray-400">DPS</span>
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm text-gray-400">Range</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">{weapon.stats.range}</span>
            <span className="text-sm text-gray-400">ly</span>
          </div>
        </div>
      </div>

      {/* Performance Bars */}
      <div className="mb-6 space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Accuracy</span>
            <span className={`text-${color}-400`}>{weapon.stats.accuracy}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${weapon.stats.accuracy}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Rate of Fire</span>
            <span className={`text-${color}-400`}>{weapon.stats.rateOfFire}/s</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${(weapon.stats.rateOfFire / 10) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Energy Cost</span>
            <span className={`text-${color}-400`}>{weapon.stats.energyCost}/shot</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${(weapon.stats.energyCost / 100) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Special Effects */}
      {weapon.specialEffects && weapon.specialEffects.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-medium text-gray-300">Special Effects</h4>
          <div className="space-y-2">
            {weapon.specialEffects.map(effect => (
              <button
                key={effect.name}
                onClick={() => onToggleEffect(effect.name)}
                disabled={effect.active}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  effect.active
                    ? `bg-${color}-500/20 border border-${color}-500/30`
                    : 'bg-gray-700/50 hover:bg-gray-600/50'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{effect.name}</span>
                  {effect.active ? (
                    <span className="text-xs text-green-400">Active</span>
                  ) : (
                    <span className="text-xs text-gray-400">{effect.cooldown}s</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{effect.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fire Control */}
      <button
        onClick={onFire}
        disabled={weapon.status !== 'ready'}
        className={`flex w-full items-center justify-center space-x-2 rounded-lg px-4 py-3 ${
          weapon.status === 'ready'
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
