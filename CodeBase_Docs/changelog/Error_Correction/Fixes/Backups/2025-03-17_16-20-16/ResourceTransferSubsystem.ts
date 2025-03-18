import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import {
  ResourceTransfer as StringResourceTransfer,
  ResourceType as StringResourceType,
} from '../../types/resources/ResourceTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";
import { ResourceType } from "./../../types/resources/ResourceTypes";
import { ResourceSystem, ResourceSystemConfig } from '../ResourceSystem';

/**
 * ResourceTransferSubsystem
 *
 * Handles resource transfers between entities
 * - Direct transfers between entities
 * - Transfer history tracking
 * - Transfer validation and error handling
 */
export class ResourceTransferSubsystem {
  private transferHistory: StringResourceTransfer[] = [];
  private parentSystem: ResourceSystem;
  private config: ResourceSystemConfig;
  private isInitialized = false;

  constructor(parentSystem: ResourceSystem, config: ResourceSystemConfig) {
    this.parentSystem = parentSystem;
    this.config = config;
  }

  /**
   * Initialize the subsystem
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize event subscriptions
      this.initializeEventSubscriptions();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ResourceTransferSubsystem:', error);
      throw error;
    }
  }

  /**
   * Dispose of the subsystem
   */
  public async dispose(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Unsubscribe from events
      eventSystem.clearSubscriptions(undefined, this.constructor.name);

      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to dispose ResourceTransferSubsystem:', error);
      throw error;
    }
  }

  /**
   * Initialize event subscriptions
   */
  private initializeEventSubscriptions(): void {
    eventSystem.subscribe(
      'resource.transfer.request',
      this.handleTransferRequest,
      {},
      this.constructor.name
    );
  }

  /**
   * Handle transfer request events
   */
  private handleTransferRequest = (event: Record<string, unknown>): void => {
    const { type, amount, sourceId, targetId } = event as {
      type: StringResourceType | ResourceType;
      amount: number;
      sourceId: string;
      targetId: string;
    };

    this.transferResource(type, amount, sourceId, targetId);

    // Publish transfer completed event
    eventSystem.publish({
      type: 'RESOURCE_TRANSFERRED',
      resourceType: type,
      amount,
      sourceId,
      targetId,
      timestamp: Date.now(),
    });
  };

  /**
   * Transfer resources between entities
   */
  public transferResource(
    type: StringResourceType | ResourceType,
    amount: number,
    sourceId: string,
    targetId: string
  ): number {
    if (amount <= 0 || sourceId === targetId) {
      return 0;
    }

    // Convert to string resource type for internal use
    const stringType = ensureStringResourceType(type);

    // Get storage subsystem
    const storageSubsystem = this.parentSystem.getStorageSubsystem();

    // Retrieve from source
    const retrievedAmount = storageSubsystem.retrieveResource(sourceId, stringType, amount);

    if (retrievedAmount <= 0) {
      return 0;
    }

    // Store in target
    const storedAmount = storageSubsystem.storeResource(targetId, stringType, retrievedAmount);

    // If not all was stored, return remainder to source
    if (storedAmount < retrievedAmount) {
      const remainder = retrievedAmount - storedAmount;
      storageSubsystem.storeResource(sourceId, stringType, remainder);
    }

    // Record transfer
    this.recordTransfer({
      type: stringType,
      source: sourceId,
      target: targetId,
      amount: storedAmount,
      timestamp: Date.now(),
    });

    return storedAmount;
  }

  /**
   * Bulk transfer resources between multiple sources and targets
   */
  public bulkTransfer(
    transfers: {
      type: StringResourceType | ResourceType;
      amount: number;
      sourceId: string;
      targetId: string;
    }[]
  ): { transferred: number; totalRequested: number } {
    let totalTransferred = 0;
    let totalRequested = 0;

    for (const transfer of transfers) {
      totalRequested += transfer.amount;
      totalTransferred += this.transferResource(
        transfer.type,
        transfer.amount,
        transfer.sourceId,
        transfer.targetId
      );
    }

    return {
      transferred: totalTransferred,
      totalRequested,
    };
  }

  /**
   * Record a resource transfer in the history
   */
  private recordTransfer(transfer: StringResourceTransfer): void {
    // Add to history
    this.transferHistory.push(transfer);

    // Trim history if it exceeds the configured maximum
    if (this.config.maxHistorySize && this.transferHistory.length > this.config.maxHistorySize) {
      this.transferHistory = this.transferHistory.slice(
        this.transferHistory.length - this.config.maxHistorySize
      );
    }

    // Publish transfer event
    eventSystem.publish({
      type: 'RESOURCE_TRANSFERRED',
      resourceType: transfer.type,
      source: transfer.source,
      target: transfer.target,
      amount: transfer.amount,
      timestamp: Date.now(),
    });
  }

  /**
   * Get all transfer history
   */
  public getTransferHistory(): StringResourceTransfer[] {
    return [...this.transferHistory];
  }

  /**
   * Get transfer history for a specific resource type
   */
  public getTransfersByType(type: StringResourceType | ResourceType): StringResourceTransfer[] {
    const stringType = ensureStringResourceType(type);
    return this.transferHistory.filter(transfer => transfer.type === stringType);
  }

  /**
   * Get transfers involving a specific entity (as source or target)
   */
  public getTransfersByEntity(entityId: string): StringResourceTransfer[] {
    return this.transferHistory.filter(
      transfer => transfer.source === entityId || transfer.target === entityId
    );
  }

  /**
   * Get transfers between specific entities
   */
  public getTransfersBetween(sourceId: string, targetId: string): StringResourceTransfer[] {
    return this.transferHistory.filter(
      transfer => transfer.source === sourceId && transfer.target === targetId
    );
  }

  /**
   * Calculate net flow between entities
   */
  public calculateNetFlow(
    entityId: string,
    resourceType?: StringResourceType | ResourceType
  ): Record<string, number> {
    const netFlow: Record<string, number> = {};

    // Convert resource type if provided
    const stringType = resourceType ? ensureStringResourceType(resourceType) : undefined;

    // Filter transfers involving this entity
    const relevantTransfers = this.transferHistory.filter(
      transfer =>
        (transfer.source === entityId || transfer.target === entityId) &&
        (!stringType || transfer.type === stringType)
    );

    for (const transfer of relevantTransfers) {
      // Calculate the other entity ID
      const otherEntityId = transfer.source === entityId ? transfer.target : transfer.source;

      // Calculate flow direction - positive for incoming, negative for outgoing
      const flowAmount = transfer.source === entityId ? -transfer.amount : transfer.amount;

      // Update net flow
      netFlow[otherEntityId] = (netFlow[otherEntityId] || 0) + flowAmount;
    }

    return netFlow;
  }
}
