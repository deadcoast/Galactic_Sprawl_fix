import { vi } from 'vitest';
import { FlowNode, FlowNodeType } from '../../managers/resource/ResourceFlowManager';
import { ResourceType } from '../../types/resources/ResourceTypes';
import {
  explorationTasks,
  fleetFormations,
  reconShips,
  sectors,
} from '../fixtures/explorationFixtures';
import { miningHubs, miningNodes, miningOperations, miningShips } from '../fixtures/miningFixtures';
import { flowConnections, flowNodes, resourceStates } from '../fixtures/resourceFixtures';

/**
 * Creates a customized resource state based on the standard state
 * @param resourceType The type of resource
 * @param overrides Properties to override in the standard state
 * @returns A customized resource state
 */
export function createResourceState(
  resourceType: ResourceType,
  overrides: Partial<typeof resourceStates.standard> = {}
) {
  // Apply resource-specific defaults based on type
  const typeDefaults: Record<ResourceType, Partial<typeof resourceStates.standard>> = {
    minerals: { production: 10, consumption: 5, max: 1000, current: 100, min: 0 },
    energy: { production: 20, consumption: 15, max: 2000, current: 200, min: 0 },
    population: { production: 1, consumption: 0.5, max: 100, current: 10, min: 0 },
    research: { production: 5, consumption: 0, max: 500, current: 50, min: 0 },
    plasma: { production: 3, consumption: 2, max: 300, current: 30, min: 0 },
    gas: { production: 8, consumption: 4, max: 800, current: 80, min: 0 },
    exotic: { production: 1, consumption: 0.1, max: 200, current: 20, min: 0 },
  };

  return {
    ...resourceStates.standard,
    ...typeDefaults[resourceType],
    ...overrides,
  };
}

/**
 * Creates a customized flow node based on a template
 * @param type The type of flow node
 * @param overrides Properties to override in the template
 * @returns A customized flow node
 */
export function createFlowNode(
  type: FlowNodeType,
  overrides: Partial<FlowNode> = {}
): Partial<FlowNode> {
  const templates: Record<FlowNodeType, Partial<FlowNode>> = {
    producer: flowNodes.powerPlant,
    consumer: flowNodes.factory,
    storage: flowNodes.storage,
    converter: flowNodes.converter,
  };

  return {
    ...templates[type],
    id: `${type}-${Math.random().toString(36).substring(2, 9)}`,
    ...overrides,
  };
}

/**
 * Creates a mock resource manager with pre-configured states and nodes
 * @returns A mock resource manager
 */
export function createMockResourceManager() {
  return {
    getResourceState: vi.fn((_type: ResourceType) => resourceStates.standard),
    updateResourceState: vi.fn(),
    registerNode: vi.fn().mockReturnValue(true),
    unregisterNode: vi.fn().mockReturnValue(true),
    registerConnection: vi.fn().mockReturnValue(true),
    unregisterConnection: vi.fn().mockReturnValue(true),
    optimizeFlows: vi.fn().mockReturnValue({
      transfers: [],
      updatedConnections: [],
      bottlenecks: [],
      underutilized: [],
    }),
    getNode: vi.fn((id: string) => {
      if (id === 'powerPlant1') return flowNodes.powerPlant;
      if (id === 'factory1') return flowNodes.factory;
      if (id === 'storage1') return flowNodes.storage;
      if (id === 'converter1') return flowNodes.converter;
      return undefined;
    }),
    getNodes: vi.fn().mockReturnValue(Object.values(flowNodes)),
    getConnections: vi.fn().mockReturnValue(flowConnections),
    cleanup: vi.fn(),
  };
}

/**
 * Creates a mock mining manager with pre-configured ships and nodes
 * @returns A mock mining manager
 */
export function createMockMiningManager() {
  return {
    getShips: vi.fn().mockReturnValue(miningShips),
    getNodes: vi.fn().mockReturnValue(miningNodes),
    getHubs: vi.fn().mockReturnValue(miningHubs),
    getOperations: vi.fn().mockReturnValue(miningOperations),
    assignShip: vi.fn().mockReturnValue(true),
    unassignShip: vi.fn().mockReturnValue(true),
    startOperation: vi.fn().mockReturnValue({
      id: 'new-operation',
      shipId: 'miningShip1',
      nodeId: 'miningNode1',
      resourceType: 'minerals',
      startTime: Date.now(),
      targetAmount: 500,
      currentAmount: 0,
      efficiency: 0.8,
      status: 'in_progress',
    }),
    stopOperation: vi.fn().mockReturnValue(true),
    updateShipStatus: vi.fn(),
    cleanup: vi.fn(),
  };
}

/**
 * Creates a mock exploration manager with pre-configured ships and sectors
 * @returns A mock exploration manager
 */
export function createMockExplorationManager() {
  return {
    getShips: vi.fn().mockReturnValue(reconShips),
    getSectors: vi.fn().mockReturnValue(sectors),
    getFormations: vi.fn().mockReturnValue(fleetFormations),
    getTasks: vi.fn().mockReturnValue(explorationTasks),
    createFormation: vi.fn().mockImplementation((name, type, shipIds, leaderId) => ({
      id: `formation-${Math.random().toString(36).substring(2, 9)}`,
      name,
      type,
      shipIds,
      leaderId,
      position: { x: 0, y: 0 },
      scanBonus: 0.1,
      detectionBonus: 0.1,
      stealthBonus: 0.1,
      createdAt: Date.now(),
    })),
    disbandFormation: vi.fn().mockReturnValue(true),
    addShipToFormation: vi.fn().mockReturnValue(true),
    removeShipFromFormation: vi.fn().mockReturnValue(true),
    startCoordinatedScan: vi.fn().mockReturnValue({
      id: `task-${Math.random().toString(36).substring(2, 9)}`,
      type: 'explore',
      sectorId: '',
      shipIds: [],
      priority: 1,
      estimatedDuration: 3600000,
      status: 'pending',
    }),
    shareTask: vi.fn().mockReturnValue(true),
    autoDistributeTasks: vi.fn().mockReturnValue(true),
    cleanup: vi.fn(),
  };
}

/**
 * Creates a customized recon ship based on a template
 * @param templateIndex Index of the template ship (0-2)
 * @param overrides Properties to override in the template
 * @returns A customized recon ship
 */
export function createReconShip(templateIndex = 0, overrides = {}) {
  const templates = reconShips;
  const template = templates[templateIndex % templates.length];

  return {
    ...template,
    id: `ship-${Math.random().toString(36).substring(2, 9)}`,
    ...overrides,
  };
}

/**
 * Creates a customized mining ship based on a template
 * @param templateIndex Index of the template ship (0-2)
 * @param overrides Properties to override in the template
 * @returns A customized mining ship
 */
export function createMiningShip(templateIndex = 0, overrides = {}) {
  const templates = miningShips;
  const template = templates[templateIndex % templates.length];

  return {
    ...template,
    id: `mining-ship-${Math.random().toString(36).substring(2, 9)}`,
    ...overrides,
  };
}

/**
 * Creates a customized sector based on a template
 * @param templateIndex Index of the template sector (0-3)
 * @param overrides Properties to override in the template
 * @returns A customized sector
 */
export function createSector(templateIndex = 0, overrides = {}) {
  const templates = sectors;
  const template = templates[templateIndex % templates.length];

  return {
    ...template,
    id: `sector-${Math.random().toString(36).substring(2, 9)}`,
    ...overrides,
  };
}

/**
 * Creates a customized mining node based on a template
 * @param templateIndex Index of the template node (0-2)
 * @param overrides Properties to override in the template
 * @returns A customized mining node
 */
export function createMiningNode(templateIndex = 0, overrides = {}) {
  const templates = miningNodes;
  const template = templates[templateIndex % templates.length];

  return {
    ...template,
    id: `mining-node-${Math.random().toString(36).substring(2, 9)}`,
    ...overrides,
  };
}

/**
 * Creates a batch of test items based on a factory function
 * @param factory Factory function to create items
 * @param count Number of items to create
 * @param baseOverrides Base overrides to apply to all items
 * @param indexOverrides Function to generate overrides based on index
 * @returns Array of created items
 */
export function createBatch<T, O extends Record<string, unknown>>(
  factory: (index: number, overrides: O) => T,
  count: number,
  baseOverrides: O = {} as O,
  indexOverrides: (index: number) => Partial<O> = () => ({}) as Partial<O>
): T[] {
  return Array.from({ length: count }, (_, i) =>
    factory(i % 3, { ...baseOverrides, ...indexOverrides(i) } as O)
  );
}
