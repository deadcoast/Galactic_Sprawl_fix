/**
 * Represents a unique identifier, typically a string or number.
 */
export type ID = string | number;

/**
 * Represents a timestamp, typically a number (milliseconds since epoch).
 */
export type Timestamp = number;

/**
 * Generic status enum, potentially used in various contexts.
 */
export enum Status {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ERROR = 'error',
}

/**
 * Generic type for key-value pairs, useful for configurations or metadata.
 */
export type KeyValuePair<T = unknown> = {
  [key: string]: T;
};
