import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceFlowManager } from '../../../managers/resource/ResourceFlowManager';
import { ResourcePriority } from '../../../types/resources/ResourceTypes';

// Import FlowNode and FlowConnection types

// Mock the resourceValidation module
vi.mock('../../../utils/resources/resourceValidation', () => ({
  validateResourceFlow: vi.fn().mockImplementation(() => true),
  validateResourceTransfer: vi.fn().mockImplementation(() => true),
}));

describe('ResourceFlowManager Batch Processing', () => {
  let flowManager: ResourceFlowManager;
  const defaultPriority: ResourcePriority = { type: 'energy', priority: 1, consumers: [] };

  beforeEach(() => {
    vi.clearAllMocks();
    // Create with small batch size for testing
    flowManager = new ResourceFlowManager(100, 500, 5);
  });

  afterEach(() => {
    flowManager.cleanup();
  });

  describe('Batch Processing for Large Networks', () => {
    it('should process nodes in batches according to batch size', () => {
      // Create a set of 15 producer nodes (3 batches with batch size 5)
      for (let i = 0; i < 15; i++) {
        flowManager.registerNode({
          id: `producer-${i}`,
          type: 'producer',
          resources: ['energy'],
          priority: defaultPriority,
          active: true,
        });
      }

      // Create a set of 15 consumer nodes (3 batches with batch size 5)
      for (let i = 0; i < 15; i++) {
        flowManager.registerNode({
          id: `consumer-${i}`,
          type: 'consumer',
          resources: ['energy'],
          priority: defaultPriority,
          active: true,
        });
      }

      // Create connections between producers and consumers
      for (let i = 0; i < 15; i++) {
        flowManager.registerConnection({
          id: `connection-${i}`,
          source: `producer-${i}`,
          target: `consumer-${i}`,
          resourceType: 'energy',
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

      // Optimize flows (should trigger batch processing)
      const result = flowManager.optimizeFlows();

      // Verify results
      expect(result.transfers.length).toBeGreaterThan(0);
      expect(result.updatedConnections.length).toBeGreaterThan(0);

      // Verify performance metrics
      expect(result.performanceMetrics).toBeDefined();
      if (result.performanceMetrics) {
        expect(result.performanceMetrics.nodesProcessed).toBe(30); // 15 producers + 15 consumers
        expect(result.performanceMetrics.connectionsProcessed).toBe(15);
        expect(result.performanceMetrics.transfersGenerated).toBeGreaterThanOrEqual(1);
        expect(result.performanceMetrics.executionTimeMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle converters in batches', () => {
      // Create test network with converters
      const converterCount = 12;

      // Create a set of converter nodes
      for (let i = 0; i < converterCount; i++) {
        flowManager.registerNode({
          id: `converter-${i}`,
          type: 'converter',
          resources: ['energy', 'minerals'],
          priority: defaultPriority,
          active: true,
        });
      }

      // Set batch size smaller than converter count
      const batchSize = 5;
      flowManager = new ResourceFlowManager(100, 50, batchSize);

      // Re-create test network with the new flow manager
      // Create a set of converter nodes again
      for (let i = 0; i < converterCount; i++) {
        flowManager.registerNode({
          id: `converter-${i}`,
          type: 'converter',
          resources: ['energy', 'minerals'],
          priority: defaultPriority,
          active: true,
        });
      }

      // Optimize flows
      const result = flowManager.optimizeFlows();

      // Verify results
      expect(result.transfers.length).toBeGreaterThan(0);
      expect(result.updatedConnections.length).toBeGreaterThan(0);

      // Verify performance metrics
      // First check if performanceMetrics exists
      expect(result.performanceMetrics).toBeDefined();

      // Use type assertion to assure TypeScript that performanceMetrics is defined
      const metrics = result.performanceMetrics as NonNullable<typeof result.performanceMetrics>;
      expect(metrics.nodesProcessed).toBe(converterCount * 2); // Converters + producers
      expect(metrics.connectionsProcessed).toBe(converterCount);
    });

    it('should process connections in batches', () => {
      // Create test network with many connections
      const connectionCount = 15;

      // Create nodes first
      flowManager.registerNode({
        id: 'central-producer',
        type: 'producer',
        resources: ['energy'],
        priority: defaultPriority,
        active: true,
      });

      // Create consumer nodes and connections to them
      for (let i = 0; i < connectionCount; i++) {
        flowManager.registerNode({
          id: `consumer-${i}`,
          type: 'consumer',
          resources: ['energy'],
          priority: defaultPriority,
          active: true,
        });

        flowManager.registerConnection({
          id: `connection-${i}`,
          source: 'central-producer',
          target: `consumer-${i}`,
          resourceType: 'energy',
          maxRate: 5 + i, // Different rates to test prioritization
          currentRate: 0,
          priority: defaultPriority,
          active: true,
        });
      }

      // Set batch size smaller than connection count
      const batchSize = 5;
      flowManager = new ResourceFlowManager(100, 50, batchSize);

      // Re-create test network with the new flow manager
      // Create nodes first
      flowManager.registerNode({
        id: 'central-producer',
        type: 'producer',
        resources: ['energy'],
        priority: defaultPriority,
        active: true,
      });

      // Create consumer nodes and connections to them
      for (let i = 0; i < connectionCount; i++) {
        flowManager.registerNode({
          id: `consumer-${i}`,
          type: 'consumer',
          resources: ['energy'],
          priority: defaultPriority,
          active: true,
        });

        flowManager.registerConnection({
          id: `connection-${i}`,
          source: 'central-producer',
          target: `consumer-${i}`,
          resourceType: 'energy',
          maxRate: 5 + i, // Different rates to test prioritization
          currentRate: 0,
          priority: defaultPriority,
          active: true,
        });
      }

      // Optimize flows
      const result = flowManager.optimizeFlows();

      // Verify results
      expect(result.transfers.length).toBeGreaterThan(0);
      expect(result.updatedConnections.length).toBe(connectionCount);

      // Verify performance metrics
      // First check if performanceMetrics exists
      expect(result.performanceMetrics).toBeDefined();

      // Use type assertion to assure TypeScript that performanceMetrics is defined
      const metrics = result.performanceMetrics as NonNullable<typeof result.performanceMetrics>;
      expect(metrics.connectionsProcessed).toBe(connectionCount);
    });

    it('should handle large networks efficiently with different batch sizes', () => {
      const smallBatchManager = new ResourceFlowManager(100, 500, 3);
      const largeBatchManager = new ResourceFlowManager(100, 500, 20);

      // Function to create a test network
      const createTestNetwork = (manager: ResourceFlowManager, nodeCount: number) => {
        // Register producer nodes
        for (let i = 0; i < nodeCount; i++) {
          manager.registerNode({
            id: `producer-${i}`,
            type: 'producer',
            resources: ['energy'],
            priority: defaultPriority,
            active: true,
          });
        }

        // Register consumer nodes
        for (let i = 0; i < nodeCount; i++) {
          manager.registerNode({
            id: `consumer-${i}`,
            type: 'consumer',
            resources: ['energy'],
            priority: defaultPriority,
            active: true,
          });
        }

        // Register connections
        for (let i = 0; i < nodeCount; i++) {
          manager.registerConnection({
            id: `connection-${i}`,
            source: `producer-${i}`,
            target: `consumer-${i}`,
            resourceType: 'energy',
            maxRate: 10,
            currentRate: 0,
            priority: defaultPriority,
            active: true,
          });
        }

        // Set resource state
        manager.updateResourceState('energy', {
          current: 1000,
          max: 10000,
          min: 0,
          production: 500,
          consumption: 300,
        });
      };

      // Create same test network with 30 nodes in both managers
      createTestNetwork(smallBatchManager, 30);
      createTestNetwork(largeBatchManager, 30);

      // Optimize flows on both managers
      const smallBatchResult = smallBatchManager.optimizeFlows();
      const largeBatchResult = largeBatchManager.optimizeFlows();

      // Both should produce the same number of transfers
      expect(smallBatchResult.transfers.length).toBe(largeBatchResult.transfers.length);
      expect(smallBatchResult.updatedConnections.length).toBe(
        largeBatchResult.updatedConnections.length
      );

      // Both should process the same number of nodes and connections
      expect(smallBatchResult.performanceMetrics?.nodesProcessed).toBe(
        largeBatchResult.performanceMetrics?.nodesProcessed
      );

      expect(smallBatchResult.performanceMetrics?.connectionsProcessed).toBe(
        largeBatchResult.performanceMetrics?.connectionsProcessed
      );

      // Cleanup
      smallBatchManager.cleanup();
      largeBatchManager.cleanup();
    });
  });
});
