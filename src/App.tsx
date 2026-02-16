import * as React from 'react';
import { lazy, useEffect, useState } from 'react';
import { GameProvider } from './contexts/GameContext';
import { ResourceManager } from './managers/game/ResourceManager';
// import { TechTreeManager } from './managers/game/techTreeManager';

// Import the GlobalErrorBoundary component
// Import error services
import {
    Box,
    CircularProgress,
    CssBaseline,
    GlobalStyles,
    ThemeProvider,
    Typography
} from '@mui/material';
import { Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { ShipHangar } from './components/buildings/modules/hangar/ShipHangar';
// Removed unused import: import ResourceVisualization from './components/ui/visualization/ResourceVisualization';
import { ThresholdIntegration as ThresholdIntegrationProvider } from './components/core/ThresholdIntegration';
import { ServiceProvider as SystemIntegrationProvider } from './components/providers/ServiceProvider';
import { getResourceManager } from './managers/ManagerRegistry';
import { initializeResourceIntegration } from './managers/resource/ResourceIntegration';
import ColonyManagementPage from './pages/ColonyManagementPage'; // Corrected name
import PerformanceAnalysisDashboard from './pages/PerformanceAnalysisDashboard'; // Corrected name
// import ExplorationMap from './pages/ExplorationMap'; // TEMP: File not found
// import FleetManagement from './pages/FleetManagement'; // TEMP: File not found
// import ResearchTree from './pages/ResearchTree'; // TEMP: File not found
import { errorLoggingService, ErrorSeverity, ErrorType } from './services/logging/ErrorLoggingService';
import { darkTheme } from './ui/theme/darkTheme';

// Lazy load components that aren't needed on initial render
const GameLayout = lazy(() =>
  import('./components/ui/GameLayout').then(module => ({ default: module.GameLayout }))
);

// A wrapper for the GameLayout component to provide the required props
const GameLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
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
    getResourceManager();
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
        <Typography sx={{ ml: 2 }}>Initializing Galactic Sprawl...</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          /* Global application CSS */
        }}
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
