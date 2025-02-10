import React from 'react';
import { Sword, Shield, AlertTriangle } from 'lucide-react';

interface FactionShip {
  id: string;
  name: string;
  faction: 'spaceRats' | 'lostNova' | 'equatorHorizon';
  type: string;
  status: 'engaging' | 'patrolling' | 'retreating' | 'disabled';
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  tactics: 'aggressive' | 'defensive' | 'hit-and-run';
  specialAbility?: {
    name: string;
    description: string;
    cooldown: number;
    active: boolean;
  };
}

interface FactionShipProps {
  ship: FactionShip;
  onEngage: () => void;
  onRetreat: () => void;
}

export function FactionShip({ ship, onEngage, onRetreat }: FactionShipProps) {
  const getFactionColor = (faction: string) => {
    switch (faction) {
      case 'spaceRats': return 'red';
      case 'lostNova': return 'violet';
      case 'equatorHorizon': return 'amber';
      default: return 'blue';
    }
  };

  const color = getFactionColor(ship.faction);

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}>
      {/* Ship Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">{ship.name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span className="capitalize">{ship.faction.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="mx-2">•</span>
            <span>{ship.type}</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          ship.status === 'engaging' ? 'bg-red-900/50 text-red-400' :
          ship.status === 'patrolling' ? 'bg-green-900/50 text-green-400' :
          ship.status === 'retreating' ? 'bg-yellow-900/50 text-yellow-400' :
          'bg-gray-700 text-gray-400'
        }`}>
          {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)}
        </div>
      </div>

      {/* Health & Shield Bars */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Hull Integrity</span>
            <span className={ship.health < ship.maxHealth * 0.3 ? 'text-red-400' : 'text-gray-300'}>
              {Math.round((ship.health / ship.maxHealth) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                ship.health < ship.maxHealth * 0.3 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${(ship.health / ship.maxHealth) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Shield Power</span>
            <span className="text-gray-300">{Math.round((ship.shield / ship.maxShield) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(ship.shield / ship.maxShield) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tactics & Special Ability */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-300">Combat Tactics</div>
          <div className={`px-2 py-1 rounded text-xs ${
            ship.tactics === 'aggressive' ? 'bg-red-900/50 text-red-400' :
            ship.tactics === 'defensive' ? 'bg-blue-900/50 text-blue-400' :
            'bg-yellow-900/50 text-yellow-400'
          }`}>
            {ship.tactics.charAt(0).toUpperCase() + ship.tactics.slice(1)}
          </div>
        </div>

        {ship.specialAbility && (
          <div className={`p-3 rounded-lg ${
            ship.specialAbility.active
              ? `bg-${color}-500/20 border border-${color}-500/30`
              : 'bg-gray-700/50'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">{ship.specialAbility.name}</span>
              <span className="text-xs text-gray-400">{ship.specialAbility.cooldown}s</span>
            </div>
            <p className="text-xs text-gray-400">{ship.specialAbility.description}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onEngage}
          disabled={ship.status === 'disabled'}
          className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            ship.status === 'disabled'
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : `bg-${color}-500/20 hover:bg-${color}-500/30 text-${color}-200`
          }`}
        >
          <Sword className="w-4 h-4" />
          <span>Engage</span>
        </button>
        <button
          onClick={onRetreat}
          disabled={ship.status === 'disabled'}
          className={`px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            ship.status === 'disabled' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Retreat</span>
        </button>
      </div>

      {/* Status Warnings */}
      {ship.status === 'disabled' && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-200">Ship systems critically damaged</span>
        </div>
      )}
    </div>
  );
}