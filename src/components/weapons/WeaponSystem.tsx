import {
  WeaponEffectsDisplay,
  WeaponHeader,
  WeaponStatsDisplay,
  WeaponUpgradeDisplay,
} from "./WeaponComponents";
import { 
  WEAPON_COLORS, 
  WeaponSystemProps,
  WeaponUpgrade,
  WeaponEffect,
  CombatWeaponStats
} from "../../types/weapons/WeaponTypes";
import { Crosshair } from "lucide-react";

export function WeaponSystem({
  weapon,
  availableUpgrades,
  resources,
  onFire,
  onUpgrade,
  onToggleEffect,
}: WeaponSystemProps) {
  const color = WEAPON_COLORS[weapon.config.category];

  const handleUpgrade = (upgradeId: string) => {
    if (onUpgrade) {
      onUpgrade(upgradeId);
    }
  };

  return (
    <div
      className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6`}
    >
      <WeaponHeader
        name={weapon.config.name}
        tier={weapon.config.tier}
        type={weapon.config.category}
        status={weapon.state.status}
        color={color}
      />

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-400 mb-1">Damage</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">
              {weapon.state.currentStats.damage}
            </span>
            <span className="text-sm text-gray-400">DPS</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Range</div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">
              {weapon.state.currentStats.range}
            </span>
            <span className="text-sm text-gray-400">ly</span>
          </div>
        </div>
      </div>

      <WeaponStatsDisplay
        stats={weapon.state.currentStats}
        color={color}
        showAmmo={weapon.state.currentAmmo !== undefined}
        currentAmmo={weapon.state.currentAmmo}
        maxAmmo={weapon.state.maxAmmo}
      />

      <WeaponEffectsDisplay
        effects={weapon.state.effects.map(effect => ({
          name: effect.name,
          description: effect.description,
          type: effect.type,
          magnitude: effect.magnitude,
          duration: effect.duration,
          active: effect.active ?? true,
          cooldown: effect.cooldown ?? 0
        }))}
        color={color}
        onToggle={onToggleEffect}
      />

      {/* Available Upgrades */}
      {availableUpgrades && availableUpgrades.length > 0 && resources && (
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-gray-300">
            Available Upgrades
          </h4>
          {availableUpgrades.map((upgrade) => (
            <WeaponUpgradeDisplay
              key={upgrade.id}
              upgrade={upgrade}
              currentStats={weapon.state.currentStats}
              resources={resources}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>
      )}

      {/* Fire Control */}
      <button
        onClick={() => onFire?.(weapon.config.id)}
        disabled={weapon.state.status !== "ready"}
        className={`w-full px-4 py-3 rounded-lg flex items-center justify-center space-x-2 ${
          weapon.state.status === "ready"
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
