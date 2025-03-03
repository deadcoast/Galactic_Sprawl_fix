import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceFlowManager } from '../../../managers/resource/ResourceFlowManager';
import {
  ResourceFlow,
  ResourcePriority,
  ResourceState,
  ResourceType,
} from '../../../types/resources/ResourceTypes';
import { validateResourceFlow } from '../../../utils/resources/resourceValidation';

// Import FlowNode and FlowConnection types
import type {
  FlowConnection,
  FlowNode,
  FlowNodeType,
} from '../../../managers/resource/ResourceFlowManager';

// Define types for mocked functions
interface MockedValidateResourceFlow {
  mockReturnValueOnce: (value: boolean) => void;
}

// Mock the resourceValidation module
vi.mock('../../../utils/resources/resourceValidation', () => ({
  validateResourceFlow: vi.fn().mockImplementation(() => true),
  validateResourceTransfer: vi.fn().mockImplementation(() => true),
}));

describe('ResourceFlowManager', () => {
  let flowManager: ResourceFlowManager;
  // Create a default priority value for tests
  const defaultPriority: ResourcePriority = { type: 'energy', priority: 1, consumers: [] };

  beforeEach(() => {
    vi.clearAllMocks();
    // Create with small optimization interval for testing
    flowManager = new ResourceFlowManager(100, 500, 10);
  });

  afterEach(() => {
    flowManager.cleanup();
  });

  it('should create a new instance', () => {
    expect(flowManager).toBeInstanceOf(ResourceFlowManager);
  });

  it('should register a node', () => {
    const node: FlowNode = {
      id: 'test-node',
      type: 'producer' as FlowNodeType,
      resources: ['energy' as ResourceType],
      priority: defaultPriority,
      active: true,
    };

    const result = flowManager.registerNode(node);
    expect(result).toBe(true);

    const nodes = flowManager.getNodes();
    expect(nodes.length).toBe(1);
    expect(nodes[0].id).toBe('test-node');
  });

  it('should not register an invalid node', () => {
    const invalidNode: FlowNode = {
      id: '',
      type: 'producer' as FlowNodeType,
      resources: ['energy' as ResourceType],
      priority: defaultPriority,
      active: true,
    };

    const result = flowManager.registerNode(invalidNode);
    expect(result).toBe(false);

    const nodes = flowManager.getNodes();
    expect(nodes.length).toBe(0);
  });

  it('should register a connection', () => {
    // Register nodes first
    flowManager.registerNode({
      id: 'source-node',
      type: 'producer' as FlowNodeType,
      resources: ['energy' as ResourceType],
      priority: defaultPriority,
      active: true,
    });

    flowManager.registerNode({
      id: 'target-node',
      type: 'consumer' as FlowNodeType,
      resources: ['energy' as ResourceType],
      priority: defaultPriority,
      active: true,
    });

    const connection: FlowConnection = {
      id: 'test-connection',
      source: 'source-node',
      target: 'target-node',
      resourceType: 'energy' as ResourceType,
      maxRate: 10,
      currentRate: 0,
      priority: defaultPriority,
      active: true,
    };

    const result = flowManager.registerConnection(connection);
    expect(result).toBe(true);

    const connections = flowManager.getConnections();
    expect(connections.length).toBe(1);
    expect(connections[0].id).toBe('test-connection');
  });

  it('should not register an invalid connection', () => {
    const invalidConnection: FlowConnection = {
      id: '',
      source: 'source-node',
      target: 'target-node',
      resourceType: 'energy' as ResourceType,
      maxRate: 10,
      currentRate: 0,
      priority: defaultPriority,
      active: true,
    };

    const result = flowManager.registerConnection(invalidConnection);
    expect(result).toBe(false);

    const connections = flowManager.getConnections();
    expect(connections.length).toBe(0);
  });

  it('should create a flow', () => {
    const flow: ResourceFlow = {
      source: 'source-node',
      target: 'target-node',
      resources: [
        {
          type: 'energy' as ResourceType,
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
    expect(connections[0].resourceType).toBe('energy');
    expect(connections[0].maxRate).toBe(10);
  });

  it('should not create an invalid flow', () => {
    // Mock validateResourceFlow to return false for this test
    (validateResourceFlow as unknown as MockedValidateResourceFlow).mockReturnValueOnce(false);

    const invalidFlow = {
      source: '',
      target: 'target-node',
      resources: [],
    } as ResourceFlow;

    const result = flowManager.createFlow(invalidFlow);
    expect(result).toBe(false);

    const connections = flowManager.getConnections();
    expect(connections.length).toBe(0);
  });

  it('should optimize flows', () => {
    // Register nodes
    flowManager.registerNode({
      id: 'producer-1',
      type: 'producer' as FlowNodeType,
      resources: ['energy' as ResourceType],
      priority: defaultPriority,
      active: true,
    });

    flowManager.registerNode({
      id: 'consumer-1',
      type: 'consumer' as FlowNodeType,
      resources: ['energy' as ResourceType],
      priority: defaultPriority,
      active: true,
    });

    // Register connection
    flowManager.registerConnection({
      id: 'connection-1',
      source: 'producer-1',
      target: 'consumer-1',
      resourceType: 'energy' as ResourceType,
      maxRate: 10,
      currentRate: 0,
      priority: defaultPriority,
      active: true,
    });

    // Instead of directly accessing private properties, we'll use a workaround
    // by creating a flow that will indirectly set the resource state
    const flow: ResourceFlow = {
      source: 'producer-1',
      target: 'consumer-1',
      resources: [
        {
          type: 'energy' as ResourceType,
          amount: 10,
          interval: 1000,
        },
      ],
    };

    // Create the flow to set up the internal state
    flowManager.createFlow(flow);

    // Optimize flows
    const result = flowManager.optimizeFlows();

    // Verify the results
    expect(result.transfers.length).toBeGreaterThan(0);
    expect(result.updatedConnections.length).toBeGreaterThan(0);
    if (result.transfers.length > 0) {
      expect(result.transfers[0].type).toBe('energy');
    }

    // Verify performance metrics are included
    expect(result.performanceMetrics).toBeDefined();
    if (result.performanceMetrics) {
      expect(result.performanceMetrics.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.nodesProcessed).toBe(2);
      expect(result.performanceMetrics.connectionsProcessed).toBe(1);
      expect(result.performanceMetrics.transfersGenerated).toBeGreaterThanOrEqual(0);
    }
  });

  it('should cache resource states', () => {
    // Set up a resource state
    const resourceState: ResourceState = {
      current: 100,
      max: 1000,
      min: 0,
      production: 10,
      consumption: 5,
    };

    flowManager.updateResourceState('energy', resourceState);

    // First call should retrieve from network and cache
    const firstResult = flowManager.getResourceState('energy');
    expect(firstResult).toEqual(resourceState);

    // Modify the original state (this shouldn't affect the cached value)
    resourceState.current = 200;

    // Second call should retrieve from cache
    const secondResult = flowManager.getResourceState('energy');
    expect(secondResult).toEqual({
      current: 100,
      max: 1000,
      min: 0,
      production: 10,
      consumption: 5,
    });

    // Wait for cache to expire
    vi.advanceTimersByTime(600);

    // Update the resource state
    flowManager.updateResourceState('energy', resourceState);

    // After cache expiration, should get the updated value
    const thirdResult = flowManager.getResourceState('energy');
    expect(thirdResult).toEqual({
      current: 200,
      max: 1000,
      min: 0,
      production: 10,
      consumption: 5,
    });
  });

  it('should invalidate cache when registering a node', () => {
    // Set up a resource state
    const resourceState: ResourceState = {
      current: 100,
      max: 1000,
      min: 0,
      production: 10,
      consumption: 5,
    };

    flowManager.updateResourceState('energy', resourceState);

    // First call should retrieve from network and cache
    const firstResult = flowManager.getResourceState('energy');
    expect(firstResult).toEqual(resourceState);

    // Register a node with the same resource type
    flowManager.registerNode({
      id: 'new-producer',
      type: 'producer' as FlowNodeType,
      resources: ['energy' as ResourceType],
      priority: defaultPriority,
      active: true,
    });

    // Update the resource state
    const updatedState: ResourceState = {
      current: 200,
      max: 1000,
      min: 0,
      production: 20,
      consumption: 5,
    };

    flowManager.updateResourceState('energy', updatedState);

    // Should get the updated value because cache was invalidated
    const secondResult = flowManager.getResourceState('energy');
    expect(secondResult).toEqual(updatedState);
  });

  it('should process converters correctly', () => {
    // Register converter node
    flowManager.registerNode({
      id: 'converter-1',
      type: 'converter' as FlowNodeType,
      resources: ['energy' as ResourceType, 'minerals' as ResourceType],
      priority: defaultPriority,
      efficiency: 0.8,
      active: true,
    });

    // Register target node
    flowManager.registerNode({
      id: 'consumer-1',
      type: 'consumer' as FlowNodeType,
      resources: ['energy' as ResourceType],
      priority: defaultPriority,
      active: true,
    });

    // Register connection from converter to consumer
    flowManager.registerConnection({
      id: 'connection-1',
      source: 'converter-1',
      target: 'consumer-1',
      resourceType: 'energy' as ResourceType,
      maxRate: 10,
      currentRate: 5,
      priority: defaultPriority,
      active: true,
    });

    // Optimize flows
    const result = flowManager.optimizeFlows();

    // Get the updated connection
    const updatedConnection = flowManager.getConnection('connection-1');

    // Verify the connection rate was adjusted by the converter efficiency
    expect(updatedConnection).toBeDefined();
    if (updatedConnection) {
      // The current rate should be affected by the 0.8 efficiency
      expect(updatedConnection.currentRate).toBeLessThanOrEqual(5);
    }
  });

  it('should handle batch processing for large networks', () => {
    // Create a large number of nodes and connections
    const nodeCount = 50;
    const connectionCount = 50;

    // Register producer nodes
    for (let i = 0; i < nodeCount; i++) {
      flowManager.registerNode({
        id: `producer-${i}`,
        type: 'producer' as FlowNodeType,
        resources: ['energy' as ResourceType],
        priority: defaultPriority,
        active: true,
      });
    }

    // Register consumer nodes
    for (let i = 0; i < nodeCount; i++) {
      flowManager.registerNode({
        id: `consumer-${i}`,
        type: 'consumer' as FlowNodeType,
        resources: ['energy' as ResourceType],
        priority: defaultPriority,
        active: true,
      });
    }

    // Register connections
    for (let i = 0; i < connectionCount; i++) {
      flowManager.registerConnection({
        id: `connection-${i}`,
        source: `producer-${i % nodeCount}`,
        target: `consumer-${i % nodeCount}`,
        resourceType: 'energy' as ResourceType,
        maxRate: 10,
        currentRate: 0,
        priority: defaultPriority,
        active: true,
      });
    }

    // Set resource state
    flowManager.updateResourceState('energy', {
      current: 1000,
      max: 10000,
      min: 0,
      production: 500,
      consumption: 300,
    });

    // Optimize flows
    const result = flowManager.optimizeFlows();

    // Verify the results
    expect(result.transfers.length).toBeGreaterThan(0);
    expect(result.updatedConnections.length).toBeGreaterThan(0);

    // Verify performance metrics
    expect(result.performanceMetrics).toBeDefined();
    if (result.performanceMetrics) {
      expect(result.performanceMetrics.nodesProcessed).toBe(nodeCount * 2);
      expect(result.performanceMetrics.connectionsProcessed).toBe(connectionCount);
    }
  });
});
