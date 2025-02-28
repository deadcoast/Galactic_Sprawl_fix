export * from '../../effects/types_effects/shipEffects';
export * from './equatorHorizonShips';
export * from './lostNovaShips';
export * from './spaceRatsShips';

import { FactionShipClass, FactionShipStats } from '../../types/ships/FactionShipTypes';
import { EQUATOR_HORIZON_SHIPS } from './equatorHorizonShips';
import { LOST_NOVA_SHIPS } from './lostNovaShips';
import { SPACE_RATS_SHIPS } from './spaceRatsShips';

export const SHIP_STATS: Record<FactionShipClass, FactionShipStats> = {
  ...SPACE_RATS_SHIPS,
  ...LOST_NOVA_SHIPS,
  ...EQUATOR_HORIZON_SHIPS,
} as const;
