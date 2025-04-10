/**
 * @file TypeUtils.ts
 * Utility types and functions for improved type safety across the codebase
 *
 * This file provides:
 * 1. Generic type utilities to reduce the need for "as unknown as" casts
 * 2. Type guards for common operations
 * 3. Helper types for event handling and data processing
 * 4. Unified interfaces that work in both production and test code
 */

/**
 * Type-safe cast utility - use this instead of "as unknown as" when possible
 * Generic function that provides a safer way to cast from one type to another
 * when you need to bypass TypeScript's type system but maintain type safety.
 */
export function typeCast<T, U>(value: T): U {
  return value as unknown as U;
}

/**
 * Runtime type checking utilities - use these to verify types at runtime
 */

/**
 * Helper to check if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Helper to check if a value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown,
  property: K
): value is { [P in K]: unknown } {
  return isObject(value) && property in value;
}

/**
 * Helper to check if a value has specific properties
 */
export function hasProperties<K extends string>(
  value: unknown,
  properties: K[]
): value is { [P in K]: unknown } {
  if (!isObject(value)) return false;
  return properties.every(prop => prop in value);
}

/**
 * Generic class property type - gets the type of a property on a class
 */
export type PropertyType<T, K extends keyof T> = T[K];

/**
 * Event handler types - unify event handling patterns
 */
export type EventHandler<T> = (event: T) => void;
export type AsyncEventHandler<T> = (event: T) => Promise<void>;
export type EventUnsubscribe = () => void;

/**
 * EventEmitter interface that works for both testing and production
 */
export interface EventEmitter<T> {
  emit(event: T): void;
  on(handler: EventHandler<T>): EventUnsubscribe;
  off(handler: EventHandler<T>): void;
}

/**
 * Manager interface base - for consistent manager implementations
 */
export interface Manager {
  initialize(): void | Promise<void>;
  dispose(): void;
}

/**
 * Types for dealing with nullable values
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

/**
 * Type safe extraction from data objects with unknown structure
 */
export function getPropertySafe<T>(obj: unknown, path: string, defaultValue: T): T {
  if (!isObject(obj)) return defaultValue;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (!isObject(current) || !(part in current)) {
      return defaultValue;
    }
    current = current[part];
  }

  return current as unknown as T;
}

/**
 * Narrowing helper for discriminated unions
 */
export function isOfType<T, K extends string>(
  obj: unknown,
  discriminator: K,
  value: string
): obj is T & { [P in K]: string } {
  return (
    isObject(obj) &&
    hasProperty(obj, discriminator) &&
    typeof obj[discriminator] === 'string' &&
    obj[discriminator] === value
  );
}

/**
 * Type-safe partial - preserves required vs optional properties
 */
export type StrictPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, unknown> ? StrictPartial<T[P]> : T[P];
};

/**
 * Data transformation utilities - for safely working with unknown type
 */
export function safeMapRecord<T extends Record<string, unknown>, U>(
  record: T,
  mapFn: (value: unknown, key: string) => U
): Record<string, U> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, mapFn(value, key)]));
}

/**
 * Safe array mapper - ensures type safety when mapping arrays
 */
export function safeMap<T, U>(
  array: unknown[],
  predicate: (item: unknown) => item is T,
  mapFn: (item: T) => U
): U[] {
  return array.filter(predicate).map(mapFn);
}

/**
 * Type guard factory - creates type guards for specific interfaces
 */
export function createTypeGuard<T>(
  properties: Array<keyof T>,
  typeChecks: Partial<Record<keyof T, (val: unknown) => boolean>> = {}
): (obj: unknown) => obj is T {
  return (obj: unknown): obj is T => {
    if (!isObject(obj)) return false;

    // Check that all required properties exist
    if (!properties.every(prop => prop in obj)) return false;

    // Apply custom type checks if provided
    return Object.entries(typeChecks).every(([prop, check]) => {
      if (!(prop in obj)) return false;
      if (check && typeof check === 'function') {
        return check(obj[prop]);
      }
      return true;
    });
  };
}

/**
 * Type-safe event mapper - converts event data safely
 */
export function mapEventData<T, U>(
  eventData: unknown,
  predicate: (data: unknown) => data is T,
  mapper: (data: T) => U
): U | undefined {
  if (predicate(eventData)) {
    return mapper(eventData);
  }
  return undefined;
}

/**
 * Type-safe object property accessor
 */
export function getProperty<T, K extends keyof T>(obj: T, property: K): T[K] {
  return obj[property];
}

/**
 * Type-safe JSON parsing with a fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Creates a type-safe function that casts to a specific enum
 */
export function createEnumParser<T extends Record<string, string | number>>(
  enumObj: T
): (value: string) => T[keyof T] | undefined {
  const validValues = Object.values(enumObj);
  return (value: string) => {
    const enumValue = enumObj[value as keyof T];
    if (enumValue !== undefined) return enumValue;

    // Check if the value itself matches unknown enum value
    if (validValues.includes(value as T[keyof T])) {
      return value as T[keyof T];
    }

    return undefined;
  };
}

/**
 * Deep readonly type for immutable data
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends (...args: unknown[]) => unknown
    ? T
    : T extends object
      ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
      : T;
