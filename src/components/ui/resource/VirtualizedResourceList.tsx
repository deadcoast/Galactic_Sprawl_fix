import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List, ListChildComponentProps, VariableSizeList } from 'react-window';
import { ResourceType } from "./../../../types/resources/ResourceTypes";

export interface ResourceItem {
  id: string;
  type: ResourceType;
  name: string;
  amount: number;
  rate?: number;
  capacity?: number;
  efficiency?: number;
  status?: 'normal' | 'warning' | 'critical' | 'inactive';
  metadata?: Record<string, unknown>;
}

export interface ResourceColumn<T> {
  key: keyof T | string;
  header: string;
  width: number;
  minWidth?: number;
  flex?: number;
  render?: (item: T) => React.ReactNode;
}

export interface VirtualizedResourceListProps<T> {
  /**
   * Array of resources to display
   */
  items: T[];

  /**
   * Columns configuration
   */
  columns: ResourceColumn<T>[];

  /**
   * Height of the list container
   */
  height?: number;

  /**
   * Width of the list container (defaults to 100%)
   */
  width?: number | string;

  /**
   * Height of each row
   */
  rowHeight?: number;

  /**
   * Function to determine variable row heights (overrides rowHeight)
   */
  getRowHeight?: (index: number) => number;

  /**
   * Function called when a row is clicked
   */
  onRowClick?: (item: T, index: number) => void;

  /**
   * CSS class name for the list container
   */
  className?: string;

  /**
   * CSS class for list rows
   */
  rowClassName?: string;

  /**
   * CSS class for header row
   */
  headerClassName?: string;

  /**
   * Render a custom header component
   */
  headerRenderer?: () => React.ReactNode;

  /**
   * Render a custom row component
   */
  rowRenderer?: (props: ListChildComponentProps) => React.ReactNode;

  /**
   * Render empty state
   */
  emptyRenderer?: () => React.ReactNode;

  /**
   * Whether to include footer with stats
   */
  showFooter?: boolean;

  /**
   * Render custom footer component
   */
  footerRenderer?: () => React.ReactNode;
}

/**
 * A virtualized list component optimized for resource data
 * Uses react-window for efficient rendering of large datasets
 */
export function VirtualizedResourceList<T extends { id: string }>({
  items,
  columns,
  height = 400,
  width = '100%',
  rowHeight = 40,
  getRowHeight,
  onRowClick,
  className = '',
  rowClassName = '',
  headerClassName = '',
  headerRenderer,
  rowRenderer,
  emptyRenderer,
  showFooter = false,
  footerRenderer,
}: VirtualizedResourceListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fixedListRef = useRef<List>(null);
  const variableListRef = useRef<VariableSizeList>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height });

  // Handle container resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setContainerSize(prev => ({ ...prev, width }));
      }
    });

    resizeObserver.observe(containerRef.current);

    // Initialize width
    setContainerSize(prev => ({
      ...prev,
      width: containerRef.current?.clientWidth || 0,
    }));

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update list when items change
  useEffect(() => {
    if (getRowHeight && variableListRef.current) {
      variableListRef.current.resetAfterIndex(0);
    }
  }, [items, getRowHeight]);

  // Update height when prop changes
  useEffect(() => {
    setContainerSize(prev => ({ ...prev, height }));
  }, [height]);

  // Default header renderer
  const defaultHeaderRenderer = () => (
    <div className={`flex bg-gray-700 text-xs uppercase ${headerClassName}`}>
      {columns.map(column => (
        <div
          key={column.key.toString()}
          className="px-4 py-2 font-semibold"
          style={{
            minWidth: column.minWidth || column.width,
            width: column.width,
            flex: column.flex || 0,
          }}
        >
          {column.header}
        </div>
      ))}
    </div>
  );

  // Default row renderer
  const defaultRowRenderer = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    return (
      <div
        style={style}
        className={`flex border-b border-gray-700 hover:bg-gray-600 ${rowClassName}`}
        onClick={() => onRowClick?.(item, index)}
        role="row"
        aria-rowindex={index + 1}
      >
        {columns.map(column => (
          <div
            key={`${item.id}-${column.key.toString()}`}
            className="truncate px-4 py-2"
            style={{
              minWidth: column.minWidth || column.width,
              width: column.width,
              flex: column.flex || 0,
            }}
          >
            {column.render
              ? column.render(item)
              : typeof column.key === 'string'
                ? (item as Record<string, React.ReactNode>)[column.key]
                : (item[column.key] as React.ReactNode)}
          </div>
        ))}
      </div>
    );
  };

  // Default empty renderer
  const defaultEmptyRenderer = () => (
    <div className="flex h-full items-center justify-center py-8 text-center text-gray-400">
      No items to display
    </div>
  );

  // Default footer renderer
  const defaultFooterRenderer = () => (
    <div className="mt-2 text-xs text-gray-500">
      Displaying {items.length} items (virtualized for performance)
    </div>
  );

  // Render the list
  if (items.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`rounded bg-gray-800 ${className}`}
        style={{ height, width }}
      >
        {(emptyRenderer || defaultEmptyRenderer)()}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="overflow-hidden rounded bg-gray-800"
        style={{ height, width }}
      >
        {/* Header */}
        {(headerRenderer || defaultHeaderRenderer)()}

        {/* Virtualized List */}
        {getRowHeight ? (
          <VariableSizeList
            ref={variableListRef}
            height={containerSize.height - 30} // Subtract header height
            width={containerSize.width}
            itemCount={items.length}
            itemSize={getRowHeight}
            overscanCount={5}
          >
            {rowRenderer || defaultRowRenderer}
          </VariableSizeList>
        ) : (
          <List
            ref={fixedListRef}
            height={containerSize.height - 30} // Subtract header height
            width={containerSize.width}
            itemCount={items.length}
            itemSize={rowHeight}
            overscanCount={5}
          >
            {rowRenderer || defaultRowRenderer}
          </List>
        )}
      </div>

      {/* Footer */}
      {showFooter && (footerRenderer || defaultFooterRenderer)()}
    </div>
  );
}

// Memoize the component for better performance
export default React.memo(VirtualizedResourceList) as typeof VirtualizedResourceList;
