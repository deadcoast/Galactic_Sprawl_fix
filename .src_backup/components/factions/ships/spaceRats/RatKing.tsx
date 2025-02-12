import { WarShipCombat } from '../../../../playerShips/WarShipCombat';
import { ShipBase } from '../../components/ShipBase';
import { WeaponMount } from '../../components/WeaponMount';
import { WeaponType, WeaponCategory } from '../../../types/CombatTypes';
import { ShipStats } from '../../../types/ShipTypes';

type ShipStatus = 'idle' | 'engaging' | 'patrolling' | 'retreating' | 'disabled' | 'damaged';
type WarShipType = 'spitflare' | 'starSchooner' | 'orionFrigate' | 'harbringerGalleon' | 'midwayCarrier';
type WarShipStatus = 'idle' | 'engaging' | 'retreating' | 'damaged';
type WarShipWeaponType = 'machineGun' | 'gaussCannon' | 'railGun' | 'rockets';

interface RatKingProps {
  id: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponType[];
  stats: ShipStats;
  onFire: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat: () => void;
  onSpecialAbility?: (abilityName: string) => void;
}

export function RatKing({
  id,
  status,
  health,
  maxHealth,
  shield,
  maxShield,
  weapons,
  stats,
  onFire,
  onEngage,
  onRetreat,
  onSpecialAbility
}: RatKingProps) {
  // Convert status for WarShipCombat compatibility
  const getWarShipStatus = (status: ShipStatus): WarShipStatus => {
    switch (status) {
      case 'patrolling':
      case 'disabled':
        return 'idle';
      case 'engaging':
      case 'retreating':
      case 'damaged':
        return status;
      default:
        return 'idle';
    }
  };

  // Convert weapon type for WarShipCombat compatibility
  const getWarShipWeaponType = (category: WeaponCategory): WarShipWeaponType => {
    return category === 'mgss' ? 'machineGun' : category;
  };

  // For compatibility with WarShipCombat
  const warShipProps = {
    id,
    name: "The Rat King",
    type: 'spitflare' as WarShipType,
    tier: 3 as const,
    status: getWarShipStatus(status),
    hull: health,
    maxHull: maxHealth,
    shield,
    maxShield,
    weapons: weapons.map(w => ({
      id: w.id,
      name: w.category,
      type: getWarShipWeaponType(w.category),
      damage: w.stats.damage,
      range: w.stats.range,
      cooldown: 1 / w.stats.rateOfFire,
      status: 'ready' as const
    })),
    specialAbilities: [
      {
        name: "Swarm Command",
        description: "Boost nearby Space Rat ships' attack speed",
        cooldown: 45,
        active: false
      },
      {
        name: "Scavenger's Fury",
        description: "Increased damage against damaged targets",
        cooldown: 30,
        active: false
      }
    ]
  };

  // Filter status for ShipBase compatibility
  const baseStatus = status === 'damaged' ? 'disabled' : status;

  return (
    <div className="relative">
      {/* New ShipBase Component */}
      <ShipBase
        id={id}
        name="The Rat King"
        faction="spaceRats"
        status={baseStatus}
        health={health}
        maxHealth={maxHealth}
        shield={shield}
        maxShield={maxShield}
        stats={stats}
        specialAbility={{
          name: "Pirate's Fury",
          cooldown: 30,
          duration: 10,
          effect: {
            type: 'damage',
            magnitude: 2
          }
        }}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={() => onSpecialAbility?.("Pirate's Fury")}
      />

      {/* Weapon Mounts */}
      <div className="absolute inset-0 pointer-events-none">
        {weapons.map((weapon, index) => (
          <WeaponMount
            key={weapon.id}
            weapon={weapon}
            position={{
              x: 50 + (index * 30),
              y: 50
            }}
            rotation={0}
            isFiring={status === 'engaging'}
            onFire={() => onFire?.(weapon.id)}
            className="absolute"
          />
        ))}
      </div>

      {/* Legacy WarShipCombat for compatibility */}
      <div className="hidden">
        <WarShipCombat
          ship={warShipProps}
          onFireWeapon={onFire}
          onActivateAbility={(name) => onSpecialAbility?.(name)}
          onRetreat={onRetreat}
        />
      </div>
    </div>
  );
} 