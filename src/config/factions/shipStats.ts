import { shipClassConfigs } from "../../config/factions/factionConfig";
import { WeaponType } from "../../types/combat/CombatTypes";
import { ShipStats, ShipType } from "../../types/ships/CommonShipTypes";

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
export const spaceRatsShipStats: Record<string, Partial<ShipType>> = {
  ratKing: {
    tier: 3,
    stats: {
      health: 500,
      shields: 250,
      speed: 70,
      maneuverability: 50,
      cargo: 100,
    },
  },
  asteroidMarauder: {
    tier: 1,
    stats: {
      ...tierBaseStats[1],
      speed: 120, // Faster than base
    },
  },
  // Add other Space Rats ships...
};

// Lost Nova ship stats
export const lostNovaShipStats: Record<string, Partial<ShipType>> = {
  eclipseScythe: {
    tier: 3,
    stats: {
      health: 450,
      shields: 300,
      speed: 90,
      maneuverability: 70,
      cargo: 60,
    },
  },
  nullsRevenge: {
    tier: 2,
    stats: {
      ...tierBaseStats[2],
      shields: 150, // Better shields than base
    },
  },
  // Add other Lost Nova ships...
};

// Equator Horizon ship stats
export const equatorHorizonShipStats: Record<string, Partial<ShipType>> = {
  celestialArbiter: {
    tier: 3,
    stats: {
      health: 600,
      shields: 400,
      speed: 80,
      maneuverability: 60,
      cargo: 120,
    },
  },
  etherealGalleon: {
    tier: 2,
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
  faction: keyof typeof shipClassConfigs,
  baseStats: Partial<ShipType>,
  weapons: WeaponType[],
): ShipType {
  return {
    id,
    name,
    faction,
    class: id,
    tier: baseStats.tier || 1,
    stats: {
      ...tierBaseStats[baseStats.tier || 1],
      ...baseStats.stats,
    },
    loadout: {
      weapons,
      upgrades: [],
    },
    visualAsset: `ships/${faction}/${id}`,
  };
}
