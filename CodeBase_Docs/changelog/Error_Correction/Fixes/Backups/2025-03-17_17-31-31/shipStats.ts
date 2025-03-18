import { FactionShipClass, FactionShipStats } from '../../types/ships/FactionShipTypes';
import { FactionId } from '../../types/ships/FactionTypes';
import { EQUATOR_HORIZON_SHIPS } from './equatorHorizonShips';
import { LOST_NOVA_SHIPS } from './lostNovaShips';
import { SPACE_RATS_SHIPS } from './spaceRatsShips';

// Base template for unimplemented ships
const BASE_SHIP_TEMPLATE: FactionShipStats = {
  health: 1000,
  maxHealth: 1000,
  shield: 500,
  maxShield: 500,
  energy: 500,
  maxEnergy: 500,
  speed: 100,
  turnRate: 2,
  cargo: 200,
  tier: 1,
  faction: 'space-rats' as FactionId,
  weapons: [],
  defense: {
    armor: 300,
    shield: 500,
    evasion: 0.3,
    regeneration: 5,
  },
  mobility: {
    speed: 100,
    turnRate: 2,
    acceleration: 50,
  },
  abilities: [],
};

// Export aggregated ship stats
export const SHIP_STATS: Record<FactionShipClass, FactionShipStats> = {
  ...SPACE_RATS_SHIPS,
  ...LOST_NOVA_SHIPS,
  ...EQUATOR_HORIZON_SHIPS,
} as const;

export function getShipStats(shipClass: FactionShipClass): FactionShipStats {
  const stats = SHIP_STATS[shipClass];
  if (!stats) {
    // Return base template for unimplemented ships
    return {
      ...BASE_SHIP_TEMPLATE,
      faction: shipClass.includes('lost-nova')
        ? 'lost-nova'
        : shipClass.includes('equator-horizon')
          ? 'equator-horizon'
          : ('space-rats' as FactionId),
    };
  }
  return stats;
}
