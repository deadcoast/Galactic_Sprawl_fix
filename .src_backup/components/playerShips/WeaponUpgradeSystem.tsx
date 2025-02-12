import { Crosshair, Shield, Zap, AlertTriangle } from 'lucide-react';

interface WeaponUpgrade {
  id: string;
  name: string;
  type: 'plasma' | 'spark' | 'gauss' | 'light' | 'maurader' | 'engine' | 'slug' | 'empr' | 'swarm' | 'bigBang';
  description: string;
  stats: {
    damage: number;
    range: number;
    accuracy: number;
    rateOfFire: number;
    energyCost: number;
  };
  specialEffect?: {
    name: string;
    description: string;
  };
  requirements: {
    tech: string[];
    resources: { type: string; amount: number }[];
  };
  unlocked: boolean;
}

interface WeaponUpgradeSystemProps {
  weapon: {
    id: string;
    name: string;
    type: 'machineGun' | 'gaussCannon' | 'railGun' | 'mgss' | 'rockets';
    tier: 1 | 2 | 3;
    currentStats: {
      damage: number;
      range: number;
      accuracy: number;
      rateOfFire: number;
      energyCost: number;
    };
    availableUpgrades: WeaponUpgrade[];
    resources: {
      [key: string]: number;
    };
  };
  onUpgrade: (upgradeId: string) => void;
}

export function WeaponUpgradeSystem({ weapon, onUpgrade }: WeaponUpgradeSystemProps) {
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

  const getUpgradeColor = (type: WeaponUpgrade['type']) => {
    switch (type) {
      case 'plasma':
      case 'spark': return 'cyan';
      case 'gauss':
      case 'light': return 'violet';
      case 'maurader':
      case 'engine': return 'indigo';
      case 'slug': return 'fuchsia';
      case 'empr':
      case 'swarm':
      case 'bigBang': return 'rose';
      default: return 'blue';
    }
  };

  const canAffordUpgrade = (upgrade: WeaponUpgrade) => {
    return upgrade.requirements.resources.every(
      resource => (weapon.resources[resource.type] || 0) >= resource.amount
    );
  };

  const getStatDifference = (current: number, upgraded: number) => {
    const diff = upgraded - current;
    return diff >= 0 ? `+${diff}` : diff.toString();
  };

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
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Crosshair className="w-6 h-6 text-indigo-400" />
        </div>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-400 mb-1">Damage</div>
          <div className="text-2xl font-bold text-white">{weapon.currentStats.damage}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Range</div>
          <div className="text-2xl font-bold text-white">{weapon.currentStats.range}</div>
        </div>
      </div>

      {/* Available Upgrades */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-300">Available Upgrades</h4>
        {weapon.availableUpgrades.map(upgrade => {
          const upgradeColor = getUpgradeColor(upgrade.type);
          const canAfford = canAffordUpgrade(upgrade);

          return (
            <div
              key={upgrade.id}
              className={`p-4 rounded-lg border ${
                upgrade.unlocked
                  ? canAfford
                    ? `bg-${upgradeColor}-900/20 border-${upgradeColor}-700/30`
                    : 'bg-gray-800/50 border-gray-700'
                  : 'bg-gray-800/30 border-gray-700 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="text-white font-medium">{upgrade.name}</h5>
                  <p className="text-sm text-gray-400">{upgrade.description}</p>
                </div>
                {!upgrade.unlocked && <Shield className="w-5 h-5 text-gray-500" />}
              </div>

              {/* Stat Changes */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {Object.entries(upgrade.stats).map(([stat, value]) => (
                  <div key={stat} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 capitalize">
                      {stat.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={
                      value > weapon.currentStats[stat as keyof typeof weapon.currentStats]
                        ? 'text-green-400'
                        : 'text-red-400'
                    }>
                      {getStatDifference(
                        weapon.currentStats[stat as keyof typeof weapon.currentStats],
                        value
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Special Effect */}
              {upgrade.specialEffect && (
                <div className="mb-3 p-2 bg-gray-800/50 rounded">
                  <div className="text-sm font-medium text-gray-300">{upgrade.specialEffect.name}</div>
                  <div className="text-xs text-gray-400">{upgrade.specialEffect.description}</div>
                </div>
              )}

              {/* Requirements */}
              <div className="space-y-2 mb-3">
                {upgrade.requirements.tech.map((tech, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-400">
                    <Zap className="w-4 h-4 mr-2" />
                    <span>{tech}</span>
                  </div>
                ))}
              </div>

              {/* Resource Costs */}
              <div className="flex flex-wrap gap-2 mb-3">
                {upgrade.requirements.resources.map((resource, index) => (
                  <div
                    key={index}
                    className={`px-2 py-1 rounded text-xs ${
                      (weapon.resources[resource.type] || 0) >= resource.amount
                        ? 'bg-green-900/20 text-green-400'
                        : 'bg-red-900/20 text-red-400'
                    }`}
                  >
                    {resource.type}: {weapon.resources[resource.type] || 0}/{resource.amount}
                  </div>
                ))}
              </div>

              {/* Upgrade Button */}
              <button
                onClick={() => onUpgrade(upgrade.id)}
                disabled={!upgrade.unlocked || !canAfford}
                className={`w-full px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
                  upgrade.unlocked && canAfford
                    ? `bg-${upgradeColor}-600 hover:bg-${upgradeColor}-700 text-white`
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Crosshair className="w-4 h-4" />
                <span>Apply Upgrade</span>
              </button>

              {/* Warnings */}
              {(!upgrade.unlocked || !canAfford) && (
                <div className="mt-2 flex items-center space-x-2 text-xs text-yellow-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    {!upgrade.unlocked
                      ? 'Research required technologies first'
                      : 'Insufficient resources for upgrade'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}