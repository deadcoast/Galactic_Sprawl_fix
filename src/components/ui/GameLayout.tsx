import { Database, Map, Menu, Radar, Ship, Users } from 'lucide-react';
import React from 'react';
import { GalaxyMap } from './GalaxyMap';
import { GameHUD } from './GameHUD';

interface GameLayoutProps {
  empireName: string;
  bannerColor: string;
  children: React.ReactNode;
}

export function GameLayout({ empireName, bannerColor, children }: GameLayoutProps) {
  const [showSprawlView, setShowSprawlView] = React.useState(false);
  const [showVPRView, setShowVPRView] = React.useState(false);
  const [showGalaxyMap, setShowGalaxyMap] = React.useState(false);

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        setShowGalaxyMap(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-white">
      {/* Sidebar Navigation */}
      <div className="flex w-16 flex-col items-center space-y-6 border-r border-gray-700 bg-gray-800 py-4">
        <Menu className="h-6 w-6 cursor-pointer text-gray-400 hover:text-white" />
        <div className="h-8 w-8 rounded-full" style={{ backgroundColor: bannerColor }} />
        <div className="flex flex-1 flex-col space-y-6">
          <button
            onClick={() => setShowGalaxyMap(prev => !prev)}
            className="rounded-lg p-2 transition-colors hover:bg-gray-700"
          >
            <Map className="h-6 w-6" />
          </button>
          <button className="rounded-lg p-2 transition-colors hover:bg-gray-700">
            <Radar className="h-6 w-6" />
          </button>
          <button className="rounded-lg p-2 transition-colors hover:bg-gray-700">
            <Ship className="h-6 w-6" />
          </button>
          <button className="rounded-lg p-2 transition-colors hover:bg-gray-700">
            <Users className="h-6 w-6" />
          </button>
          <button className="rounded-lg p-2 transition-colors hover:bg-gray-700">
            <Database className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col">
        {/* Top Bar */}
        <div className="flex h-16 items-center justify-between border-b border-gray-700 bg-gray-800/90 px-6 backdrop-blur-sm">
          <h1 className="text-xl font-bold">{empireName}</h1>
          <div className="flex items-center space-x-4">
            <div className="rounded-lg bg-gray-700 px-4 py-2">
              <span className="text-sm text-gray-300">Population:</span>
              <span className="ml-2 font-medium">1,000</span>
            </div>
            <div className="rounded-lg bg-gray-700 px-4 py-2">
              <span className="text-sm text-gray-300">Systems:</span>
              <span className="ml-2 font-medium">1/50</span>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="relative flex-1">
          <GameHUD
            empireName={empireName}
            onToggleSprawlView={() => {
              setShowSprawlView(!showSprawlView);
              setShowVPRView(false);
            }}
            onToggleVPRView={() => {
              setShowVPRView(!showVPRView);
              setShowSprawlView(false);
            }}
          />
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              showSprawlView ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {children}
          </div>

          {/* Galaxy Map */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              showGalaxyMap ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <GalaxyMap />
          </div>
        </div>
      </div>
    </div>
  );
}
