import { isEqual } from 'lodash';

interface PersistenceOptions<T> {
  /**
   * The key to use for localStorage
   */
  key: string;

  /**
   * The current version of the state schema
   */
  version: number;

  /**
   * Optional function to migrate state from a previous version
   */
  migrate?: (state: unknown, fromVersion: number) => T;

  /**
   * Optional function to validate the state before loading
   */
  validate?: (state: unknown) => boolean;

  /**
   * Optional function to serialize the state
   * @default JSON.stringify
   */
  serialize?: (state: T) => string;

  /**
   * Optional function to deserialize the state
   * @default JSON.parse
   */
  deserialize?: (serialized: string) => unknown;

  /**
   * Optional function to determine if the state has changed
   * @default lodash.isEqual
   */
  isEqual?: (a: T, b: T) => boolean;

  /**
   * Optional debounce time in milliseconds for saving state
   * @default 1000
   */
  debounceTime?: number;

  /**
   * Optional flag to enable debug logging
   * @default false
   */
  debug?: boolean;
}

interface PersistedData<T> {
  version: number;
  timestamp: number;
  state: T;
}

/**
 * Creates a state persistence manager that handles saving and loading state
 * from localStorage with versioning support.
 *
 * @param options Configuration options for persistence
 * @returns An object with methods to save, load, and clear state
 */
export function createStatePersistence<T>(options: PersistenceOptions<T>) {
  const {
    key,
    version,
    migrate,
    validate,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    isEqual: equalityFn = isEqual,
    debounceTime = 1000,
    debug = false,
  } = options;

  // Keep a reference to the last saved state to avoid unnecessary saves
  let lastSavedState: T | null = null;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  const log = (message: string, ...args: unknown[]) => {
    if (debug) {
      console.warn(`[StatePersistence:${key}] ${message}`, ...args);
    }
  };

  /**
   * Saves the state to localStorage
   *
   * @param state The state to save
   * @param immediate Whether to save immediately or debounce
   * @returns A promise that resolves when the state is saved
   */
  const saveState = (state: T, immediate = false): Promise<void> => {
    return new Promise(resolve => {
      // If the state hasn't changed, don't save it
      if (lastSavedState && equalityFn(state, lastSavedState)) {
        log('State unchanged, skipping save');
        resolve();
        return;
      }

      // Clear any existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }

      const performSave = () => {
        try {
          const data: PersistedData<T> = {
            version,
            timestamp: Date.now(),
            state,
          };

          const serialized = serialize(data as unknown as T);
          localStorage.setItem(key, serialized);
          lastSavedState = state;

          log('State saved', { version, timestamp: data?.timestamp });
          resolve();
        } catch (error) {
          console.error(`[StatePersistence:${key}] Error saving state:`, error);
          resolve();
        }
      };

      if (immediate) {
        performSave();
      } else {
        saveTimeout = setTimeout(performSave, debounceTime);
      }
    });
  };

  /**
   * Loads the state from localStorage
   *
   * @returns The loaded state, or null if no state was found or it was invalid
   */
  const loadState = (): T | null => {
    try {
      const serialized = localStorage.getItem(key);

      if (!serialized) {
        log('No saved state found');
        return null;
      }

      const data = deserialize(serialized) as PersistedData<T>;

      // Validate the data structure
      if (!data || typeof data !== 'object' || !('version' in data) || !('state' in data)) {
        log('Invalid state format', data);
        return null;
      }

      // Check if we need to migrate
      if (data?.version !== version) {
        log(`Version mismatch: saved=${data?.version}, current=${version}`);

        if (!migrate) {
          log('No migration function provided, clearing saved state');
          clearState();
          return null;
        }

        try {
          const migratedState = migrate(data?.state, data?.version);
          log('State migrated successfully', { fromVersion: data?.version, toVersion: version });

          // Save the migrated state
          saveState(migratedState, true);
          return migratedState;
        } catch (error) {
          console.error(`[StatePersistence:${key}] Migration error:`, error);
          clearState();
          return null;
        }
      }

      // Validate the state if a validator is provided
      if (validate && !validate(data?.state)) {
        log('State validation failed');
        return null;
      }

      log('State loaded successfully', {
        version: data?.version,
        age: Date.now() - (data?.timestamp ?? 0),
      });
      lastSavedState = data?.state;
      return data?.state;
    } catch (error) {
      console.error(`[StatePersistence:${key}] Error loading state:`, error);
      return null;
    }
  };

  /**
   * Clears the saved state from localStorage
   */
  const clearState = (): void => {
    try {
      localStorage.removeItem(key);
      lastSavedState = null;
      log('State cleared');
    } catch (error) {
      console.error(`[StatePersistence:${key}] Error clearing state:`, error);
    }
  };

  return {
    saveState,
    loadState,
    clearState,
  };
}

/**
 * Creates a hook-friendly state persistence manager
 *
 * @param options Configuration options for persistence
 * @returns An object with methods to use in React components
 */
export function createStatePersistenceHook<T>(options: PersistenceOptions<T>) {
  const persistence = createStatePersistence(options);

  return {
    /**
     * Loads the persisted state
     *
     * @returns The loaded state or null
     */
    loadPersistedState: persistence.loadState,

    /**
     * Saves the current state
     *
     * @param state The state to save
     * @param immediate Whether to save immediately
     */
    persistState: persistence.saveState,

    /**
     * Clears the persisted state
     */
    clearPersistedState: persistence.clearState,
  };
}

/**
 * Creates a simple localStorage getter/setter for a specific key
 *
 * @param key The localStorage key
 * @param defaultValue The default value to return if the key doesn't exist
 * @returns An object with get and set methods
 */
export function createLocalStorageItem<T>(key: string, defaultValue: T) {
  return {
    /**
     * Gets the value from localStorage
     *
     * @returns The parsed value or the default value
     */
    get: (): T => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error(`[LocalStorage:${key}] Error getting item:`, error);
        return defaultValue;
      }
    },

    /**
     * Sets the value in localStorage
     *
     * @param value The value to set
     */
    set: (value: T): void => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`[LocalStorage:${key}] Error setting item:`, error);
      }
    },

    /**
     * Removes the item from localStorage
     */
    remove: (): void => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`[LocalStorage:${key}] Error removing item:`, error);
      }
    },
  };
}
