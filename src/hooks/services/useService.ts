import { useEffect, useState } from 'react';
import { BaseService } from '../../lib/services/BaseService';
import { ServiceRegistry } from '../../lib/services/ServiceRegistry';

/**
 * Hook for accessing services in UI components
 * @param serviceName The name of the service to access
 * @returns The service instance and loading/error states
 */
export function useService<T extends BaseService>(serviceName: string) {
  const [service, setService] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const registry = ServiceRegistry.getInstance();
        const instance = await registry.getService<T>(serviceName);

        if (mounted) {
          setService(instance);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadService().catch(err => {
      // Error is already handled inside loadService, but this prevents floating promise warning
      if (mounted) {
        setError(err as Error);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [serviceName]);

  return {
    service,
    isLoading,
    error,
    isReady: service?.isReady() ?? false,
  };
}
