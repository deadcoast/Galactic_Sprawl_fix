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
  customRules?: Record<string, unknown>;
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
  value?: unknown;
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
  onConfigChange?: (key: string, newValue: unknown, oldValue: unknown) => void;
}

/**
 * Type-safe configuration manager class
 */
export class TypeSafeConfigManager {
  private configItems: Map<string, ConfigItem> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private configValues: Map<string, unknown> = new Map();
  private categories: Map<string, ConfigCategory> = new Map();
  private options: ConfigManagerOptions;
  private userContext: Record<string, unknown> = {};

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
  registerConfigs(configs: ConfigItem[]): void {
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
  setUserContext(context: Record<string, unknown>): void {
    this.userContext = context;
  }

  /**
   * Get the value of a configuration item with type safety
   */
  get<T extends z.ZodType>(key: string): z.infer<T> | undefined {
    const config = this.configItems.get(key) as ConfigItem<T> | undefined;
    if (!config) {
      if (this.options?.strictMode) {
        throw new Error(`Config with key "${key}" is not registered`);
      }
      return undefined;
    }

    const value = this.configValues.get(key);

    // Validate if required
    if (this.options?.validateOnAccess) {
      try {
        return config.schema.parse(value) as z.infer<T>;
      } catch (error) {
        const zodError = error as z.ZodError;
        const validationErrors = this.formatZodErrors(key, zodError);

        if (this.options?.logErrors) {
          console.error(`Validation failed for config "${key}":`, validationErrors);
        }

        if (this.options?.onValidationError) {
          this.options.onValidationError(validationErrors);
        }

        if (this.options?.strictMode) {
          throw new Error(`Validation failed for config "${key}": ${validationErrors[0]?.message}`);
        }

        return config.defaultValue as z.infer<T>;
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
      if (this.options?.strictMode) {
        throw new Error(`Config with key "${key}" is not registered`);
      }
      return {
        valid: false,
        errors: [{ key, message: `Config with key "${key}" is not registered` }],
      };
    }

    // Validate the value
    try {
      const validValue = config.schema.parse(value);
      const oldValue = this.configValues.get(key);
      this.configValues.set(key, validValue);

      // Trigger onChange callback
      if (this.options?.onConfigChange && oldValue !== validValue) {
        this.options.onConfigChange(key, validValue, oldValue);
      }

      return { valid: true, errors: [] };
    } catch (error) {
      const zodError = error as z.ZodError;
      const validationErrors = this.formatZodErrors(key, zodError);

      if (this.options?.logErrors) {
        console.error(`Validation failed for config "${key}":`, validationErrors);
      }

      if (this.options?.onValidationError) {
        this.options.onValidationError(validationErrors);
      }

      if (this.options?.strictMode) {
        throw new Error(`Validation failed for config "${key}": ${validationErrors[0]?.message}`);
      }

      return { valid: false, errors: validationErrors };
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  isFeatureEnabled(key: string): boolean {
    const feature = this.featureFlags.get(key);
    if (!feature) {
      if (this.options?.strictMode) {
        throw new Error(`Feature flag with key "${key}" is not registered`);
      }
      return false;
    }

    // Check if feature is globally disabled
    if (feature.status === FeatureStatus.DISABLED) {
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
        if (!feature.targeting.userRoles.includes(this.userContext.role as string)) {
          return false;
        }
      }

      // Check environments
      if (
        feature.targeting.environments &&
        feature.targeting.environments.length > 0 &&
        this.userContext.environment
      ) {
        if (!feature.targeting.environments.includes(this.userContext.environment as string)) {
          return false;
        }
      }

      // Check percentage rollout
      if (feature.targeting.percentageRollout !== undefined) {
        const userId = this.userContext.id ?? '';
        // Simple deterministic percentage rollout based on user ID
        const hash = this.simpleHash(key + (userId as string));
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
    const result: ConfigValidationResult = { valid: true, errors: [] };

    for (const [key, config] of this.configItems.entries()) {
      const value = this.configValues.get(key);
      try {
        config.schema.parse(value);
      } catch (error) {
        const zodError = error as z.ZodError;
        const validationErrors = this.formatZodErrors(key, zodError);
        result.valid = false;
        result.errors.push(...validationErrors);
      }
    }

    if (!result.valid && this.options?.onValidationError) {
      this.options.onValidationError(result.errors);
    }

    return result;
  }

  /**
   * Export the current configuration values
   */
  exportConfig(): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    for (const [key, value] of this.configValues.entries()) {
      config[key] = value;
    }
    return config;
  }

  /**
   * Export the current feature flag values
   */
  exportFeatures(): Record<string, boolean> {
    const features: Record<string, boolean> = {};
    for (const [key] of this.featureFlags.entries()) {
      features[key] = this.isFeatureEnabled(key);
    }
    return features;
  }

  /**
   * Import configuration values from an object
   */
  importConfig(config: Record<string, unknown>): ConfigValidationResult {
    const result: ConfigValidationResult = { valid: true, errors: [] };

    for (const [key, value] of Object.entries(config)) {
      const configItem = this.configItems.get(key);
      if (!configItem) {
        if (this.options?.strictMode) {
          result.valid = false;
          result.errors.push({ key, message: `Config with key "${key}" is not registered` });
        }
        continue;
      }

      try {
        const validatedValue = configItem.schema.parse(value);
        this.configValues.set(key, validatedValue);
      } catch (error) {
        const zodError = error as z.ZodError;
        const validationErrors = this.formatZodErrors(key, zodError);
        result.valid = false;
        result.errors.push(...validationErrors);
      }
    }

    if (!result.valid && this.options?.onValidationError) {
      this.options.onValidationError(result.errors);
    }

    return result;
  }

  /**
   * Get all registered config items
   */
  getConfigItems(): ConfigItem[] {
    return Array.from(this.configItems.values());
  }

  /**
   * Get all registered categories
   */
  getCategories(): ConfigCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get all registered feature flags
   */
  getFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  /**
   * Format zod errors into a more usable format
   */
  private formatZodErrors(key: string, error: z.ZodError): ConfigValidationError[] {
    return error.errors.map(err => ({
      key,
      message: err.message,
      path: err.path.map(p => p.toString()),
      value: undefined,
    }));
  }

  /**
   * Simple hash function for deterministic feature flag targeting
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
 * Create a new config manager instance
 */
export function createConfigManager(options?: ConfigManagerOptions): TypeSafeConfigManager {
  return new TypeSafeConfigManager(options);
}

/**
 * Helper to create a config item with type safety
 */
export function createConfigItem<T extends z.ZodType>(
  key: string,
  schema: T,
  defaultValue: z.infer<T>,
  options: Omit<ConfigItem<T>, 'key' | 'schema' | 'defaultValue'> = { name: '', description: '' }
): ConfigItem<T> {
  return {
    key,
    schema,
    defaultValue,
    name: options?.name || key,
    description: options?.description || '',
    category: options?.category,
    tags: options?.tags || [],
    metadata: options?.metadata,
    isSecret: options?.isSecret,
    isRequired: options?.isRequired,
    source: options?.source,
  };
}

/**
 * Helper to create a feature flag
 */
export function createFeatureFlag(
  key: string,
  defaultValue: boolean,
  options: Partial<Omit<FeatureFlag, 'key' | 'defaultValue'>> = {}
): FeatureFlag {
  return {
    key,
    defaultValue,
    name: options?.name || key,
    description: options?.description || '',
    status: options?.status || FeatureStatus.DISABLED,
    targeting: options?.targeting,
    metadata: options?.metadata,
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
  const isEnabled = configManager.isFeatureEnabled(key);
  return isEnabled !== undefined ? isEnabled : defaultValue;
}
