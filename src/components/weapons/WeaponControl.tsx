import { Crosshair } from "lucide-react";
import { 
  WeaponCategory, 
  WeaponStatus,
  CombatWeaponStats,
  WEAPON_COLORS
} from "../../types/weapons/WeaponTypes";
import { WeaponEffect } from "../../effects/types_effects/WeaponEffects";

interface WeaponControlProps {
  weapon: {
    id: string;
    name: string;
    type: WeaponCategory;
    tier: 1 | 2 | 3;
    status: WeaponStatus;
    stats: CombatWeaponStats;
    specialEffects?: WeaponEffect[];
  };
  onFire: () => void;
  onToggleEffect: (effectName: string) => void;
}

export function WeaponControl({
  weapon,
  onFire,
  onToggleEffect,
}: WeaponControlProps) {
  const color = WEAPON_COLORS[weapon.type];

  return (
    <div
      className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}
    >
      {/* Weapon Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">{weapon.name}</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span>Tier {weapon.tier}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">
              {weapon.type.replace(/([A-Z])/g, " $1").trim()}
            </span>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm ${
            weapon.status === "ready"
              ? "bg-green-900/50 text-green-400"
              : weapon.status === "charging"
                ? "bg-yellow-900/50 text-yellow-400"
                : weapon.status === "cooling"
                  ? "bg-blue-900/50 text-blue-400"
                  : "bg-red-900/50 text-red-400"
          }`}
        >
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
            <span className={`text-${color}-400`}>
              {weapon.stats.accuracy}%
            </span>
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
            <span className={`text-${color}-400`}>
              {weapon.stats.rateOfFire}/s
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${(weapon.stats.rateOfFire / 10) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Energy Cost</span>
            <span className={`text-${color}-400`}>
              {weapon.stats.energyCost}/shot
            </span>
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
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Special Effects
          </h4>
          <div className="space-y-2">
            {weapon.specialEffects.map((effect) => (
              <button
                key={effect.name}
                onClick={() => onToggleEffect(effect.name)}
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
      )}

      {/* Fire Control */}
      <button
        onClick={onFire}
        disabled={weapon.status !== "ready"}
        className={`w-full px-4 py-3 rounded-lg flex items-center justify-center space-x-2 ${
          weapon.status === "ready"
            ? `bg-${color}-600 hover:bg-${color}-700 text-white`
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Crosshair className="w-5 h-5" />
        <span>Fire Weapon</span>
      </button>
    </div>
  );
}
