import { shipClassConfigs } from "../../config/factions/factionConfig";
import { WeaponType } from "../../types/combat/CombatTypes";
import { ShipStats } from "../../types/factions/ShipTypes";
import { FactionId } from "../../types/factions/FactionTypes";
import { FactionShipStats, FactionShip } from "../../types/ships/FactionShipTypes";
import { Tier } from "../../types/core/GameTypes";
import { ShipStatus } from "../../components/ships/FactionShips/FactionShipBase";

// Base stats for different ship tiers
const tierBaseStats: Record<number, ShipStats> = {
  1: {
    health: 100,
    shields: 50,
    speed: 100,
    maneuverability: 80,
    cargo: 20,
  },
  2: {
    health: 200,
    shields: 100,
    speed: 80,
    maneuverability: 60,
    cargo: 40,
  },
  3: {
    health: 400,
    shields: 200,
    speed: 60,
    maneuverability: 40,
    cargo: 80,
  },
};

// Space Rats ship stats
export const spaceRatsShipStats: Record<string, Partial<FactionShip>> = {
  ratKing: {
    class: "ratKing",
    faction: "space-rats",
    stats: {
      health: 500,
      shields: 250,
      speed: 70,
      maneuverability: 50,
      cargo: 100,
    },
  },
  asteroidMarauder: {
    class: "asteroidMarauder",
    faction: "space-rats",
    stats: {
      ...tierBaseStats[1],
      speed: 120, // Faster than base
    },
  },
  // Add other Space Rats ships...
};

// Lost Nova ship stats
export const lostNovaShipStats: Record<string, Partial<FactionShip>> = {
  eclipseScythe: {
    class: "eclipseScythe",
    faction: "lost-nova",
    stats: {
      health: 450,
      shields: 300,
      speed: 90,
      maneuverability: 70,
      cargo: 60,
    },
  },
  nullsRevenge: {
    class: "nullsRevenge",
    faction: "lost-nova",
    stats: {
      ...tierBaseStats[2],
      shields: 150, // Better shields than base
    },
  },
  // Add other Lost Nova ships...
};

// Equator Horizon ship stats
export const equatorHorizonShipStats: Record<string, Partial<FactionShip>> = {
  celestialArbiter: {
    class: "celestialArbiter",
    faction: "equator-horizon",
    stats: {
      health: 600,
      shields: 400,
      speed: 80,
      maneuverability: 60,
      cargo: 120,
    },
  },
  etherealGalleon: {
    class: "etherealGalleon",
    faction: "equator-horizon",
    stats: {
      ...tierBaseStats[2],
      maneuverability: 80, // Better maneuverability than base
    },
  },
  // Add other Equator Horizon ships...
};

// Helper function to create a complete ship type
export function createShipType(
  id: string,
  name: string,
  faction: FactionId,
  baseStats: Partial<FactionShip>,
  weapons: WeaponType[],
): FactionShip {
  const stats = {
    ...tierBaseStats[1], // Default to tier 1 if not specified
    ...baseStats.stats,
  };

  return {
    id,
    name,
    faction,
    class: id,
    status: "ready" as ShipStatus,
    health: stats.health,
    maxHealth: stats.health,
    shield: stats.shields,
    maxShield: stats.shields,
    stats,
    tactics: "aggressive",
  };
}
