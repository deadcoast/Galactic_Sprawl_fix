import { Ship, ShipCategory, ShipStatus } from '../../../../types/ships/ShipTypes';
import { SelectedShipDetailsData } from './SelectedShipDetails';
import { ShipCardData } from './ShipCard';

// Define a minimal officer type if not already defined globally
// Assuming this structure based on the mapping logic
interface OfficerSummary {
  id: string;
  // Add other minimal fields if needed by any consumer,
  // but keep it minimal for this purpose.
}

/**
 * Maps a full Ship object to the simplified SelectedShipDetailsData structure.
 * @param ship - The full Ship object or null.
 * @returns SelectedShipDetailsData object or null.
 */
export const mapShipToSelectedShipData = (ship: Ship | null): SelectedShipDetailsData | null => {
  if (!ship) {
    return null;
  }

  // Safely map officers if they exist and are an array
  // Note: If OfficerSummary becomes more complex, adjust the mapping.
  const assignedOfficersData = ('assignedOfficers' in ship && Array.isArray(ship.assignedOfficers))
    ? ship.assignedOfficers.map((officer: OfficerSummary) => ({ id: officer.id }))
    : [];

  return {
    id: ship.id,
    name: ship.name,
    status: ship.status,
    category: ship.category,
    cargo: {
      capacity: ship.cargo?.capacity ?? 0,
      resources: ship.cargo?.resources ?? new Map(),
    },
    assignedOfficers: assignedOfficersData,
    stats: {
      health: ship.stats?.health ?? 0,
      maxHealth: ship.stats?.maxHealth ?? 100, // Assuming 100 as a default max health if undefined
    },
  };
};

// Map Ship to ShipCardData
export const mapShipToShipCardData = (ship: Ship): ShipCardData => {
  // Basic check for essential properties using optional chaining
  if (!ship?.id || !ship?.status || !ship?.category) {
    // Handle cases where essential data might be missing, e.g., return a default or throw an error
    // For now, let's return a partial object, assuming downstream components can handle it
    // Or preferably, ensure ship data is always valid upstream
    return {
      id: ship?.id ?? 'unknown',
      name: ship?.name ?? 'Unknown Ship',
      status: ship?.status ?? ShipStatus.IDLE, // Default status using enum
      category: ship?.category ?? ShipCategory.combat, // Default category using enum
      stats: null, // Indicate stats are missing
    };
  }

  return {
    id: ship.id,
    name: ship.name ?? null,
    status: ship.status,
    category: ship.category,
    // Safely access nested stats, providing defaults or null if necessary
    stats: ship.stats
      ? {
          maxHealth: ship.stats.maxHealth,
          health: ship.stats.health,
          maxShield: ship.stats.maxShield,
          shield: ship.stats.shield,
          speed: ship.stats.speed,
          defense: ship.stats.defense
            ? { armor: ship.stats.defense.armor }
            : undefined, 
        }
      : null, // Handle potentially missing stats object
  };
};
