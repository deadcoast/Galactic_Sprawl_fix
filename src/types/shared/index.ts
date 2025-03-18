import { ResourceType } from './resources/ResourceTypes';
/**
 * Shared type definitions for common patterns across the codebase.
 * These types are designed to be reusable and type-safe alternatives to 'any'.
 */

/**
 * Event System Types
 */

export type EventCallback<T = unknown> = (event: T) => void;

export type EventHandler<T = unknown> = {
  type: string;
  callback: EventCallback<T>;
  once?: boolean;
};

export type EventUnsubscribe = () => void;

export interface EventEmitter<T = unknown> {
  emit(type: string, event: T): void;
  on(type: string, callback: EventCallback<T>): EventUnsubscribe;
  once(type: string, callback: EventCallback<T>): EventUnsubscribe;
  off(type: string, callback: EventCallback<T>): void;
}

/**
 * Resource Types
 */

export type ResourceOperation<T> = {
  type: ResourceType;
  data: T;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

export type ResourceMetrics = {
  count: number;
  rate: number;
  efficiency: number;
  utilization: number;
};

/**
 * Utility Types
 */

export type AsyncOperation<T = unknown> = Promise<T>;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: T[P] extends object ? ReadonlyDeep<T[P]> : T[P];
};

/**
 * Function Types
 */

export type AsyncCallback<T = void> = () => Promise<T>;

export type ErrorCallback = (error: Error) => void;

export type Disposable = {
  dispose(): void;
};

/**
 * Configuration Types
 */

export type ConfigValue = string | number | boolean | null | ConfigObject;

export interface ConfigObject {
  [key: string]: ConfigValue | ConfigValue[];
}

/**
 * Validation Types
 */

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export type Validator<T> = (value: T) => ValidationResult;

/**
 * Data Structure Types
 */

export type Tree<T> = {
  value: T;
  children?: Tree<T>[];
};

export type Graph<T> = {
  nodes: T[];
  edges: [number, number][];
};

export type Matrix<T> = T[][];

/**
 * Performance Types
 */

export type PerformanceMetrics = {
  duration: number;
  memory: number;
  cpu: number;
  fps: number;
};

export type PerformanceCallback = (metrics: PerformanceMetrics) => void;
