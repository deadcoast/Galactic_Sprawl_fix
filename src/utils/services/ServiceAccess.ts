/**
 * @file ServiceAccess.ts
 * Utilities for safely accessing game services/managers
 *
 * This file provides:
 * 1. Type-safe access to global services
 * 2. Error handling for missing services
 * 3. Registration utilities for services
 * 4. Service availability monitoring
 */

/**
 * Error thrown when a required service is not available
 */
export class ServiceNotAvailableError extends Error {
  constructor(serviceName: string) {
    super(`Service '${serviceName}' is not available. Ensure it is initialized before access.`);
    this.name = 'ServiceNotAvailableError';
  }
}

/**
 * Type for service validation functions
 */
type ServiceValidator<T> = (service: T | undefined) => boolean;

/**
 * Default validator just checks if the service exists
 */
const defaultValidator = <T>(service: T | undefined): boolean => service !== undefined;

/**
 * Safely get a service from the window object with type checking
 *
 * @param serviceName The name of the service property on window
 * @param validator Optional function to validate the service (beyond just checking existence)
 * @param throwIfMissing Whether to throw an error if the service is missing
 * @returns The service instance with proper typing
 */
export function getService<T>(
  serviceName: keyof Window & string,
  validator: ServiceValidator<T> = defaultValidator,
  throwIfMissing = false
): T | undefined {
  const service = window[serviceName] as unknown as T;

  if (!validator(service)) {
    if (throwIfMissing) {
      throw new ServiceNotAvailableError(serviceName);
    }
    return undefined;
  }

  return service;
}

/**
 * Get a service that is required by the application
 * Throws an error if the service is not available
 *
 * @param serviceName The name of the service property on window
 * @param validator Optional function to validate the service
 * @returns The service instance with proper typing (never undefined)
 * @throws ServiceNotAvailableError if service is not available
 */
export function getRequiredService<T>(
  serviceName: keyof Window & string,
  validator: ServiceValidator<T> = defaultValidator
): T {
  const service = getService<T>(serviceName, validator, true);
  // TypeScript doesn't know that getService with throwIfMissing=true will never return undefined
  return service as T;
}

/**
 * Register a service on the window object with type safety
 *
 * @param serviceName Name of the service to register
 * @param serviceInstance The service instance to register
 */
export function registerService<T>(serviceName: keyof Window & string, serviceInstance: T): void {
  // Convert to unknown first as suggested by the linter
  (window as unknown as Record<string, unknown>)[serviceName] = serviceInstance;
  console.warn(`Service '${serviceName}' registered successfully.`);
}

/**
 * Check if multiple services are available
 *
 * @param serviceNames Array of service names to check
 * @returns Object with results for each service
 */
export function checkServicesAvailability(
  serviceNames: (keyof Window & string)[]
): Record<string, boolean> {
  return serviceNames.reduce(
    (result, name) => {
      result[name] = getService(name) !== undefined;
      return result;
    },
    {} as Record<string, boolean>
  );
}

/**
 * Wait for a service to become available
 *
 * @param serviceName Name of the service to wait for
 * @param timeout Maximum time to wait in milliseconds (default: 5000ms)
 * @param interval Check interval in milliseconds (default: 100ms)
 * @returns Promise that resolves with the service or rejects on timeout
 */
export function waitForService<T>(
  serviceName: keyof Window & string,
  timeout = 5000,
  interval = 100
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const startTime = Date.now();

    const checkService = () => {
      const service = window[serviceName] as unknown as T;

      if (service) {
        resolve(service);
        return;
      }

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime >= timeout) {
        reject(new ServiceNotAvailableError(serviceName));
        return;
      }

      setTimeout(checkService, interval);
    };

    checkService();
  });
}
