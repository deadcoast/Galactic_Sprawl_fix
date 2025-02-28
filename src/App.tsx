import { useEffect, useState } from 'react';
import { GameLayout } from './components/ui/GameLayout';
import { TooltipProvider } from './components/ui/TooltipProvider';
import { defaultColony, defaultMothership } from './config/buildings/defaultBuildings';
import { defaultModuleConfigs } from './config/modules/defaultModuleConfigs';
import { GameProvider, useGame } from './contexts/GameContext';
import { ModuleProvider } from './contexts/ModuleContext';
import { ThresholdProvider } from './contexts/ThresholdContext';
import { assetManager } from './managers/game/assetManager';
import { gameManager } from './managers/game/gameManager';
import { ResourceManager } from './managers/game/ResourceManager';
import { TechNode, techTreeManager } from './managers/game/techTreeManager';
import { moduleManager } from './managers/module/ModuleManager';
import { OfficerManager } from './managers/module/OfficerManager';
import { ShipHangarManager } from './managers/module/ShipHangarManager';

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

const GameInitializer = ({ children }: { children: React.ReactNode }) => {
  const gameContext = useGame();

  // Ensure context is available
  if (!gameContext) {
    return null;
  }

  const { dispatch } = gameContext;
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [resourceManager] = useState(() => new ResourceManager());
  const [officerManager] = useState(() => new OfficerManager());
  const [shipHangarManager] = useState(
    () => new ShipHangarManager(resourceManager, officerManager)
  );

  useEffect(() => {
    const initializeGame = async () => {
      try {
        console.log('Initializing game systems...');

        // Register module configurations
        console.log('Registering module configurations...');
        Object.values(defaultModuleConfigs).forEach(config => {
          moduleManager.registerModuleConfig(config);
        });

        // Register default buildings
        console.log('Registering default buildings...');
        moduleManager.registerBuilding(defaultMothership);
        moduleManager.registerBuilding(defaultColony);

        // Initialize asset manager
        console.log('Initializing asset manager...');
        await assetManager.initialize();

        // Register initial technologies
        console.log('Registering initial technologies...');
        initialTechs.forEach(tech => {
          techTreeManager.registerNode(tech);
        });

        // Add initial resources
        console.log('Adding initial resources...');
        dispatch({
          type: 'UPDATE_RESOURCES',
          resources: {
            minerals: 2000, // Increased initial resources to allow for early module building
            energy: 2000,
            research: 0,
            population: 100,
          },
        });

        // Update systems count
        console.log('Updating system counts...');
        dispatch({
          type: 'UPDATE_SYSTEMS',
          systems: {
            total: 1,
            colonized: 1,
            explored: 1,
          },
        });

        // Start the game
        console.log('Starting game loop...');
        dispatch({ type: 'START_GAME' });
        gameManager.start();

        console.log('Game initialization complete');
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to initialize game');
      }
    };

    initializeGame();

    // Cleanup function
    return () => {
      gameManager.stop();
      assetManager.destroy();
    };
  }, [dispatch]);

  if (loadingError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#ff4444',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h2>Failed to Initialize Game</h2>
        <p>{loadingError}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            marginTop: '20px',
            background: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#fff',
          background: '#111',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h2>Initializing game...</h2>
        <p>Loading assets and preparing game systems</p>
      </div>
    );
  }

  return children;
};

export default function App() {
  return (
    <GameProvider>
      <ThresholdProvider>
        <ModuleProvider>
          <TooltipProvider>
            <GameInitializer>
              <GameLayout empireName="Stellar Dominion" bannerColor="#4FD1C5">
                <div className="min-h-screen bg-gray-900">
                  <div className="flex h-full flex-col items-center justify-center">
                    <h1 className="mb-4 text-2xl text-blue-500">Mothership Control</h1>
                    <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
                      <div className="mb-4 text-blue-400">
                        Resources:
                        <div className="grid grid-cols-3 gap-4">
                          <div>Minerals: 2000</div>
                          <div>Energy: 2000</div>
                          <div>Population: 100</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GameLayout>
            </GameInitializer>
          </TooltipProvider>
        </ModuleProvider>
      </ThresholdProvider>
    </GameProvider>
  );
}
