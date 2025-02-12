import { Crosshair, AlertTriangle, Lock } from 'lucide-react';

interface WeaponStats {
  damage: number;
  range: number;
  accuracy: number;
  rateOfFire: number;
  energyCost: number;
}

interface WeaponUpgrade {
  name: string;
  description: string;
  stats: Partial<WeaponStats>;
  unlocked: boolean;
  cost: {
    type: string;
    amount: number;
  }[];
}

interface WeaponSystemProps {
  weapon: {
    id: string;
    name: string;
    type: 'machineGun' | 'gaussCannon' | 'railGun' | 'mgss' | 'rockets';
    tier: 1 | 2 | 3;
    status: 'ready' | 'charging' | 'cooling' | 'disabled';
    currentAmmo?: number;
    maxAmmo?: number;
    stats: WeaponStats;
    upgrades: WeaponUpgrade[];
    specialEffects?: {
      name: string;
      description: string;
      active: boolean;
      cooldown: number;
    }[];
  };
  onFire: () => void;
  onUpgrade: (upgradeId: string) => void;
}

export function WeaponSystem({ weapon, onFire, onUpgrade }: WeaponSystemProps) {
  const getWeaponColor = (type: string) => {
    switch (type) {
      case 'machineGun': return 'cyan';
      case 'gaussCannon': return 'violet';
      case 'railGun': return 'indigo';
      case 'mgss': return 'fuchsia';
      case 'rockets': return 'rose';
      default: return 'blue';
    }
  };

  const color = getWeaponColor(weapon.type);

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}>
      {/* Weapon Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">{weapon.name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span>Tier {weapon.tier}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{weapon.type.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          weapon.status === 'ready' ? 'bg-green-900/50 text-green-400' :
          weapon.status === 'charging' ? 'bg-yellow-900/50 text-yellow-400' :
          weapon.status === 'cooling' ? 'bg-blue-900/50 text-blue-400' :
          'bg-red-900/50 text-red-400'
        }`}>
          {weapon.status.charAt(0).toUpperCase() + weapon.status.slice(1)}
        </div>
      </div>

      {/* Weapon Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-400 mb-1">Damage</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">
              {weapon.stats.damage}
            </span>
            <span className="text-sm text-gray-400">DPS</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Range</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">
              {weapon.stats.range}
            </span>
            <span className="text-sm text-gray-400">ly</span>
          </div>
        </div>
      </div>

      {/* Performance Bars */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Accuracy</span>
            <span className={`text-${color}-400`}>{weapon.stats.accuracy}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${weapon.stats.accuracy}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Rate of Fire</span>
            <span className={`text-${color}-400`}>{weapon.stats.rateOfFire}/s</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${(weapon.stats.rateOfFire / 10) * 100}%` }}
            />
          </div>
        </div>

        {weapon.currentAmmo !== undefined && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Ammo</span>
              <span className={`text-${color}-400`}>
                {weapon.currentAmmo} / {weapon.maxAmmo}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-${color}-500 rounded-full`}
                style={{ width: `${((weapon.currentAmmo ?? 0) / (weapon.maxAmmo ?? 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Energy Cost</span>
            <span className={`text-${color}-400`}>{weapon.stats.energyCost}/shot</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
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
          <h4 className="text-sm font-medium text-gray-300 mb-3">Special Effects</h4>
          <div className="space-y-2">
            {weapon.specialEffects.map(effect => (
              <div
                key={effect.name}
                className={`p-3 rounded-lg ${
                  effect.active
                    ? `bg-${color}-500/20 border border-${color}-500/30`
                    : 'bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{effect.name}</span>
                  {effect.active ? (
                    <span className="text-xs text-green-400">Active</span>
                  ) : (
                    <span className="text-xs text-gray-400">{effect.cooldown}s</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{effect.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Upgrades */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-300">Available Upgrades</h4>
        {weapon.upgrades.map(upgrade => (
          <button
            key={upgrade.name}
            onClick={() => onUpgrade(upgrade.name)}
            disabled={!upgrade.unlocked}
            className={`w-full p-3 rounded-lg text-left transition-all ${
              upgrade.unlocked
                ? `bg-${color}-500/20 hover:bg-${color}-500/30 border border-${color}-500/30`
                : 'bg-gray-700/50 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">{upgrade.name}</span>
              {!upgrade.unlocked && <Lock className="w-4 h-4 text-gray-500" />}
            </div>
            <p className="text-xs text-gray-400 mb-2">{upgrade.description}</p>
            <div className="flex flex-wrap gap-2">
              {upgrade.cost.map(cost => (
                <div
                  key={cost.type}
                  className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300"
                >
                  {cost.type}: {cost.amount}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Fire Control */}
      <button
        onClick={onFire}
        disabled={weapon.status !== 'ready'}
        className={`w-full px-4 py-3 rounded-lg flex items-center justify-center space-x-2 ${
          weapon.status === 'ready'
            ? `bg-${color}-600 hover:bg-${color}-700 text-white`
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        <Crosshair className="w-5 h-5" />
        <span>Fire Weapon</span>
      </button>

      {/* Status Warnings */}
      {weapon.status === 'disabled' && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="text-sm text-red-200">
            Weapon system disabled. Check power distribution and damage status.
          </div>
        </div>
      )}
    </div>
  );
}