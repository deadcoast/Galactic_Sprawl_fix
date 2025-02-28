import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceFlowManager } from '../../../managers/resource/ResourceFlowManager';
import { ResourceFlow, ResourceState, ResourceType } from '../../../types/resources/ResourceTypes';
import { validateResourceFlow } from '../../../utils/resources/resourceValidation';

// Import FlowNode and FlowConnection types
import type {
  FlowConnection,
  FlowNode,
  FlowNodeType,
} from '../../../managers/resource/ResourceFlowManager';

// Mock the resourceValidation module
vi.mock('../../../utils/resources/resourceValidation', () => ({
  validateResourceFlow: vi.fn().mockImplementation(() => true),
  validateResourceTransfer: vi.fn().mockImplementation(() => true),
}));

describe('ResourceFlowManager', () => {
  let flowManager: ResourceFlowManager;

  beforeEach(() => {
    vi.clearAllMocks();
    flowManager = new ResourceFlowManager();
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
      priority: 1,
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
      priority: 1,
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
      priority: 1,
      active: true,
    });

    flowManager.registerNode({
      id: 'target-node',
      type: 'consumer' as FlowNodeType,
      resources: ['energy' as ResourceType],
      priority: 1,
      active: true,
    });

    const connection: FlowConnection = {
      id: 'test-connection',
      source: 'source-node',
      target: 'target-node',
      resourceType: 'energy' as ResourceType,
      maxRate: 10,
      currentRate: 0,
      priority: 1,
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
      priority: 1,
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
    (validateResourceFlow as any).mockReturnValueOnce(false);

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
      priority: 1,
      active: true,
    });

    flowManager.registerNode({
      id: 'consumer-1',
      type: 'consumer' as FlowNodeType,
      resources: ['energy' as ResourceType],
      priority: 1,
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
      priority: 1,
      active: true,
    });

    // Set resource state using the network property
    const resourceState: ResourceState = {
      current: 50,
      min: 0,
      max: 100,
      production: 10,
      consumption: 5,
    };

    // Access the network property directly to set the resource state
    (flowManager as any).network.resourceStates.set('energy', resourceState);

    // Optimize flows
    const result = flowManager.optimizeFlows();

    expect(result.transfers.length).toBe(1);
    expect(result.updatedConnections.length).toBe(1);
    expect(result.transfers[0].type).toBe('energy');
    expect(result.transfers[0].amount).toBe(10); // maxRate
  });

  it('should handle transfer history', () => {
    // Add a transfer to history
    const transfer = {
      type: 'energy' as ResourceType,
      source: 'producer-1',
      target: 'consumer-1',
      amount: 10,
      timestamp: Date.now(),
    };

    flowManager.addToTransferHistory(transfer);

    const history = flowManager.getTransferHistory();
    expect(history.length).toBe(1);
    expect(history[0].type).toBe('energy');
    expect(history[0].amount).toBe(10);
  });

  it('should limit transfer history size', () => {
    // Set a small history size
    flowManager = new ResourceFlowManager(1000, 5); // 5 history items max

    // Add multiple transfers
    for (let i = 0; i < 10; i++) {
      flowManager.addToTransferHistory({
        type: 'energy' as ResourceType,
        source: 'producer-1',
        target: 'consumer-1',
        amount: i,
        timestamp: Date.now() + i,
      });
    }

    const history = flowManager.getTransferHistory();
    expect(history.length).toBe(5); // Limited to 5 items
    expect(history[0].amount).toBe(9); // Most recent first
    expect(history[4].amount).toBe(5);
  });
});
