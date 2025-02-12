import {
  UPGRADE_COLORS,
  WEAPON_COLORS,
  WeaponEffect,
  WeaponStats,
  WeaponUpgrade,
} from "../../types/weapons/WeaponTypes";
import { AlertTriangle, Crosshair, Lock } from "lucide-react";

interface StatBarProps {
  label: string;
  value: number | string;
  maxValue?: number;
  color: string;
  suffix?: string;
}

export function StatBar({
  label,
  value,
  maxValue = 100,
  color,
  suffix,
}: StatBarProps) {
  const percentage = typeof value === "number" ? (value / maxValue) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={`text-${color}-400`}>
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-${color}-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface WeaponHeaderProps {
  name: string;
  tier: number;
  type: string;
  status: string;
}

export function WeaponHeader({ name, tier, type, status }: WeaponHeaderProps) {
  const color = WEAPON_COLORS[type as keyof typeof WEAPON_COLORS] || "gray";
  return (
    <div className={`flex items-center justify-between mb-6 text-${color}-400`}>
      <div>
        <h3 className="text-lg font-medium text-white">{name}</h3>
        <div className="flex items-center text-sm text-gray-400">
          <span>Tier {tier}</span>
          <span className="mx-2">•</span>
          <span className="capitalize">
            {type.replace(/([A-Z])/g, " $1").trim()}
          </span>
        </div>
      </div>
      <div
        className={`px-3 py-1 rounded-full text-sm ${
          status === "ready"
            ? "bg-green-900/50 text-green-400"
            : status === "charging"
              ? "bg-yellow-900/50 text-yellow-400"
              : status === "cooling"
                ? "bg-blue-900/50 text-blue-400"
                : "bg-red-900/50 text-red-400"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    </div>
  );
}

interface WeaponStatsDisplayProps {
  stats: WeaponStats;
  color: string;
  showAmmo?: boolean;
  currentAmmo?: number;
  maxAmmo?: number;
}

export function WeaponStatsDisplay({
  stats,
  color,
  showAmmo,
  currentAmmo,
  maxAmmo,
}: WeaponStatsDisplayProps) {
  return (
    <div className="space-y-4 mb-6">
      <StatBar label="Accuracy" value={`${stats.accuracy}%`} color={color} />
      <StatBar
        label="Rate of Fire"
        value={stats.rateOfFire}
        maxValue={10}
        suffix="/s"
        color={color}
      />
      {showAmmo && currentAmmo !== undefined && maxAmmo !== undefined && (
        <StatBar
          label="Ammo"
          value={currentAmmo}
          maxValue={maxAmmo}
          color={color}
        />
      )}
      <StatBar
        label="Energy Cost"
        value={stats.energyCost}
        maxValue={100}
        suffix="/shot"
        color={color}
      />
    </div>
  );
}

interface WeaponEffectsDisplayProps {
  effects: WeaponEffect[];
  color: string;
  onToggle?: (effectName: string) => void;
}

export function WeaponEffectsDisplay({
  effects,
  color,
  onToggle,
}: WeaponEffectsDisplayProps) {
  if (effects.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-300 mb-3">
        Special Effects
      </h4>
      <div className="space-y-2">
        {effects.map((effect) => (
          <button
            key={effect.name}
            onClick={() => onToggle?.(effect.name)}
            disabled={effect.active}
            className={`w-full p-3 rounded-lg text-left transition-colors ${
              effect.active
                ? `bg-${color}-500/20 border border-${color}-500/30`
                : "bg-gray-700/50 hover:bg-gray-600/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">
                {effect.name}
              </span>
              {effect.active ? (
                <span className="text-xs text-green-400">Active</span>
              ) : (
                <span className="text-xs text-gray-400">
                  {effect.cooldown}s
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{effect.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

interface WeaponUpgradeDisplayProps {
  upgrade: WeaponUpgrade;
  currentStats: WeaponStats;
  resources: Record<string, number>;
  onUpgrade: (upgradeId: string) => void;
}

export function WeaponUpgradeDisplay({
  upgrade,
  currentStats,
  resources,
  onUpgrade,
}: WeaponUpgradeDisplayProps) {
  const color = UPGRADE_COLORS[upgrade.type];
  const canAfford = upgrade.requirements.resources.every(
    (resource) => (resources[resource.type] || 0) >= resource.amount,
  );

  const getStatDifference = (current: number, upgraded: number) => {
    const diff = upgraded - current;
    return diff >= 0 ? `+${diff}` : diff.toString();
  };

  return (
    <div
      className={`p-4 rounded-lg border ${
        upgrade.unlocked
          ? canAfford
            ? `bg-${color}-900/20 border-${color}-700/30`
            : "bg-gray-800/50 border-gray-700"
          : "bg-gray-800/30 border-gray-700 opacity-50"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h5 className="text-white font-medium">{upgrade.name}</h5>
          <p className="text-sm text-gray-400">{upgrade.description}</p>
        </div>
        {!upgrade.unlocked && <Lock className="w-5 h-5 text-gray-500" />}
      </div>

      {/* Stat Changes */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {Object.entries(upgrade.stats).map(([stat, value]) => (
          <div key={stat} className="flex items-center justify-between text-sm">
            <span className="text-gray-400 capitalize">
              {stat.replace(/([A-Z])/g, " $1").trim()}
            </span>
            <span
              className={
                value > currentStats[stat as keyof WeaponStats]
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {getStatDifference(
                currentStats[stat as keyof WeaponStats],
                value,
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Resource Costs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {upgrade.requirements.resources.map((resource, index) => (
          <div
            key={index}
            className={`px-2 py-1 rounded text-xs ${
              (resources[resource.type] || 0) >= resource.amount
                ? "bg-green-900/20 text-green-400"
                : "bg-red-900/20 text-red-400"
            }`}
          >
            {resource.type}: {resources[resource.type] || 0}/{resource.amount}
          </div>
        ))}
      </div>

      <button
        onClick={() => onUpgrade(upgrade.id)}
        disabled={!upgrade.unlocked || !canAfford}
        className={`w-full px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 ${
          upgrade.unlocked && canAfford
            ? `bg-${color}-600 hover:bg-${color}-700 text-white`
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Crosshair className="w-4 h-4" />
        <span>Apply Upgrade</span>
      </button>

      {(!upgrade.unlocked || !canAfford) && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-yellow-400">
          <AlertTriangle className="w-4 h-4" />
          <span>
            {!upgrade.unlocked
              ? "Research required technologies first"
              : "Insufficient resources for upgrade"}
          </span>
        </div>
      )}
    </div>
  );
}
