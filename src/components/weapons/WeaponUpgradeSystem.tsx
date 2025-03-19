import { AlertTriangle, Crosshair, Shield, Zap } from 'lucide-react';
import {
  BaseWeaponStats,
  CombatWeaponStats,
  UPGRADE_COLORS,
  WeaponCategory,
  WeaponUpgrade,
  WeaponUpgradeType,
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
      req => (weapon.resources[req.type] ?? 0) >= req.amount
    );
  };

  const renderStatValue = (key: keyof BaseWeaponStats, value: number) => {
    if (typeof value !== 'number') return null;

    // Format the key for display (convert camelCase to Title Case with spaces)
    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    return (
      <div className="flex w-full justify-between">
        <span className="text-xs text-gray-300">{formattedKey}:</span>
        <span className={`text-xs ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {value > 0 ? '+' : ''}
          {value}
        </span>
      </div>
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
            className={`rounded-lg p-4 ${
              upgrade.unlocked
                ? `bg-${color}-900/20 border border-${color}-500/30`
                : 'border border-gray-700 bg-gray-800'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">{upgrade.name}</h4>
                <p className="text-xs text-gray-400">{upgrade.description}</p>
              </div>
              {!upgrade.unlocked && (
                <div className="flex items-center text-yellow-400">
                  <AlertTriangle className="mr-1 h-4 w-4" />
                  <span className="text-xs">Locked</span>
                </div>
              )}
            </div>

            {/* Stat Changes */}
            <div className="mb-4 space-y-2">
              {Object.entries(upgrade.stats).map(([key, value]) => {
                if (typeof value !== 'number') return null;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs capitalize text-gray-400">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {renderStatValue(key as keyof BaseWeaponStats, value)}
                  </div>
                );
              })}
            </div>

            {/* Special Effect */}
            {upgrade.specialEffect && (
              <div className="mb-4 rounded bg-gray-800 p-2">
                <div className="text-xs font-medium text-gray-300">
                  {upgrade.specialEffect.name}
                </div>
                <div className="text-xs text-gray-400">{upgrade.specialEffect.description}</div>
              </div>
            )}

            {/* Requirements */}
            <div className="mb-4 space-y-2">
              <div className="text-xs text-gray-400">Requirements:</div>
              {upgrade.requirements.tech.map(tech => (
                <div key={tech} className="flex items-center text-xs text-blue-400">
                  <Shield className="mr-1 h-3 w-3" />
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
                  <Zap className="mr-1 h-3 w-3" />
                  <span>
                    {resource.type}: {weapon.resources[resource.type] ?? 0}/{resource.amount}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onUpgrade(upgrade.id)}
              disabled={!upgrade.unlocked || !canAfford}
              className={`flex w-full items-center justify-center space-x-2 rounded px-4 py-2 ${
                upgrade.unlocked && canAfford
                  ? `bg-${color}-600 hover:bg-${color}-700 text-white`
                  : 'cursor-not-allowed bg-gray-700 text-gray-500'
              }`}
            >
              <Crosshair className="h-4 w-4" />
              <span>Apply Upgrade</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
