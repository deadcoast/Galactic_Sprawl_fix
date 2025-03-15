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
import { ResourceType } from "./../../types/resources/ResourceTypes";
import {
  ChainExecutionStatus,
  ConversionChain,
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
      stepStatus: chain.steps.map(recipeId => ({
        recipeId,
        status: 'pending',
        startTime: 0,
        endTime: 0,
        processId: '',
        converterId: '',
      })),
    };

    this.chainExecutions.set(chainId, status);

    // Start the first step
    this.processNextChainStep(chainId);

    return true;
  }

  /**
   * Process the next step in a conversion chain
   */
  private processNextChainStep(chainId: string): void {
    const chainStatus = this.chainExecutions.get(chainId);
    if (!chainStatus || !chainStatus.active || chainStatus.paused) {
      return;
    }

    // Get the current step
    const currentStepIndex = chainStatus.currentStepIndex;
    if (currentStepIndex >= chainStatus.stepStatus.length) {
      // Chain is complete
      chainStatus.completed = true;
      chainStatus.active = false;
      return;
    }

    const step = chainStatus.stepStatus[currentStepIndex];
    if (step.status !== 'pending') {
      // Step is already in progress or completed
      return;
    }

    // Get the recipe for this step
    const recipeId = step.recipeId;
    const recipe = this.conversionRecipes.get(recipeId);
    if (!recipe) {
      // Recipe not found
      step.status = 'failed';
      chainStatus.failed = true;
      chainStatus.active = false;
      chainStatus.errorMessage = `Recipe ${recipeId} not found`;
      return;
    }

    // Find a converter that can process this recipe
    const converters = this.getConvertersForRecipe(recipeId);

    if (converters.length === 0) {
      // No converter found
      step.status = 'failed';
      chainStatus.failed = true;
      chainStatus.active = false;
      chainStatus.errorMessage = `No converter found for recipe ${recipeId}`;
      return;
    }

    // Sort converters by priority
    converters.sort((a, b) => {
      const aEfficiency = a.efficiency || 1;
      const bEfficiency = b.efficiency || 1;
      return bEfficiency - aEfficiency; // Higher efficiency first
    });

    // Try to start the conversion on the first available converter
    let started = false;
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

      // Try to start the conversion
      const result = this.startConversionProcess(converter.id, recipeId);
      if (result.success) {
        // Update step status
        step.status = 'in_progress';
        step.startTime = Date.now();
        step.processId = result.processId;
        step.converterId = converter.id;
        started = true;

        // Add to completed processes for tracking
        if (result.processId) {
          const process = this.processingQueue.find(p => p.processId === result.processId);
          if (process) {
            this._completedProcesses.push({ ...process });
          }
        }

        break;
      }
    }

    if (!started) {
      // Could not start conversion
      step.status = 'failed';
      chainStatus.failed = true;
      chainStatus.active = false;
      chainStatus.errorMessage = 'Could not start conversion process';
    }
  }

  /**
   * Get converters that can process a specific recipe
   */
  private getConvertersForRecipe(_recipeId: string): FlowNode[] {
    // Implementation would find converters that support this recipe
    // For now, return an empty array as a placeholder
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
      const recipe = this.conversionRecipes.get(process.recipeId);
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
    const recipe = this.conversionRecipes.get(process.recipeId);
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
    converter: FlowNode,
    recipe: ResourceConversionRecipe
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
   * Calculate quality factors for input resources
   */
  private calculateResourceQualityFactors(
    inputs: { type: ResourceType | number; amount: number }[]
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
  private calculateNetworkStressFactor(_converter: FlowNode): number {
    // Implementation would calculate network stress
    // For now, return a placeholder value
    return 1;
  }
}
