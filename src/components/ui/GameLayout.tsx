import { Beaker, Database, Map, Menu, Radar, Ship, Users, Wrench } from 'lucide-react';
import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameState } from '../../contexts/GameContext';
import { useComponentProfiler } from '../../hooks/ui/useComponentProfiler';
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
  const state = useGameState(state => state);
  const navigate = useNavigate();
  const location = useLocation();
  const showHud =
    location.pathname === '/map' ||
    location.pathname === '/colony' ||
    location.pathname === '/hangar';

  // Add component profiling to monitor performance
  const profiler = useComponentProfiler('GameLayout', {
    enabled: true,
    slowRenderThreshold: 16, // 1 frame at 60fps
    trackPropChanges: true,
  });

  // Log when component renders
  console.warn('GameLayout rendering', { showSprawlView, showVPRView, showGalaxyMap });

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        console.warn('M key pressed - toggling galaxy map');
        setShowGalaxyMap(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Handle view toggles with proper console logging for debugging
  const handleToggleSprawlView = () => {
    console.warn('Toggling sprawl view');
    setShowSprawlView(prev => {
      const newValue = !prev;
      console.warn(`Sprawl view is now ${newValue ? 'visible' : 'hidden'}`);
      return newValue;
    });

    // If showing sprawl view, hide other views
    if (!showSprawlView) {
      setShowVPRView(false);
      setShowGalaxyMap(false);
    }
  };

  const handleToggleVPRView = () => {
    console.warn('Toggling VPR view');
    setShowVPRView(prev => {
      const newValue = !prev;
      console.warn(`VPR view is now ${newValue ? 'visible' : 'hidden'}`);
      return newValue;
    });

    // If showing VPR view, hide other views
    if (!showVPRView) {
      setShowSprawlView(false);
      setShowGalaxyMap(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      {/* Sidebar Navigation */}
      <div className="flex w-16 flex-col items-center space-y-6 border-r border-gray-700 bg-gray-800 py-4">
        <Menu className="h-6 w-6 cursor-pointer text-gray-400 hover:text-white" />
        <div className="h-8 w-8 rounded-full" style={{ backgroundColor: bannerColor }} />
        <div className="flex flex-1 flex-col space-y-6">
          <button
            onClick={() => navigate('/map')}
            className={`rounded-lg p-2 transition-colors hover:bg-gray-700 ${location.pathname === '/map' ? 'bg-gray-700 text-cyan-400' : ''}`}
            title="Exploration Map"
          >
            <Map className="h-6 w-6" />
          </button>
          <button
            onClick={() => navigate('/fleet')}
            className={`rounded-lg p-2 transition-colors hover:bg-gray-700 ${location.pathname === '/fleet' ? 'bg-gray-700 text-cyan-400' : ''}`}
            title="Fleet Management"
          >
            <Radar className="h-6 w-6" />
          </button>
          <button
            onClick={() => navigate('/hangar')}
            className={`rounded-lg p-2 transition-colors hover:bg-gray-700 ${location.pathname === '/hangar' ? 'bg-gray-700 text-cyan-400' : ''}`}
            title="Ship Hangar"
          >
            <Ship className="h-6 w-6" />
          </button>
          <button
            onClick={() => navigate('/colony')}
            className={`rounded-lg p-2 transition-colors hover:bg-gray-700 ${location.pathname === '/colony' ? 'bg-gray-700 text-cyan-400' : ''}`}
            title="Colony Management"
          >
            <Users className="h-6 w-6" />
          </button>
          <button
            onClick={() => navigate('/research')}
            className={`rounded-lg p-2 transition-colors hover:bg-gray-700 ${location.pathname === '/research' ? 'bg-gray-700 text-cyan-400' : ''}`}
            title="Research Tree"
          >
            <Beaker className="h-6 w-6" />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className={`rounded-lg p-2 transition-colors hover:bg-gray-700 ${location.pathname === '/dashboard' ? 'bg-gray-700 text-cyan-400' : ''}`}
            title="Dashboard"
          >
            <Database className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col">
        {/* Top Bar with performance metrics */}
        <div className="flex h-16 items-center justify-between border-b border-gray-700 bg-gray-800/90 px-6 backdrop-blur-sm">
          <h1 className="text-xl font-bold">{empireName}</h1>
          <div className="flex items-center space-x-4">
            <div className="rounded-lg bg-gray-700 px-4 py-2">
              <span className="text-sm text-gray-300">Population:</span>
              <span className="ml-2 font-medium">
                {(state.resources?.POPULATION ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="rounded-lg bg-gray-700 px-4 py-2">
              <span className="text-sm text-gray-300">Systems:</span>
              <span className="ml-2 font-medium">
                {state.systems?.explored ?? 0}/{state.systems?.total ?? 0}
              </span>
            </div>
            {/* Add performance indicator */}
            <div className="rounded-lg bg-gray-700 px-4 py-2">
              <span className="text-sm text-gray-300">Render:</span>
              <span
                className={`ml-2 font-medium ${(profiler.metrics?.lastRenderTime ?? 0) > 16 ? 'text-yellow-400' : 'text-green-400'}`}
              >
                {(profiler.metrics?.lastRenderTime ?? 0).toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="relative flex-1 overflow-auto">
          {/* Game HUD is only shown on gameplay routes to avoid overlaying analysis/management pages */}
          {showHud && (
            <GameHUD
              empireName={empireName}
              onToggleSprawlView={handleToggleSprawlView}
              onToggleVPRView={handleToggleVPRView}
            />
          )}

          {/* Main Route Content — always visible */}
          <div className="h-full w-full">
            {children}
          </div>

          {/* Sprawl View — overlay panel */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              showSprawlView
                ? 'pointer-events-auto z-10 opacity-100'
                : 'pointer-events-none z-0 opacity-0'
            }`}
          >
            <div className="flex h-full w-full flex-col items-center justify-center bg-gray-800 p-4">
              <h2 className="mb-4 text-2xl font-bold text-white">Sprawl View</h2>
              <p className="text-center text-gray-300">
                Manage your mining operations and resource extraction.
              </p>
            </div>
          </div>

          {/* VPR View — overlay panel */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              showVPRView
                ? 'pointer-events-auto z-10 opacity-100'
                : 'pointer-events-none z-0 opacity-0'
            }`}
          >
            <div className="flex h-full w-full flex-col items-center justify-center bg-blue-900/50 p-4">
              <h2 className="mb-4 text-2xl font-bold text-white">Exploration View</h2>
              <p className="text-center text-gray-300">
                Manage your exploration missions and scout ships.
              </p>
            </div>
          </div>

          {/* Galaxy Map — overlay panel */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              showGalaxyMap
                ? 'pointer-events-auto z-10 opacity-100'
                : 'pointer-events-none z-0 opacity-0'
            }`}
          >
            <GalaxyMap />
          </div>
        </div>
      </div>
    </div>
  );
}
