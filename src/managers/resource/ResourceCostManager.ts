import { ResourceContainer } from '../../types/resources/ResourceConversionTypes';
import { ResourceCost, ResourceState, ResourceType } from '../../types/resources/ResourceTypes';
import { validateResourceCost } from '../../utils/typeGuards/resourceTypeGuards';

/**
 * Cost validation result
 */
export interface CostValidationResult {
  valid: boolean;
  missingResources?: ResourceCost[];
  totalCost?: ResourceCost[];
  affordabilityPercentage?: number;
}

/**
 * Cost calculation options
 */
export interface CostCalculationOptions {
  applyDiscount?: boolean;
  discountPercentage?: number;
  applyTax?: boolean;
  taxPercentage?: number;
  roundValues?: boolean;
}

/**
 * Resource Cost Manager
 * Manages resource cost validation, calculation, and application
 */
export class ResourceCostManager {
  private resourceStates: Map<ResourceType, ResourceState>;
  private containers: Map<string, ResourceContainer>;
  private discounts: Map<string, number>;
  private taxes: Map<string, number>;
  private costHistory: Array<{
    costs: ResourceCost[];
    timestamp: number;
    source?: string;
    target?: string;
    success: boolean;
  }>;
  private maxHistorySize: number;

  constructor(maxHistorySize = 100) {
    this.resourceStates = new Map();
    this.containers = new Map();
    this.discounts = new Map();
    this.taxes = new Map();
    this.costHistory = [];
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Update resource state
   */
  public updateResourceState(type: ResourceType, state: ResourceState): void {
    this.resourceStates.set(type, state);
  }

  /**
   * Register a container
   */
  public registerContainer(container: ResourceContainer): boolean {
    if (!container.id) {
      console.error('Invalid container:', container);
      return false;
    }

    this.containers.set(container.id, container);
    return true;
  }

  /**
   * Unregister a container
   */
  public unregisterContainer(id: string): boolean {
    if (!this.containers.has(id)) {
      return false;
    }

    this.containers.delete(id);
    return true;
  }

  /**
   * Set discount for a resource type
   */
  public setDiscount(type: string, percentage: number): void {
    this.discounts.set(type, Math.max(0, Math.min(percentage, 100)));
  }

  /**
   * Set tax for a resource type
   */
  public setTax(type: string, percentage: number): void {
    this.taxes.set(type, Math.max(0, Math.min(percentage, 100)));
  }

  /**
   * Validate if resources are available for a cost
   */
  public validateCost(costs: ResourceCost[], containerId?: string): CostValidationResult {
    if (!Array.isArray(costs) || costs.length === 0) {
      return { valid: false };
    }

    // Validate each cost item
    for (const cost of costs) {
      if (!validateResourceCost(cost)) {
        return { valid: false };
      }
    }

    const missingResources: ResourceCost[] = [];
    let totalAvailable = 0;
    let totalRequired = 0;

    // Check if resources are available
    for (const cost of costs) {
      const { type, amount } = cost;
      let available = 0;

      if (containerId) {
        // Check specific container
        const container = this.containers.get(containerId);
        if (container && container.resources) {
          available = this.getAvailableResources(container, type);
        }
      } else {
        // Check global resource state
        const state = this.resourceStates.get(type);
        if (state) {
          available = state.current;
        }
      }

      totalAvailable += available;
      totalRequired += amount;

      if (available < amount) {
        missingResources.push({
          type,
          amount: amount - available,
        });
      }
    }

    const affordabilityPercentage =
      totalRequired > 0 ? Math.min(100, (totalAvailable / totalRequired) * 100) : 100;

    return {
      valid: missingResources.length === 0,
      missingResources: missingResources.length > 0 ? missingResources : undefined,
      totalCost: costs,
      affordabilityPercentage,
    };
  }

  /**
   * Calculate adjusted costs based on discounts and taxes
   */
  public calculateAdjustedCosts(
    costs: ResourceCost[],
    options: CostCalculationOptions = {}
  ): ResourceCost[] {
    const {
      applyDiscount = false,
      discountPercentage = 0,
      applyTax = false,
      taxPercentage = 0,
      roundValues = true,
    } = options;

    return costs.map(cost => {
      let adjustedAmount = cost.amount;

      // Apply global discount if enabled
      if (applyDiscount) {
        const globalDiscount = discountPercentage / 100;
        adjustedAmount *= 1 - globalDiscount;
      }

      // Apply resource-specific discount if available
      const resourceDiscount = this.discounts.get(cost.type) ?? 0;
      if (resourceDiscount > 0) {
        adjustedAmount *= 1 - resourceDiscount / 100;
      }

      // Apply global tax if enabled
      if (applyTax) {
        const globalTax = taxPercentage / 100;
        adjustedAmount *= 1 + globalTax;
      }

      // Apply resource-specific tax if available
      const resourceTax = this.taxes.get(cost.type) ?? 0;
      if (resourceTax > 0) {
        adjustedAmount *= 1 + resourceTax / 100;
      }

      // Round values if enabled
      if (roundValues) {
        adjustedAmount = Math.ceil(adjustedAmount);
      }

      return {
        type: cost.type,
        amount: adjustedAmount,
      };
    });
  }

  /**
   * Apply costs to resources (deduct resources)
   */
  public applyCosts(costs: ResourceCost[], containerId?: string, source?: string): boolean {
    // Validate costs first
    const validation = this.validateCost(costs, containerId);
    if (!validation.valid) {
      this.recordCostHistory(costs, source, undefined, false);
      return false;
    }

    // Apply costs
    for (const cost of costs) {
      const { type, amount } = cost;

      if (containerId) {
        // Apply to specific container
        const container = this.containers.get(containerId);
        if (container && container.resources) {
          this.updateContainerResources(container, type, amount);
        }
      } else {
        // Apply to global resource state
        const state = this.resourceStates.get(type);
        if (state) {
          state.current = Math.max(0, state.current - amount);
          this.resourceStates.set(type, state);
        }
      }
    }

    this.recordCostHistory(costs, source, containerId, true);
    return true;
  }

  /**
   * Calculate bulk discount based on quantity
   */
  public calculateBulkDiscount(quantity: number): number {
    if (quantity < 5) {
      return 0;
    } else if (quantity < 10) {
      return 5; // 5% discount
    } else if (quantity < 25) {
      return 10; // 10% discount
    } else if (quantity < 50) {
      return 15; // 15% discount
    } else if (quantity < 100) {
      return 20; // 20% discount
    } else {
      return 25; // 25% discount
    }
  }

  /**
   * Calculate tiered costs based on level
   */
  public calculateTieredCosts(baseCosts: ResourceCost[], level: number): ResourceCost[] {
    const scaleFactor = Math.pow(1.5, level - 1);

    return baseCosts.map(cost => ({
      type: cost.type,
      amount: Math.ceil(cost.amount * scaleFactor),
    }));
  }

  /**
   * Record cost history
   */
  private recordCostHistory(
    costs: ResourceCost[],
    source?: string,
    target?: string,
    success: boolean = true
  ): void {
    this.costHistory.push({
      costs,
      timestamp: Date.now(),
      source,
      target,
      success,
    });

    // Trim history if needed
    if (this.costHistory.length > this.maxHistorySize) {
      this.costHistory = this.costHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get cost history
   */
  public getCostHistory(): Array<{
    costs: ResourceCost[];
    timestamp: number;
    source?: string;
    target?: string;
    success: boolean;
  }> {
    return [...this.costHistory];
  }

  /**
   * Get cost history for a specific resource type
   */
  public getCostHistoryByType(type: ResourceType): Array<{
    costs: ResourceCost[];
    timestamp: number;
    source?: string;
    target?: string;
    success: boolean;
  }> {
    return this.costHistory.filter(entry => entry.costs.some(cost => cost.type === type));
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.resourceStates.clear();
    this.containers.clear();
    this.discounts.clear();
    this.taxes.clear();
    this.costHistory = [];
  }

  /**
   * Get available resources from a container
   */
  private getAvailableResources(container: ResourceContainer, type: ResourceType): number {
    if (!container || !container.resources) {
      return 0;
    }

    return container.resources.get(type) ?? 0;
  }

  /**
   * Update resources in a container
   */
  private updateContainerResources(
    container: ResourceContainer,
    type: ResourceType,
    amount: number
  ): void {
    if (!container || !container.resources) {
      return;
    }

    const currentAmount = container.resources.get(type) ?? 0;
    container.resources.set(type, Math.max(0, currentAmount - amount));
  }
}
