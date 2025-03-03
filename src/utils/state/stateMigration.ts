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
}

/**
 * Creates a migration manager that handles state schema migrations
 *
 * @param options Configuration options for the migration manager
 * @returns An object with methods to register migrations and migrate state
 */
export function createMigrationManager<T>(options: MigrationManagerOptions<T>) {
  const { currentVersion, migrations: initialMigrations = [], validate, debug = false } = options;

  // Store migrations in a map for quick lookup by version
  const migrations = new Map<number, MigrationStep<T>>();

  // Register initial migrations
  initialMigrations.forEach(migration => {
    migrations.set(migration.toVersion, migration);
  });

  const log = (message: string, ...args: unknown[]) => {
    if (debug) {
      console.log(`[MigrationManager] ${message}`, ...args);
    }
  };

  /**
   * Registers a new migration step
   *
   * @param toVersion The version this migration transforms the state to
   * @param migrateFn The migration function
   * @returns The migration manager for chaining
   */
  const registerMigration = (toVersion: number, migrateFn: MigrationFn<T>) => {
    if (toVersion > currentVersion) {
      throw new Error(
        `Cannot register migration to version ${toVersion} because it is greater than the current version ${currentVersion}`
      );
    }

    if (migrations.has(toVersion)) {
      log(`Overriding existing migration for version ${toVersion}`);
    }

    migrations.set(toVersion, { toVersion, migrate: migrateFn });
    log(`Registered migration to version ${toVersion}`);

    return { registerMigration, migrateState };
  };

  /**
   * Migrates state from a previous version to the current version
   *
   * @param state The state to migrate
   * @param fromVersion The version of the state
   * @returns The migrated state
   * @throws Error if migration fails
   */
  const migrateState = (state: unknown, fromVersion: number): T => {
    if (fromVersion === currentVersion) {
      log('State is already at current version, no migration needed');
      return state as T;
    }

    if (fromVersion > currentVersion) {
      throw new Error(
        `Cannot migrate from version ${fromVersion} because it is greater than the current version ${currentVersion}`
      );
    }

    log(`Starting migration from version ${fromVersion} to ${currentVersion}`);

    // Get all migrations that need to be applied in order
    const migrationsToApply = Array.from(migrations.values())
      .filter(
        migration => migration.toVersion > fromVersion && migration.toVersion <= currentVersion
      )
      .sort((a, b) => a.toVersion - b.toVersion);

    if (migrationsToApply.length === 0) {
      log('No migrations found, returning state as-is');
      return state as T;
    }

    log(`Found ${migrationsToApply.length} migrations to apply`);

    // Apply migrations in sequence
    let migratedState = state;
    for (const migration of migrationsToApply) {
      try {
        log(`Applying migration to version ${migration.toVersion}`);
        migratedState = migration.migrate(migratedState);
      } catch (error) {
        const errorMessage = `Failed to migrate to version ${migration.toVersion}: ${error instanceof Error ? error.message : String(error)}`;
        log(errorMessage);
        throw new Error(errorMessage);
      }
    }

    // Validate the final state if a validator is provided
    if (validate && !validate(migratedState as T)) {
      const errorMessage = 'Validation failed after migration';
      log(errorMessage);
      throw new Error(errorMessage);
    }

    log('Migration completed successfully');
    return migratedState as T;
  };

  return {
    registerMigration,
    migrateState,
  };
}

/**
 * Creates a migration builder to help define migrations in a fluent API
 *
 * @param currentVersion The current version of the state schema
 * @returns A builder object to define migrations
 */
export function createMigrationBuilder<T>(currentVersion: number) {
  const migrations: MigrationStep<T>[] = [];

  /**
   * Adds a migration step
   *
   * @param toVersion The version this migration transforms the state to
   * @param migrateFn The migration function
   * @returns The builder for chaining
   */
  const addMigration = (toVersion: number, migrateFn: MigrationFn<T>) => {
    migrations.push({ toVersion, migrate: migrateFn });
    return { addMigration, build };
  };

  /**
   * Builds the migration manager
   *
   * @param options Additional options for the migration manager
   * @returns The migration manager
   */
  const build = (
    options: Omit<MigrationManagerOptions<T>, 'currentVersion' | 'migrations'> = {}
  ) => {
    return createMigrationManager({
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

/**
 * Helper function to add a property to a state object with a default value
 *
 * @param state The state object
 * @param key The property key
 * @param defaultValue The default value
 * @returns A new state object with the property added
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
 * Helper function to rename a property in a state object
 *
 * @param state The state object
 * @param oldKey The old property key
 * @param newKey The new property key
 * @returns A new state object with the property renamed
 */
export function renameProperty<T extends Record<string, unknown>, K extends string>(
  state: T,
  oldKey: keyof T,
  newKey: K
): Omit<T, typeof oldKey> & Record<K, unknown> {
  const { [oldKey]: value, ...rest } = state;
  return {
    ...rest,
    [newKey]: value,
  } as Omit<T, typeof oldKey> & Record<K, unknown>;
}

/**
 * Helper function to remove a property from a state object
 *
 * @param state The state object
 * @param key The property key to remove
 * @returns A new state object with the property removed
 */
export function removeProperty<T extends Record<string, unknown>, K extends keyof T>(
  state: T,
  key: K
): Omit<T, K> {
  const { [key]: _, ...rest } = state;
  return rest;
}

/**
 * Helper function to transform a property in a state object
 *
 * @param state The state object
 * @param key The property key
 * @param transformFn The transformation function
 * @returns A new state object with the property transformed
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
