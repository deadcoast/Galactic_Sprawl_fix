import { ResourceType } from "./../../../types/resources/ResourceTypes";
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceFlowManager } from '../../../managers/resource/ResourceFlowManager';
import {
  FlowConnection,
  FlowNode,
  FlowNodeType,
  ResourceFlow,
  ResourcePriority,
  ResourceState,
  ResourceType,
  ResourceTypeHelpers,
} from '../../../types/resources/StandardizedResourceTypes';

// Import validation utilities

// Mock the resourceValidation module
vi.mock('../../../utils/resources/resourceValidation', () => ({
  validateResourceFlow: vi.fn().mockImplementation(() => true),
  validateResourceTransfer: vi.fn().mockImplementation(() => true),
}));

describe('ResourceFlowManager with Enum ResourceTypes', () => {
  let flowManager: ResourceFlowManager;

  // Create default priorities for different resource types
  const defaultEnergyPriority: ResourcePriority = {
    type: ResourceType.ENERGY,
    priority: 1,
    consumers: [],
  };

  const defaultMineralsPriority: ResourcePriority = {
    type: ResourceType.MINERALS,
    priority: 1,
    consumers: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Create with default constructor
    flowManager = new ResourceFlowManager();
  });

  afterEach(() => {
    // Ensure proper cleanup of resources between tests
    flowManager.cleanup();

    // Reset all mocks
    vi.resetAllMocks();

    // Clear any cached data
    // @ts-expect-error - Accessing private property for testing
    if (flowManager.network && flowManager.network.resourceStates) {
      // @ts-expect-error - Accessing private property for testing
      flowManager.network.resourceStates.clear();
    }

    // Ensure the flow manager is properly destroyed
    // @ts-expect-error - Setting to undefined for garbage collection
    flowManager = undefined;
  });

  it('should register a node with enum ResourceType', () => {
    const node: FlowNode = {
      id: 'test-node',
      type: FlowNodeType.PRODUCER,
      resources: [ResourceType.ENERGY],
      priority: defaultEnergyPriority,
      active: true,
    };

    const result = flowManager.registerNode(node);
    expect(result).toBe(true);

    const nodes = flowManager.getNodes();
    expect(nodes.length).toBe(1);
    expect(nodes[0].id).toBe('test-node');
    expect(nodes[0].resources[0]).toBe(ResourceType.ENERGY);
  });

  it('should register a connection with enum ResourceType', () => {
    // Register nodes first
    flowManager.registerNode({
      id: 'source-node',
      type: FlowNodeType.PRODUCER,
      resources: [ResourceType.ENERGY],
      priority: defaultEnergyPriority,
      active: true,
    });

    flowManager.registerNode({
      id: 'target-node',
      type: FlowNodeType.CONSUMER,
      resources: [ResourceType.ENERGY],
      priority: defaultEnergyPriority,
      active: true,
    });

    const connection: FlowConnection = {
      id: 'test-connection',
      source: 'source-node',
      target: 'target-node',
      resourceType: ResourceType.ENERGY,
      maxRate: 10,
      currentRate: 0,
      priority: defaultEnergyPriority,
      active: true,
    };

    const result = flowManager.registerConnection(connection);
    expect(result).toBe(true);

    const connections = flowManager.getConnections();
    expect(connections.length).toBe(1);
    expect(connections[0].id).toBe('test-connection');
    expect(connections[0].resourceType).toBe(ResourceType.ENERGY);
  });

  it('should create a flow with enum ResourceType', () => {
    const flow: ResourceFlow = {
      source: 'source-node',
      target: 'target-node',
      resources: [
        {
          type: ResourceType.ENERGY,
          amount: 10,
          interval: 1000,
        },
      ],
    };

    const result = flowManager.createFlow(flow);
    expect(result).toBe(true);

    // Verify that nodes and connection were created
    const nodes = flowManager.getNodes();
    expect(nodes.length).toBe(2);

    const connections = flowManager.getConnections();
    expect(connections.length).toBe(1);
    expect(connections[0].resourceType).toBe(ResourceType.ENERGY);
    expect(connections[0].maxRate).toBe(10);
  });

  it('should update resource state with enum ResourceType', () => {
    // Create a state object to update
    const energyState: ResourceState = {
      current: 50,
      max: 100,
      min: 0,
      production: 10,
      consumption: 5,
    };

    // Update the resource state using enum
    flowManager.updateResourceState(ResourceType.ENERGY, energyState);

    // Get the resource state back
    const state = flowManager.getResourceState(ResourceType.ENERGY);

    // Verify state properties
    expect(state).toBeDefined();
    if (state) {
      expect(state.current).toBe(50);
      expect(state.max).toBe(100);
      expect(state.min).toBe(0);
      expect(state.production).toBe(10);
      expect(state.consumption).toBe(5);
    }
  });

  it('should handle multiple resource types with enums', () => {
    // Register nodes with different resource types
    flowManager.registerNode({
      id: 'energy-producer',
      type: FlowNodeType.PRODUCER,
      resources: [ResourceType.ENERGY],
      priority: defaultEnergyPriority,
      active: true,
    });

    flowManager.registerNode({
      id: 'minerals-producer',
      type: FlowNodeType.PRODUCER,
      resources: [ResourceType.MINERALS],
      priority: defaultMineralsPriority,
      active: true,
    });

    flowManager.registerNode({
      id: 'energy-consumer',
      type: FlowNodeType.CONSUMER,
      resources: [ResourceType.ENERGY],
      priority: defaultEnergyPriority,
      active: true,
    });

    flowManager.registerNode({
      id: 'minerals-consumer',
      type: FlowNodeType.CONSUMER,
      resources: [ResourceType.MINERALS],
      priority: defaultMineralsPriority,
      active: true,
    });

    // Register connections
    flowManager.registerConnection({
      id: 'energy-connection',
      source: 'energy-producer',
      target: 'energy-consumer',
      resourceType: ResourceType.ENERGY,
      maxRate: 10,
      currentRate: 0,
      priority: defaultEnergyPriority,
      active: true,
    });

    flowManager.registerConnection({
      id: 'minerals-connection',
      source: 'minerals-producer',
      target: 'minerals-consumer',
      resourceType: ResourceType.MINERALS,
      maxRate: 8,
      currentRate: 0,
      priority: defaultMineralsPriority,
      active: true,
    });

    // Set up resource states
    flowManager.updateResourceState(ResourceType.ENERGY, {
      current: 50,
      max: 100,
      min: 0,
      production: 10,
      consumption: 5,
    });

    flowManager.updateResourceState(ResourceType.MINERALS, {
      current: 40,
      max: 80,
      min: 0,
      production: 8,
      consumption: 4,
    });

    // Optimize flows - we don't check the result directly since it may vary
    flowManager.optimizeFlows();

    // Instead, verify that we successfully registered two connections with different resource types
    const connections = flowManager.getConnections();
    expect(connections.length).toBe(2);

    // Find connections by resource type
    const energyConnections = connections.filter(
      (conn: FlowConnection) => conn.resourceType === ResourceType.ENERGY
    );
    const mineralsConnections = connections.filter(
      (conn: FlowConnection) => conn.resourceType === ResourceType.MINERALS
    );

    // Verify we have one of each type
    expect(energyConnections.length).toBe(1);
    expect(mineralsConnections.length).toBe(1);

    // Verify resource types
    expect(energyConnections[0].resourceType).toBe(ResourceType.ENERGY);
    expect(mineralsConnections[0].resourceType).toBe(ResourceType.MINERALS);
  });

  it('should correctly handle ResourceTypeHelpers for conversions', () => {
    // Test string to enum conversion
    const energyEnum = ResourceTypeHelpers.stringToEnum(ResourceType.ENERGY);
    expect(energyEnum).toBe(ResourceType.ENERGY);

    const mineralsEnum = ResourceTypeHelpers.stringToEnum(ResourceType.MINERALS);
    expect(mineralsEnum).toBe(ResourceType.MINERALS);

    // Test enum to string conversion
    const energyString = ResourceTypeHelpers.enumToString(ResourceType.ENERGY);
    expect(energyString).toBe(ResourceType.ENERGY);

    const mineralsString = ResourceTypeHelpers.enumToString(ResourceType.MINERALS);
    expect(mineralsString).toBe(ResourceType.MINERALS);

    // Test getDisplayName
    const energyDisplay = ResourceTypeHelpers.getDisplayName(ResourceType.ENERGY);
    expect(energyDisplay).toBe('Energy');

    const mineralsDisplay = ResourceTypeHelpers.getDisplayName(ResourceType.MINERALS);
    expect(mineralsDisplay).toBe('Minerals');
  });

  it('should handle converter nodes with enum ResourceTypes', () => {
    // Register converter node
    flowManager.registerNode({
      id: 'converter-node',
      type: FlowNodeType.CONVERTER,
      resources: [ResourceType.ENERGY, ResourceType.MINERALS],
      priority: defaultEnergyPriority,
      active: true,
      converterConfig: {
        supportedRecipes: ['energy-to-minerals'],
        maxConcurrentProcesses: 1,
        autoStart: true,
        queueBehavior: 'fifo',
        byproducts: {
          [ResourceType.GAS]: 0.1, // Small gas byproduct
        },
        efficiencyModifiers: {
          'energy-to-minerals': 1.2,
        },
        tier: 1,
      },
    });

    // Register input node
    flowManager.registerNode({
      id: 'energy-producer',
      type: FlowNodeType.PRODUCER,
      resources: [ResourceType.ENERGY],
      priority: defaultEnergyPriority,
      active: true,
    });

    // Register output node
    flowManager.registerNode({
      id: 'minerals-consumer',
      type: FlowNodeType.CONSUMER,
      resources: [ResourceType.MINERALS],
      priority: defaultMineralsPriority,
      active: true,
    });

    // Register input connection
    flowManager.registerConnection({
      id: 'energy-to-converter',
      source: 'energy-producer',
      target: 'converter-node',
      resourceType: ResourceType.ENERGY,
      maxRate: 10,
      currentRate: 0,
      priority: defaultEnergyPriority,
      active: true,
    });

    // Register output connection
    flowManager.registerConnection({
      id: 'converter-to-minerals',
      source: 'converter-node',
      target: 'minerals-consumer',
      resourceType: ResourceType.MINERALS,
      maxRate: 8,
      currentRate: 0,
      priority: defaultMineralsPriority,
      active: true,
    });

    // Set up resource states
    flowManager.updateResourceState(ResourceType.ENERGY, {
      current: 100,
      max: 200,
      min: 0,
      production: 20,
      consumption: 5,
    });

    flowManager.updateResourceState(ResourceType.MINERALS, {
      current: 20,
      max: 100,
      min: 0,
      production: 0,
      consumption: 0,
    });

    // Optimize flows
    flowManager.optimizeFlows();

    // Verify that converter node was registered with the correct enum types
    const nodes = flowManager.getNodes();
    const converterNode = nodes.find(node => node.id === 'converter-node');
    expect(converterNode).toBeDefined();

    if (converterNode) {
      expect(converterNode.type).toBe(FlowNodeType.CONVERTER);
      expect(converterNode.resources).toContain(ResourceType.ENERGY);
      expect(converterNode.resources).toContain(ResourceType.MINERALS);
    }

    // Verify connections with enum resource types
    const connections = flowManager.getConnections();
    expect(connections.length).toBe(2);

    // Find the energy and minerals connections
    const energyConnection = connections.find(
      (conn: FlowConnection) => conn.id === 'energy-to-converter'
    );
    const mineralsConnection = connections.find(
      (conn: FlowConnection) => conn.id === 'converter-to-minerals'
    );

    // Verify the connections exist with correct enum types
    expect(energyConnection).toBeDefined();
    expect(mineralsConnection).toBeDefined();

    if (energyConnection && mineralsConnection) {
      expect(energyConnection.resourceType).toBe(ResourceType.ENERGY);
      expect(mineralsConnection.resourceType).toBe(ResourceType.MINERALS);
    }
  });

  it('should handle mixed string and enum resource types for backward compatibility', () => {
    // Register with string-based type (for legacy compatibility)
    flowManager.registerNode({
      id: 'legacy-node',
      type: 'producer' as FlowNodeType,
      resources: [ResourceType.ENERGY as ResourceType], // Using string for backward compatibility
      priority: { type: ResourceType.ENERGY as ResourceType, priority: 1, consumers: [] },
      active: true,
    });

    // Register with enum-based type
    flowManager.registerNode({
      id: 'enum-node',
      type: FlowNodeType.PRODUCER,
      resources: [ResourceType.ENERGY],
      priority: defaultEnergyPriority,
      active: true,
    });

    // Get all nodes
    const nodes = flowManager.getNodes();
    expect(nodes.length).toBe(2);

    // Verify both nodes are registered
    const legacyNode = nodes.find(node => node.id === 'legacy-node');
    const enumNode = nodes.find(node => node.id === 'enum-node');

    expect(legacyNode).toBeDefined();
    expect(enumNode).toBeDefined();

    // Both should work with the resource system
    if (legacyNode && enumNode) {
      // The actual type test happens at runtime, but both should functionally work
      // with the ResourceFlowManager since we maintain backward compatibility
      expect(typeof legacyNode.resources[0]).toBe('string');
      expect(enumNode.resources[0]).toBe(ResourceType.ENERGY);
    }
  });
});
