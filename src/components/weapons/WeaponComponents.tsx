import * as React from "react";
import { AlertTriangle, Crosshair, Shield, Zap } from 'lucide-react';
import { WeaponEffect } from '../../effects/types_effects/WeaponEffects';
import {
  CombatWeaponStats,
  WeaponCategory,
  WeaponStatus,
  WeaponUpgrade,
} from '../../types/weapons/WeaponTypes';

interface StatBarProps {
  label: string;
  value: number | string;
  maxValue?: number;
  color: string;
  suffix?: string;
}

export function StatBar({ label, value, maxValue = 100, color, suffix }: StatBarProps) {
  const percentage = typeof value === 'number' ? (value / maxValue) * 100 : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={`text-${color}-400`}>
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-700">
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
  type: WeaponCategory;
  status: WeaponStatus;
  color: string;
}

export function WeaponHeader({ name, tier, type, status, color }: WeaponHeaderProps) {
  return (
    <div className={`mb-6 flex items-center justify-between text-${color}-400`}>
      <div>
        <h3 className="text-lg font-medium text-white">{name}</h3>
        <div className="flex items-center text-sm text-gray-400">
          <span>Tier {tier}</span>
          <span className="mx-2">•</span>
          <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
        </div>
      </div>
      <div
        className={`rounded-full px-3 py-1 text-sm ${
          status === 'ready'
            ? 'bg-green-900/50 text-green-400'
            : status === 'charging'
              ? 'bg-yellow-900/50 text-yellow-400'
              : status === 'cooling'
                ? 'bg-blue-900/50 text-blue-400'
                : 'bg-red-900/50 text-red-400'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    </div>
  );
}

interface WeaponStatsDisplayProps {
  stats: CombatWeaponStats;
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
    <div className="mb-6 space-y-4">
      <StatBar label="Accuracy" value={`${stats.accuracy}%`} color={color} />
      <StatBar
        label="Rate of Fire"
        value={stats.rateOfFire}
        maxValue={10}
        suffix="/s"
        color={color}
      />
      {showAmmo && currentAmmo !== undefined && maxAmmo !== undefined && (
        <StatBar label="Ammo" value={currentAmmo} maxValue={maxAmmo} color={color} />
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

export function WeaponEffectsDisplay({ effects, color, onToggle }: WeaponEffectsDisplayProps) {
  if (!effects || effects.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h4 className="mb-3 text-sm font-medium text-gray-300">Active Effects</h4>
      <div className="space-y-2">
        {effects.map(effect => (
          <button
            key={effect.name}
            onClick={() => onToggle?.(effect.name)}
            disabled={effect.active}
            className={`w-full rounded-lg p-3 text-left transition-colors ${
              effect.active
                ? `bg-${color}-500/20 border border-${color}-500/30`
                : 'bg-gray-700/50 hover:bg-gray-600/50'
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-white">{effect.name}</span>
              {effect.active ? (
                <span className="text-xs text-green-400">Active</span>
              ) : (
                <span className="text-xs text-gray-400">{effect.cooldown}s</span>
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
  currentStats: CombatWeaponStats;
  resources: Record<string, number>;
  onUpgrade: (upgradeId: string) => void;
}

export function WeaponUpgradeDisplay({
  upgrade,
  currentStats,
  resources,
  onUpgrade,
}: WeaponUpgradeDisplayProps) {
  const canAfford = upgrade.requirements.resources.every(
    req => (resources[req.type] ?? 0) >= req.amount
  );

  return (
    <div
      className={`rounded-lg p-4 ${
        upgrade.unlocked
          ? canAfford
            ? 'bg-gray-800/50 hover:bg-gray-700/50'
            : 'bg-gray-800/30'
          : 'bg-gray-800/20 opacity-50'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h5 className="text-sm font-medium text-white">{upgrade.name}</h5>
          <p className="text-xs text-gray-400">{upgrade.description}</p>
        </div>
        {!upgrade.unlocked && <Shield className="h-4 w-4 text-gray-500" />}
      </div>

      {/* Stat Changes */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        {Object.entries(upgrade.stats).map(([key, value]) => {
          if (typeof value !== 'number') {
            return null;
          }
          const currentValue = currentStats[key as keyof CombatWeaponStats];
          if (typeof currentValue !== 'number') {
            return null;
          }
          const diff = value - currentValue;
          return (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="capitalize text-gray-400">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className={diff >= 0 ? 'text-green-400' : 'text-red-400'}>
                {diff >= 0 ? '+' : ''}
                {diff}
              </span>
            </div>
          );
        })}
      </div>

      {/* Special Effect */}
      {upgrade.specialEffect && (
        <div className="mb-3 rounded bg-gray-700/50 p-2">
          <div className="text-xs font-medium text-gray-300">{upgrade.specialEffect.name}</div>
          <div className="text-xs text-gray-400">{upgrade.specialEffect.description}</div>
        </div>
      )}

      {/* Requirements */}
      <div className="mb-3 space-y-2">
        {upgrade.requirements.tech.map(tech => (
          <div key={tech} className="flex items-center text-xs text-gray-400">
            <Zap className="mr-1 h-3 w-3" />
            <span>{tech}</span>
          </div>
        ))}
      </div>

      {/* Resource Costs */}
      <div className="mb-3 flex flex-wrap gap-2">
        {upgrade.requirements.resources.map(resource => (
          <div
            key={resource.type}
            className={`rounded px-2 py-1 text-xs ${
              (resources[resource.type] ?? 0) >= resource.amount
                ? 'bg-green-900/20 text-green-400'
                : 'bg-red-900/20 text-red-400'
            }`}
          >
            {resource.type}: {resources[resource.type] ?? 0}/{resource.amount}
          </div>
        ))}
      </div>

      <button
        onClick={() => onUpgrade(upgrade.id)}
        disabled={!upgrade.unlocked || !canAfford}
        className={`flex w-full items-center justify-center space-x-2 rounded px-3 py-1.5 text-sm ${
          upgrade.unlocked && canAfford
            ? 'bg-gray-700 text-white hover:bg-gray-600'
            : 'cursor-not-allowed bg-gray-800 text-gray-500'
        }`}
      >
        <Crosshair className="h-4 w-4" />
        <span>Apply Upgrade</span>
      </button>

      {(!upgrade.unlocked || !canAfford) && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-yellow-400">
          <AlertTriangle className="h-3 w-3" />
          <span>
            {!upgrade.unlocked
              ? 'Research required technologies first'
              : 'Insufficient resources for upgrade'}
          </span>
        </div>
      )}
    </div>
  );
}
