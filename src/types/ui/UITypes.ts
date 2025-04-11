/**
 * Types for UI component profiling
 */

/**
 * Component render metrics
 */
export interface ComponentRenderMetrics {
  /**
   * Component name
   */
  componentName: string;

  /**
   * Render count
   */
  renderCount: number;

  /**
   * Last render time in milliseconds
   */
  lastRenderTime: number;

  /**
   * Average render time in milliseconds
   */
  averageRenderTime: number;

  /**
   * Maximum render time in milliseconds
   */
  maxRenderTime: number;

  /**
   * Total render time in milliseconds
   */
  totalRenderTime: number;

  /**
   * Timestamp of the last render
   */
  lastRenderTimestamp: number;

  /**
   * Wasted renders (renders that didn't change the output)
   */
  wastedRenders: number;

  /**
   * Props that changed in the last render
   */
  lastChangedProps?: string[];

  /**
   * Component render path (parent components)
   */
  renderPath?: string[];
}

/**
 * Component profiling options
 */
export interface ComponentProfilingOptions {
  /**
   * Whether to enable profiling
   * @default true
   */
  enabled?: boolean;

  /**
   * Whether to log render metrics to the console
   * @default false
   */
  logToConsole?: boolean;

  /**
   * Threshold in milliseconds for slow render warnings
   * @default 16 (1 frame at 60fps)
   */
  slowRenderThreshold?: number;

  /**
   * Maximum number of renders to track in history
   * @default 100
   */
  maxRenderHistory?: number;

  /**
   * Whether to track prop changes
   * @default true
   */
  trackPropChanges?: boolean;

  /**
   * Whether to track render path
   * @default false
   */
  trackRenderPath?: boolean;
}

/**
 * Component profiling result
 */
export interface ComponentProfilingResult {
  profileRender: unknown;
  /**
   * Component metrics
   */
  metrics: ComponentRenderMetrics;

  /**
   * Render history
   */
  renderHistory: Array<{
    /**
     * Render timestamp
     */
    timestamp: number;

    /**
     * Render time in milliseconds
     */
    renderTime: number;

    /**
     * Whether this was a wasted render
     */
    wasted: boolean;

    /**
     * Props that changed in this render
     */
    changedProps?: string[];
  }>;

  /**
   * Reset metrics
   */
  reset: () => void;

  /**
   * Update profiling options
   */
  updateOptions: (options: Partial<ComponentProfilingOptions>) => void;
}

/**
 * Application profiling metrics
 */
export interface ApplicationProfilingMetrics {
  /**
   * Total number of renders across all components
   */
  totalRenders: number;

  /**
   * Total number of wasted renders across all components
   */
  totalWastedRenders: number;

  /**
   * Average render time across all components in milliseconds
   */
  averageRenderTime: number;

  /**
   * Components sorted by render count (descending)
   */
  componentsByRenderCount: ComponentRenderMetrics[];

  /**
   * Components sorted by average render time (descending)
   */
  componentsByRenderTime: ComponentRenderMetrics[];

  /**
   * Components sorted by wasted renders (descending)
   */
  componentsByWastedRenders: ComponentRenderMetrics[];

  /**
   * Timestamp when profiling started
   */
  profilingStartTime: number;

  /**
   * Duration of profiling in milliseconds
   */
  profilingDuration: number;
}

/**
 * Application profiling options
 */
export interface ApplicationProfilingOptions extends ComponentProfilingOptions {
  /**
   * Whether to automatically profile all components
   * @default false
   */
  autoProfileAll?: boolean;

  /**
   * Component name patterns to include in auto-profiling
   * @default []
   */
  includePatterns?: string[];

  /**
   * Component name patterns to exclude from auto-profiling
   * @default []
   */
  excludePatterns?: string[];
}

/**
 * Application profiling result
 */
export interface ApplicationProfilingResult {
  /**
   * Get application metrics
   */
  getMetrics: () => ApplicationProfilingMetrics;

  /**
   * Get metrics for a specific component
   */
  getComponentMetrics: (componentName: string) => ComponentRenderMetrics | null;

  /**
   * Reset all metrics
   */
  resetAll: () => void;

  /**
   * Reset metrics for a specific component
   */
  resetComponent: (componentName: string) => void;

  /**
   * Update profiling options
   */
  updateOptions: (options: Partial<ApplicationProfilingOptions>) => void;

  /**
   * Start profiling
   */
  start: () => void;

  /**
   * Stop profiling
   */
  stop: () => void;

  /**
   * Whether profiling is active
   */
  isActive: () => boolean;

  /**
   * Get or create a component profiler
   */
  getOrCreateProfiler: (componentName: string) => ComponentProfilingResult;

  /**
   * Check if a component should be profiled
   */
  shouldProfileComponent: (componentName: string) => boolean;
}

/**
 * Base props interface shared by all UI components
 */
export interface BaseProps {
  /**
   * Unique identifier for the component
   */
  id?: string;

  /**
   * Component classname for styling
   */
  className?: string;

  /**
   * Whether component is visible
   */
  visible?: boolean;

  /**
   * Whether component is disabled
   */
  disabled?: boolean;
}

/**
 * Theme override properties for component-specific theming
 */
export interface ThemeOverride {
  /**
   * Color palette overrides
   */
  colors?: Record<string, string>;

  /**
   * Spacing overrides
   */
  spacing?: Record<string, string | number>;

  /**
   * Typography overrides
   */
  typography?: Record<string, unknown>;
}

/**
 * Custom style properties for component styling
 */
export interface CustomStyleProps {
  /**
   * Container styles
   */
  container?: Record<string, string | number>;

  /**
   * Header styles
   */
  header?: Record<string, string | number>;

  /**
   * Content styles
   */
  content?: Record<string, string | number>;

  /**
   * Footer styles
   */
  footer?: Record<string, string | number>;
}

/**
 * Accessibility properties for components
 */
export interface AccessibilityProps {
  /**
   * ARIA label
   */
  ariaLabel?: string;

  /**
   * ARIA described by
   */
  ariaDescribedBy?: string;

  /**
   * ARIA role
   */
  role?: string;

  /**
   * Tab index
   */
  tabIndex?: number;
}

/**
 * Extended props with additional UI component properties
 */
export interface ExtendedProps extends BaseProps {
  /**
   * Custom theme override for this component
   */
  theme?: ThemeOverride;

  /**
   * Custom styles to apply to the component
   */
  customStyles?: CustomStyleProps;

  /**
   * Accessibility properties for the component
   */
  a11y?: AccessibilityProps;

  /**
   * Component-specific configuration options
   */
  componentConfig?: Record<string, unknown>;
}
