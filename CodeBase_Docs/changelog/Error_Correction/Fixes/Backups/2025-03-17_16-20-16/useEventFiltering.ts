import { useCallback, useMemo, useState } from 'react';
import { ModuleEvent, ModuleEventType } from '../../lib/modules/ModuleEvents';
import {
  DEFAULT_FILTER_CONFIG,
  EventFilter,
  EventFilterConfig,
  EventFilterCriteria,
} from '../../utils/events/EventFilter';

/**
 * Hook for filtering events with optimized performance
 * @param events Array of events to filter
 * @param initialCriteria Initial filter criteria
 * @param config Configuration for the filter
 * @returns Object with filtered events and methods to update filter criteria
 */
export function useEventFiltering(
  events: ModuleEvent[],
  initialCriteria: EventFilterCriteria = {},
  config: EventFilterConfig = DEFAULT_FILTER_CONFIG
) {
  // Create event filter instance
  const eventFilter = useMemo(() => new EventFilter(config), []);

  // State for filter criteria
  const [criteria, setCriteria] = useState<EventFilterCriteria>(initialCriteria);

  // Apply filter to events
  const filteredEvents = useMemo(() => {
    return eventFilter.filterEvents(events, criteria);
  }, [events, criteria, eventFilter]);

  // Update filter criteria
  const updateCriteria = useCallback((newCriteria: Partial<EventFilterCriteria>) => {
    setCriteria(prev => ({ ...prev, ...newCriteria }));
  }, []);

  // Reset filter criteria
  const resetCriteria = useCallback(() => {
    setCriteria({});
  }, []);

  // Update filter configuration
  const updateConfig = useCallback(
    (newConfig: Partial<EventFilterConfig>) => {
      eventFilter.updateConfig(newConfig);
    },
    [eventFilter]
  );

  // Filter by event types
  const filterByEventTypes = useCallback(
    (eventTypes: ModuleEventType[]) => {
      updateCriteria({ eventTypes });
    },
    [updateCriteria]
  );

  // Filter by module IDs
  const filterByModuleIds = useCallback(
    (moduleIds: string[]) => {
      updateCriteria({ moduleIds });
    },
    [updateCriteria]
  );

  // Filter by time range
  const filterByTimeRange = useCallback(
    (startTime?: number, endTime?: number) => {
      updateCriteria({ startTime, endTime });
    },
    [updateCriteria]
  );

  // Add custom filter
  const setCustomFilter = useCallback(
    (customFilter: (event: ModuleEvent) => boolean) => {
      updateCriteria({ customFilter });
    },
    [updateCriteria]
  );

  return {
    // Filtered events
    filteredEvents,

    // Current filter state
    criteria,

    // Filter operations
    updateCriteria,
    resetCriteria,
    updateConfig,
    filterByEventTypes,
    filterByModuleIds,
    filterByTimeRange,
    setCustomFilter,

    // Stats
    totalEvents: events.length,
    filteredCount: filteredEvents.length,
  };
}

/**
 * Hook for filtering events with pagination
 * @param events Array of events to filter
 * @param initialCriteria Initial filter criteria
 * @param config Configuration for the filter
 * @param pageSize Number of events per page
 * @returns Object with paginated filtered events and pagination controls
 */
export function usePaginatedEventFiltering(
  events: ModuleEvent[],
  initialCriteria: EventFilterCriteria = {},
  config: EventFilterConfig = DEFAULT_FILTER_CONFIG,
  pageSize = 50
) {
  // Use the base filtering hook
  const filtering = useEventFiltering(events, initialCriteria, config);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filtering.filteredEvents.length / pageSize));

  // Ensure current page is valid
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  // Get current page of events
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtering.filteredEvents.slice(startIndex, startIndex + pageSize);
  }, [filtering.filteredEvents, currentPage, pageSize]);

  // Go to specific page
  const goToPage = useCallback(
    (page: number) => {
      const targetPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(targetPage);
    },
    [totalPages]
  );

  // Go to next page
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  // Go to previous page
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Reset to first page
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Reset pagination when filter criteria changes
  useCallback(() => {
    resetPagination();
  }, [filtering.criteria, resetPagination]);

  return {
    ...filtering,

    // Paginated events
    paginatedEvents,

    // Pagination state
    currentPage,
    totalPages,
    pageSize,

    // Pagination controls
    goToPage,
    nextPage,
    prevPage,
    resetPagination,

    // Pagination stats
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, filtering.filteredEvents.length),
  };
}
