/**
 * @context: ui-system, performance-optimization, component-library
 * 
 * VirtualizedList component for optimizing long lists by rendering only what's visible in the viewport
 */

import * as React from 'react';
import { useState, useEffect, useRef, useCallback, ReactNode, CSSProperties, memo } from 'react';
import { useVirtualization } from '../../../utils/performance/ComponentOptimizer';

export interface VirtualizedListProps<T> {
  /**
   * Items to render in the list
   */
  items: T[];
  
  /**
   * Height of each item in pixels
   */
  itemHeight: number;
  
  /**
   * Height of the list container in pixels
   */
  height: number;
  
  /**
   * Width of the list container in pixels
   * @default '100%'
   */
  width?: number | string;
  
  /**
   * Additional items to render above and below the visible area to prevent flickering during scroll
   * @default 5
   */
  overscan?: number;
  
  /**
   * Function to render an individual list item
   */
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  
  /**
   * Optional loading state indicator for items not yet loaded
   */
  isLoading?: boolean;
  
  /**
   * Optional element to display when items array is empty
   */
  emptyPlaceholder?: ReactNode;
  
  /**
   * Optional element to display when items are loading
   */
  loadingPlaceholder?: ReactNode;
  
  /**
   * Optional CSS class name to apply to the list container
   */
  className?: string;
  
  /**
   * Optional ID for the list container
   */
  id?: string;
  
  /**
   * Optional callback when list is scrolled
   */
  onScroll?: (scrollTop: number) => void;
}

/**
 * Virtualized list component that only renders items visible in the viewport
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  width = '100%',
  overscan = 5,
  renderItem,
  isLoading = false,
  emptyPlaceholder = <div className="virtualized-list-empty">No items to display</div>,
  loadingPlaceholder = <div className="virtualized-list-loading">Loading...</div>,
  className = '',
  id,
  onScroll
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Use virtualization hook to calculate visible items
  const { 
    startIndex, 
    endIndex, 
    totalHeight 
  } = useVirtualization({ 
    itemCount: items.length, 
    itemHeight, 
    containerHeight: height, 
    overscan 
  });
  
  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const newScrollTop = containerRef.current.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    }
  }, [onScroll]);
  
  // Set up scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  // If no items and not loading, show empty placeholder
  if (items.length === 0 && !isLoading) {
    return <div style={{ width, height }}>{emptyPlaceholder}</div>;
  }
  
  // If loading, show loading placeholder
  if (isLoading) {
    return <div style={{ width, height }}>{loadingPlaceholder}</div>;
  }
  
  // Calculate visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  return (
    <div
      ref={containerRef}
      className={`virtualized-list ${className}`}
      id={id}
      style={{
        height,
        width,
        overflow: 'auto',
        position: 'relative',
        willChange: 'transform',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, i) => {
          const index = startIndex + i;
          const top = index * itemHeight;
          
          return renderItem(item, index, {
            position: 'absolute',
            top,
            left: 0,
            width: '100%',
            height: itemHeight,
          });
        })}
      </div>
    </div>
  );
}

// Export a memoized version of the component for better performance
export default memo(VirtualizedList) as typeof VirtualizedList; 