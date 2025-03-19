import { CommonShip } from '../../../../types/ships/CommonShipTypes';
import { WeaponCategory } from '../../../../types/weapons/WeaponTypes';
import { WarShip } from '../variants/warships/WarShip';

interface ShipAdapterProps {
  ship: CommonShip;
  quality: 'high' | 'medium' | 'low';
  onDeploy: () => void;
  onRecall: () => void;
}

const shipTypeMap = {
  spitflare: 'spitflare',
  'star-schooner': 'starSchooner',
  'orion-frigate': 'orionFrigate',
  'harbringer-galleon': 'harbringerGalleon',
  'midway-carrier': 'midwayCarrier',
  'mother-earth-revenge': 'motherEarthRevenge',
} as const;

type ShipTypeKey = keyof typeof shipTypeMap;
type WarShipStatus = 'idle' | 'patrolling' | 'engaging' | 'returning' | 'damaged';

export function ShipAdapter({ ship, quality, onDeploy, onRecall }: ShipAdapterProps) {
  // Map CommonShip status to WarShip status
  const mapStatus = (status: CommonShip['status']): WarShipStatus => {
    switch (status) {
      case 'ready':
        return 'idle';
      case 'engaging':
        return 'engaging';
      case 'patrolling':
        return 'patrolling';
      case 'retreating':
        return 'returning';
      default:
        return 'damaged';
    }
  };

  // Convert CommonShip to WarShip's expected format
  const adaptedShip = {
    id: ship.id,
    name: ship.name,
    type: shipTypeMap[ship.name.toLowerCase() as ShipTypeKey] || 'spitflare',
    tier: 1 as const,
    status: mapStatus(ship.status),
    hull: 100, // Default values since CommonShipStats doesn't have direct hull/shield
    maxHull: 100,
    shield: ship.stats.defense.shield,
    maxShield: ship.stats.defense.shield,
    weapons: ship.abilities.map(ability => ({
      id: crypto.randomUUID(),
      name: ability.name,
      type: 'machineGun' as WeaponCategory,
      damage: 10,
      range: 100,
      cooldown: ability.cooldown,
      status: 'ready' as const,
    })),
  };

  return <WarShip ship={adaptedShip} quality={quality} onDeploy={onDeploy} onRecall={onRecall} />;
}
