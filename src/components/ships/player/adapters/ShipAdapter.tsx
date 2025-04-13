import { useState } from 'react';
import { CommonShipAbility } from '../../../../types/ships/CommonShipTypes';
import {
  PlayerShip,
  PlayerShipAbility,
  PlayerShipClass,
} from '../../../../types/ships/PlayerShipTypes';
import { UnifiedShipStatus } from '../../../../types/ships/ShipTypes';

// Import specific player ship components and their props
import { OrionFrigate, OrionFrigateProps } from '../../combatships/OrionFrigate';
import { Spitflare, SpitflareProps } from '../../combatships/Spitflare';
import { StarSchooner, StarSchoonerProps } from '../../combatships/StarSchooner';
// Import newly added ship components and props
import { HarbringerGalleon, HarbringerGalleonProps } from '../../combatships/HarbringerGalleon';
import { MidwayCarrier, MidwayCarrierProps } from '../../combatships/MidwayCarrier';
import { MotherEarthRevenge, MotherEarthRevengeProps } from '../../combatships/MotherEarthRevenge';
// Import the actual fallback component and its props
import { CombatShip, combatShipProps } from '../../combatships/CombatShip';

// --- Remove Placeholders --- (Placeholders are deleted)

interface ShipAdapterProps {
  ship: PlayerShip;
  quality: 'high' | 'medium' | 'low';
  onDeploy?: () => void;
  onRecall?: () => void;
  onFire?: () => void; // Note: Generic fire, specific components expect weaponId
  onAbility?: (ability: CommonShipAbility) => void;
  _onUpgrade?: () => void;
  onRetreat?: () => void;
}

// Map PlayerShipClass enum values to components
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Adapter handles prop differences
const shipTypeMap: Partial<Record<PlayerShipClass, React.ComponentType<any>>> = {
  [PlayerShipClass.SPITFLARE]: Spitflare,
  [PlayerShipClass.STAR_SCHOONER]: StarSchooner,
  [PlayerShipClass.ORION_FRIGATE]: OrionFrigate,
  [PlayerShipClass.HARBRINGER_GALLEON]: HarbringerGalleon,
  [PlayerShipClass.MIDWAY_CARRIER]: MidwayCarrier,
  [PlayerShipClass.MOTHER_EARTH_REVENGE]: MotherEarthRevenge,
  // ... add mappings for other PlayerShipClass members if needed ...
};

// --- Helper Functions for Prop Adaptation ---

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

// Update the union type for ALL possible props - Removed as unused
// type AdaptedComponentProps = ...

// Update the union type for the possible weapon structures
// Add weapon types from MidwayCarrier and MotherEarthRevenge
type MappedWeapon =
  | SpitflareProps['weapons'][0]
  | StarSchoonerProps['weapons'][0]
  | OrionFrigateProps['weapons'][0]
  | MidwayCarrierProps['weapons'][0]
  | MotherEarthRevengeProps['weapons'][0]
  // Fallback (CombatShip uses combatShipProps)
  | combatShipProps['ship']['weapons'][0];

/**
 * Maps UnifiedShipStatus to the specific status strings expected by component props.
 */
const mapShipStatus = (
  status: UnifiedShipStatus,
  targetType: PlayerShipClass | 'CombatShip' // Use class or 'CombatShip' identifier
): string => {
  // Return string, specific types handled by casting later
  switch (targetType) {
    case PlayerShipClass.SPITFLARE:
    case PlayerShipClass.STAR_SCHOONER:
    case PlayerShipClass.ORION_FRIGATE:
    case PlayerShipClass.HARBRINGER_GALLEON: // Uses 'idle' | 'engaging' | 'retreating' | 'damaged'
    case PlayerShipClass.MIDWAY_CARRIER:
    case PlayerShipClass.MOTHER_EARTH_REVENGE:
      switch (status) {
        case UnifiedShipStatus.ENGAGING:
        case UnifiedShipStatus.ATTACKING:
          return 'engaging';
        case UnifiedShipStatus.RETREATING:
        case UnifiedShipStatus.RETURNING:
        case UnifiedShipStatus.WITHDRAWING:
          return 'retreating';
        case UnifiedShipStatus.DAMAGED:
        case UnifiedShipStatus.DISABLED:
        case UnifiedShipStatus.REPAIRING:
        case UnifiedShipStatus.UPGRADING:
        case UnifiedShipStatus.MAINTENANCE:
          return 'damaged';
        case UnifiedShipStatus.IDLE:
        case UnifiedShipStatus.PATROLLING:
        case UnifiedShipStatus.READY:
        default:
          return 'idle';
      }
    case 'CombatShip': // Fallback case (uses combatShipProps status)
    default:
      // combatShip expects 'idle' | 'patrolling' | 'engaging' | 'returning' | 'damaged'
      switch (status) {
        case UnifiedShipStatus.ENGAGING:
        case UnifiedShipStatus.ATTACKING:
          return 'engaging';
        case UnifiedShipStatus.PATROLLING:
        case UnifiedShipStatus.READY:
          return 'patrolling';
        case UnifiedShipStatus.RETREATING:
        case UnifiedShipStatus.RETURNING:
        case UnifiedShipStatus.WITHDRAWING:
          return 'returning';
        case UnifiedShipStatus.DAMAGED:
        case UnifiedShipStatus.DISABLED:
        case UnifiedShipStatus.REPAIRING:
        case UnifiedShipStatus.UPGRADING:
        case UnifiedShipStatus.MAINTENANCE:
          return 'damaged';
        case UnifiedShipStatus.IDLE:
        default:
          return 'idle';
      }
  }
};

// Define union type for abilities mapping
type MappedAbility =
  | OrionFrigateProps['specialAbility']
  | MidwayCarrierProps['specialAbilities']
  | MotherEarthRevengeProps['specialAbilities']
  | combatShipProps['ship']['specialAbilities'];

/**
 * Maps the PlayerShip weapon data to the structure expected by a specific component.
 */
const mapWeapons = (
  ship: PlayerShip,
  targetType: PlayerShipClass | 'CombatShip'
): MappedWeapon[] => {
  const weapons = (ship.stats.weapons || []).filter(w => w.currentWeapon);
  let orionWeaponType: 'machineGun' | 'gaussCannon';
  let midwayWeaponType: 'pointDefense' | 'flakCannon';
  let motherEarthWeaponType: 'capitalLaser' | 'torpedoes' | 'pointDefense';

  return weapons
    .map(w => {
      const weaponConf = w.currentWeapon!.config;
      const weaponState = w.currentWeapon!.state;
      const baseWeaponData = {
        id: w.id,
        name: weaponConf.name,
        damage: weaponConf.baseStats.damage,
        status: weaponState.status,
      };

      switch (targetType) {
        case PlayerShipClass.SPITFLARE:
          return { ...baseWeaponData, type: 'machineGun' as const };
        case PlayerShipClass.STAR_SCHOONER:
          return { ...baseWeaponData, type: 'railGun' as const };
        case PlayerShipClass.ORION_FRIGATE:
          orionWeaponType = weaponConf.category === 'gaussCannon' ? 'gaussCannon' : 'machineGun';
          return { ...baseWeaponData, type: orionWeaponType };
        case PlayerShipClass.MIDWAY_CARRIER:
          midwayWeaponType = weaponConf.category === 'flakCannon' ? 'flakCannon' : 'pointDefense';
          return { ...baseWeaponData, type: midwayWeaponType };
        case PlayerShipClass.MOTHER_EARTH_REVENGE:
          switch (weaponConf.category) {
            case 'capitalLaser':
              motherEarthWeaponType = 'capitalLaser';
              break;
            case 'torpedoes':
              motherEarthWeaponType = 'torpedoes';
              break;
            default:
              motherEarthWeaponType = 'pointDefense';
              break;
          }
          return { ...baseWeaponData, type: motherEarthWeaponType };
        case PlayerShipClass.HARBRINGER_GALLEON:
          // Harbringer Galleon component doesn't seem to take weapon props
          return undefined; // Or an empty object/array if required
        case 'CombatShip':
        default:
          return {
            ...baseWeaponData,
            type: weaponConf.category,
            range: weaponConf.baseStats.range,
            cooldown: weaponConf.baseStats.cooldown,
          };
      }
    })
    .filter(Boolean) as MappedWeapon[]; // Filter out undefined from Harbringer and cast
};

/**
 * Maps PlayerShip abilities to the structure expected by a specific component.
 */
const mapAbilities = (
  ship: PlayerShip,
  targetType: PlayerShipClass | 'CombatShip'
): MappedAbility | undefined => {
  const firstAbility: PlayerShipAbility | undefined = ship.abilities?.[0];
  const mapToStandardAbilityArray = (abilities: PlayerShipAbility[]) =>
    abilities.map(ab => ({
      name: ab.name,
      description: ab.description || '',
      active: ab.active ?? false,
      cooldown: ab.cooldown || 0,
    }));

  switch (targetType) {
    case PlayerShipClass.ORION_FRIGATE:
      return firstAbility
        ? {
            name: firstAbility.name,
            description: firstAbility.description || '',
            active: firstAbility.active ?? false,
            cooldown: firstAbility.cooldown || 0,
          }
        : undefined;
    case PlayerShipClass.MIDWAY_CARRIER:
    case PlayerShipClass.MOTHER_EARTH_REVENGE:
    case 'CombatShip': // Fallback also expects array
      return ship.abilities ? mapToStandardAbilityArray(ship.abilities) : [];
    case PlayerShipClass.SPITFLARE:
    case PlayerShipClass.STAR_SCHOONER:
    case PlayerShipClass.HARBRINGER_GALLEON:
    default:
      return undefined;
  }
};

// --- ShipAdapter Component ---

export function ShipAdapter({
  ship,
  quality,
  onDeploy,
  onRecall,
  onFire: adapterOnFire,
  onAbility: adapterOnAbility,
  onRetreat: adapterOnRetreat,
  _onUpgrade,
}: ShipAdapterProps) {
  const [activeAbilities, setActiveAbilities] = useState<Record<string, boolean>>({});

  const ShipComponent = shipTypeMap[ship.class] ?? CombatShip;
  const targetType = shipTypeMap[ship.class] ? ship.class : 'CombatShip';

  const commonMappedProps = {
    id: ship.id,
    hull: ship.stats.health,
    maxHull: ship.stats.maxHealth,
    shield: ship.stats.shield,
    maxShield: ship.stats.maxShield,
    status: mapShipStatus(ship.status, targetType),
  };

  const handleAbilityToggle = (ability: CommonShipAbility) => {
    setActiveAbilities(prev => ({
      ...prev,
      [ability.id]: !prev[ability.id],
    }));
  };

  const renderAdaptedComponent = () => {
    switch (targetType) {
      case PlayerShipClass.SPITFLARE: {
        const TypedComponent = ShipComponent as React.FC<SpitflareProps>;
        const props: SpitflareProps = {
          ...commonMappedProps,
          status: commonMappedProps.status as SpitflareProps['status'],
          weapons: mapWeapons(ship, targetType) as SpitflareProps['weapons'],

          onFire: (_weaponId: string) => adapterOnFire?.(), // Prefix unused weaponId
          onRetreat: adapterOnRetreat ?? noop,
        };
        return <TypedComponent {...props} />;
      }
      case PlayerShipClass.STAR_SCHOONER: {
        const TypedComponent = ShipComponent as React.FC<StarSchoonerProps>;
        const props: StarSchoonerProps = {
          ...commonMappedProps,
          tier: ship.stats.tier as StarSchoonerProps['tier'],
          status: commonMappedProps.status as StarSchoonerProps['status'],
          weapons: mapWeapons(ship, targetType) as StarSchoonerProps['weapons'],

          onFire: (_weaponId: string) => adapterOnFire?.(), // Prefix unused weaponId
          onRetreat: adapterOnRetreat ?? noop,
        };
        return <TypedComponent {...props} />;
      }
      case PlayerShipClass.ORION_FRIGATE: {
        const TypedComponent = ShipComponent as React.FC<OrionFrigateProps>;
        const mappedAbil = mapAbilities(ship, targetType) as
          | OrionFrigateProps['specialAbility']
          | undefined;
        const props: OrionFrigateProps = {
          ...commonMappedProps,
          status: commonMappedProps.status as OrionFrigateProps['status'],
          weapons: mapWeapons(ship, targetType) as OrionFrigateProps['weapons'],
          specialAbility: mappedAbil ?? {
            name: 'None',
            description: '',
            active: false,
            cooldown: 0,
          },

          onFire: (_weaponId: string) => adapterOnFire?.(), // Prefix unused weaponId
          onActivateAbility: () => adapterOnAbility?.(ship.abilities?.[0]),
          onRetreat: adapterOnRetreat ?? noop,
        };
        return <TypedComponent {...props} />;
      }
      case PlayerShipClass.HARBRINGER_GALLEON: {
        const TypedComponent = ShipComponent as React.FC<HarbringerGalleonProps>;
        const props: HarbringerGalleonProps = {
          x: ship.position.x,
          y: ship.position.y,
          status: commonMappedProps.status as HarbringerGalleonProps['status'],
          health: commonMappedProps.hull,
          maxHealth: commonMappedProps.maxHull,
          shield: commonMappedProps.shield,
          maxShield: commonMappedProps.maxShield,
          // eslint-disable-next-line no-console
          onStatusChange: (newStatus: string) =>
            console.log('Harbringer status changed:', newStatus),
        };
        return <TypedComponent {...props} />;
      }
      case PlayerShipClass.MIDWAY_CARRIER: {
        const TypedComponent = ShipComponent as React.FC<MidwayCarrierProps>;
        const props: MidwayCarrierProps = {
          id: commonMappedProps.id,
          status: commonMappedProps.status as MidwayCarrierProps['status'],
          hull: commonMappedProps.hull,
          maxHull: commonMappedProps.maxHull,
          shield: commonMappedProps.shield,
          maxShield: commonMappedProps.maxShield,
          fighters: ship.fighters ?? [],
          maxFighters: ship.stats.maxFighters ?? 0,
          repairRate: ship.stats.repairRate ?? 0,
          weapons: mapWeapons(ship, targetType) as MidwayCarrierProps['weapons'],
          specialAbilities:
            (mapAbilities(ship, targetType) as MidwayCarrierProps['specialAbilities']) ?? [],
          // eslint-disable-next-line no-console
          onDeployFighters: () => console.log('Deploy Fighters'),
          // eslint-disable-next-line no-console
          onRecallFighters: () => console.log('Recall Fighters'),

          onFire: (_weaponId: string) => adapterOnFire?.(), // Prefix unused weaponId
          onActivateAbility: (abilityName: string) => {
            const abil = ship.abilities?.find(a => a.name === abilityName);
            if (abil) {
              adapterOnAbility?.(abil);
            }
          },
          onRetreat: adapterOnRetreat ?? noop,
        };
        return <TypedComponent {...props} />;
      }
      case PlayerShipClass.MOTHER_EARTH_REVENGE: {
        const TypedComponent = ShipComponent as React.FC<MotherEarthRevengeProps>;
        const props: MotherEarthRevengeProps = {
          status: commonMappedProps.status as MotherEarthRevengeProps['status'],
          hull: commonMappedProps.hull,
          maxHull: commonMappedProps.maxHull,
          shield: commonMappedProps.shield,
          maxShield: commonMappedProps.maxShield,
          dockingBays: ship.dockingBays ?? [], // Use actual dockingBays
          weapons: mapWeapons(ship, targetType) as MotherEarthRevengeProps['weapons'],
          specialAbilities:
            (mapAbilities(ship, targetType) as MotherEarthRevengeProps['specialAbilities']) ?? [],
          alerts: ship.alerts ?? [], // Use actual alerts

          onFire: (_weaponId: string) => adapterOnFire?.(), // Prefix unused weaponId
          onActivateAbility: (abilityName: string) => {
            const abil = ship.abilities?.find(a => a.name === abilityName);
            if (abil) {
              adapterOnAbility?.(abil);
            }
          },
          // eslint-disable-next-line no-console
          onLaunchShip: (bayId: string) => console.log('Launch Ship from Bay:', bayId),
          onRetreat: adapterOnRetreat ?? noop,
        };
        return <TypedComponent {...props} />;
      }
      case 'CombatShip':
      default: {
        const TypedComponent = ShipComponent as React.FC<combatShipProps>;
        const combatShipData: combatShipProps['ship'] = {
          id: ship.id,
          name: ship.name,
          type: ship.class.toLowerCase() as combatShipProps['ship']['type'],
          tier: ship.stats.tier as combatShipProps['ship']['tier'],
          status: commonMappedProps.status as combatShipProps['ship']['status'],
          hull: commonMappedProps.hull,
          maxHull: commonMappedProps.maxHull,
          shield: commonMappedProps.shield,
          maxShield: commonMappedProps.maxShield,
          weapons: mapWeapons(ship, targetType) as combatShipProps['ship']['weapons'],
          specialAbilities: mapAbilities(
            ship,
            targetType
          ) as combatShipProps['ship']['specialAbilities'],
          alerts: ship.alerts ?? [], // Use actual alerts
        };
        const props: combatShipProps = {
          ship: combatShipData,
          quality: quality,
          onDeploy: onDeploy ?? noop,
          onRecall: onRecall ?? noop,
        };
        return <TypedComponent {...props} />;
      }
    }
  };

  return (
    <div className="ship-adapter-wrapper" data-quality={quality}>
      {renderAdaptedComponent()}

      {/* Adapter-specific UI example (Abilities toggle state) */}
      {ship.abilities && ship.abilities.length > 0 && (
        <div
          className="adapter-abilities"
          style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}
        >
          <h5 style={{ fontSize: '0.8em', color: '#aaa' }}>Adapter Ability State:</h5>
          {ship.abilities.map(ability => (
            <button
              key={ability.id}
              onClick={() => handleAbilityToggle(ability)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '2px 5px',
                fontSize: '0.8em',
                backgroundColor: activeAbilities[ability.id] ? '#334' : 'transparent',
                color: activeAbilities[ability.id] ? 'lime' : '#aaa',
              }}
            >
              {ability.name}: {activeAbilities[ability.id] ? 'Active' : 'Inactive'} (Toggle)
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
