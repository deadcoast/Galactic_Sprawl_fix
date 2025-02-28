import { moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { Position } from '../../types/core/GameTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { FlowNodeType, ResourceFlowManager } from '../resource/ResourceFlowManager';
import { ResourceThresholdManager, ThresholdConfig } from '../resource/ResourceThresholdManager';
import { MiningShipManagerImpl } from './MiningShipManagerImpl';

/**
 * MiningResourceIntegration
 *
 * Integrates the MiningShipManager with the resource management system.
 * Connects mining operations with resource thresholds and flow optimization.
 */
export class MiningResourceIntegration {
  private miningManager: MiningShipManagerImpl;
  private thresholdManager: ResourceThresholdManager;
  private flowManager: ResourceFlowManager;
  private initialized: boolean = false;
  private miningNodes: Map<
    string,
    {
      id: string;
      type: ResourceType;
      position: Position;
      efficiency: number;
    }
  > = new Map();

  constructor(
    miningManager: MiningShipManagerImpl,
    thresholdManager: ResourceThresholdManager,
    flowManager: ResourceFlowManager
  ) {
    this.miningManager = miningManager;
    this.thresholdManager = thresholdManager;
    this.flowManager = flowManager;
  }

  /**
   * Initialize the integration
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }

    // Subscribe to mining events
    this.subscribeToMiningEvents();

    // Register mining nodes in the flow manager
    this.registerMiningNodes();

    // Create thresholds for mining operations
    this.createMiningThresholds();

    this.initialized = true;
    console.debug('[MiningResourceIntegration] Mining resource integration initialized');
  }

  /**
   * Subscribe to mining events
   */
  private subscribeToMiningEvents(): void {
    // Listen for mining ship registration
    this.miningManager.on('shipRegistered', (data: { shipId: string }) => {
      console.debug(`[MiningResourceIntegration] Mining ship registered: ${data.shipId}`);

      // Get the ship from the mining manager
      const ship = (this.miningManager as any).ships.get(data.shipId);
      if (!ship) {
        return;
      }

      // Register the ship as a producer node in the flow manager
      this.flowManager.registerNode({
        id: `mining-ship-${data.shipId}`,
        type: 'producer' as FlowNodeType,
        resources: ['minerals', 'gas', 'plasma', 'exotic'] as ResourceType[],
        priority: { type: 'minerals' as ResourceType, priority: 5, consumers: [] },
        efficiency: ship.efficiency || 1.0,
        active: ship.status === 'mining',
      });
    });

    // Listen for mining ship unregistration
    this.miningManager.on('shipUnregistered', (data: { shipId: string }) => {
      console.debug(`[MiningResourceIntegration] Mining ship unregistered: ${data.shipId}`);

      // Unregister the ship from the flow manager
      this.flowManager.unregisterNode(`mining-ship-${data.shipId}`);
    });

    // Listen for mining task completion
    moduleEventBus.subscribe('MODULE_ACTIVATED' as ModuleEventType, event => {
      if (event.moduleType !== 'mineral') {
        return;
      }

      const ship = event.data?.ship;
      if (!ship) {
        return;
      }

      // Update the ship's status in the flow manager
      const node = this.flowManager.getNode(`mining-ship-${ship.id}`);
      if (node) {
        node.active = ship.status === 'mining';
      }
    });

    // Listen for resource extraction events
    moduleEventBus.subscribe('RESOURCE_PRODUCED' as ModuleEventType, event => {
      if (!event.moduleId.startsWith('mining-ship-')) {
        return;
      }

      const { resourceType, newAmount, oldAmount, delta } = event.data;
      if (!resourceType || !delta) {
        return;
      }

      // Record the extraction in the flow manager
      const shipId = event.moduleId.replace('mining-ship-', '');
      const transfer = {
        type: resourceType as ResourceType,
        source: `mining-ship-${shipId}`,
        target: `storage-${resourceType}`,
        amount: delta,
        timestamp: event.timestamp,
      };

      // Add to transfer history
      this.addTransferToHistory(transfer);
    });
  }

  /**
   * Add a transfer to the history
   */
  private addTransferToHistory(transfer: any): void {
    // We can't directly access the private addToTransferHistory method,
    // so we'll emit an event that the ResourceIntegration will handle
    moduleEventBus.emit({
      type: 'RESOURCE_TRANSFERRED' as ModuleEventType,
      moduleId: transfer.source,
      moduleType: 'mineral',
      timestamp: Date.now(),
      data: {
        resourceType: transfer.type,
        amount: transfer.amount,
        source: transfer.source,
        target: transfer.target,
      },
    });
  }

  /**
   * Register mining nodes in the flow manager
   */
  private registerMiningNodes(): void {
    // Get all resource nodes from the mining manager
    const { resourceNodes } = this.miningManager as any;
    if (!resourceNodes) {
      return;
    }

    // Register each node in the flow manager
    resourceNodes.forEach((node: any) => {
      this.miningNodes.set(node.id, {
        id: node.id,
        type: node.type,
        position: node.position,
        efficiency: 1.0,
      });

      // Register the node in the flow manager
      this.flowManager.registerNode({
        id: `mining-node-${node.id}`,
        type: 'producer' as FlowNodeType,
        resources: [node.type],
        priority: { type: node.type, priority: 3, consumers: [] },
        efficiency: 1.0,
        active: true,
      });

      // Create a connection to the storage
      this.flowManager.registerConnection({
        id: `mining-connection-${node.id}`,
        source: `mining-node-${node.id}`,
        target: `storage-${node.type}`,
        resourceType: node.type,
        maxRate: 10, // Default extraction rate
        currentRate: 0,
        priority: { type: node.type, priority: 3, consumers: [] },
        active: true,
      });
    });
  }

  /**
   * Create thresholds for mining operations
   */
  private createMiningThresholds(): void {
    // Get all resource nodes from the mining manager
    const { resourceNodes } = this.miningManager as any;
    if (!resourceNodes) {
      return;
    }

    // Create a set of unique resource types
    const resourceTypes = new Set<ResourceType>();
    resourceNodes.forEach((node: any) => {
      resourceTypes.add(node.type);
    });

    // Create thresholds for each resource type
    resourceTypes.forEach(type => {
      // Create a threshold config
      const config: ThresholdConfig = {
        id: `mining-threshold-${type}`,
        threshold: {
          type,
          min: 100, // Default minimum threshold
          target: 500, // Default target threshold
        },
        actions: [
          {
            type: 'notification',
            target: 'mining-manager',
            message: `Low ${type} levels, prioritizing mining`,
          },
        ],
        enabled: true,
      };

      this.thresholdManager.registerThreshold(config);
    });
  }

  /**
   * Register a new mining node
   */
  public registerMiningNode(
    id: string,
    type: ResourceType,
    position: Position,
    efficiency: number = 1.0
  ): void {
    // Store the node
    this.miningNodes.set(id, {
      id,
      type,
      position,
      efficiency,
    });

    // Register the node in the flow manager
    this.flowManager.registerNode({
      id: `mining-node-${id}`,
      type: 'producer' as FlowNodeType,
      resources: [type],
      priority: { type, priority: 3, consumers: [] },
      efficiency,
      active: true,
    });

    // Create a connection to the storage
    this.flowManager.registerConnection({
      id: `mining-connection-${id}`,
      source: `mining-node-${id}`,
      target: `storage-${type}`,
      resourceType: type,
      maxRate: 10 * efficiency, // Extraction rate based on efficiency
      currentRate: 0,
      priority: { type, priority: 3, consumers: [] },
      active: true,
    });

    // Update thresholds if needed
    const existingThreshold = this.thresholdManager
      .getThresholdConfigs()
      .find(config => config.threshold.type === type);

    if (!existingThreshold) {
      // Create a new threshold
      const config: ThresholdConfig = {
        id: `mining-threshold-${type}`,
        threshold: {
          type,
          min: 100,
          target: 500,
        },
        actions: [
          {
            type: 'notification',
            target: 'mining-manager',
            message: `Low ${type} levels, prioritizing mining`,
          },
        ],
        enabled: true,
      };

      this.thresholdManager.registerThreshold(config);
    }
  }

  /**
   * Unregister a mining node
   */
  public unregisterMiningNode(id: string): void {
    // Remove the node
    this.miningNodes.delete(id);

    // Unregister the node from the flow manager
    this.flowManager.unregisterNode(`mining-node-${id}`);

    // Unregister the connection
    this.flowManager.unregisterConnection(`mining-connection-${id}`);
  }

  /**
   * Update mining node efficiency
   */
  public updateMiningNodeEfficiency(id: string, efficiency: number): void {
    // Update the node
    const node = this.miningNodes.get(id);
    if (!node) {
      return;
    }

    node.efficiency = efficiency;

    // Update the node in the flow manager
    const flowNode = this.flowManager.getNode(`mining-node-${id}`);
    if (flowNode) {
      flowNode.efficiency = efficiency;
    }

    // Update the connection
    const connection = this.flowManager.getConnection(`mining-connection-${id}`);
    if (connection) {
      connection.maxRate = 10 * efficiency;
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (!this.initialized) {
      return;
    }

    // Unregister all mining nodes
    this.miningNodes.forEach((node, id) => {
      this.flowManager.unregisterNode(`mining-node-${id}`);
      this.flowManager.unregisterConnection(`mining-connection-${id}`);
    });

    // Unregister all mining ships
    const { ships } = this.miningManager as any;
    if (ships) {
      ships.forEach((_: any, shipId: string) => {
        this.flowManager.unregisterNode(`mining-ship-${shipId}`);
      });
    }

    this.initialized = false;
  }
}

/**
 * Factory function to create and initialize the mining resource integration
 */
export function createMiningResourceIntegration(
  miningManager: MiningShipManagerImpl,
  thresholdManager: ResourceThresholdManager,
  flowManager: ResourceFlowManager
): MiningResourceIntegration {
  // Create the integration
  const integration = new MiningResourceIntegration(miningManager, thresholdManager, flowManager);

  // Initialize the integration
  integration.initialize();

  return integration;
}
