import * as React from 'react';
import { lazy, useEffect, useState } from 'react';
import { GameProvider } from './contexts/GameContext';
import { ModuleProvider } from './contexts/ModuleContext';
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
// Removed unused import: import ResourceVisualization from './components/ui/visualization/ResourceVisualization';
import { ThresholdIntegration } from './components/core/ThresholdIntegration';
import { ThresholdProvider } from './contexts/ThresholdContext';
import { ServiceProvider as SystemIntegrationProvider } from './components/providers/ServiceProvider';
import { getResourceManager } from './managers/ManagerRegistry';
import { initializeResourceIntegration } from './managers/resource/ResourceIntegration';
import { errorLoggingService, ErrorSeverity, ErrorType } from './services/logging/ErrorLoggingService';
import { darkTheme } from './ui/theme/darkTheme';

// Global error boundary to catch runtime crashes and display them
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 32,
            color: 'var(--gs-text-1)',
            background: 'var(--gs-bg)',
            minHeight: '100vh',
            fontFamily: 'Inter, SF Pro Text, Segoe UI, sans-serif',
          }}
        >
          <h1 style={{ color: 'var(--gs-danger)', marginTop: 0 }}>Runtime Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--gs-text-2)' }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--gs-text-3)', fontSize: 12 }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load components that aren't needed on initial render
const GameLayout = lazy(() =>
  import('./components/ui/GameLayout').then(module => ({ default: module.GameLayout }))
);
const PerformanceAnalysisDashboard = lazy(() => import('./pages/PerformanceAnalysisDashboard'));
const ColonyManagementPage = lazy(() => import('./pages/ColonyManagementPage'));
const ExplorationMap = lazy(() => import('./pages/ExplorationMap'));
const FleetManagement = lazy(() => import('./pages/FleetManagement'));
const ResearchTree = lazy(() => import('./pages/ResearchTree'));
const ShipHangar = lazy(() =>
  import('./components/buildings/modules/hangar/ShipHangar').then(module => ({
    default: module.ShipHangar,
  }))
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
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
          bgcolor: 'var(--gs-bg)',
          color: 'var(--gs-text-2)',
        }}
      >
        <CircularProgress size={26} />
        <Typography sx={{ color: 'var(--gs-text-2)' }}>Initializing Galactic Sprawl...</Typography>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            /* Global application CSS */
          }}
        />
        <GameProvider>
          <ModuleProvider>
            <SystemIntegrationProvider>
              <ThresholdProvider>
                <ThresholdIntegration>
                  <Router>
                    <Suspense fallback={
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '100vh',
                          gap: 2,
                          bgcolor: 'var(--gs-bg)',
                        }}
                      >
                        <CircularProgress size={26} />
                        <Typography sx={{ color: 'var(--gs-text-2)' }}>Loading game...</Typography>
                      </Box>
                    }>
                      <GameLayoutWrapper>
                        <Routes>
                          <Route path="/dashboard" element={<PerformanceAnalysisDashboard />} />
                          <Route path="/colony" element={<ColonyManagementPage />} />
                          <Route path="/map" element={<ExplorationMap />} />
                          <Route path="/fleet" element={<FleetManagement />} />
                          <Route path="/research" element={<ResearchTree />} />
                          <Route path="/hangar" element={<ShipHangar hangarId="hangar-main" />} />
                          <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                      </GameLayoutWrapper>
                    </Suspense>
                  </Router>
                </ThresholdIntegration>
              </ThresholdProvider>
            </SystemIntegrationProvider>
          </ModuleProvider>
        </GameProvider>
      </ThemeProvider>
    </ErrorBoundary>
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
