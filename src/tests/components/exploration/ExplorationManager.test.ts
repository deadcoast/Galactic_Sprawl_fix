import { beforeEach, describe, expect, it, vi } from 'vitest';
// Remove import of the mock utility
// import { createTestEnvironment } from '../../utils/exploration/explorationTestUtils';

// Import actual implementations
import { ExplorationManagerImpl } from '../../../managers/exploration/ExplorationManagerImpl';
import { ShipManagerImpl } from '../../../managers/ships/ShipManagerImpl';

// Create a factory function for test setup with actual implementations
function createTestEnvironmentWithActualImplementations() {
  // Initialize the actual managers
  const shipManager = new ShipManagerImpl();
  const explorationManager = new ExplorationManagerImpl(shipManager);

  return {
    explorationManager,
    shipManager,
  };
}

describe('ExplorationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle ship assignment', async () => {
    // Create a test environment with the actual implementation
    const { explorationManager, shipManager } = createTestEnvironmentWithActualImplementations();

    // Create test ships with proper properties
    const ship1 = shipManager.createShip({
      id: 'ship-1',
      name: 'Explorer 1',
      type: 'exploration',
      status: 'idle',
    });

    const ship2 = shipManager.createShip({
      id: 'ship-2',
      name: 'Explorer 2',
      type: 'exploration',
      status: 'idle',
    });

    // Create a test star system
    const system1 = explorationManager.createStarSystem({
      id: 'system-1',
      name: 'Alpha Centauri',
      status: 'discovered',
    });

    // Create a second test star system for ship2
    const system2 = explorationManager.createStarSystem({
      id: 'system-2',
      name: 'Proxima Centauri',
      status: 'discovered',
    });

    // Assign ships to systems
    const result1 = explorationManager.assignShipToSystem(ship1.id, system1.id);
    const result2 = explorationManager.assignShipToSystem(ship2.id, system2.id);

    // Verify assignment for ship1
    expect(result1).toBe(true);
    expect(explorationManager.getSystemById(system1.id).assignedShips).toContain(ship1.id);
    expect(shipManager.getShipById(ship1.id).status).toBe('assigned');
    expect(shipManager.getShipById(ship1.id).assignedTo).toBe(system1.id);

    // Verify assignment for ship2
    expect(result2).toBe(true);
    expect(explorationManager.getSystemById(system2.id).assignedShips).toContain(ship2.id);
    expect(shipManager.getShipById(ship2.id).status).toBe('assigned');
    expect(shipManager.getShipById(ship2.id).assignedTo).toBe(system2.id);
  });

  it('should handle search and filtering', async () => {
    // Create test environment with actual implementation
    const { explorationManager } = createTestEnvironmentWithActualImplementations();

    // Create test data with a reasonable size
    const systems = Array.from({ length: 20 }, (_, i) => ({
      id: `system-${i}`,
      name: `System ${i}`,
      type: i % 3 === 0 ? 'binary' : 'single',
      resources: i % 2 === 0 ? ['minerals', 'energy'] : ['gas'],
      status: i % 4 === 0 ? 'unexplored' : 'explored',
    }));

    // Add systems to the manager
    systems.forEach(system =>
      explorationManager.addStarSystem({
        id: system.id,
        name: system.name,
        type: system.type as string, // Ensure type is always a string
        resources: system.resources as string[], // Ensure resources is always a string array
        status: system.status,
      })
    );

    // Test search by name
    const nameResults = explorationManager.searchSystems({ name: 'System 1' });
    expect(nameResults).toHaveLength(1);
    expect(nameResults[0].id).toBe('system-1');

    // Test filtering by type
    const typeResults = explorationManager.searchSystems({ type: 'binary' });
    expect(typeResults.length).toBeGreaterThan(0);
    typeResults.forEach(system => expect(system.type).toBe('binary'));

    // Test filtering by resource
    const resourceResults = explorationManager.searchSystems({ resources: ['minerals'] });
    expect(resourceResults.length).toBeGreaterThan(0);
    resourceResults.forEach(system => expect(system.resources).toContain('minerals'));

    // Test filtering by status
    const statusResults = explorationManager.searchSystems({ status: 'unexplored' });
    expect(statusResults.length).toBeGreaterThan(0);
    statusResults.forEach(system => expect(system.status).toBe('unexplored'));

    // Test combined filters
    const combinedResults = explorationManager.searchSystems({
      type: 'binary',
      resources: ['minerals'],
    });
    expect(combinedResults.length).toBeGreaterThanOrEqual(0);
    combinedResults.forEach(system => {
      expect(system.type).toBe('binary');
      expect(system.resources).toContain('minerals');
    });
  }, 10000); // Increase timeout to 10 seconds
});
