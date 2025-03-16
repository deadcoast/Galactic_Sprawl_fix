/**
 * AdaptivePerformanceManager
 *
 * Manages adaptive performance optimization across the application.
 * Integrates ML-based resource consumption prediction with dynamic throttling
 * and resource allocation to optimize performance based on device capabilities
 * and usage patterns.
 */

import {
  ConsumptionPrediction,
  ResourceConsumptionPredictor,
} from '../../lib/ai/ResourceConsumptionPredictor';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { ResourceType } from "./../../types/resources/ResourceTypes";
import { ResourceType } from "./../../types/resources/ResourceTypes";
import { ResourceType } from "./../../types/resources/ResourceTypes";
import { GameLoopManager } from '../game/GameLoopManager';
import {
  PerformanceMetrics,
  ResourcePerformanceMonitor,
  ResourcePerformanceSnapshot,
} from './ResourcePerformanceMonitor';

export interface DeviceProfile {
  deviceType: 'high-end' | 'mid-range' | 'low-end';
  cpuScore: number;
  memoryScore: number;
  batteryState?: 'charging' | 'discharging';
  batteryLevel?: number;
  networkType?: 'wifi' | 'cellular' | 'offline';
  networkLatency?: number;
}

export interface OptimizationSuggestion {
  type: 'throttling' | 'resource-allocation' | 'batch-processing' | 'rendering' | 'cache-strategy';
  target: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  potentialSavings: number;
  implementationDifficulty: number; // 1-10 scale
}

/**
 * Manager for adaptive performance optimization
 */
export class AdaptivePerformanceManager {
  private resourcePredictor: ResourceConsumptionPredictor;
  private _performanceMonitor: ResourcePerformanceMonitor;
  private gameLoopManager: GameLoopManager | null = null;

  private deviceProfile: DeviceProfile;
  private optimizationSuggestions: OptimizationSuggestion[] = [];
  private adaptiveThrottlingEnabled = true;
  private powerSavingMode = false;

  private userInteractionCount = 0;
  private sessionStartTime: number;
  private _lastOptimizationTime: number;

  private optimizationInterval: number | null = null;
  private predictionSubscription: (() => void) | null = null;

  constructor(performanceMonitor: ResourcePerformanceMonitor) {
    this.resourcePredictor = new ResourceConsumptionPredictor();
    this._performanceMonitor = performanceMonitor;
    this.sessionStartTime = Date.now();
    this._lastOptimizationTime = Date.now();

    // Initialize with default device profile
    this.deviceProfile = this.detectDeviceProfile();

    // Initialize predictor with existing metrics if available
    this.initializePredictor();

    // Subscribe to performance events
    this.subscribeToPerformanceEvents();

    // Start optimization cycle
    this.startOptimizationCycle();

    console.warn(
      '[AdaptivePerformanceManager] Initialized with device profile:',
      this.deviceProfile.deviceType
    );
  }

  /**
   * Connect to the GameLoopManager for timing-based optimizations
   */
  public connectGameLoopManager(gameLoopManager: GameLoopManager): void {
    this.gameLoopManager = gameLoopManager;
    console.warn('[AdaptivePerformanceManager] Connected to GameLoopManager');
  }

  /**
   * Initialize the predictor with historical data
   */
  private initializePredictor(): void {
    // In a real implementation, we would load historical data from storage
    // For now, just initialize the predictor
    this.resourcePredictor.initialize();
  }

  /**
   * Subscribe to performance events
   */
  private subscribeToPerformanceEvents(): void {
    // Use the correct signature for moduleEventBus.subscribe
    this.predictionSubscription = moduleEventBus.subscribe('STATUS_CHANGED', event => {
      if (
        event.moduleId === 'resource-performance-monitor' &&
        event.data?.type === 'performance_snapshot'
      ) {
        this.processPerformanceSnapshot(event.data.snapshot as ResourcePerformanceSnapshot);
      }
    });
  }

  /**
   * Process a performance snapshot and update the ML model
   */
  private processPerformanceSnapshot(snapshot: ResourcePerformanceSnapshot): void {
    // Update user interaction count (would come from a real event system)
    this.userInteractionCount += Math.round(Math.random() * 3); // Placeholder

    // Check time since last performance monitor snapshot
    const timeSinceLastMonitorSnapshot = this._performanceMonitor.getTimeSinceLastSnapshot();
    if (timeSinceLastMonitorSnapshot > 10000) {
      console.warn(
        `[AdaptivePerformanceManager] Performance monitor snapshot delay: ${timeSinceLastMonitorSnapshot}ms`
      );
    }

    // Process each resource metric
    for (const [resourceType, metrics] of snapshot.metrics.entries()) {
      // Convert to a data point for the predictor
      this.resourcePredictor.addDataPoint({
        timestamp: Date.now(),
        resourceType,
        value: metrics.consumptionRate,
        sessionDuration: (Date.now() - this.sessionStartTime) / 1000, // in seconds
        userActions: this.userInteractionCount,
        systemLoad: snapshot.systemLoad,
        devicePerformanceScore: this.deviceProfile.cpuScore,
      });

      // Update potential savings
      this.updatePotentialSavings(resourceType, metrics);
    }

    // Generate optimization suggestions based on bottlenecks
    if (snapshot.bottlenecks.length > 0) {
      this.generateOptimizationSuggestions(snapshot);
    }

    // Apply adaptive throttling if enabled
    if (this.adaptiveThrottlingEnabled) {
      this.applyAdaptiveThrottling(snapshot);
    }
  }

  /**
   * Updates potential savings for a resource type
   */
  private updatePotentialSavings(
    resourceType: StringResourceType | ResourceType,
    metrics: PerformanceMetrics
  ): void {
    // Convert to string type for consistent handling
    const stringType = ensureStringResourceType(resourceType);

    // Calculate potential savings based on metrics
    const savings = metrics.consumptionRate * (1 - metrics.efficiency);

    console.warn(
      `[AdaptivePerformanceManager] Potential ${stringType} savings: ${savings.toFixed(2)} units`
    );
  }

  /**
   * Generate optimization suggestions based on performance data
   */
  private generateOptimizationSuggestions(snapshot: ResourcePerformanceSnapshot): void {
    const suggestions: OptimizationSuggestion[] = [];

    // Process bottlenecks
    for (const resourceType of snapshot.bottlenecks) {
      const metrics = snapshot.metrics.get(resourceType);
      if (!metrics) continue;

      // Get prediction for this resource type
      const prediction = this.resourcePredictor.predict(resourceType, {
        sessionDuration: (Date.now() - this.sessionStartTime) / 1000,
        userActions: this.userInteractionCount,
        systemLoad: snapshot.systemLoad,
        devicePerformanceScore: this.deviceProfile.cpuScore,
      });

      if (!prediction) continue;

      // Generate different types of suggestions based on resource and prediction
      if (metrics.consumptionRate > prediction.predictedValue * 1.2) {
        // Consumption is significantly higher than predicted
        suggestions.push({
          type: 'throttling',
          target: resourceType,
          priority: 'high',
          description: `Reduce ${resourceType} consumption rate by ${Math.round(((metrics.consumptionRate - prediction.predictedValue) / metrics.consumptionRate) * 100)}%`,
          potentialSavings: metrics.consumptionRate - prediction.predictedValue,
          implementationDifficulty: 4,
        });
      }

      if (metrics.utilizationRate > 0.9) {
        // Resource is heavily utilized
        suggestions.push({
          type: 'batch-processing',
          target: resourceType,
          priority: 'medium',
          description: `Implement batch processing for ${resourceType} operations to reduce overhead`,
          potentialSavings: metrics.consumptionRate * 0.15, // Estimated 15% improvement
          implementationDifficulty: 6,
        });
      }

      if (resourceType === ResourceType.ENERGY && this.deviceProfile.batteryState === 'discharging') {
        // Energy optimization for battery-powered devices
        suggestions.push({
          type: 'resource-allocation',
          target: ResourceType.ENERGY,
          priority: 'critical',
          description: 'Activate power-saving mode to extend battery life',
          potentialSavings: metrics.consumptionRate * 0.3, // Estimated 30% improvement
          implementationDifficulty: 3,
        });
      }
    }

    // Add rendering suggestions for high system load
    if (snapshot.systemLoad > 0.8) {
      suggestions.push({
        type: 'rendering',
        target: 'ui',
        priority: 'high',
        description: 'Reduce rendering quality or frame rate to decrease system load',
        potentialSavings: snapshot.systemLoad * 0.2, // Estimated 20% improvement
        implementationDifficulty: 5,
      });
    }

    // Update optimization suggestions
    this.optimizationSuggestions = suggestions;

    // Log suggestions
    if (suggestions.length > 0) {
      console.warn('[AdaptivePerformanceManager] Optimization suggestions:');
      suggestions.forEach(suggestion => {
        console.warn(
          `- ${suggestion.priority.toUpperCase()}: ${suggestion.description} (Savings: ${suggestion.potentialSavings.toFixed(2)})`
        );
      });
    }

    // Emit optimization suggestions event
    this.emitOptimizationSuggestions(suggestions);
  }

  /**
   * Apply adaptive throttling based on device capabilities and system load
   */
  private applyAdaptiveThrottling(snapshot: ResourcePerformanceSnapshot): void {
    if (!this.gameLoopManager) return;

    // Calculate throttling factor based on system load and device profile
    let throttleFactor = 1.0;

    // Adjust based on system load
    if (snapshot.systemLoad > 0.9) {
      throttleFactor = 0.7; // Significant throttling for very high load
    } else if (snapshot.systemLoad > 0.7) {
      throttleFactor = 0.85; // Moderate throttling for high load
    }

    // Adjust based on device type
    if (this.deviceProfile.deviceType === 'low-end') {
      throttleFactor *= 0.8; // Further throttling for low-end devices
    } else if (this.deviceProfile.deviceType === 'mid-range') {
      throttleFactor *= 0.9; // Some throttling for mid-range devices
    }

    // Adjust based on battery state
    if (
      this.deviceProfile.batteryState === 'discharging' &&
      this.deviceProfile.batteryLevel &&
      this.deviceProfile.batteryLevel < 0.2
    ) {
      throttleFactor *= 0.7; // Aggressive throttling for low battery
    }

    // Apply power saving mode if enabled
    if (this.powerSavingMode) {
      throttleFactor *= 0.6; // Very aggressive throttling in power saving mode
    }

    // Apply throttling to game loop (adjust update frequency)
    if (typeof this.gameLoopManager.adjustUpdateFrequency === 'function') {
      this.gameLoopManager.adjustUpdateFrequency(throttleFactor);
    }

    console.warn(
      `[AdaptivePerformanceManager] Applied throttling factor: ${throttleFactor.toFixed(2)}`
    );
  }

  /**
   * Emit optimization suggestions event
   */
  private emitOptimizationSuggestions(suggestions: OptimizationSuggestion[]): void {
    moduleEventBus.emit({
      type: 'STATUS_CHANGED',
      moduleId: 'adaptive-performance-manager',
      moduleType: 'resource-manager', // Use string literal instead of type casting
      timestamp: Date.now(),
      data: {
        type: 'optimization_suggestions',
        suggestions,
      },
    });
  }

  /**
   * Start the optimization cycle
   */
  private startOptimizationCycle(): void {
    // Run optimization every 30 seconds
    this.optimizationInterval = window.setInterval(() => {
      this.runOptimizationCycle();
    }, 30000);
  }

  /**
   * Run a full optimization cycle
   */
  private runOptimizationCycle(): void {
    // Calculate time since last optimization
    const timeSinceLastOptimization = Date.now() - this._lastOptimizationTime;
    console.warn(
      `[AdaptivePerformanceManager] Time since last optimization: ${(timeSinceLastOptimization / 1000).toFixed(1)}s`
    );

    // Update device profile
    this.deviceProfile = this.detectDeviceProfile();

    // Update power saving mode based on device state
    this.updatePowerSavingMode();

    // Apply the most valuable optimization suggestions
    this.applyHighPriorityOptimizations();

    this._lastOptimizationTime = Date.now();
  }

  /**
   * Update power saving mode based on device state
   */
  private updatePowerSavingMode(): void {
    // Enable power saving mode for low battery or low-end devices
    const lowBattery =
      this.deviceProfile.batteryState === 'discharging' &&
      this.deviceProfile.batteryLevel !== undefined &&
      this.deviceProfile.batteryLevel < 0.15;

    const shouldEnablePowerSaving = lowBattery || this.deviceProfile.deviceType === 'low-end';

    if (shouldEnablePowerSaving !== this.powerSavingMode) {
      this.powerSavingMode = shouldEnablePowerSaving;
      console.warn(
        `[AdaptivePerformanceManager] Power saving mode ${this.powerSavingMode ? 'enabled' : 'disabled'}`
      );

      // Emit power saving mode change event
      moduleEventBus.emit({
        type: 'STATUS_CHANGED',
        moduleId: 'adaptive-performance-manager',
        moduleType: 'resource-manager', // Use string literal instead of type casting
        timestamp: Date.now(),
        data: {
          type: 'power_saving_mode',
          enabled: this.powerSavingMode,
        },
      });
    }
  }

  /**
   * Apply high priority optimizations
   */
  private applyHighPriorityOptimizations(): void {
    const highPrioritySuggestions = this.optimizationSuggestions.filter(
      s => s.priority === 'critical' || s.priority === 'high'
    );

    if (highPrioritySuggestions.length === 0) return;

    // Sort by potential savings divided by implementation difficulty
    const sortedSuggestions = [...highPrioritySuggestions].sort((a, b) => {
      const valueA = a.potentialSavings / a.implementationDifficulty;
      const valueB = b.potentialSavings / b.implementationDifficulty;
      return valueB - valueA; // Higher value first
    });

    // Apply top suggestions (in a real implementation, this would connect to various systems)
    for (const suggestion of sortedSuggestions.slice(0, 2)) {
      // Apply top 2 suggestions
      console.warn(`[AdaptivePerformanceManager] Applying optimization: ${suggestion.description}`);

      // In a real implementation, we would apply the optimization
      // For now, just log it
    }
  }

  /**
   * Detect device capabilities and create a device profile
   */
  private detectDeviceProfile(): DeviceProfile {
    // In a production implementation, this would use actual device detection
    // For now, we'll use simple heuristics

    const userAgent = navigator.userAgent;
    const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4;
    const connection = (navigator as { connection?: { type: string; rtt: number } }).connection || {
      type: 'unknown',
      rtt: 50,
    };

    // Detect device type based on memory and user agent
    let deviceType: 'high-end' | 'mid-range' | 'low-end';
    let cpuScore = 1.0;

    if (memory >= 8 || /powerful|gaming/i.test(userAgent)) {
      deviceType = 'high-end';
      cpuScore = 1.0;
    } else if (memory >= 4) {
      deviceType = 'mid-range';
      cpuScore = 0.7;
    } else {
      deviceType = 'low-end';
      cpuScore = 0.4;
    }

    // Get battery info if available
    let batteryState: 'charging' | 'discharging' | undefined;
    let batteryLevel: number | undefined;

    // Try to get battery info (this is an async API, but we're simplifying for now)
    const navigatorWithBattery = navigator as {
      getBattery?: () => Promise<{ charging: boolean; level: number }>;
    };
    if (typeof navigatorWithBattery.getBattery === 'function') {
      navigatorWithBattery.getBattery().then(battery => {
        batteryState = battery.charging ? 'charging' : 'discharging';
        batteryLevel = battery.level;
      });
    }

    // Create device profile
    return {
      deviceType,
      cpuScore,
      memoryScore: memory / 8, // Normalize to 0-1 range assuming 8GB is high-end
      batteryState,
      batteryLevel,
      networkType: connection.type === 'cellular' ? 'cellular' : 'wifi',
      networkLatency: connection.rtt || 50,
    };
  }

  /**
   * Get current optimization suggestions
   */
  public getOptimizationSuggestions(): OptimizationSuggestion[] {
    return [...this.optimizationSuggestions];
  }

  /**
   * Get resource consumption predictions
   */
  public getResourcePredictions(): Map<StringResourceType | ResourceType, ConsumptionPrediction> {
    return this.resourcePredictor.getAllPredictions();
  }

  /**
   * Enable or disable adaptive throttling
   */
  public setAdaptiveThrottling(enabled: boolean): void {
    this.adaptiveThrottlingEnabled = enabled;
    console.warn(
      `[AdaptivePerformanceManager] Adaptive throttling ${enabled ? 'enabled' : 'disabled'}`
    );
  }

  /**
   * Manually enable or disable power saving mode
   */
  public setPowerSavingMode(enabled: boolean): void {
    this.powerSavingMode = enabled;
    console.warn(
      `[AdaptivePerformanceManager] Power saving mode ${enabled ? 'enabled' : 'disabled'}`
    );

    // Emit power saving mode change event
    moduleEventBus.emit({
      type: 'STATUS_CHANGED',
      moduleId: 'adaptive-performance-manager',
      moduleType: 'resource-manager', // Use string literal instead of type casting
      timestamp: Date.now(),
      data: {
        type: 'power_saving_mode',
        enabled,
      },
    });
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Clear intervals
    if (this.optimizationInterval !== null) {
      clearInterval(this.optimizationInterval);
    }

    // Unsubscribe from events
    if (this.predictionSubscription) {
      this.predictionSubscription();
    }

    // Clean up predictor
    this.resourcePredictor.cleanup();

    console.warn('[AdaptivePerformanceManager] Cleaned up resources');
  }

  /**
   * Get the performance monitor instance
   */
  public getPerformanceMonitor(): ResourcePerformanceMonitor {
    return this._performanceMonitor;
  }

  /**
   * Get time since last optimization in milliseconds
   */
  public getTimeSinceLastOptimization(): number {
    return Date.now() - this._lastOptimizationTime;
  }
}
