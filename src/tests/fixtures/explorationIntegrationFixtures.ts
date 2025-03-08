/**
 * Test fixtures for exploration integration testing
 */

import { Anomaly, Sector } from '../../managers/exploration/ExplorationManager';
import { Ship } from '../../managers/exploration/ReconShipManagerImpl';

/**
 * Create a test sector
 * @param overrides Optional properties to override defaults
 */
export const createTestSector = (
  overrides?: Partial<Sector>
): Omit<Sector, 'id' | 'anomalies' | 'discoveredAt'> => {
  return {
    name: 'Test Sector Alpha',
    status: 'unmapped' as const,
    coordinates: { x: 100, y: 200 },
    resourcePotential: 0.75,
    habitabilityScore: 0.4,
    ...overrides,
  };
};

/**
 * Create a set of test sectors
 * @param count Number of sectors to create
 */
export const createTestSectors = (
  count: number
): Omit<Sector, 'id' | 'anomalies' | 'discoveredAt'>[] => {
  return Array.from({ length: count }, (_, index) => ({
    name: `Test Sector ${index + 1}`,
    status: (['unmapped', 'mapped', 'scanning', 'analyzed'] as const)[index % 4],
    coordinates: { x: 100 + index * 50, y: 200 + index * 30 },
    resourcePotential: Math.round((0.3 + Math.random() * 0.7) * 100) / 100,
    habitabilityScore: Math.round((0.1 + Math.random() * 0.8) * 100) / 100,
    resources:
      index % 2 === 0
        ? [
            { type: 'minerals', amount: 100 + index * 20, quality: 0.7 },
            { type: 'gas', amount: 50 + index * 10, quality: 0.5 },
          ]
        : undefined,
  }));
};

/**
 * Create a test anomaly
 * @param sectorId The sector ID this anomaly belongs to
 * @param overrides Optional properties to override defaults
 */
export const createTestAnomaly = (
  sectorId: string,
  overrides?: Partial<Anomaly>
): Omit<Anomaly, 'id'> => {
  return {
    type: 'spatial',
    severity: 'medium' as const,
    description: 'Test anomaly for integration testing',
    position: { x: 110, y: 220 },
    discoveredAt: Date.now(),
    sectorId,
    ...overrides,
  };
};

/**
 * Create a set of test anomalies
 * @param sectorId The sector ID these anomalies belong to
 * @param count Number of anomalies to create
 */
export const createTestAnomalies = (sectorId: string, count: number): Omit<Anomaly, 'id'>[] => {
  const anomalyTypes = ['spatial', 'temporal', 'energy', 'biological', 'technological'];
  const severities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

  return Array.from({ length: count }, (_, index) => ({
    type: anomalyTypes[index % anomalyTypes.length],
    severity: severities[index % severities.length],
    description: `Test anomaly ${index + 1} in sector ${sectorId}`,
    position: { x: 110 + index * 5, y: 220 + index * 5 },
    discoveredAt: Date.now() - index * 60000, // Each one discovered 1 minute apart
    sectorId,
    data: {
      intensity: Math.round(Math.random() * 100),
      stabilityFactor: Math.round(Math.random() * 100) / 100,
      frequency: Math.round(Math.random() * 1000) / 10,
    },
  }));
};

/**
 * Create a test ship
 * @param overrides Optional properties to override defaults
 */
export const createTestShip = (overrides?: Partial<Ship>): Omit<Ship, 'id'> => {
  return {
    name: 'Test Explorer',
    type: 'exploration',
    status: 'idle',
    ...overrides,
  };
};

/**
 * Create a set of test ships
 * @param count Number of ships to create
 */
export const createTestShips = (count: number): Omit<Ship, 'id'>[] => {
  const statuses: ('idle' | 'scanning' | 'returning')[] = ['idle', 'scanning', 'returning'];

  return Array.from({ length: count }, (_, index) => ({
    name: `Test Explorer ${index + 1}`,
    type: 'exploration',
    status: statuses[index % statuses.length],
    assignedTo: index % 3 === 0 ? `sector-${index}` : undefined,
  }));
};

/**
 * Create test resource data
 */
export const createTestResourceData = () => {
  const resourceTypes = ['minerals', 'gas', 'energy', 'organic', 'exotic'];

  return resourceTypes.map((type, index) => ({
    type,
    amount: 100 + index * 50,
    quality: Math.round((0.5 + index * 0.1) * 100) / 100,
  }));
};

/**
 * Wait for the next update cycle
 * Useful for allowing async state updates to complete in tests
 */
export const waitForNextUpdateCycle = async () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};
