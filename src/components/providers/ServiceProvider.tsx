import * as React from 'react';
import { useEffect, useState } from 'react';
import { ServiceRegistry } from '../../lib/services/ServiceRegistry';
import { anomalyDetectionService } from '../../services/AnomalyDetectionService';
import { apiService } from '../../services/APIService';
import { componentRegistryService } from '../../services/ComponentRegistryService';
import { eventPropagationService } from '../../services/EventPropagationService';
import
  {
    errorLoggingService,
    ErrorSeverity,
    ErrorType,
  } from '../../services/logging/ErrorLoggingService';
import { realTimeDataService } from '../../services/RealTimeDataService';
import { recoveryService } from '../../services/RecoveryService';
import { webglService } from '../../services/WebGLService';
import { workerService } from '../../services/WorkerService';

interface ServiceProviderProps {
  children: React.ReactNode;
}

let registryInitializationPromise: Promise<void> | null = null;

function registerCoreServices(registry: ServiceRegistry): void {
  registry.register('errorLogging', () => errorLoggingService, {
    priority: 100, // High priority as other services depend on it
  });

  registry.register('recovery', () => recoveryService, {
    dependencies: ['errorLogging'],
    priority: 90,
  });

  registry.register('componentRegistry', () => componentRegistryService, {
    dependencies: ['errorLogging'],
    priority: 80,
  });

  registry.register('eventPropagation', () => eventPropagationService, {
    dependencies: ['errorLogging', 'componentRegistry'],
    priority: 70,
  });

  registry.register('anomalyDetection', () => anomalyDetectionService, {
    dependencies: ['errorLogging'],
    priority: 60,
  });

  registry.register('worker', () => workerService, {
    dependencies: ['errorLogging'],
    priority: 50,
  });

  registry.register('api', () => apiService, {
    dependencies: ['errorLogging'],
    priority: 40,
  });

  registry.register('webgl', () => webglService, {
    dependencies: ['errorLogging'],
    priority: 30,
  });

  registry.register('realTimeData', () => realTimeDataService, {
    dependencies: ['errorLogging', 'api'],
    priority: 20,
  });
}

async function initializeRegistryOnce(): Promise<void> {
  if (!registryInitializationPromise) {
    const registry = ServiceRegistry.getInstance();
    registerCoreServices(registry);
    registryInitializationPromise = registry.initialize().catch(error => {
      registryInitializationPromise = null;
      throw error;
    });
  }

  await registryInitializationPromise;
}

/**
 * Provider component that initializes and manages core services
 */
export function ServiceProvider({ children }: ServiceProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let disposed = false;

    const initializeServices = async () => {
      try {
        await initializeRegistryOnce();
        if (!disposed) {
          setIsInitialized(true);
        }
      } catch (err) {
        if (!disposed) {
          setError(err as Error);
        }
      }
    };

    void initializeServices();

    // Cleanup on unmount
    return () => {
      disposed = true;

      // StrictMode intentionally double-invokes effects in dev.
      // Skipping disposal here avoids init/dispose races that surface as false circular dependencies.
      if (import.meta.env.DEV) {
        return;
      }

      const registry = ServiceRegistry.getInstance();
      void registry.dispose().catch(err => {
        errorLoggingService.logError(
          err instanceof Error ? err : new Error('Error disposing ServiceRegistry'),
          ErrorType.RUNTIME,
          ErrorSeverity.MEDIUM,
          { componentName: 'ServiceProvider', action: 'cleanupEffect' }
        );
      }).finally(() => {
        registryInitializationPromise = null;
      });
    };
  }, [retryToken]);

  const handleRetry = () => {
    setError(null);
    setIsInitialized(false);

    const registry = ServiceRegistry.getInstance();
    void registry
      .dispose()
      .catch(err => {
        errorLoggingService.logError(
          err instanceof Error ? err : new Error('Error disposing ServiceRegistry during retry'),
          ErrorType.RUNTIME,
          ErrorSeverity.LOW,
          { componentName: 'ServiceProvider', action: 'handleRetry' }
        );
      })
      .finally(() => {
        registryInitializationPromise = null;
        setRetryToken(prev => prev + 1);
      });
  };

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--gs-bg)] p-6">
        <div className="w-full max-w-2xl rounded-lg border border-[var(--gs-border)] bg-[rgba(20,38,65,0.95)] p-6 shadow-[0_16px_32px_rgba(2,10,24,0.35)]">
          <h2 className="mb-3 text-xl font-bold text-red-400">Service Initialization Error</h2>
          <p className="text-[var(--gs-text-2)]">{error.message}</p>
          <div className="mt-5">
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-md border border-blue-500/70 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Retry Initialization
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--gs-bg)]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-[var(--gs-text-2)]">Initializing services...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
