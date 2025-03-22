/**
 * @context: ui-system, performance-optimization, component-library
 * 
 * Index file for optimized component exports
 */

// Re-export memoization utilities
export { 
  withMemoization,
  withMemoizationForwardRef,
  createMemoizedComponent,
  type MemoizationOptions
} from './MemoizedComponent';

// Import and re-export virtualized components
import VirtualizedList from '../virtualized/VirtualizedList';
export { VirtualizedList };
export type { VirtualizedListProps } from '../virtualized/VirtualizedList';

// Import and re-export lazy loaded components
import LazyNetworkGraph from '../visualizations/LazyNetworkGraph';
import LazyResourceFlowDiagram from '../visualizations/LazyResourceFlowDiagram';
import LazyMiniMap from '../game/LazyMiniMap';

export {
  LazyNetworkGraph,
  LazyResourceFlowDiagram,
  LazyMiniMap
}; 