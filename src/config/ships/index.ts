export * from "./shipEffects";
export * from "./spaceRatsShips";
export * from "./lostNovaShips";
export * from "./equatorHorizonShips";

import { FactionShipClass, FactionShipStats } from "../../types/ships/FactionShipTypes";
import { SPACE_RATS_SHIPS } from "./spaceRatsShips";
import { LOST_NOVA_SHIPS } from "./lostNovaShips";
import { EQUATOR_HORIZON_SHIPS } from "./equatorHorizonShips";

export const SHIP_STATS: Record<FactionShipClass, FactionShipStats> = {
  ...SPACE_RATS_SHIPS,
  ...LOST_NOVA_SHIPS,
  ...EQUATOR_HORIZON_SHIPS,
} as const; 