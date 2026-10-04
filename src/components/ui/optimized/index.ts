/**
 * @context: ui-system, performance-optimization, component-library
 *
 * Index file for optimized component exports
 */

import { FixedSizeList, FixedSizeListProps } from 'react-window'; // Import from react-window

// Re-export memoization utilities
// Assuming VirtualizedListProps was similar to FixedSizeListProps
export {
  createMemoizedComponent,
  withMemoization,
  withMemoizationForcombatdRef,
  type MemoizationOptions,
} from './MemoizedComponent';
export type { FixedSizeListProps as VirtualizedListProps };

// Export FixedSizeList as VirtualizedList
export { FixedSizeList as VirtualizedList };

// Import and re-export lazy loaded components
import LazyMiniMap from '../game/LazyMiniMap';
import LazyNetworkGraph from '../visualization/LazyNetworkGraph';
import LazyResourceFlowDiagram from '../visualization/LazyResourceFlowDiagram';

export { LazyMiniMap, LazyNetworkGraph, LazyResourceFlowDiagram };
