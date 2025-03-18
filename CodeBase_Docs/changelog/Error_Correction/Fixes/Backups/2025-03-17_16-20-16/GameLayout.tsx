import { Database, Map, Menu, Radar, Ship, Users } from 'lucide-react';
import * as React from "react";
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
    <div className="flex h-screen overflow-hidden bg-gray-900 text-white">
      {/* Sidebar Navigation */}
      <div className="flex w-16 flex-col items-center space-y-6 border-r border-gray-700 bg-gray-800 py-4">
        <Menu className="h-6 w-6 cursor-pointer text-gray-400 hover:text-white" />
        <div className="h-8 w-8 rounded-full" style={{ backgroundColor: bannerColor }} />
        <div className="flex flex-1 flex-col space-y-6">
          <button
            onClick={() => {
              console.warn('Galaxy map button clicked');
              setShowGalaxyMap(prev => !prev);
            }}
            className="rounded-lg p-2 transition-colors hover:bg-gray-700"
          >
            <Map className="h-6 w-6" />
          </button>
          <button
            className="rounded-lg p-2 transition-colors hover:bg-gray-700"
            onClick={handleToggleVPRView}
          >
            <Radar className="h-6 w-6" />
          </button>
          <button
            className="rounded-lg p-2 transition-colors hover:bg-gray-700"
            onClick={handleToggleSprawlView}
          >
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
        {/* Top Bar with performance metrics */}
        <div className="flex h-16 items-center justify-between border-b border-gray-700 bg-gray-800/90 px-6 backdrop-blur-sm">
          <h1 className="text-xl font-bold">{empireName}</h1>
          <div className="flex items-center space-x-4">
            <div className="rounded-lg bg-gray-700 px-4 py-2">
              <span className="text-sm text-gray-300">Population:</span>
              <span className="ml-2 font-medium">
                {state.resources.population.toLocaleString()}
              </span>
            </div>
            <div className="rounded-lg bg-gray-700 px-4 py-2">
              <span className="text-sm text-gray-300">Systems:</span>
              <span className="ml-2 font-medium">
                {state.systems.explored}/{state.systems.total}
              </span>
            </div>
            {/* Add performance indicator */}
            <div className="rounded-lg bg-gray-700 px-4 py-2">
              <span className="text-sm text-gray-300">Render:</span>
              <span
                className={`ml-2 font-medium ${profiler.metrics.lastRenderTime > 16 ? 'text-yellow-400' : 'text-green-400'}`}
              >
                {profiler.metrics.lastRenderTime.toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="relative flex-1">
          {/* Game HUD */}
          <GameHUD
            empireName={empireName}
            onToggleSprawlView={handleToggleSprawlView}
            onToggleVPRView={handleToggleVPRView}
          />

          {/* Sprawl View */}
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
                This is where you can manage your mining operations and resource extraction.
              </p>
              {children}
            </div>
          </div>

          {/* VPR View */}
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
                This is where you can manage your exploration missions and scout ships.
              </p>
            </div>
          </div>

          {/* Galaxy Map */}
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
