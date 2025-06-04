import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VariableSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import
  {
    errorLoggingService,
    ErrorSeverity,
    ErrorType,
  } from '../../../services/logging/ErrorLoggingService';
import { ResourceType } from './../../../types/resources/ResourceTypes';

export interface ResourceDataItem {
  id: string;
  name: string;
  type: ResourceType;
  amount: number;
  capacity?: number;
  efficiency?: number;
  rate?: number;
  quality?: number;
  coordinates?: { x: number; y: number; z?: number };
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ResourceDatasetProps<T extends ResourceDataItem> {
  /**
   * Array of resource data items to display
   */
  items: T[];

  /**
   * Function to load more items when scrolling
   * Returns a promise that resolves to a boolean indicating if there are more items
   */
  loadMoreItems?: () => Promise<boolean>;

  /**
   * Maximum number of items to display
   */
  maxItems?: number;

  /**
   * Container height
   */
  height?: number;

  /**
   * Container width
   */
  width?: string | number;

  /**
   * Row renderer function to customize how each item is displayed
   */
  rowRenderer?: (props: { item: T; index: number; style: React.CSSProperties }) => React.ReactNode;

  /**
   * Function to determine the height of each row
   */
  getRowHeight?: (index: number) => number;

  /**
   * Default row height if getRowHeight is not provided
   */
  rowHeight?: number;

  /**
   * Function to filter items
   */
  filterItem?: (item: T) => boolean;

  /**
   * Current search term for filtering
   */
  searchTerm?: string;

  /**
   * Fields to search in when filtering by searchTerm
   */
  searchFields?: (keyof T)[];

  /**
   * Function to sort items
   */
  sortItems?: (a: T, b: T) => number;

  /**
   * Callback when an item is clicked
   */
  onItemClick?: (item: T) => void;

  /**
   * Render a loading state
   */
  loadingRenderer?: () => React.ReactNode;

  /**
   * Render an empty state
   */
  emptyRenderer?: () => React.ReactNode;

  /**
   * Render a header above the list
   */
  headerRenderer?: () => React.ReactNode;

  /**
   * Render a footer below the list
   */
  footerRenderer?: () => React.ReactNode;

  /**
   * Show statistics in the footer
   */
  showStats?: boolean;

  /**
   * CSS class name for the container
   */
  className?: string;

  /**
   * Number of items to render beyond the visible area
   */
  overscanCount?: number;
}

/**
 * A virtualized component for efficiently rendering large resource datasets
 * with support for infinite loading, filtering, and sorting
 */
export function VirtualizedResourceDataset<T extends ResourceDataItem>({
  items,
  loadMoreItems,
  maxItems = 1000,
  height = 500,
  width = '100%',
  rowRenderer,
  getRowHeight,
  rowHeight = 60,
  filterItem,
  searchTerm = '',
  searchFields = ['name', 'id', 'type'] as (keyof T)[],
  sortItems,
  onItemClick,
  loadingRenderer,
  emptyRenderer,
  headerRenderer,
  footerRenderer,
  showStats = true,
  className = '',
  overscanCount = 5,
}: ResourceDatasetProps<T>) {
  // References
  const listRef = useRef<VariableSizeList | null>(null);
  const infiniteLoaderRef = useRef<InfiniteLoader | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // For storing reference without directly assigning to .current
  const listRefCallback = useCallback((list: VariableSizeList | null) => {
    listRef.current = list;
  }, []);

  // State for list management
  const [containerSize, setContainerSize] = useState({ width: 0, height });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(!!loadMoreItems);

  // Filter and sort items
  const processedItems = useMemo(() => {
    let result = [...items];

    // Apply search term filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result?.filter(item => {
        return searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowercaseSearch);
          } else if (typeof value === 'number') {
            return value.toString().includes(lowercaseSearch);
          }
          return false;
        });
      });
    }

    // Apply custom filter
    if (filterItem) {
      result = result?.filter(filterItem);
    }

    // Apply sorting
    if (sortItems) {
      result?.sort(sortItems);
    }

    // Apply limit
    if (result?.length > maxItems) {
      result = result?.slice(0, maxItems);
    }

    return result;
  }, [items, searchTerm, searchFields, filterItem, sortItems, maxItems]);

  // Handle container resizing
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setContainerSize(prev => ({ ...prev, width }));
      }
    });

    resizeObserver.observe(containerRef.current);

    // Initialize size
    setContainerSize(prev => ({
      ...prev,
      width: containerRef.current?.clientWidth ?? 0,
    }));

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update height when prop changes
  useEffect(() => {
    setContainerSize(prev => ({ ...prev, height }));
  }, [height]);

  // Reset list when items change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [processedItems.length]);

  // Load more items function for InfiniteLoader
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !loadMoreItems || !hasMoreItems) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const hasMore = await loadMoreItems();
      setHasMoreItems(hasMore);
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Failed to load more items'),
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        { componentName: 'VirtualizedResourceDataset', action: 'loadMore' }
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, loadMoreItems, hasMoreItems]);

  // Default row renderer
  const defaultRowRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = processedItems[index];
      if (!item) {
        return null;
      }

      return (
        <div
          style={style}
          className="flex cursor-pointer items-center border-b border-gray-700 p-4 transition-colors hover:bg-gray-700"
          onClick={() => onItemClick?.(item)}
        >
          <div className="mr-4 flex-shrink-0">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white`}
            >
              {item?.type.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium">{item?.name}</div>
            <div className="truncate text-sm text-gray-400">
              {item?.type} - {item?.id}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">{item?.amount.toLocaleString()}</div>
            {item?.rate !== undefined && (
              <div className={`text-sm ${item?.rate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {item?.rate >= 0 ? '+' : ''}
                {item?.rate.toFixed(1)}/s
              </div>
            )}
          </div>
        </div>
      );
    },
    [processedItems, onItemClick]
  );

  // Default empty renderer
  const defaultEmptyRenderer = useCallback(
    () => (
      <div className="flex h-full items-center justify-center p-8 text-gray-400">
        No items to display
      </div>
    ),
    []
  );

  // Default loading renderer
  const defaultLoadingRenderer = useCallback(
    () => (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    ),
    []
  );

  // Stats renderer
  const renderStats = useCallback(
    () => (
      <div className="mt-2 flex justify-between text-sm text-gray-500">
        <span>
          Displaying {processedItems.length} of {items.length} items
        </span>
        {isLoadingMore && <span>Loading more items...</span>}
      </div>
    ),
    [processedItems.length, items.length, isLoadingMore]
  );

  // If empty, render empty state
  if (processedItems.length === 0) {
    return (
      <div
        className={`rounded bg-gray-800 ${className}`}
        style={{ height, width }}
        ref={containerRef}
      >
        {emptyRenderer ? emptyRenderer() : defaultEmptyRenderer()}
      </div>
    );
  }

  // Get item size function for VariableSizeList
  const getItemSize = (index: number) => {
    if (getRowHeight) {
      return getRowHeight(index);
    }
    return rowHeight;
  };

  // Determine whether an item at a particular index has loaded
  const isItemLoaded = (index: number) => {
    return index < processedItems.length;
  };

  // Item count for infinite loader
  const itemCount = hasMoreItems ? processedItems.length + 1 : processedItems.length;

  // Render row with underlying renderer
  const renderRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="p-4">
          {loadingRenderer ? loadingRenderer() : defaultLoadingRenderer()}
        </div>
      );
    }

    return rowRenderer
      ? rowRenderer({ item: processedItems[index], index, style })
      : defaultRowRenderer({ index, style });
  };

  return (
    <div className={className}>
      {headerRenderer?.()}

      <div
        ref={containerRef}
        className="overflow-hidden rounded bg-gray-800"
        style={{ height, width }}
      >
        <InfiniteLoader
          ref={infiniteLoaderRef}
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMore}
          threshold={10}
        >
          {({ onItemsRendered, ref }) => (
            <VariableSizeList
              height={containerSize.height}
              width={containerSize.width}
              itemCount={processedItems.length}
              itemSize={getItemSize}
              onItemsRendered={onItemsRendered}
              ref={list => {
                // For InfiniteLoader
                ref(list);
                // For our component's reference
                listRefCallback(list);
              }}
              overscanCount={overscanCount}
            >
              {renderRow}
            </VariableSizeList>
          )}
        </InfiniteLoader>
      </div>

      {showStats && renderStats()}
      {footerRenderer?.()}
    </div>
  );
}

export default React.memo(VirtualizedResourceDataset) as typeof VirtualizedResourceDataset;
