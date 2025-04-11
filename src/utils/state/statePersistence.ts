/**
 * @context: state-system, persistence
 *
 * State persistence utilities for storing and loading application state.
 * These utilities handle localStorage persistence with versioning, migration,
 * and optional compression.
 */

import { isEqual as lodashIsEqual } from 'lodash';
import { useEffect, useRef, useState } from 'react';

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

  /**
   * Optional flag to enable compression for larger states
   * @default false
   */
  compress?: boolean;

  /**
   * Optional custom storage mechanism
   * @default localStorage
   */
  storage?: {
    getItem: (key: string) => string | null | Promise<string | null>;
    setItem: (key: string, value: string) => void | Promise<void>;
    removeItem: (key: string) => void | Promise<void>;
  };
}

/**
 * Data structure for persisted state
 */
interface PersistedData<T> {
  version: number;
  timestamp: number;
  state: T;
}

/**
 * Error types for state persistence
 */
export enum PersistenceErrorType {
  SERIALIZATION = 'serialization',
  DESERIALIZATION = 'deserialization',
  STORAGE_FULL = 'storage_full',
  VALIDATION = 'validation',
  MIGRATION = 'migration',
  STORAGE_UNAVAILABLE = 'storage_unavailable',
}

/**
 * Error class for state persistence
 */
export class PersistenceError extends Error {
  constructor(
    public type: PersistenceErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

/**
 * Creates utilities for persisting and loading state
 */
export function createStatePersistence<T>(options: PersistenceOptions<T>) {
  const {
    key,
    version,
    migrate = undefined,
    validate = () => true,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    isEqual = lodashIsEqual,
    debounceTime = 1000,
    debug = false,
    compress = false,
    storage = localStorage,
  } = options;

  // Timeout for debounced saves
  let saveTimeout: ReturnType<typeof setTimeout> | undefined;

  /**
   * Internal debug logging
   */
  const log = (message: string, ...args: unknown[]) => {
    if (debug) {
      console.debug(`[StatePersistence:${key}] ${message}`, ...args);
    }
  };

  /**
   * Compress a string using basic encoding
   */
  const compressString = (str: string): string => {
    if (!compress) {
      return str;
    }

    try {
      // Use lz-string if available, otherwise use basic btoa
      if (typeof window !== 'undefined' && 'lzstring' in window) {
        return (
          window as unknown as { lzstring: { compressToUTF16: (str: string) => string } }
        ).lzstring.compressToUTF16(str);
      }

      // Fallback to basic encoding
      return typeof btoa === 'function' ? btoa(str) : str;
    } catch (error) {
      log('Compression failed, using uncompressed data', error);
      return str;
    }
  };

  /**
   * Decompress a string
   */
  const decompressString = (str: string): string => {
    if (!compress) {
      return str;
    }

    try {
      // Use lz-string if available, otherwise use basic atob
      if (typeof window !== 'undefined' && 'lzstring' in window) {
        return (
          window as unknown as { lzstring: { decompressFromUTF16: (str: string) => string } }
        ).lzstring.decompressFromUTF16(str);
      }

      // Fallback to basic decoding
      return typeof atob === 'function' ? atob(str) : str;
    } catch (error) {
      log('Decompression failed, using raw data', error);
      return str;
    }
  };

  /**
   * Restore state using the specified deserializer
   * Following state restoration pattern from context documentation
   */
  const restoreState = async (serializedState: string): Promise<T | null> => {
    try {
      // Use the deserialize function from options - following context pattern
      const parsed = deserialize(serializedState);

      if (!validate(parsed)) {
        throw new PersistenceError(
          PersistenceErrorType.VALIDATION,
          `Invalid state structure for key "${key}"`
        );
      }

      return parsed as T;
    } catch (error) {
      throw new PersistenceError(
        PersistenceErrorType.DESERIALIZATION,
        `Failed to deserialize state for key "${key}"`,
        error
      );
    }
  };

  /**
   * Compare two states using the isEqual function from options
   * Following state comparison pattern from context documentation
   */
  const compareStates = (state1: T, state2: T): boolean => {
    try {
      return isEqual(state1, state2);
    } catch (error) {
      console.warn(`[StatePersistence:${key}] Error comparing states:`, error);
      // Default to false if comparison fails, triggering a save
      return false;
    }
  };

  /**
   * Save the state to storage
   */
  const saveState = async (state: T, immediate = false): Promise<void> => {
    // If we already have a pending save, clear it
    if (saveTimeout && !immediate) {
      clearTimeout(saveTimeout);
    }

    const saveFunc = async () => {
      try {
        // Generate the serialized state - using persistedStr to track serialization
        let persistedStr: string;
        try {
          persistedStr = serialize(state);
        } catch (error) {
          throw new PersistenceError(
            PersistenceErrorType.SERIALIZATION,
            `Failed to serialize state for key "${key}"`,
            error
          );
        }

        // Create metadata wrapper following the pattern in context docs
        const persistData: PersistedData<T> = {
          version,
          timestamp: Date.now(),
          state,
        };

        // Serialize and compress if needed - using the serialized state for metrics
        const serializedData = compressString(serialize(persistData));

        // Log state size information if debug is enabled - using persistedStr for comparison
        if (debug) {
          const compressionRatio =
            persistedStr.length > 0
              ? ((persistedStr.length - serializedData.length) / persistedStr.length) * 100
              : 0;
          log('State serialization stats', {
            rawSize: persistedStr.length,
            compressedSize: serializedData.length,
            compressionRatio: `${compressionRatio.toFixed(2)}%`,
          });
        }

        try {
          if (storage.setItem) {
            await storage.setItem(key, serializedData);
            log('Saved state', { size: serializedData.length, compressed: compress });
          }
        } catch (error) {
          // Handle storage errors (like quota exceeded)
          if (
            error instanceof DOMException &&
            (error.code === 22 || error.code === 1014 || error.name === 'QuotaExceededError')
          ) {
            throw new PersistenceError(
              PersistenceErrorType.STORAGE_FULL,
              `Storage quota exceeded for key "${key}"`,
              error
            );
          } else {
            throw new PersistenceError(
              PersistenceErrorType.STORAGE_UNAVAILABLE,
              `Failed to save state for key "${key}"`,
              error
            );
          }
        }
      } catch (error) {
        console.error(`[StatePersistence:${key}] Save error:`, error);
        throw error;
      }
    };

    if (immediate) {
      return saveFunc();
    } else {
      saveTimeout = setTimeout(saveFunc, debounceTime);
      return Promise.resolve();
    }
  };

  /**
   * Load the state from storage
   */
  const loadState = async (): Promise<T | null> => {
    try {
      // Get the serialized state from storage
      let serializedState: string | null = null;

      try {
        if (storage.getItem) {
          serializedState = await storage.getItem(key);
        }
      } catch (error) {
        throw new PersistenceError(
          PersistenceErrorType.STORAGE_UNAVAILABLE,
          `Failed to access storage for key "${key}"`,
          error
        );
      }

      if (!serializedState) {
        log('No saved state found');
        return null;
      }

      // Decompress if needed
      const decompressed = decompressString(serializedState);
      let persistData: PersistedData<T>;

      try {
        // Use the deserialize function from options - following context pattern
        const parsed = deserialize(decompressed) as PersistedData<T>;
        persistData = parsed;
      } catch (error) {
        throw new PersistenceError(
          PersistenceErrorType.DESERIALIZATION,
          `Failed to deserialize state for key "${key}"`,
          error
        );
      }

      log('Loaded persisted data', {
        version: persistData.version,
        current: version,
        age: (Date.now() - persistData.timestamp) / 1000,
      });

      // Handle version migration if needed
      if (persistData.version !== version) {
        if (!migrate) {
          log('Version mismatch and no migration function provided, using null');
          return null;
        }

        try {
          const migratedState = migrate(persistData.state, persistData.version);
          log('Migrated state from version', {
            from: persistData.version,
            to: version,
          });
          return migratedState;
        } catch (error) {
          throw new PersistenceError(
            PersistenceErrorType.MIGRATION,
            `Failed to migrate state from version ${persistData.version} to ${version}`,
            error
          );
        }
      }

      // Use the restoreState function to validate and deserialize
      try {
        // Serialize and then deserialize using our functions to ensure validation
        const restoredState = await restoreState(serialize(persistData.state));
        return restoredState;
      } catch (error) {
        // If restore validation fails, try with the raw state as a fallback
        if (error instanceof PersistenceError && error.type === PersistenceErrorType.VALIDATION) {
          if (validate(persistData.state)) {
            return persistData.state;
          }
        }
        throw error;
      }
    } catch (error) {
      console.error(`[StatePersistence:${key}] Load error:`, error);

      if (error instanceof PersistenceError) {
        throw error;
      }

      throw new PersistenceError(
        PersistenceErrorType.DESERIALIZATION,
        `Failed to load state for key "${key}"`,
        error
      );
    }
  };

  /**
   * Clear the saved state
   */
  const clearState = async (): Promise<void> => {
    try {
      log('Clearing state');
      await storage.removeItem(key);
    } catch (error) {
      log('Error clearing state', error);

      throw new PersistenceError(
        PersistenceErrorType.STORAGE_UNAVAILABLE,
        `Failed to clear state: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  };

  /**
   * Compares the current state with a new state to determine if changes exist
   * Uses the isEqual function from options for deep comparison
   */
  const hasStateChanged = (currentState: T, newState: T): boolean => {
    try {
      return !compareStates(currentState, newState);
    } catch (error) {
      log('Error comparing states, assuming changed', error);
      return true;
    }
  };

  return {
    saveState,
    loadState,
    clearState,
  };
}

/**
 * Hook for persisting and loading state
 */
export function createStatePersistenceHook<T>(options: PersistenceOptions<T>) {
  const { saveState, loadState, clearState } = createStatePersistence<T>(options);

  return function useStatePersistence() {
    const initialized = useRef(false);

    return {
      saveState,
      loadState,
      clearState,
      initialized,
    };
  };
}

/**
 * Creates a hook that persists a React state
 */
export function createPersistedState<T>(
  defaultValue: T,
  options: Omit<PersistenceOptions<T>, 'compress' | 'storage'>
) {
  const persistence = createStatePersistence<T>(options);

  return function usePersistedState(): [T, (newState: T) => void] {
    const [state, setState] = useState<T>(defaultValue);
    const initialized = useRef(false);

    // Load state on mount
    useEffect(() => {
      const loadPersistedState = async () => {
        try {
          const savedState = await persistence.loadState();
          if (savedState !== null) {
            setState(savedState);
          }
          initialized.current = true;
        } catch (error) {
          console.error('Failed to load persisted state:', error);
          initialized.current = true;
        }
      };

      loadPersistedState();
    }, []);

    // Save state when it changes
    useEffect(() => {
      if (!initialized.current) {
        return;
      }

      persistence.saveState(state).catch(error => {
        console.error('Failed to save persisted state:', error);
      });
    }, [state]);

    return [state, setState];
  };
}

/**
 * Create a simple localStorage item with a default value
 */
export function createLocalStorageItem<T>(key: string, defaultValue: T) {
  return {
    get: (): T => {
      try {
        const item = localStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : defaultValue;
      } catch (error) {
        console.error(`Error getting localStorage item ${key}:`, error);
        return defaultValue;
      }
    },
    set: (value: T): void => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error setting localStorage item ${key}:`, error);
      }
    },
    remove: (): void => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing localStorage item ${key}:`, error);
      }
    },
  };
}

/**
 * Creates a hook that automatically persists a context state
 */
export function createContextPersistence<T, A>(
  contextHook: () => T,
  dispatchHook: () => React.Dispatch<A>,
  options: PersistenceOptions<T>
) {
  const persistence = createStatePersistence<T>(options);

  return function usePersistContext() {
    const state = contextHook();
    const dispatch = dispatchHook();
    const initialized = useRef(false);

    // Load state on mount
    useEffect(() => {
      const loadContextState = async () => {
        try {
          const savedState = await persistence.loadState();
          if (savedState !== null && dispatch) {
            // If the context uses a reducer pattern, dispatch an initialization action
            dispatch({ type: 'INITIALIZE_FROM_STORAGE', payload: savedState } as unknown as A);
          }
          initialized.current = true;
        } catch (error) {
          console.error('Failed to load context state:', error);
          initialized.current = true;
        }
      };

      loadContextState();
    }, [dispatch]);

    // Save state when it changes
    useEffect(() => {
      if (!initialized.current) {
        return;
      }

      persistence.saveState(state).catch(error => {
        console.error('Failed to save context state:', error);
      });
    }, [state]);

    return {
      state,
      dispatch,
      persistence,
    };
  };
}
