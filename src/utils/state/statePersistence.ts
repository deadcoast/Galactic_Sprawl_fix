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
  constructor(public type: PersistenceErrorType, message: string, public originalError?: unknown) {
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
        return ((window as unknown) as { lzstring: { compressToUTF16: (str: string) => string } }).lzstring.compressToUTF16(str);
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
        return ((window as unknown) as { lzstring: { decompressFromUTF16: (str: string) => string } }).lzstring.decompressFromUTF16(str);
      }
      
      // Fallback to basic decoding
      return typeof atob === 'function' ? atob(str) : str;
    } catch (error) {
      log('Decompression failed, using raw data', error);
      return str;
    }
  };

  /**
   * Save the state to storage
   */
  const saveState = async (state: T, immediate = false): Promise<void> => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = undefined;
    }

    const saveFunc = async () => {
      try {
        const persistedData: PersistedData<T> = {
          version,
          timestamp: Date.now(),
          state,
        };

        log('Saving state', persistedData);

        // Try to serialize the state
        let serialized: string;
        try {
          serialized = serialize(state);
        } catch (error) {
          throw new PersistenceError(
            PersistenceErrorType.SERIALIZATION,
            `Failed to serialize state: ${error instanceof Error ? error.message : String(error)}`,
            error
          );
        }

        // Compress if enabled
        const compressed = compressString(serialized);
        
        // Try to save to storage
        try {
          const persistedStr = JSON.stringify(persistedData);
          await storage.setItem(key, compressed);
        } catch (error) {
          // Check if it's a quota exceeded error
          if (
            error instanceof Error &&
            (error.name === 'QuotaExceededError' || error.message.includes('quota'))
          ) {
            throw new PersistenceError(
              PersistenceErrorType.STORAGE_FULL,
              'Storage quota exceeded, cannot save state',
              error
            );
          }
          
          throw new PersistenceError(
            PersistenceErrorType.STORAGE_UNAVAILABLE,
            `Failed to save state: ${error instanceof Error ? error.message : String(error)}`,
            error
          );
        }
      } catch (error) {
        log('Error saving state', error);
        
        if (error instanceof PersistenceError) {
          throw error;
        }
        
        throw new PersistenceError(
          PersistenceErrorType.SERIALIZATION,
          `Unexpected error saving state: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      }
    };

    if (immediate) {
      await saveFunc();
    } else {
      saveTimeout = setTimeout(saveFunc, debounceTime);
    }
  };

  /**
   * Load the state from storage
   */
  const loadState = async (): Promise<T | null> => {
    try {
      log('Loading state');

      // Try to get from storage
      let serialized: string | null;
      try {
        serialized = await storage.getItem(key);
      } catch (error) {
        throw new PersistenceError(
          PersistenceErrorType.STORAGE_UNAVAILABLE,
          `Failed to access storage: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      }

      if (!serialized) {
        log('No saved state found');
        return null;
      }

      // Decompress if needed
      const decompressed = decompressString(serialized);

      // Try to parse the persisted data
      let persistedData: PersistedData<unknown>;
      try {
        persistedData = JSON.parse(decompressed);
      } catch (error) {
        throw new PersistenceError(
          PersistenceErrorType.DESERIALIZATION,
          `Failed to parse persisted data: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      }

      // Check version and migrate if needed
      let migratedState: unknown;
      try {
        if (persistedData.version !== version && migrate) {
          log(
            `Version mismatch (saved: ${persistedData.version}, current: ${version}), migrating state`
          );
          migratedState = migrate(persistedData.state, persistedData.version);
        } else {
          migratedState = persistedData.state;
        }
      } catch (error) {
        throw new PersistenceError(
          PersistenceErrorType.MIGRATION,
          `Failed to migrate state: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      }

      // Validate the state
      try {
        if (!validate(migratedState)) {
          throw new PersistenceError(
            PersistenceErrorType.VALIDATION,
            'State validation failed'
          );
        }
      } catch (error) {
        if (error instanceof PersistenceError) {
          throw error;
        }
        
        throw new PersistenceError(
          PersistenceErrorType.VALIDATION,
          `State validation error: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      }

      // Try to deserialize the state
      try {
        const deserialized = migratedState as T;
        log('State loaded successfully', deserialized);
        return deserialized;
      } catch (error) {
        throw new PersistenceError(
          PersistenceErrorType.DESERIALIZATION,
          `Failed to deserialize state: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      }
    } catch (error) {
      log('Error loading state', error);
      
      if (error instanceof PersistenceError) {
        throw error;
      }
      
      throw new PersistenceError(
        PersistenceErrorType.DESERIALIZATION,
        `Unexpected error loading state: ${error instanceof Error ? error.message : String(error)}`,
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
