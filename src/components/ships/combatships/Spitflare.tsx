import { Crosshair, Shield } from 'lucide-react';

export interface SpitflareProps {
  id: string;
  status: 'idle' | 'engaging' | 'retreating' | 'damaged';
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  weapons: {
    id: string;
    name: string;
    type: 'machineGun';
    damage: number;
    status: 'ready' | 'charging' | 'cooling';
  }[];
  onFire: (weaponId: string) => void;
  onRetreat: () => void;
}

export function Spitflare({
  id: _id,
  status,
  hull,
  maxHull,
  shield,
  maxShield,
  weapons,
  onFire,
  onRetreat,
}: SpitflareProps) {
  return (
    <div className="rounded-lg border border-cyan-700/30 bg-cyan-900/20 p-6">
      {/* Ship Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Spitflare</h3>
          <div className="text-sm text-gray-400">Tier 1 Light Fighter</div>
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
        <h4 className="text-sm font-medium text-gray-300">Machine Guns</h4>
        <div className="grid grid-cols-2 gap-3">
          {weapons.map(weapon => (
            <button
              key={weapon.id}
              onClick={() => onFire(weapon.id)}
              disabled={weapon.status !== 'ready'}
              className={`rounded-lg p-3 transition-colors ${
                weapon.status === 'ready'
                  ? 'border border-cyan-500/30 bg-cyan-500/20 hover:bg-cyan-500/30'
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

      {/* Combat Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onFire(weapons[0].id)}
          disabled={!weapons.some(w => w.status === 'ready')}
          className={`flex items-center justify-center space-x-2 rounded-lg px-4 py-2 text-sm ${
            weapons.some(w => w.status === 'ready')
              ? 'bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30'
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
