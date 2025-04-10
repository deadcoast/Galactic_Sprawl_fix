import { useEffect, useState } from 'react';
import { useEventSubscription } from '../../lib/events/UnifiedEventSystem';
import { ResourceSystem } from '../../resource/ResourceSystem';
import { FlowConnection, FlowNode } from '../../resource/subsystems/ResourceFlowSubsystem';
import { StorageContainerConfig } from '../../resource/subsystems/ResourceStorageSubsystem';
import { ResourceThreshold } from '../../resource/subsystems/ResourceThresholdSubsystem';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';
import { ResourceState, ResourceTransfer } from '../../types/resources/ResourceTypes';
import { ResourceType } from './../../types/resources/ResourceTypes';

// Make sure ResourceSystem is initialized
ResourceSystem.getInstance()
  .initialize()
  .catch(error => {
    errorLoggingService.logError(
      error instanceof Error ? error : new Error('Failed to initialize ResourceSystem (global instance)'),
      ErrorType.INITIALIZATION,
      ErrorSeverity.CRITICAL,
      { componentName: 'useResourceSystem (global scope)', action: 'initialize' }
    );
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

    ResourceSystem.getInstance()
      .initialize()
      .then(() => {
        if (isMounted) {
          setIsReady(true);
        }
      })
      .catch(error => {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error('Failed to initialize ResourceSystem in hook'),
          ErrorType.INITIALIZATION,
          ErrorSeverity.CRITICAL,
          { componentName: 'useResourceSystem', action: 'useEffect (initialize)' }
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to resource events
  useEventSubscription('RESOURCE_THRESHOLD_REACHED', event => {
    console.warn('Resource threshold reached:', event);
  });

  useEventSubscription('RESOURCE_TRANSFERRED', event => {
    console.warn('Resource transferred:', event);
  });

  /**
   * Get a resource state
   */
  function getResourceState(type: ResourceType): ResourceState | undefined {
    return ResourceSystem.getInstance().getResourceState(type);
  }

  /**
   * Update a resource state
   */
  function updateResourceState(type: ResourceType, state: ResourceState): void {
    ResourceSystem.getInstance().updateResourceState(type, state);
  }

  /**
   * Get the current resource total
   */
  function getResourceTotal(type: ResourceType): number {
    return ResourceSystem.getInstance().getResourceTotal(type);
  }

  /**
   * Check if a resource exists
   */
  function hasResource(type: ResourceType): boolean {
    return ResourceSystem.getInstance().hasResource(type);
  }

  /**
   * Check if a resource has at least the specified amount
   */
  function hasResourceAmount(type: ResourceType, amount: number): boolean {
    return ResourceSystem.getInstance().hasResourceAmount(type, amount);
  }

  /**
   * Get available resource space
   */
  function getAvailableSpace(type: ResourceType): number {
    return ResourceSystem.getInstance().getAvailableSpace(type);
  }

  /**
   * Store a resource
   */
  function storeResource(type: ResourceType, amount: number, targetId?: string): number {
    return ResourceSystem.getInstance().storeResource(type, amount, targetId);
  }

  /**
   * Retrieve a resource
   */
  function retrieveResource(type: ResourceType, amount: number, sourceId?: string): number {
    return ResourceSystem.getInstance().retrieveResource(type, amount, sourceId);
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
    return ResourceSystem.getInstance().transferResource(type, amount, sourceId, targetId);
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
    return ResourceSystem.getInstance().registerResourceFlow(sourceId, targetId, type, rate);
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
    return ResourceSystem.getInstance().convertResources(
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
    return ResourceSystem.getInstance().getTransferHistory();
  }

  /**
   * Register a storage container
   */
  function registerContainer(config: StorageContainerConfig): boolean {
    return ResourceSystem.getInstance().getStorageSubsystem().registerContainer(config);
  }

  /**
   * Get a storage container
   */
  function getContainer(id: string) {
    return ResourceSystem.getInstance().getStorageSubsystem().getContainer(id);
  }

  /**
   * Register a flow node
   */
  function registerNode(node: FlowNode): boolean {
    return ResourceSystem.getInstance().getFlowSubsystem().registerNode(node);
  }

  /**
   * Get a flow node
   */
  function getNode(id: string) {
    return ResourceSystem.getInstance().getFlowSubsystem().getNode(id);
  }

  /**
   * Register a threshold
   */
  function registerThreshold(threshold: ResourceThreshold): boolean {
    return ResourceSystem.getInstance().getThresholdSubsystem().registerThreshold(threshold);
  }

  /**
   * Get a threshold
   */
  function getThreshold(id: string) {
    return ResourceSystem.getInstance().getThresholdSubsystem().getThreshold(id);
  }

  /**
   * Optimize resource flows
   */
  async function optimizeFlows() {
    return ResourceSystem.getInstance().getFlowSubsystem().optimizeFlows();
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
    getAllContainers: () => ResourceSystem.getInstance().getStorageSubsystem().getAllContainers(),
    getContainersByResourceType: (type: ResourceType) =>
      ResourceSystem.getInstance().getStorageSubsystem().getContainersByResourceType(type),
    transferBetweenContainers: (
      sourceId: string,
      targetId: string,
      type: ResourceType,
      amount: number
    ) =>
      ResourceSystem.getInstance()
        .getStorageSubsystem()
        .transferBetweenContainers(sourceId, targetId, type, amount),

    // Flow subsystem
    registerNode,
    getNode,
    getAllNodes: () => ResourceSystem.getInstance().getFlowSubsystem().getNodes(),
    registerConnection: (connection: FlowConnection) =>
      ResourceSystem.getInstance().getFlowSubsystem().registerConnection(connection),
    getConnection: (id: string) =>
      ResourceSystem.getInstance().getFlowSubsystem().getConnection(id),
    getAllConnections: () => ResourceSystem.getInstance().getFlowSubsystem().getConnections(),
    optimizeFlows,

    // Threshold subsystem
    registerThreshold,
    getThreshold,
    getAllThresholds: () => ResourceSystem.getInstance().getThresholdSubsystem().getAllThresholds(),
    getThresholdsByResourceType: (type: ResourceType) =>
      ResourceSystem.getInstance().getThresholdSubsystem().getThresholdsByResourceType(type),
    enableThreshold: (id: string) =>
      ResourceSystem.getInstance().getThresholdSubsystem().enableThreshold(id),
    disableThreshold: (id: string) =>
      ResourceSystem.getInstance().getThresholdSubsystem().disableThreshold(id),

    // Direct access to subsystems (for advanced use cases)
    storageSubsystem: ResourceSystem.getInstance().getStorageSubsystem(),
    flowSubsystem: ResourceSystem.getInstance().getFlowSubsystem(),
    thresholdSubsystem: ResourceSystem.getInstance().getThresholdSubsystem(),
    transferSubsystem: ResourceSystem.getInstance().getTransferSubsystem(),
  };
}

export default useResourceSystem;
