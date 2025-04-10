import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { ModuleEvent, ModuleEventType } from '../../../lib/events/ModuleEventBus';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../../services/ErrorLoggingService';

export interface EventLogProps {
  /**
   * Array of events to display
   */
  events: ModuleEvent[];

  /**
   * Function to load more events
   * Return true if there are more events to load, false otherwise
   */
  loadMoreEvents?: () => Promise<boolean>;

  /**
   * Maximum number of events to display
   */
  maxEvents?: number;

  /**
   * Height of the event log
   */
  height?: number;

  /**
   * Width of the event log
   */
  width?: string | number;

  /**
   * Row height
   */
  rowHeight?: number;

  /**
   * Filter function to filter events
   */
  filterEvent?: (event: ModuleEvent) => boolean;

  /**
   * Event handler for when an event is clicked
   */
  onEventClick?: (event: ModuleEvent) => void;

  /**
   * Whether to show the event details by default
   */
  showDetails?: boolean;

  /**
   * Custom renderer for event rows
   */
  rowRenderer?: (props: {
    event: ModuleEvent;
    index: number;
    style: React.CSSProperties;
    onClick: () => void;
    isExpanded: boolean;
  }) => React.ReactNode;

  /**
   * CSS class for the container
   */
  className?: string;

  /**
   * Whether to auto-scroll to the most recent event
   */
  autoScrollToRecent?: boolean;

  /**
   * Event type filter
   */
  eventTypeFilter?: ModuleEventType[];
}

/**
 * A virtualized event log that efficiently renders large sets of events
 * Supports infinite loading for fetching historical events on demand
 */
export const VirtualizedEventLog: React.FC<EventLogProps> = ({
  events,
  loadMoreEvents,
  maxEvents = 1000,
  height = 400,
  width = '100%',
  rowHeight = 48,
  filterEvent,
  onEventClick,
  showDetails = false,
  rowRenderer,
  className = '',
  autoScrollToRecent = true,
  eventTypeFilter,
}) => {
  const listRef = useRef<List | null>(null);
  const infiniteLoaderRef = useRef<InfiniteLoader | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height });
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);

  // For storing reference without directly assigning to .current
  const listRefCallback = useCallback((list: List | null) => {
    listRef.current = list;
  }, []);

  // Filter events based on the provided filter
  const filteredEvents = useCallback(() => {
    let filtered = [...events];

    // Apply event type filter
    if (eventTypeFilter && eventTypeFilter.length > 0) {
      filtered = filtered.filter(event => eventTypeFilter.includes(event?.type));
    }

    // Apply custom filter function
    if (filterEvent) {
      filtered = filtered.filter(filterEvent);
    }

    // Limit the number of events
    return filtered.slice(0, maxEvents);
  }, [events, filterEvent, eventTypeFilter, maxEvents]);

  // Memoized filtered events
  const displayedEvents = React.useMemo(() => filteredEvents(), [filteredEvents]);

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

    // Initialize width
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

  // Auto-scroll to most recent event
  useEffect(() => {
    if (autoScrollToRecent && listRef.current && displayedEvents.length > 0) {
      listRef.current.scrollTo(0);
    }
  }, [displayedEvents.length, autoScrollToRecent]);

  // Load more events
  const loadMore = async () => {
    if (isLoadingMore || !loadMoreEvents || !hasMoreEvents) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const hasMore = await loadMoreEvents();
      setHasMoreEvents(hasMore);
    } catch (error) {
      errorLoggingService.logError(
        error instanceof Error ? error : new Error('Failed to load more events'),
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        { componentName: 'VirtualizedEventLog', action: 'loadMore' }
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle event click
  const handleEventClick = (eventId: string) => {
    const event = displayedEvents.find(e => e.moduleId + e.timestamp === eventId);
    if (event) {
      if (onEventClick) {
        onEventClick(event);
      }

      setExpandedEventIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(eventId)) {
          newSet.delete(eventId);
        } else {
          newSet.add(eventId);
        }
        return newSet;
      });
    }
  };

  // Default row renderer
  const defaultRowRenderer = ({
    event,
    index,
    style,
    onClick,
    isExpanded,
  }: {
    event: ModuleEvent;
    index: number;
    style: React.CSSProperties;
    onClick: () => void;
    isExpanded: boolean;
  }) => {
    const eventId = event?.moduleId + event?.timestamp;
    return (
      <div
        style={style}
        className={`flex flex-col border-b border-gray-700 p-2 transition-colors hover:bg-gray-700 ${
          isExpanded ? 'bg-gray-700' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="rounded bg-blue-600 px-2 py-1 text-xs text-white">{event?.type}</span>
            <span className="text-sm text-gray-300">{event?.moduleId}</span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(event?.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {isExpanded && (
          <div className="mt-2 rounded bg-gray-800 p-2">
            <pre className="text-xs text-gray-300">{JSON.stringify(event?.data, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  };

  // Row virtualization component
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const event = displayedEvents[index];
    if (!event) {
      return null;
    }

    const eventId = event?.moduleId + event?.timestamp;
    const isExpanded = expandedEventIds.has(eventId);
    const onClick = () => handleEventClick(eventId);

    return rowRenderer
      ? rowRenderer({ event, index, style, onClick, isExpanded })
      : defaultRowRenderer({ event, index, style, onClick, isExpanded });
  };

  // If no events, show empty state
  if (displayedEvents.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`flex h-${height} w-full items-center justify-center rounded bg-gray-800 ${className}`}
        style={{ height, width }}
      >
        <div className="text-center text-gray-400">No events to display</div>
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
        <InfiniteLoader
          ref={infiniteLoaderRef}
          isItemLoaded={index => index < displayedEvents.length}
          itemCount={hasMoreEvents ? displayedEvents.length + 1 : displayedEvents.length}
          loadMoreItems={loadMore}
        >
          {({ onItemsRendered, ref }) => (
            <List
              className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
              height={containerSize.height}
              width={containerSize.width}
              itemCount={displayedEvents.length}
              itemSize={rowHeight}
              onItemsRendered={onItemsRendered}
              ref={list => {
                // For InfiniteLoader
                ref(list);
                // For our component's reference
                listRefCallback(list);
              }}
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Displaying {displayedEvents.length} events (virtualized)</span>
        {isLoadingMore && <span>Loading more events...</span>}
      </div>
    </div>
  );
};

export default React.memo(VirtualizedEventLog);
