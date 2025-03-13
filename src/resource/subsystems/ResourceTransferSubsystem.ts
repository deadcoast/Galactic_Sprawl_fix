import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import { ResourceTransfer, ResourceType } from '../../types/resources/ResourceTypes';
import { validateResourceTransfer } from '../../utils/resources/resourceValidation';
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
  private transferHistory: ResourceTransfer[] = [];
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
      // Clear transfer history
      this.transferHistory = [];
      
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
    // Subscribe to relevant events
    eventSystem.subscribe('RESOURCE_TRANSFER_REQUESTED', this.handleTransferRequest);
  }

  /**
   * Handle a transfer request event
   */
  private handleTransferRequest = (event: any): void => {
    const { type, amount, sourceId, targetId } = event;
    
    this.transferResource(type, amount, sourceId, targetId);
  };

  /**
   * Transfer resources between entities
   */
  public transferResource(
    type: ResourceType,
    amount: number,
    sourceId: string,
    targetId: string
  ): number {
    if (amount <= 0 || sourceId === targetId) {
      return 0;
    }

    // Get storage subsystem
    const storageSubsystem = this.parentSystem.getStorageSubsystem();

    // Retrieve from source
    const retrievedAmount = storageSubsystem.retrieveResource(sourceId, type, amount);

    if (retrievedAmount <= 0) {
      return 0;
    }

    // Store in target
    const storedAmount = storageSubsystem.storeResource(targetId, type, retrievedAmount);

    // If not all was stored, return remainder to source
    if (storedAmount < retrievedAmount) {
      const remainder = retrievedAmount - storedAmount;
      storageSubsystem.storeResource(sourceId, type, remainder);
    }

    // Record transfer
    this.recordTransfer({
      type,
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
  public bulkTransfer(transfers: {
    type: ResourceType;
    amount: number;
    sourceId: string;
    targetId: string;
  }[]): { transferred: number; totalRequested: number } {
    let totalTransferred = 0;
    let totalRequested = 0;

    for (const transfer of transfers) {
      totalRequested += transfer.amount;
      const transferred = this.transferResource(
        transfer.type,
        transfer.amount,
        transfer.sourceId,
        transfer.targetId
      );
      totalTransferred += transferred;
    }

    return {
      transferred: totalTransferred,
      totalRequested,
    };
  }

  /**
   * Record a transfer in the history
   */
  private recordTransfer(transfer: ResourceTransfer): void {
    // Validate transfer
    if (!validateResourceTransfer(transfer)) {
      console.warn('Invalid transfer:', transfer);
      return;
    }
    
    // Add to history
    this.transferHistory.push(transfer);

    // Trim history if needed
    if (this.transferHistory.length > this.config.maxHistorySize) {
      this.transferHistory = this.transferHistory.slice(-this.config.maxHistorySize);
    }

    // Emit transfer event
    eventSystem.publish({
      type: 'RESOURCE_TRANSFERRED',
      transfer,
      timestamp: Date.now(),
    });
  }

  /**
   * Get all transfer history
   */
  public getTransferHistory(): ResourceTransfer[] {
    return [...this.transferHistory];
  }

  /**
   * Get transfer history for a specific resource type
   */
  public getTransfersByType(type: ResourceType): ResourceTransfer[] {
    return this.transferHistory.filter(transfer => transfer.type === type);
  }

  /**
   * Get transfers involving a specific entity (as source or target)
   */
  public getTransfersByEntity(entityId: string): ResourceTransfer[] {
    return this.transferHistory.filter(
      transfer => transfer.source === entityId || transfer.target === entityId
    );
  }

  /**
   * Get transfers between specific entities
   */
  public getTransfersBetween(sourceId: string, targetId: string): ResourceTransfer[] {
    return this.transferHistory.filter(
      transfer => transfer.source === sourceId && transfer.target === targetId
    );
  }

  /**
   * Calculate net flow between entities
   */
  public calculateNetFlow(
    entityId: string,
    resourceType?: ResourceType
  ): Record<string, number> {
    const netFlow: Record<string, number> = {};
    
    // Filter transfers involving this entity
    const relevantTransfers = this.transferHistory.filter(
      transfer => 
        (transfer.source === entityId || transfer.target === entityId) && 
        (!resourceType || transfer.type === resourceType)
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