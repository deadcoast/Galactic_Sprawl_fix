/**
 * ResourceConversionManager.ts
 *
 * This module handles resource conversion functionality extracted from ResourceFlowManager.
 * It manages conversion recipes, processes, and chains.
 */

import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { errorLoggingService } from '../../services/ErrorLoggingService'; // Import the service
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import {
  ChainExecutionStatus,
  ConversionChain,
  ConverterFlowNode,
  ExtendedResourceConversionRecipe,
  ResourceConversionProcess, // Import the correct base type
  ResourceConversionRecipe
} from '../../types/resources/ResourceConversionTypes';
import {
  FlowNode,
  FlowNodeType,
  ResourceType
} from '../../types/resources/ResourceTypes';
import { ResourceFlowManager } from './ResourceFlowManager'; // Import the class, not an instance
import {
  ConversionResult,
} from './ResourceFlowTypes'; // Assuming ResourceFlowEvent might be defined here

// Define a type for the payload of handleProcessUpdate
interface ProcessUpdatePayload {
  processId: string;
  status: 'pending' | 'in-progress' | 'in_progress' | 'completed' | 'failed' | 'paused';
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
  public override async initialize(): Promise<void> { // Use override keyword
    this.startProcessingInterval(this.processingIntervalMs);
    // Call super initialize if it exists and is needed
    await super.initialize?.();
  }

  /**
   * Dispose of resources
   */
  public override async dispose(): Promise<void> { // Use override keyword
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
    const status: ChainExecutionStatus = {
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
        status: 'pending',
        startTime: 0,
        endTime: 0,
        processId: '',
      })),
    };

    this.chainExecutions.set(chainId, status);

    // Start the first step
    this.processNextChainStep(chainId);

    return true;
  }

  /**
   * Process next step in a conversion chain
   */
  private processNextChainStep(chainId: string): void {
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

    const currentRecipeId = status.recipeIds[ currentStepIndex ];
    const stepStatus = status.stepStatus[ currentStepIndex ];

    // If step is already in progress or completed, skip
    if (stepStatus.status !== 'pending') {
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
      // Check if converter has capacity
      if (
        converter.status &&
        converter.configuration &&
        converter.status.activeProcesses.length >=
        converter.configuration.maxConcurrentProcesses
      ) {
        continue;
      }

      availableConverter = converter;
      break;
    }

    if (!availableConverter) {
      return; // No available converters, try again later
    }

    // Start conversion process
    const result = this.startConversionProcess(availableConverter.id, currentRecipeId);
    if (!result?.success) {
      status.failed = true;
      status.errorMessage =
        result?.error || `Failed to start conversion for recipe ${currentRecipeId}`;
      return;
    }

    // Update step status
    stepStatus.status = 'in-progress';
    stepStatus.startTime = Date.now();
    stepStatus.processId = result?.processId;
    stepStatus.converterId = availableConverter.id;

    // Emit event for chain step started
    // Now using the inherited publishEvent method
    this.publishEvent({
      type: EventType.RESOURCE_UPDATED, // Use a valid EventType value
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
      const flowManager = ResourceFlowManager.getInstance();
      const allNodes = flowManager.getNodes();
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
      const process = this.processingQueue[ i ];
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
   * Complete a conversion process
   */
  private completeProcess(process: ResourceConversionProcess): void {
    // Mark process as complete
    process.active = false;
    process.progress = 1;
    process.endTime = Date.now();

    // Get the recipe
    const recipe = this.conversionRecipes.get(process.recipeId) as ExtendedResourceConversionRecipe;
    if (!recipe) {
      console.error(`[RCM] Recipe ${process.recipeId} not found for completed process ${process.processId}.`);
      return;
    }

    // Get the converter (needed for efficiency calculation if not already stored in process)
    // Assuming we can retrieve the node info from the flow manager using process.sourceId
    let efficiency = process.appliedEfficiency; // Use pre-calculated if available
    if (efficiency === undefined || efficiency === null) {
      // Recalculate if not applied earlier (e.g., if _applyEfficiencyToProcess wasn't called)
      try {
        const converterNode = ResourceFlowManager.getInstance().getNode(process.sourceId);
        if (converterNode && converterNode.type === FlowNodeType.CONVERTER) {
          efficiency = this.calculateConverterEfficiency(converterNode as ConverterFlowNode, recipe);
          process.appliedEfficiency = efficiency; // Store it back
        } else {
          console.warn(`[RCM] Converter node ${process.sourceId} not found or invalid for efficiency calc.`);
          efficiency = 0; // Default to 0 if converter not found
        }
      } catch (error) {
        console.error(`[RCM] Error getting converter/calculating efficiency for process ${process.processId}:`, error);
        efficiency = 0; // Default to 0 on error
      }
    }
    efficiency = Math.max(0, Math.min(efficiency, 2)); // Clamp efficiency

    // Adjust outputs based on efficiency
    const efficientOutputs = recipe.outputs.map(output => ({
      ...output,
      amount: Math.floor(output.amount * efficiency) // Apply efficiency, ensure integer amount
    }));

    // Publish completion event with *efficient* outputs
    this.publishEvent({
      type: EventType.RESOURCE_UPDATED,
      moduleId: this.constructor.name,
      moduleType: 'resource-manager' as ModuleType,
      timestamp: Date.now(),
      data: {
        type: 'RESOURCE_CONVERSION_COMPLETED',
        processId: process.processId,
        recipeId: process.recipeId,
        converterId: process.sourceId,
        inputs: recipe.inputs,
        outputs: efficientOutputs, // Use adjusted outputs
        efficiency: efficiency, // Use calculated efficiency
      },
    });

    // Update chain execution if this process is part of a chain
    for (const [ chainId, chainStatus ] of this.chainExecutions.entries()) {
      for (let i = 0; i < chainStatus.stepStatus.length; i++) {
        const step = chainStatus.stepStatus[ i ];
        if (step.processId === process.processId) {
          // Mark step as complete
          step.status = 'completed';
          step.endTime = Date.now();

          // Move to next step
          chainStatus.currentStepIndex = i + 1;
          this.processNextChainStep(chainId);
          break;
        }
      }
    }
  }

  /**
   * Start a conversion process
   */
  private startConversionProcess(converterId: string, recipeId: string): ConversionResult {
    // Implementation would start a conversion process
    // For now, return a placeholder result
    return {
      success: false,
      processId: '',
      recipeId: recipeId,
    };
  }

  /**
   * Apply efficiency to a conversion process
   * @private
   */
  private _applyEfficiencyToProcess(process: ResourceConversionProcess, converterNode: FlowNode): void {
    // 1. Verify the node is actually a converter
    if (converterNode.type !== FlowNodeType.CONVERTER) {
      console.error(`[RCM] Attempted to apply efficiency using a non-converter node (${converterNode.id}) for process ${process.processId}`);
      process.appliedEfficiency = 0; // Or handle error appropriately
      return;
    }
    // Cast to ConverterFlowNode after check
    const converter = converterNode as ConverterFlowNode;

    // 2. Get the recipe
    const recipe = this.conversionRecipes.get(process.recipeId) as ExtendedResourceConversionRecipe;
    if (!recipe) {
      console.error(`[RCM] Recipe ${process.recipeId} not found for process ${process.processId} during efficiency calculation.`);
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
      console.error(`[RCM] Error calculating efficiency for process ${process.processId} on converter ${converter.id}:`, error);
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
      const recipeModifier = converter.configuration.efficiencyModifiers[ recipe.id ] || 1;
      efficiency *= recipeModifier;
    }

    // Apply resource quality factors
    // Cast to the required type to fix the type compatibility issue
    const inputs = recipe.inputs as unknown as { type: ResourceType | number; amount: number; }[];
    const qualityFactors = this.calculateResourceQualityFactors(inputs);

    // Apply quality factors
    Object.entries(qualityFactors).forEach(([ _key, value ]) => {
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
    _inputs: { type: ResourceType | number; amount: number; }[]
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
    const activeProcesses = converter.status?.activeProcesses?.length || 0;

    if (maxProcesses <= 0) {
      return 1.0; // Avoid division by zero if config is invalid
    }

    const loadRatio = activeProcesses / maxProcesses;

    // Example stress calculation: efficiency decreases linearly from 100% to 80% as load goes from 0% to 100%
    const stressFactor = 1.0 - (loadRatio * 0.2);

    // Clamp the factor between a reasonable minimum (e.g., 0.5) and 1.0
    return Math.max(0.5, Math.min(stressFactor, 1.0));
  }

  private updateConverterNode(node: ConverterFlowNode): void {
    if (!node) {
      return;
    }

    const activeProcesses = node.status?.activeProcesses || [];
    const maxProcesses = node.configuration?.maxConcurrentProcesses || 1;

    // Update node status based on processes
    // node.status = activeProcesses.length >= maxProcesses ? 'busy' : 'idle';
    // node.active = activeProcesses.length > 0;

    // TODO: Update other node properties based on configuration and status if needed
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
    process.active = status === 'in-progress' || status === 'in_progress';
    process.paused = status === 'paused';

    // If completed or failed, set end time
    if (status === 'completed' || status === 'failed') {
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
      type: EventType.RESOURCE_UPDATED, // Choose appropriate event type
      moduleId: this.constructor.name,
      moduleType: 'resource-manager' as ModuleType,
      timestamp: Date.now(),
      data: {
        type: 'PROCESS_UPDATED', // Custom type within data
        process,
      }
    });

    // Find the related chain and update its status
    for (const chainStatus of this.activeChains.values()) {
      if (chainStatus.stepStatus.some(step => step.processId === processId)) {
        const stepIndex = chainStatus.stepStatus.findIndex(
          step => step.processId === processId
        );
        if (stepIndex !== -1) {
          chainStatus.stepStatus[ stepIndex ].status = status;
          if (status === 'completed' || status === 'failed') {
            chainStatus.stepStatus[ stepIndex ].endTime = Date.now();
          }
          // Update overall chain progress
          chainStatus.progress = this.calculateChainProgress(chainStatus);
          this.activeChains.set(chainStatus.chainId, chainStatus);
          // Notify listeners about chain status update
          this.publishEvent({
            type: EventType.RESOURCE_UPDATED, // Choose appropriate event type
            moduleId: this.constructor.name,
            moduleType: 'resource-manager' as ModuleType,
            timestamp: Date.now(),
            data: {
              type: 'CHAIN_STATUS_UPDATED', // Custom type within data
              chainStatus,
            }
          });
        }
        break; // Assume process belongs to only one active chain
      }
    }
  };

  private calculateChainProgress(chainStatus: ChainExecutionStatus): number {
    // Calculate progress based on completed steps
    const completedSteps = chainStatus.stepStatus.filter(
      step => step.status === 'completed'
    ).length;
    return completedSteps / chainStatus.recipeIds.length;
  }
}
