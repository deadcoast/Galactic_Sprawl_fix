import { AlertTriangle, Crosshair, Shield } from 'lucide-react';
import { PlayerShipProps } from '../../../../types/ships/PlayerShipTypes';
import { canFireWeapon } from '../../../../utils/ships/shipUtils';

interface PlayerShipBaseProps extends PlayerShipProps {
  className?: string;
}

const PLAYER_SHIP_COLORS = {
  'harbringer-galleon': 'purple',
  'midway-carrier': 'fuchsia',
  'mother-earth-revenge': 'rose',
  'orion-frigate': 'violet',
  spitflare: 'cyan',
  'star-schooner': 'indigo',
  'void-dredger-miner': 'emerald',
  'andromeda-cutter': 'blue',
} as const;

export function PlayerShipBase({
  ship,
  onFire,
  onAbility,
  onUpgrade,
  className = '',
}: PlayerShipBaseProps) {
  const color = PLAYER_SHIP_COLORS[ship.class];

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6 ${className}`}>
      {/* Ship Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">{ship.name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span className="capitalize">{ship.class.replace(/-/g, ' ')}</span>
            <span className="mx-2">•</span>
            <span>Level {ship.stats.level}</span>
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
            <span
              className={
                ship.stats.health < ship.stats.maxHealth * 0.3 ? 'text-red-400' : 'text-gray-300'
              }
            >
              {Math.round((ship.stats.health / ship.stats.maxHealth) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${
                ship.stats.health < ship.stats.maxHealth * 0.3 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{
                width: `${(ship.stats.health / ship.stats.maxHealth) * 100}%`,
              }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Shield Power</span>
            <span className="text-gray-300">
              {Math.round((ship.stats.shield / ship.stats.maxShield) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${(ship.stats.shield / ship.stats.maxShield) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Weapon Mounts */}
      <div className="mb-6">
        <div className="mb-2 text-sm text-gray-400">Weapons</div>
        <div className="space-y-2">
          {ship.stats.weapons.map(mount => (
            <div
              key={mount.id}
              className="flex items-center justify-between rounded-lg bg-gray-800/50 p-2"
            >
              <div className="text-xs text-gray-300">
                {mount.currentWeapon ? (
                  <>
                    <div>{mount.currentWeapon.config.name}</div>
                    <div className="text-gray-500">{mount.size} Mount</div>
                  </>
                ) : (
                  <div className="text-gray-500">Empty {mount.size} Mount</div>
                )}
              </div>
              {mount.currentWeapon && (
                <button
                  onClick={() => onFire?.()}
                  disabled={!canFireWeapon(mount.currentWeapon, ship.stats.energy)}
                  className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600"
                >
                  Fire
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Special Abilities */}
      {ship.abilities.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 text-sm text-gray-400">Abilities</div>
          <div className="space-y-2">
            {ship.abilities.map(ability => (
              <button
                key={ability.name}
                onClick={() => onAbility?.()}
                disabled={ability.active}
                className={`w-full rounded-lg p-3 ${
                  ability.active
                    ? `bg-${color}-500/20 border border-${color}-500/30`
                    : 'bg-gray-700/50 hover:bg-gray-600/50'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{ability.name}</span>
                  <span className="text-xs text-gray-400">{ability.cooldown}s</span>
                </div>
                <div className="text-xs text-gray-400">{ability.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onFire}
          disabled={ship.status === 'disabled'}
          className={`flex items-center justify-center space-x-2 rounded-lg px-4 py-2 text-sm ${
            ship.status === 'disabled'
              ? 'cursor-not-allowed bg-gray-700 text-gray-500'
              : `bg-${color}-500/20 hover:bg-${color}-500/30 text-${color}-200`
          }`}
        >
          <Crosshair className="h-4 w-4" />
          <span>Fire</span>
        </button>
        <button
          onClick={onUpgrade}
          disabled={ship.status === 'disabled'}
          className={`flex items-center justify-center space-x-2 rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600 ${
            ship.status === 'disabled' ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Upgrade</span>
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
