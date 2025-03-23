import * as React from 'react';
import { lazy, Suspense, useEffect } from 'react';
import { SystemIntegration } from './components/core/SystemIntegration';
import { ThresholdIntegration } from './components/core/ThresholdIntegration';
import { GameStateMonitor } from './components/debug/GameStateMonitor';
import { TooltipProvider } from './components/ui/TooltipProvider';
import { defaultColony, defaultMothership } from './config/buildings/defaultBuildings';
import { defaultModuleConfigs } from './config/modules/defaultModuleConfigs';
import { GameActionType, GameProvider, useGameDispatch } from './contexts/GameContext';
import { ModuleActionType, ModuleProvider, useModuleDispatch } from './contexts/ModuleContext';
import { ResourceRatesProvider } from './contexts/ResourceRatesContext';
import { ThresholdProvider } from './contexts/ThresholdContext';
import { assetManager } from './managers/game/assetManager';
import { ResourceManager } from './managers/game/ResourceManager';
// import { TechTreeManager } from './managers/game/techTreeManager';
import { moduleManager } from './managers/module/ModuleManager';
import { OfficerManager } from './managers/module/OfficerManager';
import { ShipHangarManager } from './managers/module/ShipHangarManager';
import { ModuleType } from './types/buildings/ModuleTypes';
import { ModuleStatus } from './types/modules/ModuleTypes';
import { ResourceType } from './types/resources/ResourceTypes';
import { getTechTreeManager } from './managers/ManagerRegistry';
import { TechNode } from './managers/game/techTreeManager';
import { Profiler } from 'react';

// Import the GlobalErrorBoundary component
import { GlobalErrorBoundary } from './components/ui/GlobalErrorBoundary';
// Import error services
import { IntegrationErrorHandler } from './components/core/IntegrationErrorHandler';
import ResourceVisualization from './components/ui/ResourceVisualization';
import { useComponentProfiler } from './hooks/ui/useComponentProfiler';
import { useProfilingOverlay } from './hooks/ui/useProfilingOverlay';
import { errorLoggingService, ErrorSeverity, ErrorType } from './services/ErrorLoggingService';
import { eventPropagationService } from './services/EventPropagationService';
import { recoveryService } from './services/RecoveryService';
import { BaseEvent } from './types/events/EventTypes';

// Lazy load components that aren't needed on initial render
const GameLayout = lazy(() =>
  import('./components/ui/GameLayout').then(module => ({ default: module.GameLayout }))
);

// Loading component
const LoadingComponent = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white">
    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    <h2 className="mb-2 text-xl font-medium">Loading Game Components...</h2>
    <p className="text-gray-400">Preparing your galactic adventure</p>
  </div>
);

// Initial tech tree setup
const initialTechs: TechNode[] = [
  {
    id: 'basic-ship-hangar',
    name: 'Basic Ship Hangar',
    description: 'Enables basic ship construction',
    type: 'hangar',
    tier: 1 as const,
    requirements: [],
    unlocked: true,
    category: 'infrastructure',
  },
  {
    id: 'basic-weapons',
    name: 'Basic Weapons',
    description: 'Enables basic weapon systems',
    type: 'weapons',
    tier: 1 as const,
    requirements: ['basic-ship-hangar'],
    unlocked: false,
    category: 'weapons',
  },
  {
    id: 'basic-sensors',
    name: 'Basic Sensors',
    description: 'Enables basic scanning capabilities',
    type: 'recon',
    tier: 1 as const,
    requirements: ['basic-ship-hangar'],
    unlocked: false,
    category: 'reconFleet',
  },
];

interface ResourceEvent extends BaseEvent {
  moduleId: string;
  data: {
    resources: {
      current: number;
      [key: string]: unknown;
    };
  };
}

interface ThresholdEvent extends BaseEvent {
  resourceId: ResourceType;
  details: {
    type: 'below_minimum' | 'above_maximum';
    current: number;
    min?: number;
    max?: number;
  };
}

// GameInitializer component to handle game initialization
const GameInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useGameDispatch();
  const [isInitialized, setIsInitialized] = React.useState(false);
  const moduleDispatch = useModuleDispatch();
  const [resourceManagerInstance] = React.useState(() => new ResourceManager());

  useEffect(() => {
    const initializeGame = async () => {
      if (!isInitialized) {
        console.warn('Starting game initialization...');
        try {
          // Initialize resource manager
          console.warn('Initializing resource manager...');
          // ResourceManager is already initialized via useState

          // Register module configurations
          console.warn('Registering module configurations...');
          if (defaultModuleConfigs) {
            Object.values(defaultModuleConfigs).forEach(config => {
              if (config) {
                console.warn(`Registering module config: ${config.type}`);
                moduleManager.registerModuleConfig(config);
              }
            });
          } else {
            console.warn('defaultModuleConfigs is null or undefined');
          }

          // Register default buildings
          console.warn('Registering default buildings...');
          if (defaultMothership) {
            console.warn(`Registering mothership: ${defaultMothership.id}`);
            moduleManager.registerBuilding(defaultMothership);

            // Also register the building with the ModuleContext
            moduleDispatch({
              type: ModuleActionType.ADD_MODULE,
              payload: {
                module: {
                  ...defaultMothership,
                  name: 'Mothership',
                  position: { x: 0, y: 0 },
                  isActive: true,
                  status: ModuleStatus.ACTIVE,
                  type: 'resource-manager' as ModuleType,
                },
              },
            });
          }

          if (defaultColony) {
            console.warn(`Registering colony: ${defaultColony.id}`);
            moduleManager.registerBuilding(defaultColony);

            // Also register the building with the ModuleContext
            moduleDispatch({
              type: ModuleActionType.ADD_MODULE,
              payload: {
                module: {
                  ...defaultColony,
                  name: 'Colony',
                  position: { x: 0, y: 0 },
                  isActive: true,
                  status: ModuleStatus.ACTIVE,
                  type: 'resource-manager' as ModuleType,
                },
              },
            });
          }

          // Initialize asset manager
          console.warn('Initializing asset manager...');
          await assetManager.initialize();

          // Register initial technologies
          console.warn('Registering initial technologies...');
          if (initialTechs) {
            initialTechs.forEach(tech => {
              if (tech) {
                console.warn(`Registering tech: ${tech.id}`);
                getTechTreeManager().registerNode(tech);
              }
            });
          } else {
            console.warn('initialTechs is null or undefined');
          }

          // Add initial resources
          console.warn('Adding initial resources...');
          dispatch({
            type: GameActionType.UPDATE_RESOURCES,
            payload: {
              minerals: 2000, // Increased initial resources to allow for early module building
              energy: 2000,
              research: 0,
              population: 100,
            },
          });

          // Update systems count
          console.warn('Updating system counts...');
          dispatch({
            type: GameActionType.UPDATE_SYSTEMS,
            payload: {
              total: 1,
              colonized: 1,
              explored: 1,
            },
          });

          // Initialize the officer manager
          console.warn('Initializing officer manager...');
          const officerManager = new OfficerManager();

          // Initialize the ship hangar manager
          console.warn('Initializing ship hangar manager...');
          const shipHangarManager = new ShipHangarManager(resourceManagerInstance, officerManager);

          // Register the ship hangar manager with the global window object for development access
          if (process.env.NODE_ENV === 'development') {
            // Make manager available for debugging
            (
              window as Window & typeof globalThis & { shipHangarManager: ShipHangarManager }
            ).shipHangarManager = shipHangarManager;
          }

          // Initialize event propagation service
          console.warn('Initializing event propagation service...');

          // Register event mappings
          eventPropagationService.subscribe({
            eventType: 'RESOURCE_UPDATED',
            priority: 1,
            callback: (eventData: unknown) => {
              const event = eventData as ResourceEvent;
              const resources = event?.data?.resources;
              const {current} = resources;

              return {
                resourceId: event?.moduleId,
                details: {
                  current,
                  type: 'below_minimum',
                },
                timestamp: Date.now(),
              };
            },
          });

          // Register threshold to module mappings
          eventPropagationService.subscribe({
            eventType: 'THRESHOLD_VIOLATED',
            priority: 1,
            callback: (eventData: unknown) => {
              const event = eventData as ThresholdEvent;
              return {
                moduleId: 'threshold-service',
                moduleType: 'resource' as ModuleType,
                timestamp: Date.now(),
                data: {
                  resourceType: event?.resourceId,
                  thresholdType: event?.details.type === 'below_minimum' ? 'min' : 'max',
                  current: event?.details.current,
                  threshold:
                    event?.details.type === 'below_minimum'
                      ? event?.details.min
                      : event?.details.max,
                },
              };
            },
          });

          // Initialize the service
          eventPropagationService.initialize();

          // Set initialization flag
          console.warn('Game initialization complete!');

          // Log the current state of the module manager
          console.warn('Module manager state:', {
            buildings: moduleManager.getBuildings(),
            modules: moduleManager.getActiveModules(),
            configs: 'Module configurations registered',
          });

          setIsInitialized(true);
        } catch (error) {
          console.error('Error during game initialization:', error);
          errorLoggingService.logError(
            error instanceof Error ? error : new Error(String(error)),
            ErrorType.INITIALIZATION,
            ErrorSeverity.HIGH,
            {
              action: 'initialization',
            }
          );

          // Attempt recovery
          const snapshot = {
            gameState: 'error',
            error: error instanceof Error ? error.message : String(error),
          };
          recoveryService.createSnapshot(snapshot, { reason: 'Error during initialization' });
        }
      }
    };

    initializeGame();
  }, [dispatch, isInitialized, moduleDispatch]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <h2 className="mb-2 text-xl font-medium">Initializing Game Systems...</h2>
        <p className="text-gray-400">Preparing galaxy for exploration</p>
      </div>
    );
  }

  return (
    <IntegrationErrorHandler componentName="SystemIntegration">
      <SystemIntegration resourceManager={resourceManagerInstance}>
        <IntegrationErrorHandler componentName="ThresholdIntegration">
          <ThresholdIntegration resourceManager={resourceManagerInstance}>
            {children}
          </ThresholdIntegration>
        </IntegrationErrorHandler>
      </SystemIntegration>
    </IntegrationErrorHandler>
  );
};

// Handler for global errors
const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
  // Log the error using our error logging service
  errorLoggingService.logError(error, ErrorType.RUNTIME, ErrorSeverity.HIGH, {
    componentName: 'GlobalErrorBoundary',
    errorInfo,
  });

  // Log to console for development purposes
  console.error('Global error caught:', error, errorInfo);
};

// A wrapper for the GameLayout component to provide the required props
const GameLayoutWrapper = () => {
  // Use component profiler to track performance
  const profiler = useComponentProfiler('GameLayoutWrapper', {
    enabled: process.env.NODE_ENV === 'development',
    logToConsole: true,
    slowRenderThreshold: 16
  });

  return (
    <GameLayout empireName="Stellar Dominion" bannerColor="#4FD1C5">
      <div className="min-h-screen bg-gray-900">
        <ResourceVisualization type={ResourceType.ENERGY} value={100} />
      </div>
    </GameLayout>
  );
};

export default function App() {
  // Enable app-level profiling with React Profiler API
  const profilerRef = React.createRef<typeof Profiler>();
  
  // Set up callback for the React Profiler
  const handleProfilerRender = (
    id: string,
    phase: string,
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[Profiler] ${id} ${phase}: actual=${actualDuration.toFixed(2)}ms, ` +
        `base=${baseDuration.toFixed(2)}ms, at ${new Date(commitTime).toLocaleTimeString()}`
      );
    }
  };

  // Show profiling overlay in development
  useProfilingOverlay({
    enabledByDefault: process.env.NODE_ENV === 'development',
    enableInProduction: false,
    toggleKey: 'p',
    persistState: true,
  });

  // Make the ResourceManager accessible in development
  const [resourceManager] = React.useState(() => new ResourceManager());

  if (process.env.NODE_ENV === 'development') {
    // Make ResourceManager available for debugging
    (window as Window & typeof globalThis & { resourceManager: ResourceManager }).resourceManager =
      resourceManager;
  }

  // Development mode debug tools
  const showDebugTools = process.env.NODE_ENV === 'development';

  return (
    <div className="app-container">
      <Profiler id="GalacticSprawl-App" onRender={handleProfilerRender}>
        <GlobalErrorBoundary onError={handleGlobalError}>
          <GameProvider>
            <ModuleProvider>
              <ResourceRatesProvider>
                <ThresholdProvider>
                  <TooltipProvider>
                    <GameInitializer>
                      <Suspense fallback={<LoadingComponent />}>
                        <GameLayoutWrapper />
                        {showDebugTools && <GameStateMonitor expanded={false} />}
                      </Suspense>
                    </GameInitializer>
                  </TooltipProvider>
                </ThresholdProvider>
              </ResourceRatesProvider>
            </ModuleProvider>
          </GameProvider>
        </GlobalErrorBoundary>
      </Profiler>
    </div>
  );
}
