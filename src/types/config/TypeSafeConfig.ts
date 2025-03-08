import { z } from 'zod';

/**
 * Base configuration value types that can be represented in JSON
 */
export type ConfigValuePrimitive = string | number | boolean | null;
export type ConfigValue =
  | ConfigValuePrimitive
  | ConfigValuePrimitive[]
  | Record<string, ConfigValuePrimitive>
  | Record<string, ConfigValuePrimitive>[];

/**
 * Feature flag status enum
 */
export enum FeatureStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  PREVIEW = 'preview',
  EXPERIMENTAL = 'experimental',
  BETA = 'beta',
  DEPRECATED = 'deprecated',
}

/**
 * Feature flag targeting conditions
 */
export interface FeatureTargeting {
  userRoles?: string[];
  environments?: string[];
  percentageRollout?: number;
  dateRange?: {
    start?: string;
    end?: string;
  };
  customRules?: Record<string, any>;
}

/**
 * Runtime feature flag definition
 */
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  status: FeatureStatus;
  defaultValue: boolean;
  targeting?: FeatureTargeting;
  metadata?: Record<string, ConfigValue>;
}

/**
 * Configuration category for organizing config values
 */
export interface ConfigCategory {
  id: string;
  name: string;
  description: string;
  items: ConfigItem[];
}

/**
 * Configuration item with schema validation
 */
export interface ConfigItem<T extends z.ZodType = z.ZodType> {
  key: string;
  name: string;
  description: string;
  schema: T;
  defaultValue: z.infer<T>;
  category?: string;
  tags?: string[];
  metadata?: Record<string, ConfigValue>;
  isSecret?: boolean;
  isRequired?: boolean;
  source?: string;
}

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  key: string;
  message: string;
  path?: string[];
  value?: any;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

/**
 * Configuration manager options
 */
export interface ConfigManagerOptions {
  validateOnAccess?: boolean;
  strictMode?: boolean;
  logErrors?: boolean;
  onValidationError?: (errors: ConfigValidationError[]) => void;
  onConfigChange?: (key: string, newValue: any, oldValue: any) => void;
}

/**
 * Type-safe configuration manager class
 */
export class TypeSafeConfigManager {
  private configItems: Map<string, ConfigItem> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private configValues: Map<string, any> = new Map();
  private categories: Map<string, ConfigCategory> = new Map();
  private options: ConfigManagerOptions;
  private userContext: Record<string, any> = {};

  constructor(options: ConfigManagerOptions = {}) {
    this.options = {
      validateOnAccess: true,
      strictMode: false,
      logErrors: true,
      ...options,
    };
  }

  /**
   * Register a configuration item with type-safe schema
   */
  registerConfig<T extends z.ZodType>(config: ConfigItem<T>): void {
    if (this.configItems.has(config.key)) {
      throw new Error(`Config with key "${config.key}" is already registered`);
    }

    this.configItems.set(config.key, config);
    this.configValues.set(config.key, config.defaultValue);

    // Add to category if specified
    if (config.category && this.categories.has(config.category)) {
      const category = this.categories.get(config.category);
      if (category) {
        category.items.push(config);
      }
    }
  }

  /**
   * Register multiple configuration items
   */
  registerConfigs<T extends z.ZodType>(configs: ConfigItem<T>[]): void {
    configs.forEach(config => this.registerConfig(config));
  }

  /**
   * Register a category for organizing config items
   */
  registerCategory(category: ConfigCategory): void {
    if (this.categories.has(category.id)) {
      throw new Error(`Category with id "${category.id}" is already registered`);
    }
    this.categories.set(category.id, { ...category, items: [] });
  }

  /**
   * Register a feature flag
   */
  registerFeature(feature: FeatureFlag): void {
    if (this.featureFlags.has(feature.key)) {
      throw new Error(`Feature flag with key "${feature.key}" is already registered`);
    }
    this.featureFlags.set(feature.key, feature);
  }

  /**
   * Register multiple feature flags
   */
  registerFeatures(features: FeatureFlag[]): void {
    features.forEach(feature => this.registerFeature(feature));
  }

  /**
   * Set user context for feature flag targeting
   */
  setUserContext(context: Record<string, any>): void {
    this.userContext = context;
  }

  /**
   * Get the value of a configuration item with type safety
   */
  get<T extends z.ZodType>(key: string): z.infer<T> | undefined {
    const config = this.configItems.get(key) as ConfigItem<T> | undefined;
    if (!config) {
      if (this.options.strictMode) {
        throw new Error(`Config with key "${key}" is not registered`);
      }
      return undefined;
    }

    const value = this.configValues.get(key);

    // Validate on access if enabled
    if (this.options.validateOnAccess) {
      const validation = config.schema.safeParse(value);
      if (!validation.success) {
        const errors = this.formatZodErrors(key, validation.error);

        if (this.options.logErrors) {
          console.error(`Config validation error for "${key}":`, errors);
        }

        if (this.options.onValidationError) {
          this.options.onValidationError(errors);
        }

        if (this.options.strictMode) {
          throw new Error(`Config validation failed for "${key}": ${errors[0]?.message}`);
        }

        return config.defaultValue;
      }
    }

    return value as z.infer<T>;
  }

  /**
   * Set a configuration value with validation
   */
  set<T extends z.ZodType>(key: string, value: z.infer<T>): ConfigValidationResult {
    const config = this.configItems.get(key) as ConfigItem<T> | undefined;
    if (!config) {
      if (this.options.strictMode) {
        throw new Error(`Config with key "${key}" is not registered`);
      }
      return { valid: false, errors: [{ key, message: `Config not registered` }] };
    }

    const oldValue = this.configValues.get(key);
    const validation = config.schema.safeParse(value);

    if (!validation.success) {
      const errors = this.formatZodErrors(key, validation.error);
      if (this.options.logErrors) {
        console.error(`Config validation error for "${key}":`, errors);
      }
      if (this.options.onValidationError) {
        this.options.onValidationError(errors);
      }
      return { valid: false, errors };
    }

    // Update the value
    this.configValues.set(key, validation.data);

    // Call change handler if provided
    if (this.options.onConfigChange) {
      this.options.onConfigChange(key, validation.data, oldValue);
    }

    return { valid: true, errors: [] };
  }

  /**
   * Check if a feature flag is enabled
   */
  isFeatureEnabled(key: string): boolean {
    const feature = this.featureFlags.get(key);
    if (!feature) {
      if (this.options.strictMode) {
        throw new Error(`Feature flag "${key}" is not registered`);
      }
      return false;
    }

    // If feature is disabled or deprecated, it's always disabled
    if (feature.status === FeatureStatus.DISABLED || feature.status === FeatureStatus.DEPRECATED) {
      return false;
    }

    // Check targeting rules if present
    if (feature.targeting) {
      // Check user roles
      if (
        feature.targeting.userRoles &&
        feature.targeting.userRoles.length > 0 &&
        this.userContext.role
      ) {
        if (!feature.targeting.userRoles.includes(this.userContext.role)) {
          return false;
        }
      }

      // Check environments
      if (
        feature.targeting.environments &&
        feature.targeting.environments.length > 0 &&
        this.userContext.environment
      ) {
        if (!feature.targeting.environments.includes(this.userContext.environment)) {
          return false;
        }
      }

      // Check percentage rollout
      if (feature.targeting.percentageRollout !== undefined) {
        const userId = this.userContext.id || '';
        // Simple deterministic percentage rollout based on user ID
        const hash = this.simpleHash(key + userId);
        const percentage = hash % 100;
        if (percentage >= feature.targeting.percentageRollout) {
          return false;
        }
      }

      // Check date range
      if (feature.targeting.dateRange) {
        const now = new Date();
        if (feature.targeting.dateRange.start) {
          const startDate = new Date(feature.targeting.dateRange.start);
          if (now < startDate) {
            return false;
          }
        }
        if (feature.targeting.dateRange.end) {
          const endDate = new Date(feature.targeting.dateRange.end);
          if (now > endDate) {
            return false;
          }
        }
      }
    }

    return feature.defaultValue;
  }

  /**
   * Validate all configuration values
   */
  validateAllConfigs(): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];

    this.configItems.forEach((config, key) => {
      const value = this.configValues.get(key);
      const validation = config.schema.safeParse(value);

      if (!validation.success) {
        errors.push(...this.formatZodErrors(key, validation.error));
      }
    });

    const valid = errors.length === 0;
    if (!valid && this.options.logErrors) {
      console.error('Configuration validation errors:', errors);
    }

    if (!valid && this.options.onValidationError) {
      this.options.onValidationError(errors);
    }

    return { valid, errors };
  }

  /**
   * Export all configuration values
   */
  exportConfig(): Record<string, any> {
    const result: Record<string, any> = {};
    this.configValues.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Export all feature flags with their status
   */
  exportFeatures(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    this.featureFlags.forEach((feature, key) => {
      result[key] = this.isFeatureEnabled(key);
    });
    return result;
  }

  /**
   * Import configuration from an object
   */
  importConfig(config: Record<string, any>): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];

    Object.entries(config).forEach(([key, value]) => {
      const configItem = this.configItems.get(key);
      if (!configItem) {
        if (this.options.strictMode) {
          errors.push({ key, message: `Config not registered` });
        }
        return;
      }

      const validation = configItem.schema.safeParse(value);
      if (!validation.success) {
        errors.push(...this.formatZodErrors(key, validation.error));
      } else {
        this.configValues.set(key, validation.data);
      }
    });

    const valid = errors.length === 0;
    if (!valid && this.options.logErrors) {
      console.error('Configuration import errors:', errors);
    }

    if (!valid && this.options.onValidationError) {
      this.options.onValidationError(errors);
    }

    return { valid, errors };
  }

  /**
   * Get a list of all config items
   */
  getConfigItems(): ConfigItem[] {
    return Array.from(this.configItems.values());
  }

  /**
   * Get a list of all categories
   */
  getCategories(): ConfigCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get a list of all feature flags
   */
  getFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  /**
   * Helper to format Zod errors into ConfigValidationErrors
   */
  private formatZodErrors(key: string, error: z.ZodError): ConfigValidationError[] {
    return error.errors.map(err => ({
      key,
      message: err.message,
      path: err.path.map(p => p.toString()),
      value: err.input,
    }));
  }

  /**
   * Simple hash function for percentage rollout
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Create a type-safe config manager instance with default options
 */
export function createConfigManager(options?: ConfigManagerOptions): TypeSafeConfigManager {
  return new TypeSafeConfigManager(options);
}

/**
 * Helper to create a typed config item
 */
export function createConfigItem<T extends z.ZodType>(
  key: string,
  schema: T,
  defaultValue: z.infer<T>,
  options: Omit<ConfigItem<T>, 'key' | 'schema' | 'defaultValue'> = {}
): ConfigItem<T> {
  return {
    key,
    schema,
    defaultValue,
    name: options.name || key,
    description: options.description || '',
    category: options.category,
    tags: options.tags || [],
    metadata: options.metadata || {},
    isSecret: options.isSecret || false,
    isRequired: options.isRequired || false,
    source: options.source,
  };
}

/**
 * Helper to create a feature flag
 */
export function createFeatureFlag(
  key: string,
  defaultValue: boolean,
  options: Omit<FeatureFlag, 'key' | 'defaultValue'> = {} as any
): FeatureFlag {
  return {
    key,
    defaultValue,
    name: options.name || key,
    description: options.description || '',
    status: options.status || FeatureStatus.DISABLED,
    targeting: options.targeting,
    metadata: options.metadata,
  };
}

/**
 * React hook for type-safe configuration
 */
export function useTypedConfig<T extends z.ZodType>(
  configManager: TypeSafeConfigManager,
  key: string,
  defaultValue?: z.infer<T>
): z.infer<T> {
  const value = configManager.get<T>(key);
  return value !== undefined ? value : (defaultValue as z.infer<T>);
}

/**
 * React hook for feature flags
 */
export function useFeatureFlag(
  configManager: TypeSafeConfigManager,
  key: string,
  defaultValue = false
): boolean {
  return configManager.isFeatureEnabled(key) || defaultValue;
}
