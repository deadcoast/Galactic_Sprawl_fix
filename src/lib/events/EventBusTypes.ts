/**
 * Type definitions to fix EventBus issues
 */

// Extend the global Map interface to support iteration in older JavaScript environments
declare global {
  interface Map<K, V> {
    entries(): IterableIterator<[K, V]>;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
  }

  interface Set<T> {
    values(): IterableIterator<T>;
  }
}

// Export a dummy type to make TypeScript treat this as a module
export type EventBusTypesModule = true;
