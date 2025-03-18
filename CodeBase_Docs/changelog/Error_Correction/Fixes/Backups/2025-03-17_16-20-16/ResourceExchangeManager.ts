import { ResourceExchangeRate } from '../../types/resources/ResourceConversionTypes';
import { ResourceState, ResourceType } from '../../types/resources/ResourceTypes';

/**
 * Exchange transaction
 */
export interface ExchangeTransaction {
  id: string;
  fromType: ResourceType;
  toType: ResourceType;
  fromAmount: number;
  toAmount: number;
  rate: number;
  timestamp: number;
  source?: string;
  target?: string;
}

/**
 * Market condition
 */
export type MarketCondition = 'stable' | 'volatile' | 'bullish' | 'bearish';

/**
 * Exchange rate modifier
 */
export interface ExchangeRateModifier {
  id: string;
  description: string;
  affectedTypes: ResourceType[];
  multiplier: number;
  expiresAt?: number;
  active?: boolean;
  sourceType?: ResourceType;
  targetType?: ResourceType;
}

/**
 * Extended resource exchange rate with additional properties
 */
export interface ExtendedRate extends ResourceExchangeRate {
  sourceType: ResourceType;
  targetType: ResourceType;
}

/**
 * Exchange path step
 */
export interface ExchangePathStep {
  sourceType: ResourceType;
  targetType: ResourceType;
  rate: number;
  inputAmount: number;
  outputAmount: number;
}

/**
 * Exchange path
 */
export interface ExchangePath {
  steps: ExchangePathStep[];
  totalRate: number;
  inputAmount: number;
  outputAmount: number;
}

/**
 * Resource Exchange Manager
 * Manages resource exchange rates, conversions, and market dynamics
 */
export class ResourceExchangeManager {
  private baseRates: Map<string, ResourceExchangeRate>;
  private currentRates: Map<string, ResourceExchangeRate>;
  private modifiers: Map<string, ExchangeRateModifier>;
  private transactions: ExchangeTransaction[];
  private resourceStates: Map<ResourceType, ResourceState>;
  private marketCondition: MarketCondition;
  private lastMarketUpdate: number;
  private marketUpdateInterval: number;
  private maxTransactionHistory: number;

  constructor(marketUpdateInterval = 60000, maxTransactionHistory = 100) {
    this.baseRates = new Map();
    this.currentRates = new Map();
    this.modifiers = new Map();
    this.transactions = [];
    this.resourceStates = new Map();
    this.marketCondition = 'stable';
    this.lastMarketUpdate = Date.now();
    this.marketUpdateInterval = marketUpdateInterval;
    this.maxTransactionHistory = maxTransactionHistory;

    // Initialize with default exchange rates
    this.initializeDefaultRates();
  }

  /**
   * Initialize default exchange rates
   */
  private initializeDefaultRates(): void {
    // Define base exchange rates between resources
    this.registerExchangeRate({
      fromType: ResourceType.MINERALS,
      toType: ResourceType.ENERGY,
      baseRate: 0.5,
      rate: 0.5, // 2 minerals = 1 energy
      minAmount: 10,
      maxAmount: 1000,
      cooldown: 5000,
    });

    this.registerExchangeRate({
      fromType: ResourceType.ENERGY,
      toType: ResourceType.MINERALS,
      baseRate: 1.8,
      rate: 1.8, // 1 energy = 1.8 minerals
      minAmount: 5,
      maxAmount: 500,
      cooldown: 5000,
    });

    this.registerExchangeRate({
      fromType: ResourceType.MINERALS,
      toType: ResourceType.RESEARCH,
      baseRate: 0.2,
      rate: 0.2, // 5 minerals = 1 research
      minAmount: 20,
      maxAmount: 2000,
      cooldown: 10000,
    });

    this.registerExchangeRate({
      fromType: ResourceType.ENERGY,
      toType: ResourceType.RESEARCH,
      baseRate: 0.3,
      rate: 0.3, // 3.33 energy = 1 research
      minAmount: 10,
      maxAmount: 1000,
      cooldown: 10000,
    });

    this.registerExchangeRate({
      fromType: ResourceType.GAS,
      toType: ResourceType.ENERGY,
      baseRate: 2.0,
      rate: 2.0, // 1 gas = 2 energy
      minAmount: 5,
      maxAmount: 500,
      cooldown: 5000,
    });

    this.registerExchangeRate({
      fromType: ResourceType.PLASMA,
      toType: ResourceType.ENERGY,
      baseRate: 3.0,
      rate: 3.0, // 1 plasma = 3 energy
      minAmount: 5,
      maxAmount: 300,
      cooldown: 8000,
    });

    this.registerExchangeRate({
      fromType: ResourceType.EXOTIC,
      toType: ResourceType.RESEARCH,
      baseRate: 5.0,
      rate: 5.0, // 1 exotic = 5 research
      minAmount: 1,
      maxAmount: 100,
      cooldown: 15000,
    });
  }

  /**
   * Update resource state
   */
  public updateResourceState(type: ResourceType, state: ResourceState): void {
    this.resourceStates.set(type, state);
  }

  /**
   * Register an exchange rate
   */
  public registerExchangeRate(rate: ResourceExchangeRate): boolean {
    if (!rate.fromType || !rate.toType || rate.rate <= 0) {
      console.error('Invalid exchange rate:', rate);
      return false;
    }

    const rateKey = this.getRateKey(rate.fromType, rate.toType);
    this.baseRates.set(rateKey, { ...rate });
    this.currentRates.set(rateKey, { ...rate });
    return true;
  }

  /**
   * Unregister an exchange rate
   */
  public unregisterExchangeRate(fromType: ResourceType, toType: ResourceType): boolean {
    const rateKey = this.getRateKey(fromType, toType);
    if (!this.baseRates.has(rateKey)) {
      return false;
    }

    this.baseRates.delete(rateKey);
    this.currentRates.delete(rateKey);
    return true;
  }

  /**
   * Get exchange rate key
   */
  private getRateKey(fromType: ResourceType, toType: ResourceType): ResourceType {
    return `${fromType}-${toType}`;
  }

  /**
   * Get current exchange rate
   */
  public getExchangeRate(
    fromType: ResourceType,
    toType: ResourceType
  ): ResourceExchangeRate | undefined {
    const rateKey = this.getRateKey(fromType, toType);
    return this.currentRates.get(rateKey);
  }

  /**
   * Calculate exchange amount
   */
  public calculateExchangeAmount(
    fromType: ResourceType,
    toType: ResourceType,
    amount: number
  ): number {
    const rate = this.getExchangeRate(fromType, toType);
    if (!rate) {
      return 0;
    }

    // Check if amount is within limits
    if (rate.minAmount && amount < rate.minAmount) {
      console.warn(`Exchange amount ${amount} is below minimum ${rate.minAmount}`);
      return 0;
    }

    if (rate.maxAmount && amount > rate.maxAmount) {
      console.warn(`Exchange amount ${amount} is above maximum ${rate.maxAmount}`);
      amount = rate.maxAmount;
    }

    return amount * rate.rate;
  }

  /**
   * Execute resource exchange
   */
  public executeExchange(
    fromType: ResourceType,
    toType: ResourceType,
    amount: number,
    source?: string,
    target?: string
  ): ExchangeTransaction | null {
    // Get exchange rate
    const rate = this.getExchangeRate(fromType, toType);
    if (!rate) {
      console.error(`No exchange rate defined for ${fromType} to ${toType}`);
      return null;
    }

    // Check if amount is within limits
    if (rate.minAmount && amount < rate.minAmount) {
      console.error(`Exchange amount ${amount} is below minimum ${rate.minAmount}`);
      return null;
    }

    if (rate.maxAmount && amount > rate.maxAmount) {
      console.warn(
        `Exchange amount ${amount} is above maximum ${rate.maxAmount}, capping at maximum`
      );
      amount = rate.maxAmount;
    }

    // Check if source has enough resources
    const sourceState = this.resourceStates.get(fromType);
    if (!sourceState || sourceState.current < amount) {
      console.error(`Insufficient ${fromType} resources for exchange`);
      return null;
    }

    // Calculate exchange amount
    const exchangeAmount = this.calculateExchangeAmount(fromType, toType, amount);
    if (exchangeAmount <= 0) {
      console.error(`Invalid exchange amount: ${exchangeAmount}`);
      return null;
    }

    // Update resource states
    sourceState.current -= amount;
    this.resourceStates.set(fromType, sourceState);

    const targetState = this.resourceStates.get(toType);
    if (targetState) {
      targetState.current += exchangeAmount;
      this.resourceStates.set(toType, targetState);
    }

    // Record transaction
    const transaction: ExchangeTransaction = {
      id: `exchange-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromType,
      toType,
      fromAmount: amount,
      toAmount: exchangeAmount,
      rate: rate.rate,
      timestamp: Date.now(),
      source,
      target,
    };

    this.transactions.push(transaction);

    // Trim transaction history if needed
    if (this.transactions.length > this.maxTransactionHistory) {
      this.transactions = this.transactions.slice(-this.maxTransactionHistory);
    }

    return transaction;
  }

  /**
   * Register a rate modifier
   */
  public registerRateModifier(modifier: ExchangeRateModifier): boolean {
    if (!modifier.id || !modifier.affectedTypes || modifier.affectedTypes.length === 0) {
      console.error('Invalid rate modifier:', modifier);
      return false;
    }

    this.modifiers.set(modifier.id, modifier);
    this.updateCurrentRates();
    return true;
  }

  /**
   * Unregister a rate modifier
   */
  public unregisterRateModifier(id: string): boolean {
    if (!this.modifiers.has(id)) {
      return false;
    }

    this.modifiers.delete(id);
    this.updateCurrentRates();
    return true;
  }

  /**
   * Update current rates based on modifiers and market conditions
   */
  private updateCurrentRates(): void {
    // Reset current rates to base rates
    this.currentRates = new Map(
      Array.from(this.baseRates.entries()).map(([key, rate]) => [key, { ...rate }])
    );

    // Apply market condition modifier
    const marketModifier = this.getMarketConditionModifier();

    // Apply all active modifiers
    const now = Date.now();
    for (const [id, modifier] of Array.from(this.modifiers.entries())) {
      // Skip expired modifiers
      if (modifier.expiresAt && modifier.expiresAt < now) {
        // Remove expired modifier
        this.modifiers.delete(id);
        continue;
      }

      // Skip inactive modifiers
      if (modifier.active === false) {
        continue;
      }
    }

    // Calculate rates based on modifiers
    this.calculateRates();

    // Apply market condition to all rates
    for (const [key, rate] of Array.from(this.currentRates.entries())) {
      rate.rate *= marketModifier;
      this.currentRates.set(key, rate);
    }
  }

  /**
   * Get market condition modifier
   */
  private getMarketConditionModifier(): number {
    switch (this.marketCondition) {
      case 'stable':
        return 1.0;
      case 'volatile':
        // Random fluctuation between 0.8 and 1.2
        return 0.8 + Math.random() * 0.4;
      case 'bullish':
        // Increased rates (1.1 to 1.3)
        return 1.1 + Math.random() * 0.2;
      case 'bearish':
        // Decreased rates (0.7 to 0.9)
        return 0.7 + Math.random() * 0.2;
      default:
        return 1.0;
    }
  }

  /**
   * Update market conditions
   */
  public updateMarketConditions(): void {
    const now = Date.now();

    // Only update at specified intervals
    if (now - this.lastMarketUpdate < this.marketUpdateInterval) {
      return;
    }

    this.lastMarketUpdate = now;

    // Randomly change market condition
    const rand = Math.random();
    if (rand < 0.6) {
      // 60% chance to remain stable
      this.marketCondition = 'stable';
    } else if (rand < 0.75) {
      // 15% chance to become volatile
      this.marketCondition = 'volatile';
    } else if (rand < 0.9) {
      // 15% chance to become bullish
      this.marketCondition = 'bullish';
    } else {
      // 10% chance to become bearish
      this.marketCondition = 'bearish';
    }

    // Update rates based on new market condition
    this.updateCurrentRates();

    console.warn(`[ResourceExchangeManager] Market condition updated to: ${this.marketCondition}`);
  }

  /**
   * Get current market condition
   */
  public getMarketCondition(): MarketCondition {
    return this.marketCondition;
  }

  /**
   * Set market condition (for testing or events)
   */
  public setMarketCondition(condition: MarketCondition): void {
    this.marketCondition = condition;
    this.updateCurrentRates();
  }

  /**
   * Get all exchange rates
   */
  public getAllExchangeRates(): ResourceExchangeRate[] {
    return Array.from(this.currentRates.values());
  }

  /**
   * Get transaction history
   */
  public getTransactionHistory(): ExchangeTransaction[] {
    return [...this.transactions];
  }

  /**
   * Get transaction history for a specific resource type
   */
  public getTransactionHistoryByType(type: ResourceType): ExchangeTransaction[] {
    return this.transactions.filter(
      transaction => transaction.fromType === type || transaction.toType === type
    );
  }

  /**
   * Calculate optimal exchange path
   * Uses a simple version of Dijkstra's algorithm to find the best conversion path
   */
  public calculateOptimalExchangePath(
    fromType: ResourceType,
    toType: ResourceType,
    amount: number
  ): { path: ResourceType[]; rate: number; amount: number } | null {
    // Try to find the optimal path using our pathfinding algorithm
    const optimalPath = this.findOptimalPath(fromType, toType, amount);

    // If we found an optimal path, convert it to the expected return format
    if (optimalPath) {
      return {
        path: optimalPath.steps.map(step => step.sourceType).concat([toType]),
        rate: optimalPath.totalRate,
        amount: optimalPath.outputAmount,
      };
    }

    // Direct exchange fallback
    const directRate = this.getExchangeRate(fromType, toType);
    if (directRate) {
      return {
        path: [fromType, toType],
        rate: directRate.rate,
        amount: amount * directRate.rate,
      };
    }

    // No path found
    return null;
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.baseRates.clear();
    this.currentRates.clear();
    this.modifiers.clear();
    this.transactions = [];
    this.resourceStates.clear();
  }

  /**
   * Calculate exchange rates based on current modifiers
   */
  private calculateRates(): void {
    // Apply modifiers to base rates
    // Convert Map entries to array to avoid MapIterator error
    const modifierEntries = Array.from(this.modifiers.entries());
    for (const [_id, modifier] of modifierEntries) {
      // Check if modifier has active property and it's false
      if (modifier.active === false) {
        continue;
      }

      // Convert Map entries to array to avoid MapIterator error
      const rateEntries = Array.from(this.currentRates.entries());
      for (const [_rateKey, rate] of rateEntries) {
        // Cast to extended type for compatibility
        const extendedRate = rate as ExtendedRate;
        const extendedModifier = modifier as ExchangeRateModifier;

        // Check if modifier has sourceType and if it matches the rate's sourceType
        if (
          extendedModifier.sourceType &&
          extendedRate.sourceType !== extendedModifier.sourceType
        ) {
          continue;
        }

        // Check if modifier has targetType and if it matches the rate's targetType
        if (
          extendedModifier.targetType &&
          extendedRate.targetType !== extendedModifier.targetType
        ) {
          continue;
        }

        // Apply modifier
        const newRate = { ...rate };
        newRate.rate *= modifier.multiplier;
        this.currentRates.set(_rateKey, newRate);
      }
    }
  }

  /**
   * Find optimal exchange path
   */
  private findOptimalPath(
    sourceType: ResourceType,
    targetType: ResourceType,
    amount: number
  ): ExchangePath | null {
    // Direct exchange
    const directKey = this.getRateKey(sourceType, targetType);
    const directRate = this.currentRates.get(directKey);

    if (directRate) {
      return {
        steps: [
          {
            sourceType,
            targetType,
            rate: directRate.rate,
            inputAmount: amount,
            outputAmount: amount * directRate.rate,
          },
        ],
        totalRate: directRate.rate,
        inputAmount: amount,
        outputAmount: amount * directRate.rate,
      };
    }

    // Try to find a path with one intermediate step
    let bestPath: ExchangePath | null = null;
    let bestRate = 0;

    // Convert Map entries to array to avoid MapIterator error
    const rateEntries = Array.from(this.currentRates.entries());
    for (const [_rateKey, rate] of rateEntries) {
      // Cast to extended type for compatibility
      const extendedRate = rate as ExtendedRate;

      if (extendedRate.sourceType !== sourceType) {
        continue;
      }

      const intermediateType = extendedRate.targetType;
      if (!intermediateType) {
        continue;
      }

      const secondKey = this.getRateKey(intermediateType, targetType);
      const secondRate = this.currentRates.get(secondKey);

      if (!secondRate) {
        continue;
      }

      const totalRate = extendedRate.rate * secondRate.rate;
      if (totalRate > bestRate) {
        bestRate = totalRate;
        const intermediateAmount = amount * extendedRate.rate;
        bestPath = {
          steps: [
            {
              sourceType,
              targetType: intermediateType,
              rate: extendedRate.rate,
              inputAmount: amount,
              outputAmount: intermediateAmount,
            },
            {
              sourceType: intermediateType,
              targetType,
              rate: secondRate.rate,
              inputAmount: intermediateAmount,
              outputAmount: intermediateAmount * secondRate.rate,
            },
          ],
          totalRate,
          inputAmount: amount,
          outputAmount: amount * totalRate,
        };
      }
    }

    return bestPath;
  }
}
