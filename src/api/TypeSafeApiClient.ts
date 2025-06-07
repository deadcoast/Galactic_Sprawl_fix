import { z } from 'zod';

/**
 * Type definitions for API endpoints
 */
export interface ApiEndpoint<
  RequestType,
  ResponseType,
  RequestSchema extends z.ZodType<RequestType>,
  ResponseSchema extends z.ZodType<ResponseType>,
> {
  /** The API endpoint path */
  path: string;
  /** The HTTP method for this endpoint */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** The Zod schema for validating request data */
  requestSchema: RequestSchema;
  /** The Zod schema for validating response data */
  responseSchema: ResponseSchema;
  /** Optional request headers */
  headers?: Record<string, string>;
  /** Optional query parameters */
  queryParams?: Record<string, string | number | boolean | undefined>;
  /** Whether to include credentials in the request */
  withCredentials?: boolean;
}

/**
 * API client options
 */
export interface ApiClientOptions {
  /** Base URL for all API requests */
  baseUrl: string;
  /** Default headers for all requests */
  defaultHeaders?: Record<string, string>;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Whether to include credentials in all requests by default */
  withCredentials?: boolean;
  /** Whether to throw errors on validation failures */
  throwOnValidationError?: boolean;
  /** Callback for handling request errors */
  onError?: (error: ApiError) => void;
}

/**
 * API error types
 */
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  REQUEST_VALIDATION_ERROR = 'REQUEST_VALIDATION_ERROR',
  RESPONSE_VALIDATION_ERROR = 'RESPONSE_VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  UNAUTHORIZED_ERROR = 'UNAUTHORIZED_ERROR',
  FORBIDDEN_ERROR = 'FORBIDDEN_ERROR',
  BAD_REQUEST_ERROR = 'BAD_REQUEST_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * API error object with typed error information
 */
export class ApiError extends Error {
  type: ApiErrorType;
  status?: number;
  endpoint: string;
  validationErrors?: z.ZodError;
  originalError?: Error;

  constructor(
    type: ApiErrorType,
    message: string,
    endpoint: string,
    status?: number,
    validationErrors?: z.ZodError,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.endpoint = endpoint;
    this.validationErrors = validationErrors;
    this.originalError = originalError;
  }
}

/**
 * Response with metadata and validation information
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  validationResult: z.SafeParseReturnType<unknown, T>;
  isValid: boolean;
}

/**
 * Type-safe API client class
 */
export class TypeSafeApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private withCredentials: boolean;
  private throwOnValidationError: boolean;
  private onError?: (error: ApiError) => void;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options?.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options?.defaultHeaders ?? {}),
    };
    this.timeout = options?.timeout ?? 30000; // 30 seconds default
    this.withCredentials = options?.withCredentials ?? false;
    this.throwOnValidationError = options?.throwOnValidationError ?? true;
    this.onError = options?.onError;
  }

  /**
   * Execute a type-safe API request
   */
  async request<
    RequestType,
    ResponseType,
    RequestSchema extends z.ZodType<RequestType>,
    ResponseSchema extends z.ZodType<ResponseType>,
  >(
    endpoint: ApiEndpoint<RequestType, ResponseType, RequestSchema, ResponseSchema>,
    requestData?: RequestType
  ): Promise<ApiResponse<ResponseType>> {
    const {
      path,
      method,
      requestSchema,
      responseSchema,
      headers = {},
      queryParams = {},
      withCredentials,
    } = endpoint;

    // Validate request data if provided
    if (requestData) {
      const validationResult = requestSchema.safeParse(requestData);
      if (!validationResult.success) {
        const error = new ApiError(
          ApiErrorType.REQUEST_VALIDATION_ERROR,
          `Request validation failed for ${path}: ${validationResult.error.message}`,
          path,
          undefined,
          validationResult.error
        );

        if (this.onError) {
          this.onError(error);
        }

        if (this.throwOnValidationError) {
          throw error;
        }

        // Return a typed empty response to avoid breaking the call chain
        return {
          data: {} as ResponseType,
          status: 0,
          headers: {},
          validationResult: {
            success: false,
            error: validationResult.error,
          } as z.SafeParseReturnType<unknown, ResponseType>,
          isValid: false,
        };
      }
    }

    // Build URL with query parameters
    const queryString = this.buildQueryString(queryParams);
    const url = `${this.baseUrl}${path}${queryString ? `?${queryString}` : ''}`;

    // Merge headers
    const mergedHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    // Build fetch options
    const options: RequestInit = {
      method,
      headers: mergedHeaders,
      credentials: withCredentials || this.withCredentials ? 'include' : 'same-origin',
    };

    // Add body for non-GET requests
    if (method !== 'GET' && requestData) {
      options.body = JSON.stringify(requestData);
    }

    try {
      // Set up timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      options.signal = controller.signal;

      // Execute fetch request
      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response?.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Handle error status codes
      if (!response?.ok) {
        const errorType = this.getErrorTypeFromStatus(response?.status);
        const error = new ApiError(
          errorType,
          `API request failed with status ${response?.status}: ${response?.statusText}`,
          path,
          response?.status
        );

        if (this.onError) {
          this.onError(error);
        }

        throw error;
      }

      // Parse JSON response
      const responseData = (await response?.json()) as ResponseType;

      // Validate response data
      const validationResult = responseSchema.safeParse(responseData);
      if (!validationResult.success) {
        const error = new ApiError(
          ApiErrorType.RESPONSE_VALIDATION_ERROR,
          `Response validation failed for ${path}: ${validationResult.error.message}`,
          path,
          response?.status,
          validationResult.error
        );

        if (this.onError) {
          this.onError(error);
        }

        if (this.throwOnValidationError) {
          throw error;
        }

        // Return data with validation metadata
        return {
          data: responseData,
          status: response?.status,
          headers: responseHeaders,
          validationResult: validationResult as z.SafeParseReturnType<unknown, ResponseType>,
          isValid: false,
        };
      }

      // Return successful response
      return {
        data: validationResult.data,
        status: response?.status,
        headers: responseHeaders,
        validationResult: validationResult as z.SafeParseReturnType<unknown, ResponseType>,
        isValid: true,
      };
    } catch (error) {
      // Handle fetch errors (network errors, timeouts, etc.)
      if (error instanceof ApiError) {
        throw error; // Re-throw if it's already an ApiError
      }

      const originalError = error as Error;
      const errorType =
        originalError.name === 'AbortError'
          ? ApiErrorType.TIMEOUT_ERROR
          : ApiErrorType.NETWORK_ERROR;

      const apiError = new ApiError(
        errorType,
        `API request failed: ${originalError.message}`,
        path,
        undefined,
        undefined,
        originalError
      );

      if (this.onError) {
        this.onError(apiError);
      }

      throw apiError;
    }
  }

  /**
   * Type-safe GET request helper
   */
  async get<ResponseType, ResponseSchema extends z.ZodType<ResponseType>>(
    path: string,
    responseSchema: ResponseSchema,
    options: {
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      withCredentials?: boolean;
    } = {}
  ): Promise<ResponseType> {
    const endpoint: ApiEndpoint<void, ResponseType, z.ZodType<void>, ResponseSchema> = {
      path,
      method: 'GET',
      requestSchema: z.void(),
      responseSchema,
      ...options,
    };

    const response = await this.request(endpoint);
    return response?.data;
  }

  /**
   * Type-safe POST request helper
   */
  async post<
    RequestType,
    ResponseType,
    RequestSchema extends z.ZodType<RequestType>,
    ResponseSchema extends z.ZodType<ResponseType>,
  >(
    path: string,
    requestData: RequestType,
    requestSchema: RequestSchema,
    responseSchema: ResponseSchema,
    options: {
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      withCredentials?: boolean;
    } = {}
  ): Promise<ResponseType> {
    const endpoint: ApiEndpoint<RequestType, ResponseType, RequestSchema, ResponseSchema> = {
      path,
      method: 'POST',
      requestSchema,
      responseSchema,
      ...options,
    };

    const response = await this.request(endpoint, requestData);
    return response?.data;
  }

  /**
   * Type-safe PUT request helper
   */
  async put<
    RequestType,
    ResponseType,
    RequestSchema extends z.ZodType<RequestType>,
    ResponseSchema extends z.ZodType<ResponseType>,
  >(
    path: string,
    requestData: RequestType,
    requestSchema: RequestSchema,
    responseSchema: ResponseSchema,
    options: {
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      withCredentials?: boolean;
    } = {}
  ): Promise<ResponseType> {
    const endpoint: ApiEndpoint<RequestType, ResponseType, RequestSchema, ResponseSchema> = {
      path,
      method: 'PUT',
      requestSchema,
      responseSchema,
      ...options,
    };

    const response = await this.request(endpoint, requestData);
    return response?.data;
  }

  /**
   * Type-safe PATCH request helper
   */
  async patch<
    RequestType,
    ResponseType,
    RequestSchema extends z.ZodType<RequestType>,
    ResponseSchema extends z.ZodType<ResponseType>,
  >(
    path: string,
    requestData: RequestType,
    requestSchema: RequestSchema,
    responseSchema: ResponseSchema,
    options: {
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      withCredentials?: boolean;
    } = {}
  ): Promise<ResponseType> {
    const endpoint: ApiEndpoint<RequestType, ResponseType, RequestSchema, ResponseSchema> = {
      path,
      method: 'PATCH',
      requestSchema,
      responseSchema,
      ...options,
    };

    const response = await this.request(endpoint, requestData);
    return response?.data;
  }

  /**
   * Type-safe DELETE request helper
   */
  async delete<ResponseType, ResponseSchema extends z.ZodType<ResponseType>>(
    path: string,
    responseSchema: ResponseSchema,
    options: {
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      withCredentials?: boolean;
    } = {}
  ): Promise<ResponseType> {
    const endpoint: ApiEndpoint<void, ResponseType, z.ZodType<void>, ResponseSchema> = {
      path,
      method: 'DELETE',
      requestSchema: z.void(),
      responseSchema,
      ...options,
    };

    const response = await this.request(endpoint);
    return response?.data;
  }

  /**
   * Helper to build a query string from parameters
   */
  private buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }

  /**
   * Map HTTP status code to error type
   */
  private getErrorTypeFromStatus(status: number): ApiErrorType {
    switch (true) {
      case status === 400:
        return ApiErrorType.BAD_REQUEST_ERROR;
      case status === 401:
        return ApiErrorType.UNAUTHORIZED_ERROR;
      case status === 403:
        return ApiErrorType.FORBIDDEN_ERROR;
      case status === 404:
        return ApiErrorType.NOT_FOUND_ERROR;
      case status >= 500:
        return ApiErrorType.SERVER_ERROR;
      default:
        return ApiErrorType.UNKNOWN_ERROR;
    }
  }
}

/**
 * Creates a type-safe API endpoint configuration
 */
export function createApiEndpoint<
  RequestType,
  ResponseType,
  RequestSchema extends z.ZodType<RequestType>,
  ResponseSchema extends z.ZodType<ResponseType>,
>(config: ApiEndpoint<RequestType, ResponseType, RequestSchema, ResponseSchema>) {
  return config;
}

/**
 * Creates a client instance with the provided configuration
 */
export function createApiClient(options: ApiClientOptions): TypeSafeApiClient {
  return new TypeSafeApiClient(options);
}
