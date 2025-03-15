import { useEffect, useState } from 'react';
import { useEventSubscription } from '../../lib/events/UnifiedEventSystem';
import { resourceSystem } from '../../resource/ResourceSystem';
import { FlowConnection, FlowNode } from '../../resource/subsystems/ResourceFlowSubsystem';
import { StorageContainerConfig } from '../../resource/subsystems/ResourceStorageSubsystem';
import { ResourceThreshold } from '../../resource/subsystems/ResourceThresholdSubsystem';
import { ResourceState, ResourceTransfer } from '../../types/resources/ResourceTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";

// Make sure ResourceSystem is initialized
resourceSystem.initialize().catch(error => {
  console.error('Failed to initialize ResourceSystem:', error);
});

/**
 * Hook to access the resource system
 *
 * Provides methods to interact with the unified resource system
 * and subscribes to relevant resource events.
 */
export function useResourceSystem() {
  const [isReady, setIsReady] = useState(false);

  // Initialize the resource system when the hook is first used
  useEffect(() => {
    let isMounted = true;

    resourceSystem
      .initialize()
      .then(() => {
        if (isMounted) {
          setIsReady(true);
        }
      })
      .catch(error => {
        console.error('Failed to initialize ResourceSystem in hook:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to resource events
  useEventSubscription('RESOURCE_THRESHOLD_REACHED', event => {
    console.log('Resource threshold reached:', event);
  });

  useEventSubscription('RESOURCE_TRANSFERRED', event => {
    console.log('Resource transferred:', event);
  });

  /**
   * Get a resource state
   */
  function getResourceState(type: ResourceType): ResourceState | undefined {
    return resourceSystem.getResourceState(type);
  }

  /**
   * Update a resource state
   */
  function updateResourceState(type: ResourceType, state: ResourceState): void {
    resourceSystem.updateResourceState(type, state);
  }

  /**
   * Get the current resource total
   */
  function getResourceTotal(type: ResourceType): number {
    return resourceSystem.getResourceTotal(type);
  }

  /**
   * Check if a resource exists
   */
  function hasResource(type: ResourceType): boolean {
    return resourceSystem.hasResource(type);
  }

  /**
   * Check if a resource has at least the specified amount
   */
  function hasResourceAmount(type: ResourceType, amount: number): boolean {
    return resourceSystem.hasResourceAmount(type, amount);
  }

  /**
   * Get available resource space
   */
  function getAvailableSpace(type: ResourceType): number {
    return resourceSystem.getAvailableSpace(type);
  }

  /**
   * Store a resource
   */
  function storeResource(type: ResourceType, amount: number, targetId?: string): number {
    return resourceSystem.storeResource(type, amount, targetId);
  }

  /**
   * Retrieve a resource
   */
  function retrieveResource(type: ResourceType, amount: number, sourceId?: string): number {
    return resourceSystem.retrieveResource(type, amount, sourceId);
  }

  /**
   * Transfer resources between entities
   */
  function transferResource(
    type: ResourceType,
    amount: number,
    sourceId: string,
    targetId: string
  ): number {
    return resourceSystem.transferResource(type, amount, sourceId, targetId);
  }

  /**
   * Register a resource flow
   */
  function registerResourceFlow(
    sourceId: string,
    targetId: string,
    type: ResourceType,
    rate: number
  ): boolean {
    return resourceSystem.registerResourceFlow(sourceId, targetId, type, rate);
  }

  /**
   * Convert resources from one type to another
   */
  function convertResources(
    inputType: ResourceType,
    inputAmount: number,
    outputType: ResourceType,
    outputAmount: number,
    sourceId: string
  ): boolean {
    return resourceSystem.convertResources(
      inputType,
      inputAmount,
      outputType,
      outputAmount,
      sourceId
    );
  }

  /**
   * Get all recent resource transfers
   */
  function getTransferHistory(): ResourceTransfer[] {
    return resourceSystem.getTransferHistory();
  }

  /**
   * Register a storage container
   */
  function registerContainer(config: StorageContainerConfig): boolean {
    return resourceSystem.getStorageSubsystem().registerContainer(config);
  }

  /**
   * Get a storage container
   */
  function getContainer(id: string) {
    return resourceSystem.getStorageSubsystem().getContainer(id);
  }

  /**
   * Register a flow node
   */
  function registerNode(node: FlowNode): boolean {
    return resourceSystem.getFlowSubsystem().registerNode(node);
  }

  /**
   * Get a flow node
   */
  function getNode(id: string) {
    return resourceSystem.getFlowSubsystem().getNode(id);
  }

  /**
   * Register a threshold
   */
  function registerThreshold(threshold: ResourceThreshold): boolean {
    return resourceSystem.getThresholdSubsystem().registerThreshold(threshold);
  }

  /**
   * Get a threshold
   */
  function getThreshold(id: string) {
    return resourceSystem.getThresholdSubsystem().getThreshold(id);
  }

  /**
   * Optimize resource flows
   */
  async function optimizeFlows() {
    return resourceSystem.getFlowSubsystem().optimizeFlows();
  }

  return {
    // Core functionality
    isReady,
    getResourceState,
    updateResourceState,
    getResourceTotal,
    hasResource,
    hasResourceAmount,
    getAvailableSpace,
    storeResource,
    retrieveResource,
    transferResource,
    registerResourceFlow,
    convertResources,
    getTransferHistory,

    // Storage subsystem
    registerContainer,
    getContainer,
    getAllContainers: () => resourceSystem.getStorageSubsystem().getAllContainers(),
    getContainersByResourceType: (type: ResourceType) =>
      resourceSystem.getStorageSubsystem().getContainersByResourceType(type),
    transferBetweenContainers: (
      sourceId: string,
      targetId: string,
      type: ResourceType,
      amount: number
    ) =>
      resourceSystem
        .getStorageSubsystem()
        .transferBetweenContainers(sourceId, targetId, type, amount),

    // Flow subsystem
    registerNode,
    getNode,
    getAllNodes: () => resourceSystem.getFlowSubsystem().getNodes(),
    registerConnection: (connection: FlowConnection) =>
      resourceSystem.getFlowSubsystem().registerConnection(connection),
    getConnection: (id: string) => resourceSystem.getFlowSubsystem().getConnection(id),
    getAllConnections: () => resourceSystem.getFlowSubsystem().getConnections(),
    optimizeFlows,

    // Threshold subsystem
    registerThreshold,
    getThreshold,
    getAllThresholds: () => resourceSystem.getThresholdSubsystem().getAllThresholds(),
    getThresholdsByResourceType: (type: ResourceType) =>
      resourceSystem.getThresholdSubsystem().getThresholdsByResourceType(type),
    enableThreshold: (id: string) => resourceSystem.getThresholdSubsystem().enableThreshold(id),
    disableThreshold: (id: string) => resourceSystem.getThresholdSubsystem().disableThreshold(id),

    // Direct access to subsystems (for advanced use cases)
    storageSubsystem: resourceSystem.getStorageSubsystem(),
    flowSubsystem: resourceSystem.getFlowSubsystem(),
    thresholdSubsystem: resourceSystem.getThresholdSubsystem(),
    transferSubsystem: resourceSystem.getTransferSubsystem(),
  };
}

export default useResourceSystem;
