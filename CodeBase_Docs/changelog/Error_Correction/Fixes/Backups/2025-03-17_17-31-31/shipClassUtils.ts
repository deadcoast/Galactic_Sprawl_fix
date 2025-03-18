import { FactionShipClass } from '../../types/ships/FactionShipTypes';
import { FactionId } from '../../types/ships/FactionTypes';

/**
 * Maps a faction ID to its default ship class
 */
export function getFactionDefaultShipClass(factionId: FactionId): FactionShipClass {
  switch (factionId) {
    case 'space-rats':
      return 'ratKing';
    case 'lost-nova':
      return 'eclipseScythe';
    case 'equator-horizon':
      return 'celestialArbiter';
    default:
      throw new Error(`Unknown faction ID: ${factionId}`);
  }
}
