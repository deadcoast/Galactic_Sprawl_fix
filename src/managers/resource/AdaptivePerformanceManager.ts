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
import { BaseEvent } from '../../lib/events/UnifiedEventSystem';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { ensureStringResourceType } from '../../utils/resources/ResourceTypeMigration';
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

// Define a more specific type for the Status Changed event data if needed
interface StatusChangedEventData {
  type: string;
  snapshot?: ResourcePerformanceSnapshot;
  [ key: string ]: unknown; // Allow other properties
}

// Define a more specific type for the Status Changed event itself
interface StatusChangedEvent extends BaseEvent {
  moduleId?: string;
  data?: StatusChangedEventData;
}

/**
 * Manager for adaptive performance optimization
 */
export class AdaptivePerformanceManager extends AbstractBaseManager<BaseEvent> {
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

  private optimizationIntervalMs = 30000;
  private timeSinceLastOptimization = 0;

  constructor(performanceMonitor: ResourcePerformanceMonitor, id?: string) {
    super('AdaptivePerformanceManager', id);
    this._performanceMonitor = performanceMonitor;
    this.sessionStartTime = Date.now();
    this._lastOptimizationTime = Date.now();
    this.resourcePredictor = new ResourceConsumptionPredictor();
    this.deviceProfile = this.detectDeviceProfile();

    console.warn(
      '[AdaptivePerformanceManager] Initialized with device profile:',
      this.deviceProfile.deviceType
    );
  }

  /**
   * Initialize the manager
   */
  protected async onInitialize(_dependencies?: Record<string, unknown>): Promise<void> {
    this.initializePredictor();
    this.subscribeToPerformanceEvents();

    console.warn(
      '[AdaptivePerformanceManager] Initialized with device profile:',
      this.deviceProfile.deviceType
    );
  }

  /**
   * Update method called on each game tick
   */
  protected onUpdate(deltaTime: number): void {
    this.timeSinceLastOptimization += deltaTime;

    if (this.timeSinceLastOptimization >= this.optimizationIntervalMs) {
      this.runOptimizationCycle();
      this.timeSinceLastOptimization = 0;
    }
  }

  /**
   * Dispose of manager resources
   */
  protected async onDispose(): Promise<void> {
    this.resourcePredictor.cleanup();

    console.warn('[AdaptivePerformanceManager] Cleaned up resources');
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
    this.resourcePredictor.initialize();
  }

  /**
   * Subscribe to performance events
   */
  private subscribeToPerformanceEvents(): void {
    this.subscribe<StatusChangedEvent>('STATUS_CHANGED', event => {
      if (
        event?.moduleId === 'resource-performance-monitor' &&
        event.data &&
        typeof event.data === 'object' &&
        event.data.type === 'performance_snapshot' &&
        event.data.snapshot
      ) {
        this.processPerformanceSnapshot(event.data.snapshot as ResourcePerformanceSnapshot);
      }
    });
  }

  /**
   * Process a performance snapshot and update the ML model
   */
  private processPerformanceSnapshot(snapshot: ResourcePerformanceSnapshot): void {
    this.userInteractionCount += Math.round(Math.random() * 3);

    const timeSinceLastMonitorSnapshot = this._performanceMonitor.getTimeSinceLastSnapshot();
    if (timeSinceLastMonitorSnapshot > 10000) {
      console.warn(
        `[AdaptivePerformanceManager] Performance monitor snapshot delay: ${timeSinceLastMonitorSnapshot}ms`
      );
    }

    for (const [ resourceType, metrics ] of snapshot.metrics.entries()) {
      this.resourcePredictor.addDataPoint({
        timestamp: Date.now(),
        resourceType: resourceType as ResourceType,
        value: metrics.consumptionRate,
        sessionDuration: (Date.now() - this.sessionStartTime) / 1000,
        userActions: this.userInteractionCount,
        systemLoad: snapshot.systemLoad,
        devicePerformanceScore: this.deviceProfile.cpuScore,
      });

      this.updatePotentialSavings(resourceType, metrics);
    }

    if (snapshot.bottlenecks.length > 0) {
      this.generateOptimizationSuggestions(snapshot);
    }

    if (this.adaptiveThrottlingEnabled) {
      this.applyAdaptiveThrottling(snapshot);
    }
  }

  /**
   * Updates potential savings for a resource type
   */
  private updatePotentialSavings(
    resourceType: string | ResourceType,
    metrics: PerformanceMetrics
  ): void {
    const stringType = ensureStringResourceType(resourceType);

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

    for (const resourceType of snapshot.bottlenecks) {
      const metrics = snapshot.metrics.get(resourceType);
      if (!metrics) continue;

      const prediction = this.resourcePredictor.predict(resourceType as ResourceType, {
        sessionDuration: (Date.now() - this.sessionStartTime) / 1000,
        userActions: this.userInteractionCount,
        systemLoad: snapshot.systemLoad,
        devicePerformanceScore: this.deviceProfile.cpuScore,
      });

      if (!prediction) continue;

      if (metrics.consumptionRate > prediction.predictedValue * 1.2) {
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
        suggestions.push({
          type: 'batch-processing',
          target: resourceType,
          priority: 'medium',
          description: `Implement batch processing for ${resourceType} operations to reduce overhead`,
          potentialSavings: metrics.consumptionRate * 0.15,
          implementationDifficulty: 6,
        });
      }

      if (
        resourceType === ResourceType.ENERGY &&
        this.deviceProfile.batteryState === 'discharging'
      ) {
        suggestions.push({
          type: 'resource-allocation',
          target: ResourceType.ENERGY,
          priority: 'critical',
          description: 'Activate power-saving mode to extend battery life',
          potentialSavings: metrics.consumptionRate * 0.3,
          implementationDifficulty: 3,
        });
      }
    }

    if (snapshot.systemLoad > 0.8) {
      suggestions.push({
        type: 'rendering',
        target: 'ui',
        priority: 'high',
        description: 'Reduce rendering quality or frame rate to decrease system load',
        potentialSavings: snapshot.systemLoad * 0.2,
        implementationDifficulty: 5,
      });
    }

    this.optimizationSuggestions = suggestions;

    if (suggestions.length > 0) {
      console.warn('[AdaptivePerformanceManager] Optimization suggestions:');
      suggestions.forEach(suggestion => {
        console.warn(
          `- ${suggestion.priority.toUpperCase()}: ${suggestion.description} (Savings: ${suggestion.potentialSavings.toFixed(2)})`
        );
      });
    }

    this.emitOptimizationSuggestions(suggestions);
  }

  /**
   * Apply adaptive throttling based on device capabilities and system load
   */
  private applyAdaptiveThrottling(snapshot: ResourcePerformanceSnapshot): void {
    if (!this.gameLoopManager) return;

    let throttleFactor = 1.0;

    if (snapshot.systemLoad > 0.9) {
      throttleFactor = 0.7;
    } else if (snapshot.systemLoad > 0.7) {
      throttleFactor = 0.85;
    }

    if (this.deviceProfile.deviceType === 'low-end') {
      throttleFactor *= 0.8;
    } else if (this.deviceProfile.deviceType === 'mid-range') {
      throttleFactor *= 0.9;
    }

    if (
      this.deviceProfile.batteryState === 'discharging' &&
      this.deviceProfile.batteryLevel &&
      this.deviceProfile.batteryLevel < 0.2
    ) {
      throttleFactor *= 0.7;
    }

    if (this.powerSavingMode) {
      throttleFactor *= 0.6;
    }

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
    this.publish({
      type: 'OPTIMIZATION_SUGGESTIONS',
      timestamp: Date.now(),
      managerId: this.getName(),
      suggestions,
    });
  }

  /**
   * Run a full optimization cycle
   */
  private runOptimizationCycle(): void {
    this.deviceProfile = this.detectDeviceProfile();

    this.updatePowerSavingMode();

    this.applyHighPriorityOptimizations();

    this._lastOptimizationTime = Date.now();
  }

  /**
   * Update power saving mode based on device state
   */
  private updatePowerSavingMode(): void {
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

      this.publish({
        type: 'POWER_SAVING_MODE_CHANGED',
        timestamp: Date.now(),
        managerId: this.getName(),
        enabled: this.powerSavingMode,
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

    const sortedSuggestions = [ ...highPrioritySuggestions ].sort((a, b) => {
      const valueA = a.potentialSavings / a.implementationDifficulty;
      const valueB = b.potentialSavings / b.implementationDifficulty;
      return valueB - valueA;
    });

    for (const suggestion of sortedSuggestions.slice(0, 2)) {
      console.warn(`[AdaptivePerformanceManager] Applying optimization: ${suggestion.description}`);
    }
  }

  /**
   * Detect device capabilities and create a device profile
   */
  private detectDeviceProfile(): DeviceProfile {
    const userAgent = navigator.userAgent;
    const memory = (navigator as { deviceMemory?: number; }).deviceMemory || 4;
    const connection = (navigator as { connection?: { type: string; rtt: number; }; }).connection || {
      type: 'unknown',
      rtt: 50,
    };

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

    let batteryState: 'charging' | 'discharging' | undefined;
    let batteryLevel: number | undefined;

    const navigatorWithBattery = navigator as {
      getBattery?: () => Promise<{ charging: boolean; level: number; }>;
    };
    if (typeof navigatorWithBattery.getBattery === 'function') {
      navigatorWithBattery.getBattery().then(battery => {
        batteryState = battery.charging ? 'charging' : 'discharging';
        batteryLevel = battery.level;
      });
    }

    return {
      deviceType,
      cpuScore,
      memoryScore: memory / 8,
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
    return [ ...this.optimizationSuggestions ];
  }

  /**
   * Get resource consumption predictions
   */
  public getResourcePredictions(): Map<string | ResourceType, ConsumptionPrediction> {
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

    this.publish({
      type: 'POWER_SAVING_MODE_CHANGED',
      timestamp: Date.now(),
      managerId: this.getName(),
      enabled,
    });
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
