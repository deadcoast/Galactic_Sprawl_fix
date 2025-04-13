/**
 * @context: state-system, migration
 *
 * State migration utilities for handling schema changes between application versions.
 * These utilities allow for seamless migration of stored state when the schema changes,
 * with support for validation, type checking, and complex transformations.
 */

import { logger } from '../../services/logging/loggerService';

/**
 * Represents a migration function that transforms state from one version to another
 */
export type MigrationFn<T = unknown> = (state: unknown) => T;

/**
 * Represents a migration step with a target version and migration function
 */
interface MigrationStep<T = unknown> {
  /**
   * The version this migration transforms the state to
   */
  toVersion: number;

  /**
   * The migration function
   */
  migrate: MigrationFn<T>;

  /**
   * Optional description of what this migration does
   */
  description?: string;
}

/**
 * Options for creating a migration manager
 */
interface MigrationManagerOptions<T> {
  /**
   * The current version of the state schema
   */
  currentVersion: number;

  /**
   * Initial migrations to register
   */
  migrations?: MigrationStep<T>[];

  /**
   * Optional function to validate the final migrated state
   */
  validate?: (state: T) => boolean;

  /**
   * Optional flag to enable debug logging
   */
  debug?: boolean;

  /**
   * Optional schema validation function for the state
   */
  schemaValidator?: (state: unknown) => boolean;

  /**
   * Optional flag to enable performance monitoring
   */
  performanceMonitoring?: boolean;

  /**
   * Optional function to handle migration errors
   */
  onError?: (error: Error, state: unknown, fromVersion: number) => void;
}

/**
 * Error class for migration failures
 */
export class MigrationError extends Error {
  constructor(
    public readonly fromVersion: number,
    public readonly toVersion: number,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}

/**
 * Create a migration manager for handling state schema migrations
 */
export function createMigrationManager<T>(options: MigrationManagerOptions<T>) {
  const {
    currentVersion,
    migrations: initialMigrations = [],
    validate = () => true,
    debug = false,
    schemaValidator,
    performanceMonitoring = false,
    onError,
  } = options;

  // Store migrations by target version
  const migrationsByVersion = new Map<number, MigrationStep<T>>();

  // Initialize with provided migrations
  initialMigrations.forEach(migration => {
    migrationsByVersion.set(migration.toVersion, migration);
  });

  /**
   * Internal debug logging
   */
  const log = (message: string, ...args: unknown[]) => {
    logger.debug(message, { module: 'MigrationManager' }, ...args);
  };

  /**
   * Chain another migration step
   */
  const createStepChainer = (currentVersion: number) => {
    const addStep = (
      nextVersion: number,
      nextMigrateFn: MigrationFn<T>,
      nextDescription?: string
    ) => {
      if (nextVersion <= currentVersion) {
        throw new Error(
          `Invalid migration chain: version ${nextVersion} is not greater than ${currentVersion}`
        );
      }
      registerMigration(nextVersion, nextMigrateFn, nextDescription);
      return { addStep };
    };

    return { addStep };
  };

  /**
   * Register a migration for a specific version
   */
  const registerMigration = (
    toVersion: number,
    migrateFn: MigrationFn<T>,
    description?: string
  ) => {
    // Validate version
    if (typeof toVersion !== 'number' || toVersion <= 0) {
      throw new Error(
        `Invalid migration version: ${toVersion}. Version must be a positive number.`
      );
    }

    // Check if a migration already exists for this version
    if (migrationsByVersion.has(toVersion)) {
      log(`Overwriting existing migration for version ${toVersion}`);
    }

    // Register the migration
    migrationsByVersion.set(toVersion, {
      toVersion,
      migrate: migrateFn,
      description,
    });

    log(`Registered migration to version ${toVersion}${description ? `: ${description}` : ''}`);

    return createStepChainer(toVersion);
  };

  /**
   * Migrate state from one version to another
   */
  const migrateState = (state: unknown, fromVersion: number): T => {
    // If already at current version, return as is
    if (fromVersion === currentVersion) {
      return state as T;
    }

    // Validate fromVersion
    if (typeof fromVersion !== 'number' || fromVersion < 0) {
      throw new Error(`Invalid fromVersion: ${fromVersion}`);
    }

    log(`Migrating state from version ${fromVersion} to ${currentVersion}`);

    // Performance monitoring
    const startTime = performanceMonitoring ? performance.now() : 0;

    try {
      // Find all applicable migrations
      const applicableMigrations: MigrationStep<T>[] = [];
      let targetVersion = fromVersion;

      // Create a sorted array of migration versions
      const versions = Array.from(migrationsByVersion.keys()).sort((a, b) => a - b);

      // Find all migrations that apply to this state
      for (const version of versions) {
        if (version > fromVersion && version <= currentVersion) {
          const migration = migrationsByVersion.get(version);
          if (migration) {
            applicableMigrations.push(migration);
            targetVersion = version;
          }
        }
      }

      // Check if we have migrations to apply
      if (applicableMigrations.length === 0) {
        log(`No migrations available from version ${fromVersion} to ${currentVersion}`);

        // Just validate and return if there are no migrations
        if (schemaValidator && !schemaValidator(state)) {
          throw new MigrationError(
            fromVersion,
            currentVersion,
            'Schema validation failed for current version'
          );
        }

        if (!validate(state as T)) {
          throw new MigrationError(fromVersion, currentVersion, 'State validation failed');
        }

        return state as T;
      }

      // Apply migrations in sequence
      let migratedState = state;
      for (const migration of applicableMigrations) {
        log(
          `Applying migration to version ${migration.toVersion}${migration.description ? `: ${migration.description}` : ''}`
        );

        try {
          migratedState = migration.migrate(migratedState);

          // Validate the intermediate state if requested
          if (
            migration.toVersion === currentVersion &&
            schemaValidator &&
            !schemaValidator(migratedState)
          ) {
            throw new MigrationError(
              fromVersion,
              migration.toVersion,
              'Schema validation failed after migration'
            );
          }
        } catch (error) {
          if (error instanceof MigrationError) {
            throw error;
          }

          throw new MigrationError(
            fromVersion,
            migration.toVersion,
            `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
            error
          );
        }
      }

      // Validate the final state
      if (!validate(migratedState as T)) {
        throw new MigrationError(fromVersion, targetVersion, 'Final state validation failed');
      }

      // Log performance information
      if (performanceMonitoring) {
        const endTime = performance.now();
        log(`Migration completed in ${(endTime - startTime).toFixed(2)}ms`);
      }

      return migratedState as T;
    } catch (error) {
      log('Migration failed', error);

      // Call onError handler if provided
      if (onError && error instanceof Error) {
        onError(error, state, fromVersion);
      }

      // Re-throw the error
      throw error;
    }
  };

  /**
   * Get all registered migrations
   */
  const getMigrations = () => {
    return Array.from(migrationsByVersion.values()).sort((a, b) => a.toVersion - b.toVersion);
  };

  /**
   * Get the current schema version
   */
  const getCurrentVersion = () => currentVersion;

  /**
   * Check if direct migration from a specific version is supported
   */
  const canMigrateFrom = (version: number) => {
    if (version === currentVersion) {
      return true;
    }

    // Check if we have all required migrations to get from version to current
    const versions = Array.from(migrationsByVersion.keys()).sort((a, b) => a - b);
    let lastVersion = version;

    for (const migrationVersion of versions) {
      if (migrationVersion > lastVersion && migrationVersion <= currentVersion) {
        lastVersion = migrationVersion;
      }
    }

    return lastVersion === currentVersion;
  };

  return {
    registerMigration,
    migrateState,
    getMigrations,
    getCurrentVersion,
    canMigrateFrom,
  };
}

/**
 * Create a migration builder for a fluent API to define migrations
 */
export function createMigrationBuilder<T>(currentVersion: number) {
  const migrations: MigrationStep<T>[] = [];

  /**
   * Add a migration step
   */
  const addMigration = (toVersion: number, migrateFn: MigrationFn<T>, description?: string) => {
    migrations.push({
      toVersion,
      migrate: migrateFn,
      description,
    });

    return { addMigration, build };
  };

  /**
   * Build the migration manager
   */
  const build = (
    options: Omit<MigrationManagerOptions<T>, 'currentVersion' | 'migrations'> = {}
  ) => {
    return createMigrationManager<T>({
      currentVersion,
      migrations,
      ...options,
    });
  };

  return {
    addMigration,
    build,
  };
}

// Utility functions for common migration operations

/**
 * Add a property to an object with a default value
 */
export function addProperty<T extends Record<string, unknown>, K extends string, V>(
  state: T,
  key: K,
  defaultValue: V
): T & Record<K, V> {
  return {
    ...state,
    [key]: defaultValue,
  };
}

/**
 * Rename a property in an object
 */
export function renameProperty<T extends Record<string, unknown>, K extends string>(
  state: T,
  oldKey: keyof T,
  newKey: K
): Omit<T, typeof oldKey> & Record<K, unknown> {
  const { [oldKey]: value, ...rest } = state;

  // Create the new object with properly typed properties
  const result = rest as Omit<T, typeof oldKey>;
  (result as Record<string, unknown>)[newKey] = value;

  return result as Omit<T, typeof oldKey> & Record<K, unknown>;
}

/**
 * Remove a property from an object
 */
export function removeProperty<T extends Record<string, unknown>, K extends keyof T>(
  state: T,
  key: K
): Omit<T, K> {
  const { [key]: _, ...rest } = state;
  return rest;
}

/**
 * Transform a property using a function
 */
export function transformProperty<T extends Record<string, unknown>, K extends keyof T, V>(
  state: T,
  key: K,
  transformFn: (value: T[K]) => V
): Omit<T, K> & Record<K, V> {
  return {
    ...state,
    [key]: transformFn(state[key]),
  };
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const output = { ...target };

  Object.keys(source).forEach(key => {
    const sourceKey = key as keyof typeof source;
    const targetKey = key as keyof typeof target;

    if (
      source[sourceKey] !== null &&
      typeof source[sourceKey] === 'object' &&
      !Array.isArray(source[sourceKey]) &&
      target[targetKey] !== null &&
      typeof target[targetKey] === 'object' &&
      !Array.isArray(target[targetKey])
    ) {
      // Recursively merge objects
      output[targetKey] = deepMerge(
        target[targetKey] as Record<string, unknown>,
        source[sourceKey] as Record<string, unknown>
      ) as T[keyof T];
    } else {
      // Direct assignment for non-objects or arrays
      output[targetKey] = source[sourceKey] as T[keyof T];
    }
  });

  return output;
}

/**
 * Add an item to an array property
 */
export function addToArray<T extends Record<string, unknown>, K extends keyof T, V>(
  state: T,
  key: K,
  item: V
): T {
  if (!Array.isArray(state[key])) {
    throw new Error(`Property ${String(key)} is not an array`);
  }

  return {
    ...state,
    [key]: [...(state[key] as unknown[]), item],
  };
}

/**
 * Filter items in an array property
 */
export function filterArray<T extends Record<string, unknown>, K extends keyof T>(
  state: T,
  key: K,
  predicate: (item: unknown, index: number, array: unknown[]) => boolean
): T {
  if (!Array.isArray(state[key])) {
    throw new Error(`Property ${String(key)} is not an array`);
  }

  return {
    ...state,
    [key]: (state[key] as unknown[]).filter(predicate),
  };
}

/**
 * Map items in an array property
 */
export function mapArray<T extends Record<string, unknown>, K extends keyof T, V>(
  state: T,
  key: K,
  mapper: (item: unknown, index: number, array: unknown[]) => V
): T {
  if (!Array.isArray(state[key])) {
    throw new Error(`Property ${String(key)} is not an array`);
  }

  return {
    ...state,
    [key]: (state[key] as unknown[]).map(mapper),
  };
}

/**
 * Create a migration chain from a series of migration functions
 */
export function createMigrationChain<T>(
  fromVersion: number,
  migrations: Array<{ toVersion: number; transform: MigrationFn<T>; description?: string }>
): (state: unknown) => T {
  return (state: unknown) => {
    // Sort migrations by version
    const sortedMigrations = [...migrations].sort((a, b) => a.toVersion - b.toVersion);

    // Validate migration chain
    let lastVersion = fromVersion;
    for (const migration of sortedMigrations) {
      if (migration.toVersion <= lastVersion) {
        throw new Error(
          `Invalid migration chain: version ${migration.toVersion} must be greater than ${lastVersion}`
        );
      }
      lastVersion = migration.toVersion;
    }

    // Apply migrations in sequence
    let result = state;
    for (const migration of sortedMigrations) {
      result = migration.transform(result);
    }

    return result as T;
  };
}
