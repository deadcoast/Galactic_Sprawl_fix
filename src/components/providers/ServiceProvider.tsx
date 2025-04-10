import * as React from 'react';
import { useEffect, useState } from 'react';
import { ServiceRegistry } from '../../lib/services/ServiceRegistry';
import { anomalyDetectionService } from '../../services/AnomalyDetectionService';
import { apiService } from '../../services/APIService';
import { componentRegistryService } from '../../services/ComponentRegistryService';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';
import { eventPropagationService } from '../../services/EventPropagationService';
import { realTimeDataService } from '../../services/RealTimeDataService';
import { recoveryService } from '../../services/RecoveryService';
import { webglService } from '../../services/WebGLService';
import { workerService } from '../../services/WorkerService';

interface ServiceProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that initializes and manages core services
 */
export function ServiceProvider({ children }: ServiceProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        const registry = ServiceRegistry.getInstance();

        // Register core services
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

        // Initialize all services
        await registry.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err as Error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      const registry = ServiceRegistry.getInstance();
      registry.dispose().catch(err => {
        errorLoggingService.logError(
          err instanceof Error ? err : new Error('Error disposing ServiceRegistry'),
          ErrorType.RUNTIME,
          ErrorSeverity.MEDIUM,
          { componentName: 'ServiceProvider', action: 'cleanupEffect' }
        );
      });
    };
  }, []);

  if (error) {
    // You might want to render a more user-friendly error screen
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-red-50">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-red-600">Service Initialization Error</h2>
          <p className="text-gray-700">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    // You might want to render a loading screen
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Initializing services...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
