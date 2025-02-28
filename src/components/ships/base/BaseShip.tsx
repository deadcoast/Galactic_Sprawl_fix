import { Crosshair } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { ShipProvider, useShipState } from '../../../contexts/ShipContext';
import { BaseEffect } from '../../../effects/types_effects/EffectTypes';
import { useShipActions } from '../../../hooks/ships/useShipActions';
import { useShipEffects } from '../../../hooks/ships/useShipEffects';
import { CommonShipStats } from '../../../types/ships/CommonShipTypes';
import { WeaponMount } from '../../../types/weapons/WeaponTypes';

interface BaseShipProps {
  id: string;
  name: string;
  status: 'engaging' | 'patrolling' | 'retreating' | 'disabled';
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponMount[];
  stats: CommonShipStats;
  onFire?: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * BaseShipContent Component
 *
 * Internal component that uses ship state hooks
 */
function BaseShipContent({
  onFire,
  onEngage,
  onRetreat,
  onSpecialAbility,
  className = '',
  children,
}: Omit<
  BaseShipProps,
  'id' | 'name' | 'status' | 'health' | 'maxHealth' | 'shield' | 'maxShield' | 'weapons' | 'stats'
>) {
  const { state } = useShipState();
  const { fireWeapon } = useShipActions();
  const { activeEffects, clearExpiredEffects } = useShipEffects();

  // Clear expired effects periodically
  useEffect(() => {
    const interval = setInterval(clearExpiredEffects, 1000);
    return () => clearInterval(interval);
  }, [clearExpiredEffects]);

  // Handle weapon firing
  const handleFire = (weaponId: string) => {
    fireWeapon(weaponId);
    onFire?.(weaponId);
  };

  return (
    <div className={`ship-container relative ${className}`}>
      {/* Ship Header */}
      <div className="ship-header mb-4">
        <h3 className="text-lg font-medium text-white">{state.name}</h3>
        <div
          className={`status-badge rounded-full px-2 py-1 text-sm ${
            state.status === 'engaging'
              ? 'bg-red-900/50 text-red-400'
              : state.status === 'patrolling'
                ? 'bg-green-900/50 text-green-400'
                : state.status === 'retreating'
                  ? 'bg-yellow-900/50 text-yellow-400'
                  : 'bg-gray-700 text-gray-400'
          }`}
        >
          {state.status.charAt(0).toUpperCase() + state.status.slice(1)}
        </div>
      </div>

      {/* Health & Shield Bars */}
      <div className="stats-container mb-4">
        <div className="stat-bar mb-2">
          <div className="mb-1 text-sm text-gray-400">Shield</div>
          <div className="h-2 rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${(state.shield / state.maxShield) * 100}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {Math.round(state.shield)}/{state.maxShield}
          </div>
        </div>
        <div className="stat-bar">
          <div className="mb-1 text-sm text-gray-400">Health</div>
          <div className="h-2 rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-red-500 transition-all"
              style={{ width: `${(state.health / state.maxHealth) * 100}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {Math.round(state.health)}/{state.maxHealth}
          </div>
        </div>
      </div>

      {/* Weapon Systems */}
      <div className="weapons-container mb-4 grid grid-cols-2 gap-3">
        {state.weapons.map(mount => {
          if (!mount.currentWeapon) return null;

          return (
            <div
              key={mount.id}
              className={`rounded-lg p-3 ${
                mount.currentWeapon.state.status === 'ready'
                  ? 'bg-gray-800/50 hover:bg-gray-700/50'
                  : 'bg-gray-800/30'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-white">
                  {mount.currentWeapon.config.name}
                </div>
                <div
                  className={`text-xs ${
                    mount.currentWeapon.state.status === 'ready'
                      ? 'text-green-400'
                      : mount.currentWeapon.state.status === 'charging'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {mount.currentWeapon.state.status}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Range: {mount.currentWeapon.state.currentStats.range}ly</span>
                <span>DMG: {mount.currentWeapon.state.currentStats.damage}</span>
              </div>
              <button
                onClick={() => handleFire(mount.id)}
                disabled={mount.currentWeapon.state.status !== 'ready'}
                className={`mt-2 flex w-full items-center justify-center space-x-2 rounded px-3 py-1.5 ${
                  mount.currentWeapon.state.status === 'ready'
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'cursor-not-allowed bg-gray-800 text-gray-500'
                }`}
              >
                <Crosshair className="h-4 w-4" />
                <span>Fire</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Effects */}
      {activeEffects.length > 0 && (
        <div className="active-effects mb-4">
          <div className="mb-2 text-sm text-gray-400">Active Effects</div>
          <div className="space-y-2">
            {activeEffects.map((effect: BaseEffect) => (
              <div key={effect.id} className="rounded-lg bg-gray-800/50 px-3 py-2 text-sm">
                <div className="font-medium text-gray-300">{effect.name}</div>
                <div className="text-xs text-gray-400">{effect.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Effects and Custom Content */}
      <div className="custom-content">{children}</div>

      {/* Action Buttons */}
      <div className="action-buttons-container mt-4 flex gap-2">
        {onEngage && (
          <button
            onClick={onEngage}
            disabled={state.status === 'disabled'}
            className="flex-1 rounded-lg bg-red-900/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/50 disabled:opacity-50"
          >
            Engage
          </button>
        )}
        {onRetreat && (
          <button
            onClick={onRetreat}
            disabled={state.status === 'disabled'}
            className="flex-1 rounded-lg bg-yellow-900/30 px-4 py-2 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-900/50 disabled:opacity-50"
          >
            Retreat
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * BaseShip Component
 *
 * Core ship component that provides common functionality for all ship types:
 * - Health and shield display
 * - Weapon mounting and firing
 * - Status effects
 * - Action buttons
 */
export function BaseShip(props: BaseShipProps) {
  const { id, name, status, health, maxHealth, shield, maxShield, weapons, stats, ...rest } = props;

  return (
    <ShipProvider
      initialState={{
        id,
        name,
        status,
        health,
        maxHealth,
        shield,
        maxShield,
        weapons,
        stats,
      }}
    >
      <BaseShipContent {...rest} />
    </ShipProvider>
  );
}
