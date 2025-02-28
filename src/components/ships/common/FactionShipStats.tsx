import { AlertTriangle, Shield, Sword } from 'lucide-react';
import { SHIP_STATS } from '../../../config/ships/shipStats';
import type { FactionShipProps, ShipStatsWithWeapons } from '../../../types/ships/FactionShipTypes';
import { FactionBehaviorType } from '../../../types/ships/FactionTypes';

type FactionColorKey = 'spaceRats' | 'lostNova' | 'equatorHorizon';

const FACTION_COLORS = {
  spaceRats: 'red',
  lostNova: 'violet',
  equatorHorizon: 'amber',
} as const;

// Helper function to get behavior string from FactionBehaviorType
const getBehaviorString = (behavior: FactionBehaviorType): string => {
  return behavior.behavior || '';
};

// Add a helper function to format the behavior string
const formatBehavior = (behavior: string): string => {
  if (!behavior) {
    return '';
  }
  return behavior.charAt(0).toUpperCase() + behavior.slice(1);
};

export function FactionShip({
  ship,
  onEngage,
  onRetreat,
  onSpecialAbility,
  className = '',
}: FactionShipProps) {
  const color = FACTION_COLORS[ship.faction.replace(/-/g, '') as FactionColorKey];
  const stats = SHIP_STATS[ship.class] as unknown as ShipStatsWithWeapons;

  if (!stats) {
    return null;
  }

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6 ${className}`}>
      {/* Ship Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">{ship.name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span className="capitalize">{ship.faction.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="mx-2">•</span>
            <span>{ship.class.replace(/-/g, ' ')}</span>
          </div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-sm ${
            ship.status === 'engaging'
              ? 'bg-red-900/50 text-red-400'
              : ship.status === 'patrolling'
                ? 'bg-green-900/50 text-green-400'
                : ship.status === 'retreating'
                  ? 'bg-yellow-900/50 text-yellow-400'
                  : 'bg-gray-700 text-gray-400'
          }`}
        >
          {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)}
        </div>
      </div>

      {/* Health & Shield Bars */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Hull Integrity</span>
            <span className={ship.health < ship.maxHealth * 0.3 ? 'text-red-400' : 'text-gray-300'}>
              {Math.round((ship.health / ship.maxHealth) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${
                ship.health < ship.maxHealth * 0.3 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${(ship.health / ship.maxHealth) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Shield Power</span>
            <span className="text-gray-300">
              {Math.round((ship.shield / ship.maxShield) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${(ship.shield / ship.maxShield) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ship Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-800/50 p-3">
          <div className="mb-1 text-sm text-gray-400">Weapons</div>
          <div className="flex justify-between text-xs text-gray-300">
            <span>{stats.weapons.primary.config.name}</span>
            <span>DMG: {stats.weapons.primary.state.currentStats.damage}</span>
          </div>
          {stats.weapons.secondary?.map((weapon, index) => (
            <div key={index} className="flex justify-between text-xs text-gray-300">
              <span>{weapon.config.name}</span>
              <span>DMG: {weapon.state.currentStats.damage}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-gray-800/50 p-3">
          <div className="mb-1 text-sm text-gray-400">Abilities</div>
          {stats.abilities.map((ability, index) => (
            <div key={index} className="text-xs text-gray-300">
              {ability.name}
            </div>
          ))}
        </div>
      </div>

      {/* Tactics & Special Ability */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-300">Combat Tactics</div>
          <div
            className={`rounded px-2 py-1 text-xs ${
              getBehaviorString(ship.tactics) === 'aggressive'
                ? 'bg-red-900/50 text-red-400'
                : getBehaviorString(ship.tactics) === 'defensive'
                  ? 'bg-blue-900/50 text-blue-400'
                  : 'bg-yellow-900/50 text-yellow-400'
            }`}
          >
            {formatBehavior(getBehaviorString(ship.tactics))}
          </div>
        </div>

        {ship.specialAbility && (
          <button
            onClick={onSpecialAbility}
            disabled={ship.status === 'disabled'}
            className={`w-full rounded-lg p-3 ${
              ship.specialAbility.active
                ? `bg-${color}-500/20 border border-${color}-500/30`
                : 'bg-gray-700/50 hover:bg-gray-600/50'
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-white">{ship.specialAbility.name}</span>
              <span className="text-xs text-gray-400">{ship.specialAbility.cooldown}s</span>
            </div>
            <p className="text-xs text-gray-400">{ship.specialAbility.description}</p>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onEngage}
          disabled={ship.status === 'disabled'}
          className={`flex items-center justify-center space-x-2 rounded-lg px-4 py-2 text-sm ${
            ship.status === 'disabled'
              ? 'cursor-not-allowed bg-gray-700 text-gray-500'
              : `bg-${color}-500/20 hover:bg-${color}-500/30 text-${color}-200`
          }`}
        >
          <Sword className="h-4 w-4" />
          <span>Engage</span>
        </button>
        <button
          onClick={onRetreat}
          disabled={ship.status === 'disabled'}
          className={`flex items-center justify-center space-x-2 rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600 ${
            ship.status === 'disabled' ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Retreat</span>
        </button>
      </div>

      {/* Status Warnings */}
      {ship.status === 'disabled' && (
        <div className="mt-4 flex items-start space-x-2 rounded-lg border border-red-700/30 bg-red-900/20 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <span className="text-sm text-red-200">Ship systems critically damaged</span>
        </div>
      )}
    </div>
  );
}
