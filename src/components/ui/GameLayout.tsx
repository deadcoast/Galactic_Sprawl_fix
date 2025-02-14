import { GalaxyMap } from './GalaxyMap';
import { GameHUD } from './GameHUD';
import { Database, Map, Menu, Radar, Ship, Users } from 'lucide-react';
import React from 'react';

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
    <div className="h-screen bg-gray-900 text-white flex overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-6">
        <Menu className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: bannerColor }} />
        <div className="flex-1 flex flex-col space-y-6">
          <button
            onClick={() => setShowGalaxyMap(prev => !prev)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Map className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Radar className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Ship className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Users className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Database className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <div className="h-16 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">{empireName}</h1>
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-300">Population:</span>
              <span className="ml-2 font-medium">1,000</span>
            </div>
            <div className="px-4 py-2 bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-300">Systems:</span>
              <span className="ml-2 font-medium">1/50</span>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 relative">
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
              showSprawlView ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {children}
          </div>

          {/* Galaxy Map */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              showGalaxyMap ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            <GalaxyMap />
          </div>
        </div>
      </div>
    </div>
  );
}
