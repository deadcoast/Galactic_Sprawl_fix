import React from 'react';
import { Sword, Shield, AlertTriangle, Rocket } from 'lucide-react';

interface LostNovaShipProps {
  id: string;
  name: string;
  type: 'eclipseScythe' | 'nullsRevenge' | 'darkMatterReaper' | 'quantumPariah' | 'entropyScale' | 'voidRevenant' | 'scytheOfAndromeda' | 'nebularPersistence' | 'oblivionsWake' | 'forbiddenVanguard';
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

export function LostNovaShip({ id, name, type, status, health, maxHealth, shield, maxShield, tactics, specialAbility }: LostNovaShipProps) {
  return (
    <div className="bg-violet-900/20 border border-violet-700/30 rounded-lg p-6">
      {/* Ship Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">{name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="mx-2">•</span>
            <span>Lost Nova</span>
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

      {/* Tactics & Special Ability */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-300">Combat Tactics</div>
          <div className={`px-2 py-1 rounded text-xs ${
            tactics === 'aggressive' ? 'bg-red-900/50 text-red-400' :
            tactics === 'defensive' ? 'bg-blue-900/50 text-blue-400' :
            'bg-yellow-900/50 text-yellow-400'
          }`}>
            {tactics.charAt(0).toUpperCase() + tactics.slice(1)}
          </div>
        </div>

        {specialAbility && (
          <div className={`p-3 rounded-lg ${
            specialAbility.active
              ? 'bg-violet-500/20 border border-violet-500/30'
              : 'bg-gray-700/50'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">{specialAbility.name}</span>
              <span className="text-xs text-gray-400">{specialAbility.cooldown}s</span>
            </div>
            <p className="text-xs text-gray-400">{specialAbility.description}</p>
          </div>
        )}
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