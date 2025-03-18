/**
 * ResourceConversionManager.ts
 *
 * This module handles resource conversion functionality extracted from ResourceFlowManager.
 * It manages conversion recipes, processes, and chains.
 */

import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { Singleton } from '../../lib/patterns/Singleton';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { ResourceConversionRecipe as ExtendedResourceConversionRecipe } from '../../types/resources/ResourceConversionTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';
import {
  ChainExecutionStatus,
  ConversionChain,
  ConverterFlowNode,
  FlowNode,
  ResourceConversionRecipe,
} from '../../types/resources/StandardizedResourceTypes';
import {
  ConversionResult,
  ExtendedResourceConversionProcess,
  ResourceFlowEvent,
} from './ResourceFlowTypes';

/**
 * Manager for resource conversion processes
 */
// @ts-expect-error: The Singleton class has a type compatibility issue that needs to be addressed at a higher level
export class ResourceConversionManager extends Singleton<ResourceConversionManager> {
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
  private processingQueue: ExtendedResourceConversionProcess[] = [];
  private _completedProcesses: ExtendedResourceConversionProcess[] = [];
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

  // Parent manager reference for event publishing
  private parentManager: AbstractBaseManager<ResourceFlowEvent> | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  protected constructor() {
    super();
  }

  /**
   * Set the parent manager for event publishing
   */
  public setParentManager(manager: AbstractBaseManager<ResourceFlowEvent>): void {
    this.parentManager = manager;
  }

  /**
   * Initialize the conversion manager
   */
  public async initialize(): Promise<void> {
    this.startProcessingInterval(this.processingIntervalMs);
  }

  /**
   * Dispose of resources
   */
  public async dispose(): Promise<void> {
    if (this.processingInterval !== null) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.processingQueue = [];
    this._completedProcesses = [];
    this.conversionRecipes.clear();
    this.conversionChains.clear();
    this.chainExecutions.clear();
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
    const currentStepIndex = status.currentStepIndex;
    if (currentStepIndex >= status.recipeIds.length) {
      // Chain is complete
      status.completed = true;
      status.active = false;
      return;
    }

    const currentRecipeId = status.recipeIds[currentStepIndex];
    const stepStatus = status.stepStatus[currentStepIndex];

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
        converter.converterStatus &&
        converter.converterConfig &&
        converter.converterStatus.activeProcesses.length >=
          converter.converterConfig.maxConcurrentProcesses
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
    if (this.parentManager) {
      // Create event data
      const eventData = {
        // Use a valid EventType enum value
        type: EventType.RESOURCE_UPDATED, // Use an existing EventType value
        chainId,
        stepIndex: currentStepIndex,
        recipeId: currentRecipeId,
        processId: result?.processId,
        converterId: availableConverter.id,
        // Add required BaseEvent properties
        moduleId: 'resource-conversion-manager',
        moduleType: 'resource-manager' as ModuleType,
        timestamp: Date.now(),
        data: {
          type: 'CHAIN_STEP_STARTED',
          chainId,
          stepIndex: currentStepIndex,
          recipeId: currentRecipeId,
          processId: result?.processId,
          converterId: availableConverter.id,
        },
      };

      // Use the protected method to publish the event
      if (typeof this.parentManager['publishEvent'] === 'function') {
        this.parentManager['publishEvent'](eventData);
      }
    }
  }

  /**
   * Get converters that can handle a specific recipe
   */
  private getConvertersForRecipe(_recipeId: string): ConverterFlowNode[] {
    // Implementation would query the resource flow manager for converters
    // For now, return an empty array
    return [];
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
   * Complete a conversion process
   */
  private completeProcess(process: ExtendedResourceConversionProcess): void {
    // Mark process as complete
    process.active = false;
    process.progress = 1;
    process.endTime = Date.now();

    // Get the recipe
    const recipe = this.conversionRecipes.get(process.recipeId) as ExtendedResourceConversionRecipe;
    if (!recipe) {
      return;
    }

    // Produce outputs
    if (this.parentManager) {
      // Create event data with required BaseEvent properties
      const eventData = {
        type: EventType.RESOURCE_UPDATED, // Use a valid EventType enum value
        processId: process.processId,
        recipeId: process.recipeId,
        converterId: process.sourceId,
        inputs: recipe.inputs,
        outputs: recipe.outputs,
        efficiency: process.appliedEfficiency || 1,
        timestamp: Date.now(),
        // Add required BaseEvent properties
        moduleId: 'resource-conversion-manager',
        moduleType: 'resource-manager' as ModuleType,
        data: {
          type: 'RESOURCE_CONVERSION_COMPLETED', // Store the original type in data
          processId: process.processId,
          recipeId: process.recipeId,
          converterId: process.sourceId,
          inputs: recipe.inputs,
          outputs: recipe.outputs,
          efficiency: process.appliedEfficiency || 1,
        },
      } as unknown as BaseEvent;

      // Use the protected method to publish the event
      if (typeof this.parentManager['publishEvent'] === 'function') {
        this.parentManager['publishEvent'](eventData);
      }
    }

    // Update chain execution if this process is part of a chain
    for (const [chainId, chainStatus] of this.chainExecutions.entries()) {
      for (let i = 0; i < chainStatus.stepStatus.length; i++) {
        const step = chainStatus.stepStatus[i];
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
  private _applyEfficiencyToProcess(
    _processId: string,
    _process: ExtendedResourceConversionProcess,
    _converter: FlowNode,
    _recipe: ResourceConversionRecipe
  ): number {
    // Implementation would apply efficiency to a process
    // For now, return a placeholder value
    return 1;
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
    if (converter.converterConfig?.efficiencyModifiers) {
      const recipeModifier = converter.converterConfig.efficiencyModifiers[recipe.id] || 1;
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
  private calculateNetworkStressFactor(_converter: ConverterFlowNode): number {
    // Implementation would calculate network stress
    // For now, return a placeholder value
    return 1;
  }
}
