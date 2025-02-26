import { TooltipProvider } from './components/ui/TooltipProvider';
import { ResourceManager } from './managers/game/ResourceManager';
import { techTreeManager, TechNode } from './managers/game/techTreeManager';
import { OfficerManager } from './managers/module/OfficerManager';
import { ShipHangarManager } from './managers/module/ShipHangarManager';
import { useEffect, useState } from 'react';

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

export function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [resourceManager] = useState(() => new ResourceManager());
  const [officerManager] = useState(() => new OfficerManager());
  const [shipHangarManager] = useState(() => new ShipHangarManager(resourceManager, officerManager));

  useEffect(() => {
    // Initialize game state
    const initGame = async () => {
      try {
        // Register initial technologies
        initialTechs.forEach(tech => {
          techTreeManager.registerNode(tech);
        });
        
        // Add some initial resources
        resourceManager.addResource('minerals', 1000);
        resourceManager.addResource('energy', 1000);
        resourceManager.addResource('plasma', 500);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    };

    initGame();
  }, [resourceManager]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-teal-500 text-xl">Initializing game...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-900">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl text-teal-500 mb-4">Mothership Control</h1>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-teal-400 mb-4">
              Resources:
              <div className="grid grid-cols-3 gap-4">
                <div>Minerals: 1000</div>
                <div>Energy: 1000</div>
                <div>Plasma: 500</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded">
                Build Ship Hangar
              </button>
              <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded">
                Build Colony Star Station
              </button>
              <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded">
                Build Radar
              </button>
              <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded">
                Build Officer Academy
              </button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
