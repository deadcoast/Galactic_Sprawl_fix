import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { ApiEndpoint, ApiError, ApiResponse, TypeSafeApiClient } from '../api/TypeSafeApiClient';

/**
 * State type for API requests
 */
export interface ApiRequestState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  isValidationError: boolean;
  isSuccess: boolean;
}

/**
 * Options for API requests
 */
export interface UseApiOptions {
  /** Skip the request (do not execute automatically) */
  skip?: boolean;
  /** Enable request caching */
  enableCache?: boolean;
  /** Cache key (defaults to endpoint path) */
  cacheKey?: string;
  /** Cache time to live in milliseconds (default: 5 minutes) */
  cacheTTL?: number;
  /** Automatically retry failed requests */
  retry?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay between retries in milliseconds */
  retryDelay?: number;
  /** Callback when request completes successfully */
  onSuccess?: <T>(data: T) => void;
  /** Callback when request fails */
  onError?: (error: ApiError) => void;
}

// Simple in-memory cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const apiCache = new Map<string, CacheEntry<unknown>>();

/**
 * Hook for using the type-safe API client
 */
export function useTypedApi(apiClient: TypeSafeApiClient) {
  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Generic request function
   */
  const request = useCallback(
    async <
      RequestType,
      ResponseType,
      RequestSchema extends z.ZodType<RequestType>,
      ResponseSchema extends z.ZodType<ResponseType>,
    >(
      endpoint: ApiEndpoint<RequestType, ResponseType, RequestSchema, ResponseSchema>,
      requestData?: RequestType,
      options: UseApiOptions = {}
    ): Promise<ApiResponse<ResponseType>> => {
      // Get cache key if caching is enabled
      const cacheEnabled = options.enableCache ?? false;
      const cacheKey = options.cacheKey ?? `${endpoint.method}:${endpoint.path}`;

      // Check cache
      if (cacheEnabled && apiCache.has(cacheKey)) {
        const cachedEntry = apiCache.get(cacheKey) as CacheEntry<ApiResponse<ResponseType>>;
        const now = Date.now();
        if (now - cachedEntry.timestamp < cachedEntry.ttl) {
          return cachedEntry.data;
        } else {
          // Remove expired cache entry
          apiCache.delete(cacheKey);
        }
      }

      try {
        // Execute request
        const response = await apiClient.request(endpoint, requestData);

        // Cache the result if caching is enabled
        if (cacheEnabled) {
          apiCache.set(cacheKey, {
            data: response,
            timestamp: Date.now(),
            ttl: options.cacheTTL ?? 5 * 60 * 1000, // Default 5 minutes
          });
        }

        // Call success callback if provided
        if (options.onSuccess && response.isValid) {
          options.onSuccess(response.data);
        }

        return response;
      } catch (error) {
        // Handle retry logic
        if (options.retry && error instanceof ApiError) {
          const apiError = error as ApiError;
          const maxRetries = options.maxRetries ?? 3;
          const retryDelay = options.retryDelay ?? 1000;

          let retryAttempt = 0;
          let lastError = apiError;

          while (retryAttempt < maxRetries) {
            retryAttempt++;

            // Exponential backoff
            const delay = retryDelay * Math.pow(2, retryAttempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));

            try {
              const retryResponse = await apiClient.request(endpoint, requestData);

              // Cache the result if caching is enabled
              if (cacheEnabled) {
                apiCache.set(cacheKey, {
                  data: retryResponse,
                  timestamp: Date.now(),
                  ttl: options.cacheTTL ?? 5 * 60 * 1000,
                });
              }

              return retryResponse;
            } catch (retryError) {
              if (retryError instanceof ApiError) {
                lastError = retryError as ApiError;
              } else {
                throw retryError;
              }
            }
          }

          // If we've exhausted retries, throw the last error
          throw lastError;
        }

        // Call error callback if provided
        if (options.onError && error instanceof ApiError) {
          options.onError(error as ApiError);
        }

        throw error;
      }
    },
    [apiClient]
  );

  /**
   * Hook for query requests (GET)
   */
  const useQuery = useCallback(
    <ResponseType, ResponseSchema extends z.ZodType<ResponseType>>(
      path: string,
      responseSchema: ResponseSchema,
      options: UseApiOptions & {
        queryParams?: Record<string, string | number | boolean | undefined>;
        headers?: Record<string, string>;
        withCredentials?: boolean;
        dependencies?: unknown[];
      } = {}
    ) => {
      const [state, setState] = useState<ApiRequestState<ResponseType>>({
        data: null,
        isLoading: !options.skip,
        isError: false,
        error: null,
        isValidationError: false,
        isSuccess: false,
      });

      const { dependencies = [], skip = false, ...requestOptions } = options;

      const fetchData = useCallback(async () => {
        if (skip) return;

        setState(prev => ({ ...prev, isLoading: true }));

        try {
          const endpoint: ApiEndpoint<void, ResponseType, z.ZodType<void>, ResponseSchema> = {
            path,
            method: 'GET',
            requestSchema: z.void(),
            responseSchema,
            queryParams: options.queryParams,
            headers: options.headers,
            withCredentials: options.withCredentials,
          };

          const response = await request(endpoint, undefined, requestOptions);

          if (isMounted.current) {
            setState({
              data: response.data,
              isLoading: false,
              isError: false,
              error: null,
              isValidationError: !response.isValid,
              isSuccess: true,
            });
          }
        } catch (error) {
          if (isMounted.current) {
            setState({
              data: null,
              isLoading: false,
              isError: true,
              error: error instanceof ApiError ? error : null,
              isValidationError:
                error instanceof ApiError &&
                (error.type === 'RESPONSE_VALIDATION_ERROR' ||
                  error.type === 'REQUEST_VALIDATION_ERROR'),
              isSuccess: false,
            });
          }
        }
      }, [path, responseSchema, requestOptions, skip, ...dependencies]);

      useEffect(() => {
        fetchData();
      }, [fetchData]);

      return {
        ...state,
        refetch: fetchData,
      };
    },
    [request]
  );

  /**
   * Hook for mutation requests (POST, PUT, PATCH, DELETE)
   */
  const useMutation = useCallback(
    <
      RequestType,
      ResponseType,
      RequestSchema extends z.ZodType<RequestType>,
      ResponseSchema extends z.ZodType<ResponseType>,
    >(
      method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      path: string,
      requestSchema: RequestSchema,
      responseSchema: ResponseSchema,
      options: UseApiOptions & {
        headers?: Record<string, string>;
        withCredentials?: boolean;
      } = {}
    ) => {
      const [state, setState] = useState<ApiRequestState<ResponseType>>({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isValidationError: false,
        isSuccess: false,
      });

      const execute = useCallback(
        async (requestData: RequestType) => {
          setState(prev => ({ ...prev, isLoading: true }));

          try {
            const endpoint: ApiEndpoint<RequestType, ResponseType, RequestSchema, ResponseSchema> =
              {
                path,
                method,
                requestSchema,
                responseSchema,
                headers: options.headers,
                withCredentials: options.withCredentials,
              };

            const response = await request(endpoint, requestData, options);

            if (isMounted.current) {
              setState({
                data: response.data,
                isLoading: false,
                isError: false,
                error: null,
                isValidationError: !response.isValid,
                isSuccess: true,
              });
            }

            return response.data;
          } catch (error) {
            if (isMounted.current) {
              setState({
                data: null,
                isLoading: false,
                isError: true,
                error: error instanceof ApiError ? error : null,
                isValidationError:
                  error instanceof ApiError &&
                  (error.type === 'RESPONSE_VALIDATION_ERROR' ||
                    error.type === 'REQUEST_VALIDATION_ERROR'),
                isSuccess: false,
              });
            }

            throw error;
          }
        },
        [path, method, requestSchema, responseSchema, options]
      );

      return {
        ...state,
        execute,
      };
    },
    [request]
  );

  return {
    useQuery,
    useMutation,
    request,
  };
}

/**
 * Creates a POST mutation hook
 */
export function usePost<
  RequestType,
  ResponseType,
  RequestSchema extends z.ZodType<RequestType>,
  ResponseSchema extends z.ZodType<ResponseType>,
>(
  apiClient: TypeSafeApiClient,
  path: string,
  requestSchema: RequestSchema,
  responseSchema: ResponseSchema,
  options: UseApiOptions & {
    headers?: Record<string, string>;
    withCredentials?: boolean;
  } = {}
) {
  const { useMutation } = useTypedApi(apiClient);
  return useMutation<RequestType, ResponseType, RequestSchema, ResponseSchema>(
    'POST',
    path,
    requestSchema,
    responseSchema,
    options
  );
}

/**
 * Creates a PUT mutation hook
 */
export function usePut<
  RequestType,
  ResponseType,
  RequestSchema extends z.ZodType<RequestType>,
  ResponseSchema extends z.ZodType<ResponseType>,
>(
  apiClient: TypeSafeApiClient,
  path: string,
  requestSchema: RequestSchema,
  responseSchema: ResponseSchema,
  options: UseApiOptions & {
    headers?: Record<string, string>;
    withCredentials?: boolean;
  } = {}
) {
  const { useMutation } = useTypedApi(apiClient);
  return useMutation<RequestType, ResponseType, RequestSchema, ResponseSchema>(
    'PUT',
    path,
    requestSchema,
    responseSchema,
    options
  );
}

/**
 * Creates a PATCH mutation hook
 */
export function usePatch<
  RequestType,
  ResponseType,
  RequestSchema extends z.ZodType<RequestType>,
  ResponseSchema extends z.ZodType<ResponseType>,
>(
  apiClient: TypeSafeApiClient,
  path: string,
  requestSchema: RequestSchema,
  responseSchema: ResponseSchema,
  options: UseApiOptions & {
    headers?: Record<string, string>;
    withCredentials?: boolean;
  } = {}
) {
  const { useMutation } = useTypedApi(apiClient);
  return useMutation<RequestType, ResponseType, RequestSchema, ResponseSchema>(
    'PATCH',
    path,
    requestSchema,
    responseSchema,
    options
  );
}

/**
 * Creates a DELETE mutation hook
 */
export function useDelete<ResponseType, ResponseSchema extends z.ZodType<ResponseType>>(
  apiClient: TypeSafeApiClient,
  path: string,
  responseSchema: ResponseSchema,
  options: UseApiOptions & {
    headers?: Record<string, string>;
    withCredentials?: boolean;
  } = {}
) {
  const { useMutation } = useTypedApi(apiClient);
  return useMutation<void, ResponseType, z.ZodType<void>, ResponseSchema>(
    'DELETE',
    path,
    z.void(),
    responseSchema,
    options
  );
}
