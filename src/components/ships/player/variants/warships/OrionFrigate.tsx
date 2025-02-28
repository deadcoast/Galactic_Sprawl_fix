import { Crosshair, Shield } from 'lucide-react';

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
  onRetreat,
}: OrionFrigateProps) {
  return (
    <div className="rounded-lg border border-violet-700/30 bg-violet-900/20 p-6">
      {/* Ship Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Orion's Frigate</h3>
          <div className="text-sm text-gray-400">Tier 2 Combat Frigate</div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-sm ${
            status === 'engaging'
              ? 'bg-red-900/50 text-red-400'
              : status === 'retreating'
                ? 'bg-yellow-900/50 text-yellow-400'
                : status === 'damaged'
                  ? 'bg-red-900/50 text-red-400'
                  : 'bg-green-900/50 text-green-400'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      {/* Combat Status */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Hull Integrity</span>
            <span className={hull < maxHull * 0.3 ? 'text-red-400' : 'text-gray-300'}>
              {Math.round((hull / maxHull) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${
                hull < maxHull * 0.3 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${(hull / maxHull) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Shield Power</span>
            <span className="text-gray-300">{Math.round((shield / maxShield) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${(shield / maxShield) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weapon Systems */}
      <div className="mb-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-300">Weapon Systems</h4>
        <div className="grid grid-cols-2 gap-3">
          {weapons.map(weapon => (
            <button
              key={weapon.id}
              onClick={() => onFire(weapon.id)}
              disabled={weapon.status !== 'ready'}
              className={`rounded-lg p-3 transition-colors ${
                weapon.status === 'ready'
                  ? 'border border-violet-500/30 bg-violet-500/20 hover:bg-violet-500/30'
                  : 'cursor-not-allowed border border-gray-600/30 bg-gray-700/50'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-white">{weapon.name}</div>
                <div
                  className={`text-xs ${
                    weapon.status === 'ready'
                      ? 'text-green-400'
                      : weapon.status === 'charging'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {weapon.status.charAt(0).toUpperCase() + weapon.status.slice(1)}
                </div>
              </div>
              <div className="text-xs text-gray-400">Damage: {weapon.damage}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Special Ability */}
      <div className="mb-6">
        <button
          onClick={onActivateAbility}
          disabled={specialAbility.active}
          className={`w-full rounded-lg p-3 text-left transition-colors ${
            specialAbility.active
              ? 'border border-violet-500/30 bg-violet-500/20'
              : 'bg-gray-700/50 hover:bg-gray-600/50'
          }`}
        >
          <div className="mb-1 flex items-center justify-between">
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
          className={`flex items-center justify-center space-x-2 rounded-lg px-4 py-2 text-sm ${
            weapons.some(w => w.status === 'ready')
              ? 'bg-violet-500/20 text-violet-200 hover:bg-violet-500/30'
              : 'cursor-not-allowed bg-gray-700 text-gray-500'
          }`}
        >
          <Crosshair className="h-4 w-4" />
          <span>Fire Weapons</span>
        </button>
        <button
          onClick={onRetreat}
          disabled={status === 'damaged'}
          className={`flex items-center justify-center space-x-2 rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600 ${
            status === 'damaged' ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Retreat</span>
        </button>
      </div>
    </div>
  );
}
