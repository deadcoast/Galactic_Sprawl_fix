/**
 * D3 Animation Quality Manager
 *
 * This module provides a system for dynamically adjusting animation quality based on
 * device performance capabilities. It detects device performance characteristics and
 * automatically adjusts visualization complexity to maintain smooth animation experiences.
 *
 * Key features:
 * 1. Performance detection and categorization
 * 2. Quality presets for different device capabilities
 * 3. Dynamic quality adjustment based on real-time FPS
 * 4. Integration with existing animation systems
 * 5. User preference overrides
 */

import * as d3 from 'd3';

/**
 * Performance tier categorization
 */
export type PerformanceTier = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';

/**
 * Quality settings that can be adjusted
 */
export interface QualitySettings {
  /** Maximum number of animated elements */
  maxElementCount: number;

  /** Target frames per second */
  targetFps: number;

  /** Animation smoothness (1 = every frame, 2 = every other frame, etc.) */
  animationStepFactor: number;

  /** Visual complexity level (0-1) affecting details like shadows, gradients */
  visualComplexity: number;

  /** Whether to use WebGL acceleration when available */
  useWebGLWhenAvailable: boolean;

  /** Number of intermediate animation steps */
  interpolationSteps: number;

  /** Whether to use physics simulation */
  enablePhysics: boolean;

  /** Physics simulation detail level */
  physicsDetail: number;

  /** Whether to enable visual effects */
  enableEffects: boolean;

  /** Whether to enable batching for DOM operations */
  enableBatching: boolean;

  /** Whether to enable animation memoization */
  enableMemoization: boolean;

  /** Whether transitions should follow precise timing */
  preciseTiming: boolean;
}

/**
 * Device capability information
 */
export interface DeviceCapabilities {
  /** CPU benchmark score */
  cpuScore: number;

  /** GPU benchmark score */
  gpuScore: number;

  /** Memory available (approximation) */
  memoryScore: number;

  /** Connection speed category */
  connectionType: 'slow' | 'medium' | 'fast' | 'unknown';

  /** Whether the device is a mobile device */
  isMobile: boolean;

  /** Whether the device supports WebGL */
  hasWebGL: boolean;

  /** Whether the device is in battery saving mode */
  isBatterySaving: boolean;

  /** Screen resolution category */
  screenCategory: 'low' | 'medium' | 'high' | 'ultra';

  /** Browser performance capability */
  browserPerformance: 'low' | 'medium' | 'high';
}

/**
 * Quality management configuration
 */
export interface QualityManagerConfig {
  /** Whether to enable automatic quality adjustment */
  enableAutoAdjustment?: boolean;

  /** Minimum acceptable FPS before reducing quality */
  minAcceptableFps?: number;

  /** How often to check performance (ms) */
  performanceCheckInterval?: number;

  /** How quickly to adjust quality (0-1, higher = faster) */
  adjustmentResponsiveness?: number;

  /** Whether to respect prefers-reduced-motion */
  respectPrefersReducedMotion?: boolean;

  /** Whether to respect battery saving modes */
  respectBatterySaving?: boolean;

  /** Whether to save quality settings to local storage */
  persistSettings?: boolean;

  /** Initial quality tier override */
  initialQualityTier?: PerformanceTier;

  /** Maximum allowed elements regardless of performance */
  absoluteMaxElementCount?: number;

  /** Debug mode */
  debugMode?: boolean;
}

/**
 * Performance monitoring state
 */
interface PerformanceState {
  currentFps: number;
  fpsHistory: number[];
  lastAdjustmentTime: number;
  adjustmentCount: number;
  currentTier: PerformanceTier;
  detectedCapabilities: DeviceCapabilities;
  isInitialized: boolean;
  isAdjusting: boolean;
}

/**
 * Animation quality manager for D3 visualizations
 */
export class D3AnimationQualityManager {
  /** Default quality presets for each performance tier */
  private qualityPresets: Record<PerformanceTier, QualitySettings> = {
    ultra: {
      maxElementCount: 10000,
      targetFps: 60,
      animationStepFactor: 1,
      visualComplexity: 1.0,
      useWebGLWhenAvailable: true,
      interpolationSteps: 60,
      enablePhysics: true,
      physicsDetail: 1.0,
      enableEffects: true,
      enableBatching: true,
      enableMemoization: true,
      preciseTiming: true,
    },
    high: {
      maxElementCount: 5000,
      targetFps: 60,
      animationStepFactor: 1,
      visualComplexity: 0.8,
      useWebGLWhenAvailable: true,
      interpolationSteps: 45,
      enablePhysics: true,
      physicsDetail: 0.8,
      enableEffects: true,
      enableBatching: true,
      enableMemoization: true,
      preciseTiming: true,
    },
    medium: {
      maxElementCount: 2000,
      targetFps: 40,
      animationStepFactor: 2,
      visualComplexity: 0.6,
      useWebGLWhenAvailable: true,
      interpolationSteps: 30,
      enablePhysics: true,
      physicsDetail: 0.5,
      enableEffects: false,
      enableBatching: true,
      enableMemoization: true,
      preciseTiming: false,
    },
    low: {
      maxElementCount: 1000,
      targetFps: 30,
      animationStepFactor: 2,
      visualComplexity: 0.4,
      useWebGLWhenAvailable: true,
      interpolationSteps: 20,
      enablePhysics: false,
      physicsDetail: 0.3,
      enableEffects: false,
      enableBatching: true,
      enableMemoization: true,
      preciseTiming: false,
    },
    minimal: {
      maxElementCount: 500,
      targetFps: 20,
      animationStepFactor: 3,
      visualComplexity: 0.2,
      useWebGLWhenAvailable: false,
      interpolationSteps: 10,
      enablePhysics: false,
      physicsDetail: 0.1,
      enableEffects: false,
      enableBatching: true,
      enableMemoization: false,
      preciseTiming: false,
    },
  };

  /** Current quality settings */
  private currentSettings: QualitySettings;

  /** User preference overrides */
  private userOverrides: Partial<QualitySettings> = {};

  /** Current performance state */
  private performanceState: PerformanceState = {
    currentFps: 0,
    fpsHistory: [],
    lastAdjustmentTime: 0,
    adjustmentCount: 0,
    currentTier: 'medium',
    detectedCapabilities: this.getDefaultCapabilities(),
    isInitialized: false,
    isAdjusting: false,
  };

  /** Performance monitoring interval */
  private monitoringInterval: number | null = null;

  /** Animation callbacks by ID */
  private qualityChangeCallbacks: Map<string, (settings: QualitySettings) => void> = new Map();

  /** Animation quality overrides by ID */
  private animationQualityOverrides: Map<string, Partial<QualitySettings>> = new Map();

  /** Animation FPS history */
  private animationFpsTracking: Map<string, number[]> = new Map();

  /**
   * Create a new animation quality manager
   */
  constructor(private config: QualityManagerConfig = {}) {
    // Set up default configuration
    this.config = {
      enableAutoAdjustment: true,
      minAcceptableFps: 30,
      performanceCheckInterval: 5000,
      adjustmentResponsiveness: 0.5,
      respectPrefersReducedMotion: true,
      respectBatterySaving: true,
      persistSettings: true,
      initialQualityTier: undefined,
      absoluteMaxElementCount: 20000,
      debugMode: false,
      ...config,
    };

    // Initialize with medium settings first (will be adjusted)
    this.currentSettings = this.qualityPresets.medium;

    // Load saved settings if enabled
    if (this.config.persistSettings) {
      this.loadSavedSettings();
    }

    // Apply initial quality tier if specified
    if (this.config.initialQualityTier) {
      this.setQualityTier(this.config.initialQualityTier);
    }

    // Initialize the system
    this.initialize();
  }

  /**
   * Initialize the quality management system
   */
  private async initialize(): Promise<void> {
    // Load browser capability detection
    await this.detectDeviceCapabilities();

    // Set initial quality based on detected capabilities
    if (!this.config.initialQualityTier) {
      const detectedTier = this.detectOptimalQualityTier();
      this.setQualityTier(detectedTier);
    }

    // Start monitoring if auto-adjustment is enabled
    if (this.config.enableAutoAdjustment) {
      this.startPerformanceMonitoring();
    }

    // Monitor system events that might affect performance
    this.setupSystemEventListeners();

    // Mark as initialized
    this.performanceState.isInitialized = true;

    if (this.config.debugMode) {
      console.warn('D3AnimationQualityManager initialized', {
        capabilities: this.performanceState.detectedCapabilities,
        qualityTier: this.performanceState.currentTier,
        settings: this.currentSettings,
      });
    }
  }

  /**
   * Get default capabilities when proper detection isn't available
   */
  private getDefaultCapabilities(): DeviceCapabilities {
    return {
      cpuScore: 50,
      gpuScore: 50,
      memoryScore: 50,
      connectionType: 'unknown',
      isMobile: false,
      hasWebGL: false,
      isBatterySaving: false,
      screenCategory: 'medium',
      browserPerformance: 'medium',
    };
  }

  /**
   * Detect device capabilities
   */
  private async detectDeviceCapabilities(): Promise<void> {
    const capabilities: DeviceCapabilities = this.getDefaultCapabilities();

    // Mobile detection
    capabilities.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // WebGL support
    try {
      const canvas = document.createElement('canvas');
      capabilities.hasWebGL = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      capabilities.hasWebGL = false;
    }

    // Battery API check
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        capabilities.isBatterySaving = battery.charging === false && battery.level < 0.2;

        // Listen for battery changes
        battery.addEventListener('levelchange', () => {
          this.performanceState.detectedCapabilities.isBatterySaving =
            battery.charging === false && battery.level < 0.2;
          if (this.config.respectBatterySaving) {
            this.adjustQualityIfNeeded();
          }
        });
      } catch (e) {
        // Battery API not available
      }
    }

    // Screen resolution category
    const pixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.screen.width * pixelRatio;
    const screenHeight = window.screen.height * pixelRatio;
    const resolution = screenWidth * screenHeight;

    if (resolution > 4000 * 3000) {
      capabilities.screenCategory = 'ultra';
    } else if (resolution > 2000 * 1500) {
      capabilities.screenCategory = 'high';
    } else if (resolution > 1000 * 750) {
      capabilities.screenCategory = 'medium';
    } else {
      capabilities.screenCategory = 'low';
    }

    // Connection type detection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g') {
          capabilities.connectionType = 'fast';
        } else if (effectiveType === '3g') {
          capabilities.connectionType = 'medium';
        } else {
          capabilities.connectionType = 'slow';
        }
      }
    }

    // Perform quick CPU benchmark
    const cpuBenchmarkStart = performance.now();
    let benchmarkResult = 0;
    for (let i = 0; i < 1000000; i++) {
      benchmarkResult += Math.sqrt(i);
    }
    const cpuBenchmarkTime = performance.now() - cpuBenchmarkStart;

    // Normalize CPU score (lower is better, so invert)
    capabilities.cpuScore = Math.min(100, Math.max(0, 100 - cpuBenchmarkTime / 50));

    // GPU benchmarking is more complex and would require WebGL,
    // for simplicity we'll estimate based on other factors
    capabilities.gpuScore = capabilities.hasWebGL
      ? capabilities.isMobile
        ? 60
        : 80
      : capabilities.isMobile
        ? 30
        : 50;

    // Attempt to estimate available memory
    if ('deviceMemory' in navigator) {
      const deviceMemory = (navigator as any).deviceMemory;
      if (typeof deviceMemory === 'number') {
        // deviceMemory is in GB, normalize to 0-100 scale
        // Assuming 8GB as high-end, 16GB+ as maximum
        capabilities.memoryScore = Math.min(100, Math.max(0, (deviceMemory / 16) * 100));
      }
    } else {
      // Default assumption based on device type
      capabilities.memoryScore = capabilities.isMobile ? 40 : 70;
    }

    // Browser performance estimation
    // This is a very rough heuristic
    const browserScore =
      (capabilities.cpuScore + capabilities.gpuScore + capabilities.memoryScore) / 3;
    if (browserScore > 70) {
      capabilities.browserPerformance = 'high';
    } else if (browserScore > 40) {
      capabilities.browserPerformance = 'medium';
    } else {
      capabilities.browserPerformance = 'low';
    }

    // Update the state
    this.performanceState.detectedCapabilities = capabilities;
  }

  /**
   * Determine the optimal quality tier based on detected capabilities
   */
  private detectOptimalQualityTier(): PerformanceTier {
    const caps = this.performanceState.detectedCapabilities;

    // Basic score combining all factors
    const overallScore =
      caps.cpuScore * 0.3 +
      caps.gpuScore * 0.3 +
      caps.memoryScore * 0.2 +
      (caps.isMobile ? 0 : 20) +
      (caps.hasWebGL ? 10 : 0) +
      (caps.isBatterySaving ? -15 : 0) +
      (caps.screenCategory === 'ultra'
        ? 10
        : caps.screenCategory === 'high'
          ? 5
          : caps.screenCategory === 'low'
            ? -5
            : 0);

    // Map overall score to quality tier
    if (overallScore >= 80) {
      return 'ultra';
    } else if (overallScore >= 60) {
      return 'high';
    } else if (overallScore >= 40) {
      return 'medium';
    } else if (overallScore >= 20) {
      return 'low';
    } else {
      return 'minimal';
    }
  }

  /**
   * Start monitoring performance to adjust quality dynamically
   */
  private startPerformanceMonitoring(): void {
    if (this.monitoringInterval !== null) {
      return; // Already monitoring
    }

    let lastFrameTime = performance.now();
    let frameCount = 0;

    // FPS monitoring function
    const measureFps = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastFrameTime;

      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / elapsed);
        this.performanceState.currentFps = currentFps;
        this.performanceState.fpsHistory.push(currentFps);

        // Keep only the last 10 measurements
        if (this.performanceState.fpsHistory.length > 10) {
          this.performanceState.fpsHistory.shift();
        }

        frameCount = 0;
        lastFrameTime = now;
      }

      requestAnimationFrame(measureFps);
    };

    // Start measuring FPS
    requestAnimationFrame(measureFps);

    // Start the periodic quality adjustment check
    this.monitoringInterval = window.setInterval(() => {
      this.adjustQualityIfNeeded();
    }, this.config.performanceCheckInterval);
  }

  /**
   * Stop performance monitoring
   */
  private stopPerformanceMonitoring(): void {
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Set up listeners for system events that might affect performance
   */
  private setupSystemEventListeners(): void {
    // Listen for reduced motion preference
    if (this.config.respectPrefersReducedMotion) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      const handleMotionChange = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) {
          // User prefers reduced motion, force lower quality
          this.setQualityTier('low');
        } else {
          // User doesn't prefer reduced motion, redetect optimal quality
          this.setQualityTier(this.detectOptimalQualityTier());
        }
      };

      // Check initial state
      handleMotionChange(motionQuery);

      // Listen for changes
      if (typeof motionQuery.addEventListener === 'function') {
        motionQuery.addEventListener('change', handleMotionChange);
      } else if (typeof motionQuery.addListener === 'function') {
        // Older browsers
        motionQuery.addListener(handleMotionChange);
      }
    }

    // Listen for visibility changes to adjust quality when tab becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Page is now visible, check if we need to adjust quality
        this.adjustQualityIfNeeded();
      }
    });

    // Listen for window resize events, which might affect performance
    let resizeTimeout: number | null = null;
    window.addEventListener('resize', () => {
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout);
      }

      // Debounce resize events
      resizeTimeout = window.setTimeout(() => {
        this.adjustQualityIfNeeded();
        resizeTimeout = null;
      }, 500);
    });
  }

  /**
   * Adjust quality settings if needed based on performance
   */
  private adjustQualityIfNeeded(): void {
    if (!this.config.enableAutoAdjustment || this.performanceState.isAdjusting) {
      return;
    }

    this.performanceState.isAdjusting = true;

    try {
      // Get average FPS from recent history
      const avgFps =
        this.performanceState.fpsHistory.length > 0
          ? this.performanceState.fpsHistory.reduce((sum, fps) => sum + fps, 0) /
            this.performanceState.fpsHistory.length
          : this.performanceState.currentFps;

      const currentTierIndex = this.getTierIndex(this.performanceState.currentTier);
      const minAcceptableFps = this.config.minAcceptableFps || 30;

      // Check if we need to adjust quality
      if (avgFps < minAcceptableFps && currentTierIndex > 0) {
        // Performance is poor, reduce quality
        const newTier = this.getTierByIndex(currentTierIndex - 1);
        this.setQualityTier(newTier);

        if (this.config.debugMode) {
          console.warn(`Reducing quality to ${newTier} due to low FPS (${avgFps.toFixed(1)})`);
        }
      } else if (avgFps > minAcceptableFps * 1.5 && currentTierIndex < 4) {
        // Performance is good, we might be able to increase quality
        // But do this cautiously and less frequently

        const timeSinceLastAdjustment =
          performance.now() - this.performanceState.lastAdjustmentTime;
        const requiredTimeBetweenUpgrades = 30000; // 30 seconds between upgrades

        if (timeSinceLastAdjustment > requiredTimeBetweenUpgrades) {
          const newTier = this.getTierByIndex(currentTierIndex + 1);
          this.setQualityTier(newTier);

          if (this.config.debugMode) {
            console.warn(`Increasing quality to ${newTier} due to good FPS (${avgFps.toFixed(1)})`);
          }
        }
      }
    } finally {
      this.performanceState.isAdjusting = false;
    }
  }

  /**
   * Get the index of a quality tier
   */
  private getTierIndex(tier: PerformanceTier): number {
    const tiers: PerformanceTier[] = ['minimal', 'low', 'medium', 'high', 'ultra'];
    return tiers.indexOf(tier);
  }

  /**
   * Get a quality tier by index
   */
  private getTierByIndex(index: number): PerformanceTier {
    const tiers: PerformanceTier[] = ['minimal', 'low', 'medium', 'high', 'ultra'];
    return tiers[Math.max(0, Math.min(tiers.length - 1, index))];
  }

  /**
   * Set quality tier
   */
  public setQualityTier(tier: PerformanceTier): void {
    // Update the current tier
    this.performanceState.currentTier = tier;

    // Get the preset for this tier
    const presetSettings = this.qualityPresets[tier];

    // Apply user overrides
    this.currentSettings = {
      ...presetSettings,
      ...this.userOverrides,
    };

    // Apply the new settings to all registered animations
    this.applyQualitySettingsToAnimations();

    // Save settings if persistence is enabled
    if (this.config.persistSettings) {
      this.saveSettings();
    }

    // Update last adjustment time
    this.performanceState.lastAdjustmentTime = performance.now();
    this.performanceState.adjustmentCount++;
  }

  /**
   * Apply current quality settings to all registered animations
   */
  private applyQualitySettingsToAnimations(): void {
    // Notify all registered animations of quality changes
    this.qualityChangeCallbacks.forEach((callback, animationId) => {
      try {
        // Apply global settings with any animation-specific overrides
        const animationSettings = {
          ...this.currentSettings,
          ...(this.animationQualityOverrides.get(animationId) || {}),
        };

        callback(animationSettings);
      } catch (err) {
        console.error(`Error applying quality settings to animation ${animationId}:`, err);
      }
    });
  }

  /**
   * Register an animation for quality management
   */
  public registerAnimation(
    animationId: string,
    onQualityChange: (settings: QualitySettings) => void,
    animationSpecificOverrides?: Partial<QualitySettings>
  ): void {
    // Store the callback
    this.qualityChangeCallbacks.set(animationId, onQualityChange);

    // Store any animation-specific overrides
    if (animationSpecificOverrides) {
      this.animationQualityOverrides.set(animationId, animationSpecificOverrides);
    }

    // Initialize FPS tracking for this animation
    this.animationFpsTracking.set(animationId, []);

    // Apply current settings immediately
    const settings = {
      ...this.currentSettings,
      ...(animationSpecificOverrides || {}),
    };

    onQualityChange(settings);
  }

  /**
   * Unregister an animation
   */
  public unregisterAnimation(animationId: string): void {
    this.qualityChangeCallbacks.delete(animationId);
    this.animationQualityOverrides.delete(animationId);
    this.animationFpsTracking.delete(animationId);
  }

  /**
   * Update FPS for a specific animation
   */
  public updateAnimationFps(animationId: string, fps: number): void {
    const fpsHistory = this.animationFpsTracking.get(animationId);
    if (fpsHistory) {
      fpsHistory.push(fps);

      // Keep only the last 10 measurements
      if (fpsHistory.length > 10) {
        fpsHistory.shift();
      }
    }
  }

  /**
   * Set user preference override for specific settings
   */
  public setUserPreference(settingKey: keyof QualitySettings, value: unknown): void {
    this.userOverrides[settingKey] = value;

    // Apply the change immediately
    this.currentSettings = {
      ...this.qualityPresets[this.performanceState.currentTier],
      ...this.userOverrides,
    };

    // Apply to all animations
    this.applyQualitySettingsToAnimations();

    // Save settings if persistence is enabled
    if (this.config.persistSettings) {
      this.saveSettings();
    }
  }

  /**
   * Clears all user preference overrides
   */
  public clearUserPreferences(): void {
    this.userOverrides = {};

    // Reapply preset settings
    this.currentSettings = this.qualityPresets[this.performanceState.currentTier];

    // Apply to all animations
    this.applyQualitySettingsToAnimations();

    // Save settings if persistence is enabled
    if (this.config.persistSettings) {
      this.saveSettings();
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      const settingsToSave = {
        qualityTier: this.performanceState.currentTier,
        userOverrides: this.userOverrides,
      };

      localStorage.setItem('d3-animation-quality-settings', JSON.stringify(settingsToSave));
    } catch (err) {
      console.error('Error saving animation quality settings:', err);
    }
  }

  /**
   * Load saved settings from localStorage
   */
  private loadSavedSettings(): void {
    try {
      const savedSettings = localStorage.getItem('d3-animation-quality-settings');

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);

        // Apply saved tier if it exists
        if (parsed.qualityTier && typeof parsed.qualityTier === 'string') {
          this.performanceState.currentTier = parsed.qualityTier as PerformanceTier;
        }

        // Apply saved user overrides
        if (parsed.userOverrides && typeof parsed.userOverrides === 'object') {
          this.userOverrides = parsed.userOverrides;
        }
      }
    } catch (err) {
      console.error('Error loading animation quality settings:', err);
    }
  }

  /**
   * Get current quality settings
   */
  public getCurrentSettings(): QualitySettings {
    return { ...this.currentSettings };
  }

  /**
   * Get current performance state
   */
  public getPerformanceState(): Readonly<PerformanceState> {
    return { ...this.performanceState };
  }

  /**
   * Get detected device capabilities
   */
  public getDeviceCapabilities(): Readonly<DeviceCapabilities> {
    return { ...this.performanceState.detectedCapabilities };
  }

  /**
   * Enable or disable auto-adjustment
   */
  public setAutoAdjustment(enabled: boolean): void {
    this.config.enableAutoAdjustment = enabled;

    if (enabled && this.monitoringInterval === null) {
      this.startPerformanceMonitoring();
    } else if (!enabled && this.monitoringInterval !== null) {
      this.stopPerformanceMonitoring();
    }
  }
}

// Singleton instance for easier access
export const animationQualityManager = new D3AnimationQualityManager();

/**
 * Helper to create a quality-adaptive D3 visualization
 */
export function createQualityAdaptiveVisualization<GElement extends Element = SVGSVGElement>(
  selector: string | GElement,
  animationId: string,
  setup: (
    container: d3.Selection<GElement, unknown, null, undefined>,
    settings: QualitySettings
  ) => void,
  qualityOverrides?: Partial<QualitySettings>
): d3.Selection<GElement, unknown, null, undefined> {
  // Select the container element
  const selection = d3.select(selector) as d3.Selection<GElement, unknown, null, undefined>;

  // Register with the quality manager
  animationQualityManager.registerAnimation(
    animationId,
    settings => {
      // Clear previous content
      selection.selectAll('*').remove();

      // Set up visualization with current quality settings
      setup(selection, settings);
    },
    qualityOverrides
  );

  return selection;
}

/**
 * Create quality-adaptive D3 transitions
 */
export function createQualityAdaptiveTransition<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  duration?: number
): d3.Transition<GElement, Datum, PElement, PDatum> {
  const settings = animationQualityManager.getCurrentSettings();

  // Adjust duration based on quality settings
  let adjustedDuration = duration;
  if (duration !== undefined) {
    // Scale duration by animation step factor
    // If animationStepFactor is 2, transitions will take twice as long but use half as many frames
    adjustedDuration = duration * settings.animationStepFactor;
  }

  // Create transition with quality-appropriate settings
  const transition = selection.transition().duration(adjustedDuration);

  // If precise timing isn't needed, use a more efficient easing function
  if (!settings.preciseTiming) {
    transition.ease(d3.easeLinear); // Linear is most efficient
  }

  return transition;
}

/**
 * Helper to create a quality-adaptive data binding
 */
export function bindDataWithQualityAdjustment<
  GElement extends Element,
  OldDatum,
  NewDatum,
  PElement extends Element,
  PDatum,
>(
  selection: d3.Selection<GElement, OldDatum, PElement, PDatum>,
  data: NewDatum[],
  key?: (d: NewDatum, i: number, data: NewDatum[]) => string
): d3.Selection<GElement, NewDatum, PElement, PDatum> {
  const settings = animationQualityManager.getCurrentSettings();

  // If we need to reduce the number of elements for performance reasons
  const maxElements = settings.maxElementCount;
  let limitedData = data;

  if (data.length > maxElements) {
    // Limit the number of elements based on quality settings
    limitedData = data.slice(0, maxElements);
  }

  // Bind the data, potentially with a key function
  return key ? selection.data(limitedData, key) : selection.data(limitedData);
}

/**
 * Helper to create a quality-adaptive simulation
 */
export function createQualityAdaptiveSimulation<NodeDatum extends d3.SimulationNodeDatum>(
  nodes: NodeDatum[]
): d3.Simulation<NodeDatum, undefined> {
  const settings = animationQualityManager.getCurrentSettings();

  // Create simulation with quality-adaptive settings
  const simulation = d3.forceSimulation<NodeDatum>().nodes(nodes);

  // Adjust simulation parameters based on quality settings
  const alphaDecay = settings.physicsDetail < 0.5 ? 0.1 : 0.02; // Faster convergence for low quality
  const velocityDecay = settings.physicsDetail < 0.5 ? 0.5 : 0.4; // More damping for low quality
  const iterations = Math.max(1, Math.round(settings.physicsDetail * 4)); // Fewer iterations for low quality

  simulation.alphaDecay(alphaDecay).velocityDecay(velocityDecay).alphaTarget(0).alphaMin(0.001);

  // Set tick iterations based on quality
  if (typeof simulation.tick === 'function') {
    const originalTick = simulation.tick;
    simulation.tick = function () {
      for (let i = 0; i < iterations; i++) {
        originalTick.call(this);
      }
      return this;
    };
  }

  return simulation;
}

/**
 * Helper to create a quality-adaptive interpolator
 */
export function createQualityAdaptiveInterpolator<T>(
  a: T,
  b: T,
  interpolatorFactory: (a: T, b: T) => (t: number) => T = d3.interpolate
): (t: number) => T {
  const settings = animationQualityManager.getCurrentSettings();
  const baseInterpolator = interpolatorFactory(a, b);

  // For high quality settings, use the full interpolator
  if (settings.interpolationSteps >= 60) {
    return baseInterpolator;
  }

  // For lower quality, create a stepped interpolator with fewer intermediate values
  return (t: number) => {
    // Quantize the t value to reduce the number of unique outputs
    const steps = settings.interpolationSteps;
    const steppedT = Math.round(t * steps) / steps;
    return baseInterpolator(steppedT);
  };
}

/**
 * React hook for using quality-adaptive D3 visualizations
 */
export function useQualityAdaptiveD3(
  animationId: string,
  qualityOverrides?: Partial<QualitySettings>
) {
  const [qualitySettings, setQualitySettings] = React.useState<QualitySettings>(
    animationQualityManager.getCurrentSettings()
  );

  React.useEffect(() => {
    // Register with quality manager
    animationQualityManager.registerAnimation(
      animationId,
      newSettings => {
        setQualitySettings(newSettings);
      },
      qualityOverrides
    );

    // Unregister on cleanup
    return () => {
      animationQualityManager.unregisterAnimation(animationId);
    };
  }, [animationId, qualityOverrides]);

  return qualitySettings;
}
