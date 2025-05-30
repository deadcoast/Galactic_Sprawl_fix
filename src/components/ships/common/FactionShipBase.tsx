import { ReactNode, useEffect } from 'react';
import { useShipState } from '../../../contexts/ShipContext';
import { BaseEffect } from '../../../effects/types_effects/EffectTypes';
import { useShipActions } from '../../../hooks/ships/useShipActions';
import { useShipEffects } from '../../../hooks/ships/useShipEffects';
import type { FactionShipProps } from '../../../types/ships/FactionShipTypes';
import { FactionId } from '../../../types/ships/FactionTypes';
import { UnifiedShipStatus } from '../../../types/ships/UnifiedShipTypes';
import { AbilityButtonContainer } from '../../ui/buttons/AbilityButton';
import { StatusEffectContainer } from '../../ui/status/StatusEffect';
import { BaseShip } from '../base/BaseShip';

// Update FACTION_COLORS to include all possible FactionId values
const FACTION_COLORS: Record<FactionId, string> = {
  'space-rats': 'red',
  'lost-nova': 'violet',
  'equator-horizon': 'amber',
  player: 'blue',
  enemy: 'red',
  neutral: 'gray',
  ally: 'green',
} as const;

/**
 * Maps the full UnifiedShipStatus to the limited status type used by BaseShip
 * TODO: Update BaseShip to accept UnifiedShipStatus directly?
 */
function mapShipStatus(
  status: UnifiedShipStatus
): 'engaging' | 'patrolling' | 'retreating' | 'disabled' {
  switch (status) {
    case UnifiedShipStatus.ENGAGING:
    case UnifiedShipStatus.ATTACKING:
      return 'engaging';
    case UnifiedShipStatus.PATROLLING:
    case UnifiedShipStatus.IDLE:
    case UnifiedShipStatus.READY:
      return 'patrolling';
    case UnifiedShipStatus.RETREATING:
    case UnifiedShipStatus.RETURNING:
    case UnifiedShipStatus.WITHDRAWING:
      return 'retreating';
    case UnifiedShipStatus.DISABLED:
    case UnifiedShipStatus.DAMAGED:
    case UnifiedShipStatus.REPAIRING:
    case UnifiedShipStatus.UPGRADING:
    case UnifiedShipStatus.MAINTENANCE:
      return 'disabled';
    case UnifiedShipStatus.MINING:
    case UnifiedShipStatus.SCANNING:
    case UnifiedShipStatus.INVESTIGATING:
      return 'patrolling';
    default:
      return 'patrolling';
  }
}

/**
 * FactionShipContent Component
 *
 * Internal component that uses ship state hooks
 */
function FactionShipContent({
  ship,
  onEngage,
  onRetreat,
  onSpecialAbility,
  onFire,
  className = '',
  children,
}: FactionShipProps & { children?: ReactNode }) {
  const { state } = useShipState();
  const { updateStatus } = useShipActions();
  const { activeEffects, clearExpiredEffects } = useShipEffects();

  // Clear expired effects periodically
  useEffect(() => {
    const interval = setInterval(clearExpiredEffects, 1000);
    return () => clearInterval(interval);
  }, [clearExpiredEffects]);

  // Update ship status when faction status changes
  useEffect(() => {
    updateStatus(mapShipStatus(ship.status));
  }, [ship.status, updateStatus]);

  const color = FACTION_COLORS[ship.faction];

  // Handle weapon firing
  const handleWeaponFire = (weaponId: string) => {
    if (state.status !== 'disabled' && onFire) {
      onFire(weaponId);
    }
  };

  return (
    <div className={`bg-${color}-900/20 border border-${color}-700/30 rounded-lg p-6 ${className}`}>
      {/* Faction Info */}
      <div className="mb-4 flex items-center text-sm text-gray-400">
        <span className="capitalize">{ship.faction.replace(/-/g, ' ')}</span>
        <span className="mx-2">•</span>
        <span>{ship.class.replace(/([A-Z])/g, ' $1').trim()}</span>
      </div>

      {/* Status Effects */}
      <StatusEffectContainer className="mb-4">
        {activeEffects.map((effect: BaseEffect) => (
          <div
            key={effect.id}
            className={`px-3 py-2 bg-${color}-900/30 mb-2 rounded-lg text-sm last:mb-0`}
          >
            <div className="font-medium text-gray-300">{effect.name}</div>
            <div className="text-xs text-gray-400">{effect.description}</div>
          </div>
        ))}
        {children}
      </StatusEffectContainer>

      {/* Ship Stats */}
      {ship.stats.abilities.length > 0 && (
        <div className="mb-4">
          {ship.stats.abilities.map((ability, index) => (
            <div key={index} className="mb-2 last:mb-0">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">{ability.name}</span>
                <span className="text-sm text-gray-400">{ability.cooldown}s</span>
              </div>
              <p className="text-sm text-gray-400">{ability.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button
          onClick={onEngage}
          disabled={state.status === 'disabled'}
          className={`rounded-lg px-3 py-2 text-sm ${state.status === 'disabled' ? 'bg-gray-700 text-gray-500' : `bg-${color}-600 text-white`}`}
        >
          Engage
        </button>
        <button
          onClick={onRetreat}
          disabled={state.status === 'disabled'}
          className={`rounded-lg px-3 py-2 text-sm ${state.status === 'disabled' ? 'bg-gray-700 text-gray-500' : 'bg-yellow-600 text-white'}`}
        >
          Retreat
        </button>
        <button
          onClick={onSpecialAbility}
          disabled={state.status === 'disabled'}
          className={`rounded-lg px-3 py-2 text-sm ${state.status === 'disabled' ? 'bg-gray-700 text-gray-500' : `bg-${color}-500 text-white`}`}
        >
          Special
        </button>
      </div>

      {/* Weapon Controls */}
      {ship.stats.weapons.length > 0 && (
        <div className="space-y-2">
          {ship.stats.weapons.map(weapon => (
            <button
              key={weapon.id}
              onClick={() => handleWeaponFire(weapon.id)}
              disabled={state.status === 'disabled'}
              className={`w-full rounded-lg px-3 py-2 text-sm ${state.status === 'disabled' ? 'bg-gray-700 text-gray-500' : `bg-${color}-700 text-white`}`}
            >
              Fire {weapon.currentWeapon?.config.name || weapon.position} Mount
            </button>
          ))}
        </div>
      )}

      {/* Ability Buttons */}
      <AbilityButtonContainer>{children}</AbilityButtonContainer>
    </div>
  );
}

/**
 * FactionShipBase Component
 *
 * Base component for all faction ships that provides:
 * - Faction-specific styling and colors
 * - Integration with BaseShip functionality
 * - Status effect and ability button containers
 */
export function FactionShipBase(props: FactionShipProps & { children?: ReactNode }) {
  const { ship, ...rest } = props;

  return (
    <BaseShip
      id={ship.id}
      name={ship.name}
      status={mapShipStatus(ship.status)}
      health={ship.health}
      maxHealth={ship.maxHealth}
      shield={ship.shield}
      maxShield={ship.maxShield}
      weapons={ship.stats.weapons}
      stats={ship.stats}
      onFire={props?.onFire}
      onSpecialAbility={props?.onSpecialAbility}
      onRetreat={props?.onRetreat}
      onEngage={props?.onEngage}
    >
      <FactionShipContent ship={ship} {...rest} />
    </BaseShip>
  );
}
