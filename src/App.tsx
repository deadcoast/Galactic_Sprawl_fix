import * as React from 'react';
import { lazy, useEffect, useState } from 'react';
import { SystemIntegration } from './components/core/SystemIntegration';
import { ThresholdIntegration } from './components/core/ThresholdIntegration';
import { defaultColony, defaultMothership } from './config/buildings/defaultBuildings';
import { defaultModuleConfigs } from './config/modules/defaultModuleConfigs';
import {
  createUpdateResourcesAction,
  GameAction,
  GameActionType,
  GameProvider,
  useGameDispatch,
} from './contexts/GameContext';
import { ModuleActionType, useModuleDispatch } from './contexts/ModuleContext';
import { assetManager } from './managers/game/assetManager';
import { ResourceManager } from './managers/game/ResourceManager';
// import { TechTreeManager } from './managers/game/techTreeManager';
import { TechNode } from './managers/game/techTreeManager';
import { getTechTreeManager } from './managers/ManagerRegistry';
import { moduleManager } from './managers/module/ModuleManager';
import { OfficerManager } from './managers/module/OfficerManager';
import { ShipHangarManager } from './managers/module/ShipHangarManager';
import { ModuleType } from './types/buildings/ModuleTypes';
import { ModuleStatus } from './types/modules/ModuleTypes';
import { ResourceType } from './types/resources/ResourceTypes';

// Import the GlobalErrorBoundary component
// Import error services
import {
  Box,
  CircularProgress,
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { ShipHangar } from './components/buildings/modules/hangar/ShipHangar';
import { IntegrationErrorHandler } from './components/core/IntegrationErrorHandler';
// Removed unused import: import ResourceVisualization from './components/ui/visualization/ResourceVisualization';
import { ServiceProvider as SystemIntegrationProvider } from './components/providers/ServiceProvider';
import { ThresholdIntegration as ThresholdIntegrationProvider } from './components/core/ThresholdIntegration';
import { useComponentProfiler } from './hooks/ui/useComponentProfiler';
import { getResourceManager } from './managers/ManagerRegistry';
import { initializeResourceIntegration } from './managers/resource/ResourceIntegration';
import { StandardShipHangarManager } from './managers/ships/ShipManager';
import ColonyManagementPage from './pages/ColonyManagementPage'; // Corrected name
import PerformanceAnalysisDashboard from './pages/PerformanceAnalysisDashboard'; // Corrected name
// import ExplorationMap from './pages/ExplorationMap'; // TEMP: File not found
// import FleetManagement from './pages/FleetManagement'; // TEMP: File not found
// import ResearchTree from './pages/ResearchTree'; // TEMP: File not found
import { errorLoggingService, ErrorSeverity, ErrorType } from './services/logging/ErrorLoggingService';
import { eventPropagationService } from './services/EventPropagationService';
import { recoveryService } from './services/RecoveryService';
import { darkTheme } from './ui/theme/darkTheme';
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
  const [initializationError, setInitializationError] = React.useState<Error | null>(null);

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
              [ResourceType.MINERALS]: 2000, // Use enum key
              [ResourceType.ENERGY]: 2000,    // Use enum key
              [ResourceType.RESEARCH]: 0,      // Use enum key
              [ResourceType.POPULATION]: 100,  // Use enum key
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
          const shipHangarManager = new StandardShipHangarManager(
            'hangar-main',
            20,
            getResourceManager(),
            officerManager
          );

          // Register the ship hangar manager with the global window object for development access
          if (process.env.NODE_ENV === 'development') {
            // Make manager available for debugging
            // Cast to unknown to resolve type mismatch for debug assignment
            (
              window as Window & typeof globalThis & { shipHangarManager: ShipHangarManager }
            ).shipHangarManager = shipHangarManager as unknown; // Reverted to unknown cast
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
              const { current } = resources;

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

          setInitializationError(error instanceof Error ? error : new Error(String(error)));
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
      <SystemIntegration>
        <IntegrationErrorHandler componentName="ThresholdIntegration">
          <ThresholdIntegration>
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
const GameLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  // Use component profiler to track performance
  const _profiler = useComponentProfiler('GameLayoutWrapper', {
    enabled: process.env.NODE_ENV === 'development',
    logToConsole: true,
    slowRenderThreshold: 16,
  });

  return (
    <GameLayout empireName="Stellar Dominion" bannerColor="#4FD1C5">
      {children}
    </GameLayout>
  );
};

// Initialization function
function initializeManagers(): void {
  try {
    errorLoggingService.logInfo('[App] Initializing configurations...', { componentName: 'App', action: 'initializeManagers' });
    errorLoggingService.logInfo('[App] Configurations initialized.', { componentName: 'App', action: 'initializeManagers' });

    errorLoggingService.logInfo('[App] Initializing managers...', { componentName: 'App', action: 'initializeManagers' });
    const resourceManager = getResourceManager();
    errorLoggingService.logInfo('[App] Managers initialized.', { componentName: 'App', action: 'initializeManagers' });

    errorLoggingService.logInfo('[App] Initializing resource integration...', { componentName: 'App', action: 'initializeManagers' });
    initializeResourceIntegration();
    errorLoggingService.logInfo('[App] Resource integration initialized.', { componentName: 'App', action: 'initializeManagers' });
  } catch (error) {
    errorLoggingService.logError(
      error instanceof Error ? error : new Error('Initialization failed'),
      ErrorType.INITIALIZATION,
      ErrorSeverity.CRITICAL,
      {
        componentName: 'App',
        action: 'initializeManagers',
      }
    );
    throw error;
  }
}

// Remove async, fix dispatch type
function loadGameData(dispatch: React.Dispatch<GameAction>): void {
  try {
    errorLoggingService.logInfo('[App] Loading game data...', { componentName: 'App', action: 'loadGameData' });
    dispatch(
      createUpdateResourcesAction({
        [ResourceType.MINERALS]: 5000,
        [ResourceType.ENERGY]: 10000,
        [ResourceType.POPULATION]: 50,
      })
    );
    errorLoggingService.logInfo('[App] Initial resources loaded.', { componentName: 'App', action: 'loadGameData' });

    // Placeholder for loading other data or adding initial ships

    errorLoggingService.logInfo('[App] Game data loaded.', { componentName: 'App', action: 'loadGameData' });
  } catch (error) {
    errorLoggingService.logError(
      error instanceof Error ? error : new Error('Game data loading failed'),
      ErrorType.RUNTIME,
      ErrorSeverity.HIGH,
      {
        componentName: 'App',
        action: 'loadGameData',
      }
    );
  }
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initApp = () => {
      try {
        initializeManagers();
        setIsInitialized(true);
        errorLoggingService.logInfo('[App] Initialization sequence complete.', { componentName: 'App', action: 'useEffect init' });
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error('App Initialization failed'),
          ErrorType.INITIALIZATION,
          ErrorSeverity.CRITICAL,
          {
            componentName: 'App',
            action: 'useEffect init',
          }
        );
      }
    };
    initApp();
  }, []);

  if (!isInitialized) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <CircularProgress />
        <Typography ml={2}>Initializing Galactic Sprawl...</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <GlobalStyles
        styles={
          {
            /* global styles here */
          }
        }
      />
      <GameProvider>
        <SystemIntegrationProvider>
          <ThresholdIntegrationProvider>
            <Router>
              <GameLayoutWrapper>
                <Suspense fallback={<CircularProgress />}>
                  <Routes>
                    <Route path="/dashboard" element={<PerformanceAnalysisDashboard />} />
                    <Route path="/colony" element={<ColonyManagementPage />} />
                    {/* <Route path="/map" element={<ExplorationMap />} /> */}
                    {/* <Route path="/fleet" element={<FleetManagement />} /> */}
                    {/* <Route path="/research" element={<ResearchTree />} /> */}
                    <Route path="/hangar" element={<ShipHangar hangarId="hangar-main" />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </GameLayoutWrapper>
            </Router>
          </ThresholdIntegrationProvider>
        </SystemIntegrationProvider>
      </GameProvider>
    </ThemeProvider>
  );
}

export default App;

// Resource Provider - Consider if this is needed if ResourceManager is a global singleton
interface ResourceProviderProps {
  children: React.ReactNode;
  /* resourceManager: ResourceManager; // Potentially remove prop */
}

const ResourceContext = React.createContext<ResourceManager | null>(null);

export const ResourceProvider: React.FC<ResourceProviderProps> = ({
  children,
  /* resourceManager */ // Removed prop
}) => {
  // Access the singleton instance directly
  const resourceManager = getResourceManager();
  return <ResourceContext.Provider value={resourceManager}>{children}</ResourceContext.Provider>;
};
