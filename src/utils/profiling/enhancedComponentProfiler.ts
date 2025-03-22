/**
 * @context: ui-system, performance-optimization, profiling-system
 * 
 * Enhanced component profiler with additional metrics for layout issues,
 * re-render causes, and interaction delays for better performance debugging.
 */

import * as React from 'react';
import { isEqual } from 'lodash';
import { 
  ComponentProfilingOptions, 
  ComponentProfilingResult,
  ComponentRenderMetrics 
} from '../../types/ui/UITypes';
import { createComponentProfiler } from './componentProfiler';

export interface LayoutMetrics {
  /**
   * Number of layout shifts detected
   */
  layoutShifts: number;
  
  /**
   * Cumulative layout shift score (similar to Core Web Vitals CLS)
   */
  cumulativeLayoutShift: number;
  
  /**
   * Time spent in layout operations
   */
  layoutDuration: number;
  
  /**
   * Layout shifts with timestamps and impact scores
   */
  layoutShiftHistory: Array<{
    timestamp: number;
    score: number;
    sourceElement?: string;
  }>;
}

export interface InteractionMetrics {
  /**
   * First input delay measurement (time to response to first interaction)
   */
  firstInputDelay: number | null;
  
  /**
   * Interaction to next paint measurements
   */
  interactionToNextPaint: Array<{
    timestamp: number;
    duration: number;
    eventType: string;
  }>;
  
  /**
   * Average time from interaction to next paint
   */
  averageInteractionDelay: number;
  
  /**
   * Number of slow interactions (interactions that took too long to respond)
   */
  slowInteractions: number;
}

export interface EnhancedRenderInfo {
  /**
   * Timestamp of the render
   */
  timestamp: number;
  
  /**
   * Render duration
   */
  renderTime: number;
  
  /**
   * Whether the render was wasted (no visual changes)
   */
  wasted: boolean;
  
  /**
   * Props that changed causing the render
   */
  changedProps: string[];
  
  /**
   * Whether the render was caused by a state change
   */
  causedByStateChange?: boolean;
  
  /**
   * Whether the render was caused by a context change
   */
  causedByContextChange?: boolean;
  
  /**
   * Whether the render was caused by a parent re-render
   */
  causedByParentRender?: boolean;
  
  /**
   * Whether the render was caused by a hook effect
   */
  causedByEffect?: boolean;
  
  /**
   * Reference to the component instance
   */
  componentInstance?: unknown;
}

export interface EnhancedComponentProfilingOptions extends ComponentProfilingOptions {
  /**
   * Whether to track layout metrics
   */
  trackLayoutMetrics?: boolean;
  
  /**
   * Whether to track interaction metrics
   */
  trackInteractionMetrics?: boolean;
  
  /**
   * Whether to track render causes
   */
  trackRenderCauses?: boolean;
  
  /**
   * Whether to analyze component dependencies
   */
  analyzeDependencies?: boolean;
  
  /**
   * Threshold for slow interactions in milliseconds
   */
  slowInteractionThreshold?: number;
  
  /**
   * Whether to report metrics to the performance observer
   */
  reportToPerformanceObserver?: boolean;
}

export interface EnhancedComponentProfilingResult extends ComponentProfilingResult {
  /**
   * Enhanced information about each render
   */
  enhancedRenderHistory: EnhancedRenderInfo[];
  
  /**
   * Layout metrics
   */
  layoutMetrics: LayoutMetrics;
  
  /**
   * Interaction metrics
   */
  interactionMetrics: InteractionMetrics;
  
  /**
   * Component dependency analysis
   */
  dependencies: {
    contexts: string[];
    hooks: string[];
    childComponents: string[];
  };
  
  /**
   * Reset all enhanced metrics
   */
  resetEnhancedMetrics: () => void;
  
  /**
   * Update enhanced profiling options
   */
  updateEnhancedOptions: (newOptions: Partial<EnhancedComponentProfilingOptions>) => void;
  
  /**
   * Record a layout shift
   */
  recordLayoutShift: (score: number, sourceElement?: string) => void;
  
  /**
   * Record an interaction
   */
  recordInteraction: (duration: number, eventType: string) => void;
  
  /**
   * Record render cause
   */
  recordRenderCause: (cause: {
    stateChange?: boolean;
    contextChange?: boolean;
    parentRender?: boolean;
    effect?: boolean;
  }) => void;
}

// Add Performance Entry interface for type safety
interface PerformanceEntryWithProcessing extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

/**
 * Default enhanced profiling options
 */
const DEFAULT_ENHANCED_PROFILING_OPTIONS: EnhancedComponentProfilingOptions = {
  enabled: true,
  logToConsole: false,
  slowRenderThreshold: 16, // 1 frame at 60fps
  maxRenderHistory: 100,
  trackPropChanges: true,
  trackRenderPath: false,
  trackLayoutMetrics: true,
  trackInteractionMetrics: true,
  trackRenderCauses: true,
  analyzeDependencies: false,
  slowInteractionThreshold: 100, // 100ms is considered slow for interactions
  reportToPerformanceObserver: false,
};

/**
 * Creates an enhanced component profiler with additional metrics
 * @param componentName Name of the component to profile
 * @param options Profiling options
 * @returns Enhanced component profiling result
 */
export function createEnhancedComponentProfiler(
  componentName: string,
  options: Partial<EnhancedComponentProfilingOptions> = {}
): EnhancedComponentProfilingResult {
  // Create base profiler
  const baseProfiler = createComponentProfiler(componentName, options);
  
  // Merge options with defaults
  const profilingOptions: EnhancedComponentProfilingOptions = {
    ...DEFAULT_ENHANCED_PROFILING_OPTIONS,
    ...options,
  };
  
  // Initialize enhanced metrics
  const enhancedRenderHistory: EnhancedRenderInfo[] = [];
  
  const layoutMetrics: LayoutMetrics = {
    layoutShifts: 0,
    cumulativeLayoutShift: 0,
    layoutDuration: 0,
    layoutShiftHistory: [],
  };
  
  const interactionMetrics: InteractionMetrics = {
    firstInputDelay: null,
    interactionToNextPaint: [],
    averageInteractionDelay: 0,
    slowInteractions: 0,
  };
  
  // Initialize with proper typing
  const dependencies: {
    contexts: string[];
    hooks: string[];
    childComponents: string[];
  } = {
    contexts: [],
    hooks: [],
    childComponents: [],
  };
  
  // Set up performance observer if enabled
  let layoutObserver: PerformanceObserver | null = null;
  let interactionObserver: PerformanceObserver | null = null;
  
  if (profilingOptions.trackLayoutMetrics && profilingOptions.reportToPerformanceObserver) {
    setupLayoutObserver();
  }
  
  if (profilingOptions.trackInteractionMetrics && profilingOptions.reportToPerformanceObserver) {
    setupInteractionObserver();
  }
  
  /**
   * Set up layout observer to monitor layout shifts
   */
  function setupLayoutObserver() {
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }
    
    try {
      layoutObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Ensure it's a layout shift entry
          if (entry.entryType === 'layout-shift') {
            // Cast entry to LayoutShiftEntry
            const layoutShift = entry as unknown as {
              value: number;
              sources?: Array<{ node?: Node }>;
            };
            
            recordLayoutShift(
              layoutShift.value,
              layoutShift.sources && layoutShift.sources[0]?.node 
                ? getElementDescription(layoutShift.sources[0].node)
                : undefined
            );
          }
        }
      });
      
      layoutObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('Failed to observe layout shifts:', error);
    }
  }
  
  /**
   * Set up interaction observer to monitor interactions
   */
  function setupInteractionObserver() {
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }
    
    try {
      interactionObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Only process entries related to this component
          if (entry.name.includes(componentName)) {
            // Process interaction metrics
            if (entry.entryType === 'first-input' && interactionMetrics.firstInputDelay === null) {
              // Use type assertion with specific interface instead of 'any'
              const typedEntry = entry as PerformanceEntryWithProcessing;
              interactionMetrics.firstInputDelay = typedEntry.processingStart - typedEntry.startTime;
            } else if (entry.entryType === 'event') {
              recordInteraction(
                entry.duration,
                entry.name.split(':')[1] || 'unknown'
              );
            }
          }
        }
      });
      
      interactionObserver.observe({ type: 'event', buffered: true });
      interactionObserver.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.warn('Failed to observe interactions:', error);
    }
  }
  
  /**
   * Reset all enhanced metrics
   */
  function resetEnhancedMetrics() {
    enhancedRenderHistory.length = 0;
    
    layoutMetrics.layoutShifts = 0;
    layoutMetrics.cumulativeLayoutShift = 0;
    layoutMetrics.layoutDuration = 0;
    layoutMetrics.layoutShiftHistory.length = 0;
    
    interactionMetrics.firstInputDelay = null;
    interactionMetrics.interactionToNextPaint.length = 0;
    interactionMetrics.averageInteractionDelay = 0;
    interactionMetrics.slowInteractions = 0;
    
    dependencies.contexts.length = 0;
    dependencies.hooks.length = 0;
    dependencies.childComponents.length = 0;
  }
  
  /**
   * Update enhanced profiling options
   */
  function updateEnhancedOptions(newOptions: Partial<EnhancedComponentProfilingOptions>) {
    Object.assign(profilingOptions, newOptions);
    
    // Update base profiler options
    baseProfiler.updateOptions(newOptions);
    
    // Setup or cleanup observers based on new options
    if (newOptions.trackLayoutMetrics !== undefined) {
      if (newOptions.trackLayoutMetrics && profilingOptions.reportToPerformanceObserver) {
        setupLayoutObserver();
      } else if (layoutObserver) {
        layoutObserver.disconnect();
        layoutObserver = null;
      }
    }
    
    if (newOptions.trackInteractionMetrics !== undefined) {
      if (newOptions.trackInteractionMetrics && profilingOptions.reportToPerformanceObserver) {
        setupInteractionObserver();
      } else if (interactionObserver) {
        interactionObserver.disconnect();
        interactionObserver = null;
      }
    }
  }
  
  /**
   * Record a layout shift
   */
  function recordLayoutShift(score: number, sourceElement?: string) {
    if (!profilingOptions.trackLayoutMetrics) {
      return;
    }
    
    layoutMetrics.layoutShifts++;
    layoutMetrics.cumulativeLayoutShift += score;
    
    // Add to history
    layoutMetrics.layoutShiftHistory.push({
      timestamp: Date.now(),
      score,
      sourceElement,
    });
    
    // Trim history if needed
    if (layoutMetrics.layoutShiftHistory.length > (profilingOptions.maxRenderHistory || 100)) {
      layoutMetrics.layoutShiftHistory.shift();
    }
    
    // Log if enabled
    if (profilingOptions.logToConsole && score > 0.1) {
      console.warn(
        `Large layout shift detected in ${componentName}: ${score.toFixed(3)}` +
          (sourceElement ? ` (source: ${sourceElement})` : '')
      );
    }
  }
  
  /**
   * Record an interaction
   */
  function recordInteraction(duration: number, eventType: string) {
    if (!profilingOptions.trackInteractionMetrics) {
      return;
    }
    
    // Add to history
    interactionMetrics.interactionToNextPaint.push({
      timestamp: Date.now(),
      duration,
      eventType,
    });
    
    // Trim history if needed
    if (interactionMetrics.interactionToNextPaint.length > (profilingOptions.maxRenderHistory || 100)) {
      interactionMetrics.interactionToNextPaint.shift();
    }
    
    // Update average
    const totalTime = interactionMetrics.interactionToNextPaint.reduce(
      (sum, item) => sum + item.duration, 
      0
    );
    
    interactionMetrics.averageInteractionDelay = 
      totalTime / interactionMetrics.interactionToNextPaint.length;
    
    // Check if slow
    if (duration > (profilingOptions.slowInteractionThreshold || 100)) {
      interactionMetrics.slowInteractions++;
      
      // Log if enabled
      if (profilingOptions.logToConsole) {
        console.warn(
          `Slow ${eventType} interaction detected in ${componentName}: ${duration.toFixed(2)}ms ` +
            `(threshold: ${profilingOptions.slowInteractionThreshold || 100}ms)`
        );
      }
    }
  }
  
  /**
   * Record render cause
   */
  function recordRenderCause(cause: {
    stateChange?: boolean;
    contextChange?: boolean;
    parentRender?: boolean;
    effect?: boolean;
  }) {
    if (!profilingOptions.trackRenderCauses) {
      return;
    }
    
    // Skip if history is empty
    if (enhancedRenderHistory.length === 0 || baseProfiler.renderHistory.length === 0) {
      return;
    }
    
    // Get the latest render info
    const latestRender = enhancedRenderHistory[enhancedRenderHistory.length - 1];
    
    // Update cause
    latestRender.causedByStateChange = cause.stateChange || latestRender.causedByStateChange;
    latestRender.causedByContextChange = cause.contextChange || latestRender.causedByContextChange;
    latestRender.causedByParentRender = cause.parentRender || latestRender.causedByParentRender;
    latestRender.causedByEffect = cause.effect || latestRender.causedByEffect;
  }
  
  /**
   * Set component dependencies
   */
  function setDependencies(deps: {
    contexts?: string[];
    hooks?: string[];
    childComponents?: string[];
  }) {
    if (!profilingOptions.analyzeDependencies) {
      return;
    }
    
    if (deps.contexts && deps.contexts.length > 0) {
      // Use a safe array spread that respects types
      dependencies.contexts = Array.from(new Set([...dependencies.contexts, ...deps.contexts]));
    }
    
    if (deps.hooks && deps.hooks.length > 0) {
      // Use a safe array spread that respects types
      dependencies.hooks = Array.from(new Set([...dependencies.hooks, ...deps.hooks]));
    }
    
    if (deps.childComponents && deps.childComponents.length > 0) {
      // Use a safe array spread that respects types
      dependencies.childComponents = Array.from(new Set([...dependencies.childComponents, ...deps.childComponents]));
    }
  }
  
  /**
   * Helper to get a description of a DOM element
   */
  function getElementDescription(node: Node): string {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return node.nodeName || 'unknown';
    }
    
    const element = node as Element;
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className && typeof element.className === 'string'
      ? `.${element.className.split(' ').join('.')}`
      : '';
    
    return `${tag}${id}${classes}`;
  }
  
  // Cleanup function
  const cleanup = () => {
    if (layoutObserver) {
      layoutObserver.disconnect();
    }
    
    if (interactionObserver) {
      interactionObserver.disconnect();
    }
  };
  
  // Override the base profiler's onRender method to add enhanced metrics
  const originalProfileRender = baseProfiler.profileRender;
  baseProfiler.profileRender = <Props, Result>(
    renderFn: (props: Props) => Result,
    prevProps: Props | null,
    nextProps: Props
  ): Result => {
    // Call original profile render first
    const result = originalProfileRender(renderFn, prevProps, nextProps);
    
    // Add enhanced render info
    if (
      profilingOptions.enabled &&
      baseProfiler.renderHistory.length > 0 &&
      enhancedRenderHistory.length < baseProfiler.renderHistory.length
    ) {
      const latestBaseRender = baseProfiler.renderHistory[baseProfiler.renderHistory.length - 1];
      
      // Create enhanced render info
      const enhancedRender: EnhancedRenderInfo = {
        timestamp: latestBaseRender.timestamp,
        renderTime: latestBaseRender.renderTime,
        wasted: latestBaseRender.wasted,
        // Use null checking before spreading array to avoid Symbol.iterator error
        changedProps: latestBaseRender.changedProps ? [...latestBaseRender.changedProps] : [],
        // Start with undefined cause - will be filled in later
        causedByStateChange: undefined,
        causedByContextChange: undefined,
        causedByParentRender: undefined,
        causedByEffect: undefined,
      };
      
      // Add to history
      enhancedRenderHistory.push(enhancedRender);
      
      // Trim history if needed
      if (enhancedRenderHistory.length > (profilingOptions.maxRenderHistory || 100)) {
        enhancedRenderHistory.shift();
      }
    }
    
    return result;
  };
  
  // Return the enhanced profiler
  return {
    ...baseProfiler,
    enhancedRenderHistory,
    layoutMetrics,
    interactionMetrics,
    dependencies,
    resetEnhancedMetrics,
    updateEnhancedOptions,
    recordLayoutShift,
    recordInteraction,
    recordRenderCause,
  };
}

/**
 * Create an enhanced profiler hook for functional components
 */
export function useEnhancedComponentProfiler(
  componentName: string,
  options: Partial<EnhancedComponentProfilingOptions> = {}
): EnhancedComponentProfilingResult {
  // Create a ref to store the profiler
  const profilerRef = React.useRef<EnhancedComponentProfilingResult | null>(null);
  
  // Create cause tracker
  const causeRef = React.useRef({
    stateChange: false,
    contextChange: false,
    parentRender: false,
    effect: false,
  });
  
  // Initialize the profiler if it doesn't exist
  if (!profilerRef.current) {
    profilerRef.current = createEnhancedComponentProfiler(componentName, options);
  }
  
  // Get the profiler
  const profiler = profilerRef.current;
  
  // Update options when they change
  React.useEffect(() => {
    profiler.updateEnhancedOptions(options);
  }, [profiler, options]);
  
  // Record render time
  const renderStartTime = React.useRef(performance.now());
  
  // Track layout effects
  React.useLayoutEffect(() => {
    const layoutTime = performance.now();
    const layoutDuration = layoutTime - renderStartTime.current;
    
    // Update layout duration
    profiler.layoutMetrics.layoutDuration += layoutDuration;
    
    // Reset cause tracker for next render
    causeRef.current = {
      stateChange: false,
      contextChange: false,
      parentRender: false,
      effect: false,
    };
    
    return () => {
      // Mark this render as caused by an effect if cleanup runs
      causeRef.current.effect = true;
    };
  });
  
  // Hook to use before setState to track state changes as a cause
  const trackStateChange = React.useCallback(() => {
    causeRef.current.stateChange = true;
  }, []);
  
  // Function to wrap a setState function to track state changes
  const wrapSetState = React.useCallback(<T>(setState: React.Dispatch<React.SetStateAction<T>>) => {
    return (value: React.SetStateAction<T>) => {
      trackStateChange();
      return setState(value);
    };
  }, [trackStateChange]);
  
  return {
    ...profiler,
    // Add a trackStateChange method for convenience
    trackStateChange,
    // Add a wrapSetState method for convenience
    wrapSetState,
  } as EnhancedComponentProfilingResult & {
    trackStateChange: () => void;
    wrapSetState: <T>(setState: React.Dispatch<React.SetStateAction<T>>) => 
      React.Dispatch<React.SetStateAction<T>>;
  };
}

/**
 * Higher-order component that adds enhanced profiling to a component
 */
export function withEnhancedProfiling<Props extends object>(
  Component: React.ComponentType<Props>,
  options: Partial<EnhancedComponentProfilingOptions> = {}
): React.FC<Props> & { profiler: EnhancedComponentProfilingResult } {
  const componentName = Component.displayName || Component.name || 'Component';
  const profiler = createEnhancedComponentProfiler(componentName, options);
  
  const WithProfiling: React.FC<Props> & { profiler: EnhancedComponentProfilingResult } = 
    React.memo(
      (props: Props) => {
        // Create a ref for previous props
        const prevPropsRef = React.useRef<Props | null>(null);

        // Profile the render with proper type assertion to avoid untyped function call error
        const renderedOutput = (profiler.profileRender as <P, R>(
          renderFn: (props: P) => R,
          prevProps: P | null,
          nextProps: P
        ) => R)<Props, React.ReactElement>(
          // Use Props type instead of any
          (renderProps: Props) => React.createElement(Component, renderProps),
          prevPropsRef.current,
          props
        );

        // Update previous props
        prevPropsRef.current = props;

        return renderedOutput;
      },
      (prevProps, nextProps) => {
        // Skip re-renders if disabled
        if (!options.enabled) {
          return true;
        }

        // Check for prop changes
        const hasChanged = !isEqual(prevProps, nextProps);

        // Record as a wasted render if props haven't changed
        if (!hasChanged && profiler.metrics.renderCount > 0) {
          profiler.metrics.wastedRenders++;
        }

        return !hasChanged;
      }
    ) as unknown as React.FC<Props> & { profiler: EnhancedComponentProfilingResult };
  
  // Add profiler to component
  WithProfiling.profiler = profiler;
  
  // Forward the display name
  WithProfiling.displayName = `WithEnhancedProfiling(${componentName})`;
  
  return WithProfiling;
} 