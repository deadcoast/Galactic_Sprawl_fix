import { AlertTriangle, Crosshair, Shield, Zap } from 'lucide-react';
import {
  WeaponCategory,
  WeaponUpgrade,
  WeaponUpgradeType,
  CombatWeaponStats,
  UPGRADE_COLORS,
  BaseWeaponStats,
} from '../../types/weapons/WeaponTypes';

interface WeaponUpgradeSystemProps {
  weapon: {
    id: string;
    name: string;
    type: WeaponCategory;
    tier: 1 | 2 | 3;
    currentStats: CombatWeaponStats;
    availableUpgrades: WeaponUpgrade[];
    resources: Record<string, number>;
  };
  onUpgrade: (upgradeId: string) => void;
}

export function WeaponUpgradeSystem({ weapon, onUpgrade }: WeaponUpgradeSystemProps) {
  const getUpgradeColor = (type: WeaponUpgradeType) => {
    return UPGRADE_COLORS[type];
  };

  const canAffordUpgrade = (upgrade: WeaponUpgrade): boolean => {
    return upgrade.requirements.resources.every(
      req => (weapon.resources[req.type] || 0) >= req.amount
    );
  };

  const renderStatValue = (key: keyof BaseWeaponStats, value: number) => {
    if (typeof value !== 'number') return null;
    return (
      <span className={`text-xs ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
        {value > 0 ? '+' : ''}
        {value}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {weapon.availableUpgrades.map(upgrade => {
        const color = getUpgradeColor(upgrade.type);
        const canAfford = canAffordUpgrade(upgrade);

        return (
          <div
            key={upgrade.id}
            className={`p-4 rounded-lg ${
              upgrade.unlocked
                ? `bg-${color}-900/20 border border-${color}-500/30`
                : 'bg-gray-800 border border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-white">{upgrade.name}</h4>
                <p className="text-xs text-gray-400">{upgrade.description}</p>
              </div>
              {!upgrade.unlocked && (
                <div className="flex items-center text-yellow-400">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  <span className="text-xs">Locked</span>
                </div>
              )}
            </div>

            {/* Stat Changes */}
            <div className="space-y-2 mb-4">
              {Object.entries(upgrade.stats).map(([key, value]) => {
                if (typeof value !== 'number') return null;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {renderStatValue(key as keyof BaseWeaponStats, value)}
                  </div>
                );
              })}
            </div>

            {/* Special Effect */}
            {upgrade.specialEffect && (
              <div className="mb-4 p-2 bg-gray-800 rounded">
                <div className="text-xs font-medium text-gray-300">
                  {upgrade.specialEffect.name}
                </div>
                <div className="text-xs text-gray-400">{upgrade.specialEffect.description}</div>
              </div>
            )}

            {/* Requirements */}
            <div className="space-y-2 mb-4">
              <div className="text-xs text-gray-400">Requirements:</div>
              {upgrade.requirements.tech.map(tech => (
                <div key={tech} className="flex items-center text-xs text-blue-400">
                  <Shield className="w-3 h-3 mr-1" />
                  <span>{tech}</span>
                </div>
              ))}
              {upgrade.requirements.resources.map(resource => (
                <div
                  key={resource.type}
                  className={`flex items-center text-xs ${
                    weapon.resources[resource.type] >= resource.amount
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  <span>
                    {resource.type}: {weapon.resources[resource.type] || 0}/{resource.amount}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onUpgrade(upgrade.id)}
              disabled={!upgrade.unlocked || !canAfford}
              className={`w-full px-4 py-2 rounded flex items-center justify-center space-x-2 ${
                upgrade.unlocked && canAfford
                  ? `bg-${color}-600 hover:bg-${color}-700 text-white`
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span>Apply Upgrade</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
