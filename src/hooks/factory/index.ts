export * from './createDataFetchHook';
export * from './createLifecycleHook';
export * from './createStateHook';

/**
 * Hook Factory Pattern
 *
 * This module provides factory functions for creating reusable React hooks
 * with standardized patterns, reducing duplication and ensuring consistent
 * behavior across the application.
 *
 * Available factories:
 *
 * - createDataFetchHook: Creates hooks for data fetching with loading/error states
 * - createStateHook: Creates hooks for state management with action creators
 * - createLifecycleHook: Creates hooks for component lifecycle management
 *
 * @example
 * Basic data fetch hook:
 * ```
 * const useUserData = createDataFetchHook(
 *   (userId: string) => fetchUser(userId),
 *   { fetchOnMount: true }
 * );
 * ```
 *
 * @example
 * Basic state hook:
 * ```
 * const useCounter = createStateHook(
 *   { count: 0 },
 *   {
 *     increment: (state) => ({ count: state.count + 1 }),
 *     decrement: (state) => ({ count: state.count - 1 })
 *   }
 * );
 * ```
 */
