/**
 * Tests for the refactored ExplorationManagerImpl
 * Verifies that circular dependencies, event handling, and functionality are working
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '../../../lib/events/EventBus';
import {
  ExplorationManagerImpl,
  IShip,
  IShipManager,
} from '../../../managers/exploration/ExplorationManagerImpl';
import { BaseEvent } from '../../../types/events/EventTypes';

// Create a mock ship manager to break the circular dependency
class MockShipManager implements IShipManager {
  private ships: Map<string, IShip> = new Map();

  constructor() {
    // Initialize with some test ships
    this.addShip({
      id: 'ship-1',
      name: 'Test Ship 1',
      type: 'recon',
      status: 'idle',
    });
    this.addShip({
      id: 'ship-2',
      name: 'Test Ship 2',
      type: 'scout',
      status: 'idle',
    });
  }

  private addShip(ship: IShip): void {
    this.ships.set(ship.id, ship);
  }

  getShipById(shipId: string): IShip | undefined {
    return this.ships.get(shipId);
  }

  updateShipStatus(shipId: string, status: string): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      ship.status = status;
    }
  }

  updateShipAssignment(shipId: string, systemId: string): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      ship.assignedTo = systemId;
    }
  }

  getAllShips(): IShip[] {
    return Array.from(this.ships.values());
  }

  getShipsByType(type: string): IShip[] {
    return this.getAllShips().filter(ship => ship.type === type);
  }

  getShipsByStatus(status: string): IShip[] {
    return this.getAllShips().filter(ship => ship.status === status);
  }
}

// Extend the real EventBus for testing with added features to track emitted events
class TestEventBus extends EventBus<BaseEvent> {
  public emittedEvents: BaseEvent[] = [];

  constructor() {
    super(100, false); // Use a small history size and disable performance tracking
  }

  // Override emit to track emitted events for assertions
  override emit(event: BaseEvent): void {
    this.emittedEvents.push(event);
    super.emit(event);
  }

  // Clear all emitted events for test isolation
  clearEmittedEvents(): void {
    this.emittedEvents = [];
  }
}

describe('ExplorationManagerImpl', () => {
  let eventBus: TestEventBus;
  let shipManager: MockShipManager;
  let explorationManager: ExplorationManagerImpl;

  beforeEach(async () => {
    // Reset mocks and create fresh instances for each test
    eventBus = new TestEventBus();
    shipManager = new MockShipManager();
    explorationManager = new ExplorationManagerImpl(eventBus, shipManager);

    // Initialize the manager
    await explorationManager.initialize();
  });

  it('should create and return a star system', () => {
    // Create a test system
    const system = explorationManager.createStarSystem({
      id: 'system-1',
      name: 'Alpha Centauri',
      status: 'unmapped',
    });

    // Check the system was created properly
    expect(system).toBeDefined();
    expect(system.id).toBe('system-1');
    expect(system.name).toBe('Alpha Centauri');
    expect(system.status).toBe('unmapped');
    expect(system.assignedShips).toEqual([]);

    // Verify that an event was emitted
    expect(eventBus.emittedEvents.length).toBe(1);
    expect(eventBus.emittedEvents[0].type).toMatch(/EXPLORATION_SYSTEM_CREATED/);
    expect(eventBus.emittedEvents[0].data?.system).toBeDefined();
  });

  it('should assign a ship to a system', () => {
    // Create a test system
    const system = explorationManager.createStarSystem({
      id: 'system-1',
      name: 'Alpha Centauri',
      status: 'unmapped',
    });

    // Clear the events from system creation
    eventBus.clearEmittedEvents();

    // Assign a ship to the system
    const result = explorationManager.assignShipToSystem('ship-1', 'system-1');

    // Check the assignment worked
    expect(result).toBe(true);

    // Verify the system was updated
    const updatedSystem = explorationManager.getSystemById('system-1');
    expect(updatedSystem?.assignedShips).toContain('ship-1');

    // Verify the ship was updated
    const ship = shipManager.getShipById('ship-1');
    expect(ship?.status).toBe('assigned');
    expect(ship?.assignedTo).toBe('system-1');

    // Verify that an event was emitted
    expect(eventBus.emittedEvents.length).toBe(1);
    expect(eventBus.emittedEvents[0].type).toMatch(/EXPLORATION_SHIP_ASSIGNED/);
    expect(eventBus.emittedEvents[0].data?.shipId).toBe('ship-1');
    expect(eventBus.emittedEvents[0].data?.systemId).toBe('system-1');
  });

  it('should search systems based on criteria', () => {
    // Create multiple test systems
    explorationManager.addStarSystem({
      id: 'system-1',
      name: 'Alpha Centauri',
      type: 'binary',
      resources: ['minerals', 'energy'],
      status: 'mapped',
    });

    explorationManager.addStarSystem({
      id: 'system-2',
      name: 'Proxima Centauri',
      type: 'single',
      resources: ['gas', 'energy'],
      status: 'unmapped',
    });

    explorationManager.addStarSystem({
      id: 'system-3',
      name: 'Tau Ceti',
      type: 'binary',
      resources: ['minerals'],
      status: 'scanning',
    });

    // Search by name
    const nameResults = explorationManager.searchSystems({ name: 'Centauri' });
    expect(nameResults.length).toBe(2);
    expect(nameResults.map(s => s.id)).toContain('system-1');
    expect(nameResults.map(s => s.id)).toContain('system-2');

    // Search by type
    const typeResults = explorationManager.searchSystems({ type: 'binary' });
    expect(typeResults.length).toBe(2);
    expect(typeResults.map(s => s.id)).toContain('system-1');
    expect(typeResults.map(s => s.id)).toContain('system-3');

    // Search by resources
    const resourceResults = explorationManager.searchSystems({ resources: ['minerals'] });
    expect(resourceResults.length).toBe(2);
    expect(resourceResults.map(s => s.id)).toContain('system-1');
    expect(resourceResults.map(s => s.id)).toContain('system-3');

    // Search by status
    const statusResults = explorationManager.searchSystems({ status: 'unmapped' });
    expect(statusResults.length).toBe(1);
    expect(statusResults[0].id).toBe('system-2');

    // Combined search
    const combinedResults = explorationManager.searchSystems({
      type: 'binary',
      resources: ['minerals'],
    });
    expect(combinedResults.length).toBe(2);
    expect(combinedResults.map(s => s.id)).toContain('system-1');
    expect(combinedResults.map(s => s.id)).toContain('system-3');
  });

  it('should update a system', () => {
    // Create a test system
    explorationManager.createStarSystem({
      id: 'system-1',
      name: 'Alpha Centauri',
      status: 'unmapped',
    });

    // Clear the events from system creation
    eventBus.clearEmittedEvents();

    // Update the system
    const updatedSystem = explorationManager.updateSystem('system-1', {
      status: 'mapped',
      resources: ['minerals', 'energy'],
    });

    // Check the update worked
    expect(updatedSystem).toBeDefined();
    expect(updatedSystem?.status).toBe('mapped');
    expect(updatedSystem?.resources).toEqual(['minerals', 'energy']);

    // Verify that an event was emitted
    expect(eventBus.emittedEvents.length).toBe(1);
    expect(eventBus.emittedEvents[0].type).toMatch(/EXPLORATION_SYSTEM_UPDATED/);
    expect(eventBus.emittedEvents[0].data?.system).toBeDefined();

    // Type-safe way to check the status
    const emittedSystem = updatedSystem
      ? {
          ...updatedSystem,
          status: updatedSystem.status,
        }
      : undefined;

    expect(emittedSystem?.status).toBe('mapped');
  });

  it('should unassign a ship from a system', () => {
    // Create a test system
    const system = explorationManager.createStarSystem({
      id: 'system-1',
      name: 'Alpha Centauri',
      status: 'unmapped',
    });

    // Assign a ship to the system first
    explorationManager.assignShipToSystem('ship-1', 'system-1');

    // Clear the events
    eventBus.clearEmittedEvents();

    // Unassign the ship
    const result = explorationManager.unassignShipFromSystem('ship-1', 'system-1');

    // Check the unassignment worked
    expect(result).toBe(true);

    // Verify the system was updated
    const updatedSystem = explorationManager.getSystemById('system-1');
    expect(updatedSystem?.assignedShips).not.toContain('ship-1');

    // Verify the ship was updated
    const ship = shipManager.getShipById('ship-1');
    expect(ship?.status).toBe('idle');
    expect(ship?.assignedTo).toBe('');

    // Verify that an event was emitted
    expect(eventBus.emittedEvents.length).toBe(1);
    expect(eventBus.emittedEvents[0].type).toMatch(/EXPLORATION_SHIP_UNASSIGNED/);
    expect(eventBus.emittedEvents[0].data?.shipId).toBe('ship-1');
    expect(eventBus.emittedEvents[0].data?.systemId).toBe('system-1');
  });
});
