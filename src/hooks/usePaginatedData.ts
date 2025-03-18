import { useCallback, useEffect, useState } from 'react';
import { apiService, PaginationParams } from '../services/APIService';
import { useService } from './services/useService';

interface UsePaginatedDataOptions<T> {
  endpoint: string;
  initialParams?: Partial<PaginationParams>;
  initialData?: T[];
}

interface UsePaginatedDataResult<T> {
  data: T[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  page: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: Record<string, unknown>) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export function usePaginatedData<T>({
  endpoint,
  initialParams = {},
  initialData = [],
}: UsePaginatedDataOptions<T>): UsePaginatedDataResult<T> {
  const { service } = useService<typeof apiService>('api');
  const [data, setData] = useState<T[]>(initialData);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    pageSize: 20,
    ...initialParams,
  });
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(
    async (newParams: PaginationParams) => {
      if (!service) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await service.fetchPaginated<T>(endpoint, newParams);

        if (newParams.page === 1) {
          setData(response?.data);
        } else {
          setData(prev => [...prev, ...response?.data]);
        }

        setTotal(response?.total);
        setHasMore(response?.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [service, endpoint]
  );

  // Initial fetch
  useEffect(() => {
    fetchData(params);
  }, [fetchData, params]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const newParams = {
      ...params,
      page: params.page + 1,
    };
    setParams(newParams);
  }, [isLoading, hasMore, params]);

  const refresh = useCallback(async () => {
    const newParams = {
      ...params,
      page: 1,
    };
    setParams(newParams);
  }, [params]);

  const setFilters = useCallback((filters: Record<string, unknown>) => {
    setParams(prev => ({
      ...prev,
      page: 1,
      filters,
    }));
  }, []);

  const setSorting = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setParams(prev => ({
      ...prev,
      page: 1,
      sortBy,
      sortOrder,
    }));
  }, []);

  return {
    data,
    total,
    isLoading,
    error,
    page: params.page,
    hasMore,
    loadMore,
    refresh,
    setFilters,
    setSorting,
  };
}
