/**
 * ResourceConversionManager.ts
 *
 * This module handles resource conversion functionality extracted from ResourceFlowManager.
 * It manages conversion recipes, processes, and chains.
 */

import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { errorLoggingService, ErrorType } from '../../services/ErrorLoggingService'; // Import the service
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { ProcessStatus } from '../../types/resources/ProductionChainTypes';
import {
  ChainExecutionStatus,
  ConversionChain,
  ConverterFlowNode,
  ExtendedResourceConversionRecipe,
  ResourceConversionProcess,
  ResourceConversionRecipe,
} from '../../types/resources/ResourceConversionTypes';
import { FlowNode, FlowNodeType, ResourceType } from '../../types/resources/ResourceTypes';
import { ResourceFlowManager } from './ResourceFlowManager';
import { ConversionResult } from './ResourceFlowTypes'; // Assuming ResourceFlowEvent might be defined here

// Define a type for the payload of handleProcessUpdate using ProcessStatus
interface ProcessUpdatePayload {
  processId: string;
  status: ProcessStatus; // Use enum
  error?: string;
  progress?: number;
}

/**
 * Manager for resource conversion processes
 */
// @ts-expect-error: The Singleton class has a type compatibility issue that needs to be addressed at a higher level
// Make the manager extend AbstractBaseManager to get event emitting capabilities
export class ResourceConversionManager extends AbstractBaseManager<BaseEvent> {
  // Singleton instance
  private static _instance: ResourceConversionManager | null = null;

  /**
   * Get the singleton instance of ResourceConversionManager
   */
  public static getInstance(): ResourceConversionManager {
    if (!ResourceConversionManager._instance) {
      ResourceConversionManager._instance = new ResourceConversionManager();
    }
    return ResourceConversionManager._instance;
  }

  // Conversion processing
  private processingQueue: ResourceConversionProcess[] = [];
  private _completedProcesses: ResourceConversionProcess[] = [];
  private conversionRecipes: Map<string, ResourceConversionRecipe> = new Map();
  private conversionChains: Map<string, ConversionChain> = new Map();
  private chainExecutions: Map<string, ChainExecutionStatus> = new Map();

  // Intervals
  private processingInterval: number | null = null;
  private processingIntervalMs = 1000;

  // Resource flow settings
  private _resourceCapacityBuffer = 0.05; // 5% buffer to prevent overflow
  private _lastProcessingTime = 0;
  private maxHistorySize = 1000;

  // Add reference to hold the ResourceFlowManager instance
  private resourceFlowManager: ResourceFlowManager | null = null;

  // // Parent manager reference for event publishing - Handled by AbstractBaseManager now
  // private parentManager: AbstractBaseManager<ResourceFlowEvent> | null = null;

  private conversionProcesses: Map<string, ResourceConversionProcess> = new Map();
  private activeChains: Map<string, ChainExecutionStatus> = new Map();

  /**
   * Private constructor to enforce singleton pattern
   */
  protected constructor() {
    // Call super constructor with manager details
    super('ResourceConversionManager', '1.0.0');
  }

  // // Method to set parent manager is no longer needed if extending AbstractBaseManager
  // public setParentManager(manager: AbstractBaseManager<ResourceFlowEvent>): void {
  //   this.parentManager = manager;
  // }

  /**
   * Initialize the conversion manager
   */
  public override async initialize(): Promise<void> {
    // Use override keyword
    this.startProcessingInterval(this.processingIntervalMs);
    // Call super initialize if it exists and is needed
    await super.initialize?.();
  }

  /**
   * Dispose of resources
   */
  public override async dispose(): Promise<void> {
    // Use override keyword
    if (this.processingInterval !== null) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.processingQueue = [];
    this._completedProcesses = [];
    this.conversionRecipes.clear();
    this.conversionChains.clear();
    this.chainExecutions.clear();
    // Call super dispose if it exists and is needed
    await super.dispose?.();
  }

  /**
   * Sets the ResourceFlowManager instance.
   * Should be called during system initialization.
   */
  public setResourceFlowManager(manager: ResourceFlowManager): void {
    this.resourceFlowManager = manager;
  }

  /**
   * Register a conversion recipe
   */
  public registerConversionRecipe(recipe: ResourceConversionRecipe): boolean {
    if (!recipe.id) {
      return false;
    }

    this.conversionRecipes.set(recipe.id, recipe);
    return true;
  }

  /**
   * Register a conversion chain
   */
  public registerConversionChain(chain: ConversionChain): boolean {
    if (!chain.id) {
      return false;
    }

    this.conversionChains.set(chain.id, chain);
    return true;
  }

  /**
   * Start a conversion chain
   */
  public startConversionChain(chainId: string): boolean {
    const chain = this.conversionChains.get(chainId);
    if (!chain) {
      return false;
    }

    // Create chain execution status
    const executionStatus: ChainExecutionStatus = {
      executionId: `chain-exec-${chainId}-${Date.now()}`,
      chainId,
      active: true,
      paused: false,
      completed: false,
      failed: false,
      startTime: Date.now(),
      currentStepIndex: 0,
      recipeIds: chain.steps,
      estimatedEndTime: 0,
      progress: 0,
      resourceTransfers: [],
      stepStatus: chain.steps.map((recipeId: string) => ({
        recipeId,
        status: ProcessStatus.PENDING,
        startTime: 0,
        endTime: 0,
        processId: '',
      })),
    };

    this.chainExecutions.set(chainId, executionStatus);

    // Start the first step
    this.processNextChainStep(chainId);

    return true;
  }

  /**
   * Process next step in a conversion chain (now async)
   */
  private async processNextChainStep(chainId: string): Promise<void> {
    const status = this.chainExecutions.get(chainId);
    if (!status || !status.active || status.completed || status.failed) {
      return;
    }

    // Get the current step
    const { currentStepIndex } = status;
    if (currentStepIndex >= status.recipeIds.length) {
      // Chain is complete
      status.completed = true;
      status.active = false;
      return;
    }

    const currentRecipeId = status.recipeIds[currentStepIndex];
    const stepStatus = status.stepStatus[currentStepIndex];

    // If step is already in progress or completed, skip
    if (stepStatus.status !== ProcessStatus.PENDING) {
      return;
    }

    // Find a converter that can process this recipe
    const converters = this.getConvertersForRecipe(currentRecipeId);
    if (converters.length === 0) {
      status.failed = true;
      status.errorMessage = `No converters available for recipe ${currentRecipeId}`;
      return;
    }

    // Find an available converter
    let availableConverter: ConverterFlowNode | null = null;
    for (const converter of converters) {
      // Check if converter has capacity using activeProcessIds
      if (
        converter.configuration &&
        (converter.activeProcessIds?.length ?? 0) >= converter.configuration.maxConcurrentProcesses
      ) {
        continue;
      }

      availableConverter = converter;
      break;
    }

    if (!availableConverter) {
      return; // No available converters, try again later
    }

    // Start conversion process (now awaits)
    let result: ConversionResult | null = null;
    try {
      result = await this.startConversionProcess(availableConverter.id, currentRecipeId);
    } catch (error) {
      const errorMsg = `[RCM] Error during startConversionProcess for ${currentRecipeId}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      status.failed = true;
      status.errorMessage = errorMsg;
      // TODO: Publish CHAIN_FAILED event
      return;
    }

    if (!result?.success) {
      status.failed = true;
      status.errorMessage =
        result?.error || `Failed to start conversion for recipe ${currentRecipeId}`; // Access error from awaited result
      // TODO: Publish CHAIN_FAILED event
      return;
    }

    // Update step status
    stepStatus.status = ProcessStatus.IN_PROGRESS;
    stepStatus.startTime = Date.now();
    stepStatus.processId = result?.processId;
    stepStatus.converterId = availableConverter.id;

    // Emit event for chain step started
    // Now using the inherited publishEvent method
    this.publishEvent({
      type: EventType.CHAIN_STEP_STARTED, // Use specific chain event type
      chainId,
      stepIndex: currentStepIndex,
      recipeId: currentRecipeId,
      processId: result?.processId,
      converterId: availableConverter.id,
      // Add required BaseEvent properties
      moduleId: this.constructor.name, // Use manager name
      moduleType: 'resource-manager' as ModuleType, // Adjust as needed
      timestamp: Date.now(),
      data: {
        type: 'CHAIN_STEP_STARTED', // Custom type within data
        chainId,
        stepIndex: currentStepIndex,
        recipeId: currentRecipeId,
        processId: result?.processId,
        converterId: availableConverter.id,
      },
    });
  }

  /**
   * Get converters that can handle a specific recipe
   */
  private getConvertersForRecipe(recipeId: string): ConverterFlowNode[] {
    const recipe = this.conversionRecipes.get(recipeId);
    if (!recipe) {
      console.warn(`[RCM] Recipe ${recipeId} not found when searching for converters.`);
      return [];
    }

    try {
      // Use the stored reference, check for null
      if (!this.resourceFlowManager) {
        console.error('[RCM] ResourceFlowManager not set. Cannot get converters.');
        return [];
      }
      const allNodes = this.resourceFlowManager.getNodes();
      // Filter for nodes of type CONVERTER
      const allConverters = allNodes.filter(
        (node: FlowNode): node is ConverterFlowNode => node.type === FlowNodeType.CONVERTER
      );

      // Filter converters based on supportedRecipeIds
      const suitableConverters = allConverters.filter((converter: ConverterFlowNode) => {
        // Check if the converter explicitly supports the recipe ID
        return converter.supportedRecipeIds?.includes(recipeId);
      });

      if (suitableConverters.length === 0) {
        console.warn(`[RCM] No suitable converters found supporting recipe ${recipeId}`);
      }

      return suitableConverters;
    } catch (error) {
      console.error(`[RCM] Error fetching or filtering converters for recipe ${recipeId}:`, error);
      return [];
    }
  }

  /**
   * Start the processing interval
   */
  private startProcessingInterval(interval: number): void {
    if (this.processingInterval !== null) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processConversions();
    }, interval) as unknown as number;
  }

  /**
   * Process active conversions
   */
  private processConversions(): void {
    // Process each active conversion
    for (let i = 0; i < this.processingQueue.length; i++) {
      const process = this.processingQueue[i];
      if (!process.active || process.paused) {
        continue;
      }

      // Update progress
      const now = Date.now();
      const elapsed = now - process.startTime;
      const recipe = this.conversionRecipes.get(
        process.recipeId
      ) as ExtendedResourceConversionRecipe;
      if (!recipe) {
        continue;
      }

      const duration = recipe.processingTime;
      process.progress = Math.min(1, elapsed / duration);

      // Check if process is complete
      if (process.progress >= 1) {
        this.completeProcess(process);
        this.processingQueue.splice(i, 1);
        i--;
      }
    }

    // Limit history size
    if (this._completedProcesses.length > this.maxHistorySize) {
      this._completedProcesses = this._completedProcesses.slice(
        this._completedProcesses.length - this.maxHistorySize
      );
    }
  }

  /**
   * Complete a conversion process (now async)
   */
  private async completeProcess(process: ResourceConversionProcess): Promise<void> {
    // Make async
    // Mark process as complete
    process.active = false;
    process.progress = 1;
    process.endTime = Date.now();

    // Get the recipe
    const recipe = this.conversionRecipes.get(process.recipeId) as ExtendedResourceConversionRecipe;
    if (!recipe) {
      console.error(
        `[RCM] Recipe ${process.recipeId} not found for completed process ${process.processId}.`
      );
      return;
    }

    // Get the converter (needed for efficiency calculation if not already stored in process)
    // Assuming we can retrieve the node info from the flow manager using process.sourceId
    let efficiency = process.appliedEfficiency; // Use pre-calculated if available
    if (efficiency === undefined || efficiency === null) {
      // Recalculate if not applied earlier (e.g., if _applyEfficiencyToProcess wasn't called)
      try {
        // Use the stored reference, check for null
        if (!this.resourceFlowManager) {
          throw new Error('[RCM] ResourceFlowManager not set. Cannot get converter node.');
        }
        const converterNode = this.resourceFlowManager.getNode(process.sourceId);
        if (converterNode && converterNode.type === FlowNodeType.CONVERTER) {
          efficiency = this.calculateConverterEfficiency(
            converterNode as ConverterFlowNode,
            recipe
          );
          process.appliedEfficiency = efficiency; // Store it back
        } else {
          console.warn(
            `[RCM] Converter node ${process.sourceId} not found or invalid for efficiency calc.`
          );
          efficiency = 0; // Default to 0 if converter not found
        }
      } catch (error) {
        console.error(
          `[RCM] Error getting converter/calculating efficiency for process ${process.processId}:`,
          error
        );
        efficiency = 0; // Default to 0 on error
      }
    }
    efficiency = Math.max(0, Math.min(efficiency, 2)); // Clamp efficiency

    // Adjust outputs based on efficiency
    const efficientOutputs = recipe.outputs.map(output => ({
      ...output,
      amount: Math.floor(output.amount * efficiency), // Apply efficiency, ensure integer amount
    }));

    // Check if this process is part of an active chain and if there's a next step
    let partOfActiveChain = false;
    let nextStepExists = false;
    let nextConverterId: string | undefined = undefined;
    let chainIdForProcess: string | undefined = undefined;
    let nextStepIndex = -1; // Store next step index

    for (const [chainId, chainStatus] of this.chainExecutions.entries()) {
      const stepIndex = chainStatus.stepStatus.findIndex(
        step => step.processId === process.processId
      );
      if (stepIndex !== -1) {
        chainIdForProcess = chainId;
        partOfActiveChain = chainStatus.active;
        nextStepExists = stepIndex < chainStatus.recipeIds.length - 1;
        if (nextStepExists) {
          nextStepIndex = stepIndex + 1;
          // Try to find the converter for the next step (if processNextChainStep assigned it)
          // If processNextChainStep hasn't run yet for the next step, converterId might be undefined
          nextConverterId = chainStatus.stepStatus[nextStepIndex]?.converterId;
        }
        break;
      }
    }

    let transferredDirectly = false; // Flag for successful direct transfer
    // Attempt Direct Resource Transfer between chain steps.
    if (partOfActiveChain && nextStepExists) {
      // We need the target converter ID for the *next* step.
      // If processNextChainStep hasn't assigned it yet, we might need to determine it here
      // or assume resources go to a temporary holding area/back to source node.
      // For now, assume transfer only happens if nextConverterId is known.
      if (nextConverterId && this.resourceFlowManager) {
        console.log(
          `[RCM] Attempting direct transfer from ${process.sourceId} to ${nextConverterId}`
        );
        try {
          transferredDirectly = await this.resourceFlowManager.transferResources(
            process.sourceId,
            nextConverterId,
            efficientOutputs
          );
          if (!transferredDirectly) {
            console.warn(
              `[RCM] Direct transfer failed from ${process.sourceId} to ${nextConverterId}. Resources will be added back to source.`
            );
          }
        } catch (error) {
          const errorMsg = `[RCM] Error during direct transfer: ${error instanceof Error ? error.message : String(error)}`;
          console.error(errorMsg);
          errorLoggingService.logError(new Error(errorMsg), ErrorType.RUNTIME, undefined, {
            /* context */
          });
          transferredDirectly = false; // Ensure flag is false on error
        }
      } else {
        console.warn(
          `[RCM] Cannot attempt direct transfer: Next converter ID for step ${nextStepIndex} is unknown.`
        );
      }
    }

    // Add resources back to the current converter ONLY if not transferred directly.
    if (!transferredDirectly) {
      if (this.resourceFlowManager) {
        try {
          await this.resourceFlowManager.addResources(process.sourceId, efficientOutputs);
        } catch (error) {
          // Log error if adding resources fails - Pass the error object
          errorLoggingService.logError(
            error instanceof Error ? error : new Error(String(error)), // Pass error here
            ErrorType.RUNTIME,
            undefined,
            {
              /* context */
            }
          );
        }
      } else {
        console.error('[RCM] ResourceFlowManager not set. Cannot add completed resources.');
      }
    }

    // Remove process from converter node's active list
    if (this.resourceFlowManager) {
      const converterNode = this.resourceFlowManager.getNode(process.sourceId);
      if (converterNode && converterNode.type === FlowNodeType.CONVERTER) {
        const currentActiveIds = (converterNode as ConverterFlowNode).activeProcessIds || [];
        const updatedNodeData: Partial<ConverterFlowNode> = {
          activeProcessIds: currentActiveIds.filter(id => id !== process.processId),
          // Potentially update status if it becomes idle?
          // status: (currentActiveIds.length - 1 === 0) ? ConverterStatus.INACTIVE : converterNode.status
        };
        try {
          await this.resourceFlowManager.updateNodeData(process.sourceId, updatedNodeData);
        } catch (error) {
          const errorMsg = `[RCM] Error updating node ${process.sourceId} after completing process ${process.processId}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(errorMsg);
          errorLoggingService.logError(new Error(errorMsg), ErrorType.RUNTIME, undefined, {
            /* context */
          });
          // Node update failed, but process is complete. Log and continue.
        }
      } else {
        console.warn(
          `[RCM] Could not find converter node ${process.sourceId} to remove completed process ${process.processId}.`
        );
      }
    }

    // Publish completion event with *efficient* outputs
    this.publishEvent({
      type: EventType.RESOURCE_UPDATED, // Revert to RESOURCE_UPDATED
      moduleId: this.constructor.name,
      moduleType: 'resource-manager' as ModuleType,
      timestamp: Date.now(),
      data: {
        type: 'RESOURCE_UPDATED',
        processId: process.processId,
        recipeId: process.recipeId,
        converterId: process.sourceId,
        inputs: recipe.inputs,
        outputs: efficientOutputs, // Use adjusted outputs
        efficiency: efficiency, // Use calculated efficiency
      },
    });

    // Update chain execution if this process is part of a chain
    // (Moved chain check logic earlier to handle resource transfer/addition)
    if (chainIdForProcess) {
      const chainStatus = this.chainExecutions.get(chainIdForProcess);
      if (chainStatus) {
        const stepIndex = chainStatus.stepStatus.findIndex(
          step => step.processId === process.processId
        );
        if (stepIndex !== -1) {
          // Mark step as complete
          chainStatus.stepStatus[stepIndex].status = ProcessStatus.COMPLETED;
          chainStatus.stepStatus[stepIndex].endTime = Date.now();

          // Move to next step index
          chainStatus.currentStepIndex = stepIndex + 1;

          // Publish CHAIN_STEP_COMPLETED event
          this.publishEvent({
            type: EventType.CHAIN_STEP_COMPLETED,
            moduleId: this.constructor.name,
            moduleType: 'resource-manager' as ModuleType,
            timestamp: Date.now(),
            data: {
              chainId: chainIdForProcess,
              stepIndex: stepIndex,
              processId: process.processId,
              recipeId: chainStatus.stepStatus[stepIndex].recipeId,
              converterId: chainStatus.stepStatus[stepIndex].converterId,
              outputs: efficientOutputs, // Include outputs
              efficiency: efficiency,
            },
          });

          // Check if this was the last step
          if (chainStatus.currentStepIndex >= chainStatus.recipeIds.length) {
            chainStatus.completed = true;
            chainStatus.active = false;
            // Publish CHAIN_COMPLETED event
            this.publishEvent({
              type: EventType.CHAIN_COMPLETED,
              moduleId: this.constructor.name,
              moduleType: 'resource-manager' as ModuleType,
              timestamp: Date.now(),
              data: {
                chainId: chainIdForProcess,
                finalOutputs: efficientOutputs, // Or aggregate outputs?
              },
            });
          } else {
            // Process the next step if chain is not complete
            this.processNextChainStep(chainIdForProcess);
          }
        }
      }
    }
  }

  /**
   * Start a conversion process (now async)
   */
  // Make async and return Promise<ConversionResult>
  private async startConversionProcess(
    converterId: string,
    recipeId: string
  ): Promise<ConversionResult> {
    if (!this.resourceFlowManager) {
      const errorMsg = '[RCM] ResourceFlowManager not set. Cannot start conversion process.';
      console.error(errorMsg);
      return { success: false, error: errorMsg, recipeId, processId: '' };
    }

    const recipe = this.conversionRecipes.get(recipeId);
    const converterNode = this.resourceFlowManager.getNode(converterId);

    if (!recipe) {
      const errorMsg = `[RCM] Recipe ${recipeId} not found.`;
      console.error(errorMsg);
      return { success: false, error: errorMsg, recipeId, processId: '' };
    }

    if (!converterNode || converterNode.type !== FlowNodeType.CONVERTER) {
      const errorMsg = `[RCM] Converter node ${converterId} not found or invalid.`;
      console.error(errorMsg);
      return { success: false, error: errorMsg, recipeId, processId: '' };
    }

    // Check resource availability (now uses await)
    let hasResources = false;
    try {
      hasResources = await this.resourceFlowManager.checkResourcesAvailable(
        converterId,
        recipe.inputs
      );
    } catch (error) {
      const errorMsg = `[RCM] Error checking resources on ${converterId}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg, recipeId, processId: '' };
    }

    if (!hasResources) {
      const errorMsg = `[RCM] Insufficient resources on ${converterId} for recipe ${recipeId}.`;
      console.warn(errorMsg);
      return { success: false, error: errorMsg, recipeId, processId: '' };
    }

    // Consume resources (now uses await)
    let consumed = false;
    try {
      consumed = await this.resourceFlowManager.consumeResources(converterId, recipe.inputs);
    } catch (error) {
      const errorMsg = `[RCM] Error consuming resources on ${converterId}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      // TODO: Consider resource rollback logic here if consumption fails mid-way through multiple resources
      return { success: false, error: errorMsg, recipeId, processId: '' };
    }

    if (!consumed) {
      // This might happen if resources became unavailable between check and consume
      const errorMsg = `[RCM] Failed to consume resources on ${converterId} for recipe ${recipeId} (potentially unavailable now).`;
      console.error(errorMsg);
      return { success: false, error: errorMsg, recipeId, processId: '' };
    }

    // --- If resource checks/consumption succeed ---

    // Create and register the process
    const processId = `proc_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
    const newProcess: ResourceConversionProcess = {
      processId,
      recipeId,
      sourceId: converterId,
      active: true,
      paused: false,
      startTime: Date.now(),
      progress: 0,
      appliedEfficiency: 0, // Will be calculated next
    };

    // Calculate and apply efficiency
    this._applyEfficiencyToProcess(newProcess, converterNode);

    this.conversionProcesses.set(processId, newProcess);
    this.processingQueue.push(newProcess); // Add to active processing queue

    // Update the converter node state
    const currentActiveIds = (converterNode as ConverterFlowNode).activeProcessIds || [];
    const updatedNodeData: Partial<ConverterFlowNode> = {
      activeProcessIds: [...currentActiveIds, processId],
      // status: ConverterStatus.ACTIVE
    };

    // Update node (now uses await)
    try {
      await this.resourceFlowManager.updateNodeData(converterId, updatedNodeData);
    } catch (error) {
      const errorMsg = `[RCM] Error updating node ${converterId} after starting process ${processId}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      // Process started, but node update failed. Log and continue, but maybe flag the node?
      // Or should we try to roll back the process? For now, just log.
      errorLoggingService.logError(new Error(errorMsg), ErrorType.RUNTIME, undefined, {
        context: 'startConversionProcess - updateNodeData',
        processId: processId,
        converterId: converterId,
        manager: this.managerName,
      });
    }

    // Publish PROCESS_STARTED event (or similar)
    this.publishEvent({
      type: EventType.RESOURCE_UPDATED, // Placeholder type
      moduleId: this.constructor.name,
      moduleType: 'resource-manager' as ModuleType,
      timestamp: Date.now(),
      data: {
        type: 'PROCESS_STARTED',
        process: newProcess,
      },
    });

    return {
      success: true,
      processId,
      recipeId,
    };
  }

  /**
   * Apply efficiency to a conversion process
   * @private
   */
  private _applyEfficiencyToProcess(
    process: ResourceConversionProcess,
    converterNode: FlowNode
  ): void {
    // 1. Verify the node is actually a converter
    if (converterNode.type !== FlowNodeType.CONVERTER) {
      console.error(
        `[RCM] Attempted to apply efficiency using a non-converter node (${converterNode.id}) for process ${process.processId}`
      );
      process.appliedEfficiency = 0; // Or handle error appropriately
      return;
    }
    // Cast to ConverterFlowNode after check
    const converter = converterNode as ConverterFlowNode;

    // 2. Get the recipe
    const recipe = this.conversionRecipes.get(process.recipeId) as ExtendedResourceConversionRecipe;
    if (!recipe) {
      console.error(
        `[RCM] Recipe ${process.recipeId} not found for process ${process.processId} during efficiency calculation.`
      );
      process.appliedEfficiency = 0; // Or handle error
      return;
    }

    // 3. Calculate efficiency
    try {
      const efficiency = this.calculateConverterEfficiency(converter, recipe);
      // 4. Apply the calculated efficiency to the process
      process.appliedEfficiency = Math.max(0, Math.min(efficiency, 2)); // Clamp efficiency (e.g., 0% to 200%)

      // Log the efficiency application for debugging/monitoring
      errorLoggingService.logInfo(
        `Applied efficiency ${process.appliedEfficiency.toFixed(2)} to process ${process.processId} on converter ${converter.id}`,
        {
          service: 'ResourceConversionManager',
          method: 'applyEfficiency',
          processId: process.processId,
          converterId: converter.id,
          efficiency: process.appliedEfficiency,
        }
      );
    } catch (error) {
      console.error(
        `[RCM] Error calculating efficiency for process ${process.processId} on converter ${converter.id}:`,
        error
      );
      process.appliedEfficiency = 0; // Default to 0 on error
    }
  }

  /**
   * Apply efficiency to conversion outputs
   * @private
   */
  private _applyEfficiencyToOutputs(
    _result: ConversionResult,
    _efficiency: number
  ): ConversionResult {
    // Implementation would apply efficiency to outputs
    // For now, return the input result
    return _result;
  }

  /**
   * Calculate the efficiency of a converter for a specific recipe
   */
  private calculateConverterEfficiency(
    converter: ConverterFlowNode,
    recipe: ExtendedResourceConversionRecipe
  ): number {
    // Base efficiency from recipe
    let efficiency = recipe.baseEfficiency || 1;

    // Apply converter efficiency
    if (converter.efficiency) {
      efficiency *= converter.efficiency;
    }

    // Apply converter config modifiers
    if (converter.configuration?.efficiencyModifiers) {
      const recipeModifier = converter.configuration.efficiencyModifiers[recipe.id] || 1;
      efficiency *= recipeModifier;
    }

    // Apply resource quality factors
    // Cast to the required type to fix the type compatibility issue
    const inputs = recipe.inputs as unknown as { type: ResourceType | number; amount: number }[];
    const qualityFactors = this.calculateResourceQualityFactors(inputs);

    // Apply quality factors
    Object.entries(qualityFactors).forEach(([_key, value]) => {
      efficiency *= value;
    });

    // Apply network stress factor
    const stressFactor = this.calculateNetworkStressFactor(converter);
    efficiency *= stressFactor;

    return efficiency;
  }

  /**
   * Calculate resource quality factors for a set of inputs
   */
  private calculateResourceQualityFactors(
    _inputs: { type: ResourceType | number; amount: number }[]
  ): Record<string, number> {
    // Implementation would calculate quality factors
    // For now, return a placeholder object
    return {
      quality: 1,
    };
  }

  /**
   * Calculate network stress factor for a converter
   */
  private calculateNetworkStressFactor(converter: ConverterFlowNode): number {
    // Basic implementation: stress increases as the converter approaches max capacity.
    const maxProcesses = converter.configuration?.maxConcurrentProcesses || 1;
    // Use activeProcessIds.length
    const activeProcesses = converter.activeProcessIds?.length ?? 0;

    if (maxProcesses <= 0) {
      return 1.0; // Avoid division by zero if config is invalid
    }

    const loadRatio = activeProcesses / maxProcesses;

    // Example stress calculation: efficiency decreases linearly from 100% to 80% as load goes from 0% to 100%
    const stressFactor = 1.0 - loadRatio * 0.2;

    // Clamp the factor between a reasonable minimum (e.g., 0.5) and 1.0
    return Math.max(0.5, Math.min(stressFactor, 1.0));
  }

  // Add proper type to the payload parameter
  private handleProcessUpdate = (payload: ProcessUpdatePayload): void => {
    const { processId, status, error } = payload;

    // Find the process in the conversionProcesses map
    const process = this.conversionProcesses.get(processId);
    if (!process) {
      console.warn(`[RCM] Process ${processId} not found for update.`);
      return;
    }

    // Update process state (process is of type ResourceConversionProcess)
    process.active = status === ProcessStatus.IN_PROGRESS;
    process.paused = status === ProcessStatus.PAUSED;

    // If completed or failed, set end time
    if (status === ProcessStatus.COMPLETED || status === ProcessStatus.FAILED) {
      process.endTime = Date.now();
      // Optionally remove from active processes if truly finished
      // this.conversionProcesses.delete(processId);
    }

    // Update progress (assuming progress is part of the payload)
    if (payload?.progress !== undefined) {
      process.progress = payload.progress;
    }

    // Log error if present
    if (error) {
      console.error(`[RCM] Error in conversion process ${processId}:`, error);
      // Handle error state appropriately
    }

    this.conversionProcesses.set(processId, process);

    // Notify listeners using the inherited publishEvent method
    this.publishEvent({
      type: EventType.RESOURCE_UPDATED, // Revert to RESOURCE_UPDATED
      moduleId: this.constructor.name,
      moduleType: 'resource-manager' as ModuleType,
      timestamp: Date.now(),
      data: {
        type: 'PROCESS_UPDATED', // Custom type within data
        process,
      },
    });

    // Find the related chain and update its status
    for (const chainStatus of this.activeChains.values()) {
      if (chainStatus.stepStatus.some(step => step.processId === processId)) {
        const stepIndex = chainStatus.stepStatus.findIndex(step => step.processId === processId);
        if (stepIndex !== -1) {
          chainStatus.stepStatus[stepIndex].status = status;
          if (status === ProcessStatus.COMPLETED || status === ProcessStatus.FAILED) {
            chainStatus.stepStatus[stepIndex].endTime = Date.now();
          }
          // Update overall chain progress
          chainStatus.progress = this.calculateChainProgress(chainStatus);
          this.activeChains.set(chainStatus.chainId, chainStatus);
          // Notify listeners about chain status update
          this.publishEvent({
            type: EventType.CHAIN_STATUS_UPDATED, // Use specific chain status update event
            moduleId: this.constructor.name,
            moduleType: 'resource-manager' as ModuleType,
            timestamp: Date.now(),
            data: {
              type: 'CHAIN_STATUS_UPDATED', // Custom type within data
              chainStatus,
            },
          });
        }
        break; // Assume process belongs to only one active chain
      }
    }
  };

  private calculateChainProgress(chainStatus: ChainExecutionStatus): number {
    // Calculate progress based on completed steps
    const completedSteps = chainStatus.stepStatus.filter(
      step => step.status === ProcessStatus.COMPLETED
    ).length;
    return completedSteps / chainStatus.recipeIds.length;
  }
}
