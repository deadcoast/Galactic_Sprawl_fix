import { Sword, Shield, AlertTriangle } from 'lucide-react';
import { FactionId } from '../../factionHooks/useFactionBehavior';
import { ShipStats, ShipAbility } from '../../types/ShipTypes';

export interface ShipBaseProps {
  id: string;
  name: string;
  faction: FactionId;
  status: 'idle' | 'engaging' | 'patrolling' | 'retreating' | 'disabled';
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  stats: ShipStats;
  specialAbility?: ShipAbility;
  className?: string;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
}

const FACTION_COLORS = {
  spaceRats: 'red',
  lostNova: 'violet',
  equatorHorizon: 'amber'
} as const;

export function ShipBase({
  id,
  name,
  faction,
  status,
  health,
  maxHealth,
  shield,
  maxShield,
  stats,
  specialAbility,
  className = '',
  onEngage,
  onRetreat,
  onSpecialAbility
}: ShipBaseProps) {
  const color = FACTION_COLORS[faction];

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6 ${className}`}>
      {/* Ship Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">{name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span className="capitalize">{faction.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="mx-2">•</span>
            <span>#{id}</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          status === 'engaging' ? 'bg-red-900/50 text-red-400' :
          status === 'patrolling' ? 'bg-green-900/50 text-green-400' :
          status === 'retreating' ? 'bg-yellow-900/50 text-yellow-400' :
          'bg-gray-700 text-gray-400'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      {/* Health & Shield Bars */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Hull Integrity</span>
            <span className={health < maxHealth * 0.3 ? 'text-red-400' : 'text-gray-300'}>
              {Math.round((health / maxHealth) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                health < maxHealth * 0.3 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${(health / maxHealth) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Shield Power</span>
            <span className="text-gray-300">{Math.round((shield / maxShield) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(shield / maxShield) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ship Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Combat Stats</div>
          <div className="text-xs text-gray-300 space-y-1">
            <div className="flex justify-between">
              <span>Speed</span>
              <span>{stats.speed}</span>
            </div>
            <div className="flex justify-between">
              <span>Maneuverability</span>
              <span>{stats.maneuverability}</span>
            </div>
          </div>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Cargo</div>
          <div className="text-xs text-gray-300">
            <div className="flex justify-between">
              <span>Capacity</span>
              <span>{stats.cargo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Special Ability */}
      {specialAbility && (
        <div className="mb-6">
          <button
            onClick={onSpecialAbility}
            disabled={status === 'disabled'}
            className={`w-full p-3 rounded-lg ${
              specialAbility.effect.type === 'active'
                ? `bg-${color}-500/20 border border-${color}-500/30`
                : 'bg-gray-700/50 hover:bg-gray-600/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">{specialAbility.name}</span>
              <span className="text-xs text-gray-400">{specialAbility.cooldown}s</span>
            </div>
            <div className="text-xs text-gray-400">
              Effect: {specialAbility.effect.type} ({specialAbility.effect.magnitude}x)
              {specialAbility.effect.radius && ` - Range: ${specialAbility.effect.radius}`}
            </div>
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onEngage}
          disabled={status === 'disabled'}
          className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            status === 'disabled'
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : `bg-${color}-500/20 hover:bg-${color}-500/30 text-${color}-200`
          }`}
        >
          <Sword className="w-4 h-4" />
          <span>Engage</span>
        </button>
        <button
          onClick={onRetreat}
          disabled={status === 'disabled'}
          className={`px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            status === 'disabled' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Retreat</span>
        </button>
      </div>

      {/* Status Warnings */}
      {status === 'disabled' && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-200">Ship systems critically damaged</span>
        </div>
      )}
    </div>
  );
} 