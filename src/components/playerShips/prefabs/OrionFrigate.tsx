import React from 'react';
import { Crosshair, Shield, Rocket, Zap } from 'lucide-react';

interface OrionFrigateProps {
  id: string;
  status: 'idle' | 'engaging' | 'retreating' | 'damaged';
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  weapons: {
    id: string;
    name: string;
    type: 'machineGun' | 'gaussCannon';
    damage: number;
    status: 'ready' | 'charging' | 'cooling';
  }[];
  specialAbility: {
    name: string;
    description: string;
    active: boolean;
    cooldown: number;
  };
  onFire: (weaponId: string) => void;
  onActivateAbility: () => void;
  onRetreat: () => void;
}

export function OrionFrigate({ 
  id, 
  status, 
  hull, 
  maxHull, 
  shield, 
  maxShield, 
  weapons, 
  specialAbility,
  onFire, 
  onActivateAbility,
  onRetreat 
}: OrionFrigateProps) {
  return (
    <div className="bg-violet-900/20 border border-violet-700/30 rounded-lg p-6">
      {/* Ship Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">Orion's Frigate</h3>
          <div className="text-sm text-gray-400">Tier 2 Combat Frigate</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          status === 'engaging' ? 'bg-red-900/50 text-red-400' :
          status === 'retreating' ? 'bg-yellow-900/50 text-yellow-400' :
          status === 'damaged' ? 'bg-red-900/50 text-red-400' :
          'bg-green-900/50 text-green-400'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      {/* Combat Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Hull Integrity</span>
            <span className={hull < maxHull * 0.3 ? 'text-red-400' : 'text-gray-300'}>
              {Math.round((hull / maxHull) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                hull < maxHull * 0.3 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${(hull / maxHull) * 100}%` }}
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

      {/* Weapon Systems */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-300">Weapon Systems</h4>
        <div className="grid grid-cols-2 gap-3">
          {weapons.map(weapon => (
            <button
              key={weapon.id}
              onClick={() => onFire(weapon.id)}
              disabled={weapon.status !== 'ready'}
              className={`p-3 rounded-lg transition-colors ${
                weapon.status === 'ready'
                  ? 'bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30'
                  : 'bg-gray-700/50 border border-gray-600/30 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-white">{weapon.name}</div>
                <div className={`text-xs ${
                  weapon.status === 'ready' ? 'text-green-400' :
                  weapon.status === 'charging' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {weapon.status.charAt(0).toUpperCase() + weapon.status.slice(1)}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Damage: {weapon.damage}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Special Ability */}
      <div className="mb-6">
        <button
          onClick={onActivateAbility}
          disabled={specialAbility.active}
          className={`w-full p-3 rounded-lg text-left transition-colors ${
            specialAbility.active
              ? 'bg-violet-500/20 border border-violet-500/30'
              : 'bg-gray-700/50 hover:bg-gray-600/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-white">{specialAbility.name}</span>
            {specialAbility.active ? (
              <span className="text-xs text-green-400">Active</span>
            ) : (
              <span className="text-xs text-gray-400">{specialAbility.cooldown}s</span>
            )}
          </div>
          <p className="text-xs text-gray-400">{specialAbility.description}</p>
        </button>
      </div>

      {/* Combat Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onFire(weapons[0].id)}
          disabled={!weapons.some(w => w.status === 'ready')}
          className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            weapons.some(w => w.status === 'ready')
              ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-200'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>Fire Weapons</span>
        </button>
        <button
          onClick={onRetreat}
          disabled={status === 'damaged'}
          className={`px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center justify-center space-x-2 ${
            status === 'damaged' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Retreat</span>
        </button>
      </div>
    </div>
  );
}