/**
 * @context: ui-system, performance-optimization, component-library
 * 
 * Index file for optimized component exports
 */

// Re-export memoization utilities
export type { VirtualizedListProps } from '../virtualized/VirtualizedList';
export {
  createMemoizedComponent, withMemoization,
  withMemoizationForwardRef, type MemoizationOptions
} from './MemoizedComponent';
export { VirtualizedList };

// Import and re-export virtualized components
  import VirtualizedList from '../virtualized/VirtualizedList';

// Import and re-export lazy loaded components
import LazyMiniMap from '../game/LazyMiniMap';
import LazyNetworkGraph from '../visualization/LazyNetworkGraph';
import LazyResourceFlowDiagram from '../visualization/LazyResourceFlowDiagram';

export {
  LazyMiniMap, LazyNetworkGraph,
  LazyResourceFlowDiagram
};
