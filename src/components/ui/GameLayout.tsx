import { Beaker, Database, Map, Menu, Radar, Ship, Users } from 'lucide-react';
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
  const legacyHudEnabled = import.meta.env.VITE_ENABLE_LEGACY_HUD === 'true';
  const showHud =
    legacyHudEnabled &&
    ['/map', '/colony', '/hangar'].includes(location.pathname);

  // Add component profiling to monitor performance
  const profiler = useComponentProfiler('GameLayout', {
    enabled: true,
    slowRenderThreshold: 16, // 1 frame at 60fps
    trackPropChanges: true,
  });

  React.useEffect(() => {
    if (!showHud) {
      return;
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        setShowGalaxyMap(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showHud]);

  // Handle optional legacy HUD overlays.
  const handleToggleSprawlView = () => {
    setShowSprawlView(prev => {
      return !prev;
    });

    // If showing sprawl view, hide other views
    if (!showSprawlView) {
      setShowVPRView(false);
      setShowGalaxyMap(false);
    }
  };

  const handleToggleVPRView = () => {
    setShowVPRView(prev => {
      return !prev;
    });

    // If showing VPR view, hide other views
    if (!showVPRView) {
      setShowSprawlView(false);
      setShowGalaxyMap(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--gs-bg)] text-[var(--gs-text-1)]">
      {/* Sidebar Navigation */}
      <div className="flex w-16 flex-col items-center space-y-6 border-r border-[var(--gs-border)] bg-[rgba(18,35,63,0.95)] py-4">
        <Menu className="h-6 w-6 cursor-pointer text-[var(--gs-text-3)] hover:text-[var(--gs-text-1)]" />
        <div className="h-8 w-8 rounded-full" style={{ backgroundColor: bannerColor }} />
        <div className="flex flex-1 flex-col space-y-6">
          <button
            onClick={() => {
              void navigate('/map');
            }}
            className={`rounded-lg border p-2 transition-colors ${
              location.pathname === '/map'
                ? 'border-cyan-400/60 bg-[rgba(59,130,246,0.2)] text-cyan-300'
                : 'border-transparent text-[var(--gs-text-2)] hover:border-[var(--gs-border)] hover:bg-[rgba(27,45,73,0.92)]'
            }`}
            title="Exploration Map"
          >
            <Map className="h-6 w-6" />
          </button>
          <button
            onClick={() => {
              void navigate('/fleet');
            }}
            className={`rounded-lg border p-2 transition-colors ${
              location.pathname === '/fleet'
                ? 'border-cyan-400/60 bg-[rgba(59,130,246,0.2)] text-cyan-300'
                : 'border-transparent text-[var(--gs-text-2)] hover:border-[var(--gs-border)] hover:bg-[rgba(27,45,73,0.92)]'
            }`}
            title="Fleet Management"
          >
            <Radar className="h-6 w-6" />
          </button>
          <button
            onClick={() => {
              void navigate('/hangar');
            }}
            className={`rounded-lg border p-2 transition-colors ${
              location.pathname === '/hangar'
                ? 'border-cyan-400/60 bg-[rgba(59,130,246,0.2)] text-cyan-300'
                : 'border-transparent text-[var(--gs-text-2)] hover:border-[var(--gs-border)] hover:bg-[rgba(27,45,73,0.92)]'
            }`}
            title="Ship Hangar"
          >
            <Ship className="h-6 w-6" />
          </button>
          <button
            onClick={() => {
              void navigate('/colony');
            }}
            className={`rounded-lg border p-2 transition-colors ${
              location.pathname === '/colony'
                ? 'border-cyan-400/60 bg-[rgba(59,130,246,0.2)] text-cyan-300'
                : 'border-transparent text-[var(--gs-text-2)] hover:border-[var(--gs-border)] hover:bg-[rgba(27,45,73,0.92)]'
            }`}
            title="Colony Management"
          >
            <Users className="h-6 w-6" />
          </button>
          <button
            onClick={() => {
              void navigate('/research');
            }}
            className={`rounded-lg border p-2 transition-colors ${
              location.pathname === '/research'
                ? 'border-cyan-400/60 bg-[rgba(59,130,246,0.2)] text-cyan-300'
                : 'border-transparent text-[var(--gs-text-2)] hover:border-[var(--gs-border)] hover:bg-[rgba(27,45,73,0.92)]'
            }`}
            title="Research Tree"
          >
            <Beaker className="h-6 w-6" />
          </button>
          <button
            onClick={() => {
              void navigate('/dashboard');
            }}
            className={`rounded-lg border p-2 transition-colors ${
              location.pathname === '/dashboard'
                ? 'border-cyan-400/60 bg-[rgba(59,130,246,0.2)] text-cyan-300'
                : 'border-transparent text-[var(--gs-text-2)] hover:border-[var(--gs-border)] hover:bg-[rgba(27,45,73,0.92)]'
            }`}
            title="Dashboard"
          >
            <Database className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Top Bar with performance metrics */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--gs-border)] bg-[rgba(20,38,65,0.9)] px-6 backdrop-blur-sm">
          <h1 className="text-xl font-bold text-[var(--gs-text-1)]">{empireName}</h1>
          <div className="flex items-center space-x-4">
            <div className="rounded-lg border border-[var(--gs-border)] bg-[rgba(27,45,73,0.92)] px-4 py-2">
              <span className="text-sm text-[var(--gs-text-2)]">Population:</span>
              <span className="ml-2 font-medium text-[var(--gs-text-1)]">
                {(state.resources?.POPULATION ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="rounded-lg border border-[var(--gs-border)] bg-[rgba(27,45,73,0.92)] px-4 py-2">
              <span className="text-sm text-[var(--gs-text-2)]">Systems:</span>
              <span className="ml-2 font-medium text-[var(--gs-text-1)]">
                {state.systems?.explored ?? 0}/{state.systems?.total ?? 0}
              </span>
            </div>
            {/* Add performance indicator */}
            <div className="rounded-lg border border-[var(--gs-border)] bg-[rgba(27,45,73,0.92)] px-4 py-2">
              <span className="text-sm text-[var(--gs-text-2)]">Render:</span>
              <span
                className={`ml-2 font-medium ${(profiler.metrics?.lastRenderTime ?? 0) > 16 ? 'text-yellow-400' : 'text-green-400'}`}
              >
                {(profiler.metrics?.lastRenderTime ?? 0).toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="relative min-w-0 flex-1 overflow-auto">
          {/* Game HUD is only shown on gameplay routes to avoid overlaying analysis/management pages */}
          {showHud && (
            <GameHUD
              empireName={empireName}
              onToggleSprawlView={handleToggleSprawlView}
              onToggleVPRView={handleToggleVPRView}
            />
          )}

          {/* Main Route Content — always visible */}
          <div className="h-full w-full min-w-0">
            {children}
          </div>

          {/* Sprawl View — overlay panel */}
          {showHud && (
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                showSprawlView
                  ? 'pointer-events-auto z-10 opacity-100'
                  : 'pointer-events-none z-0 opacity-0'
              }`}
            >
              <div className="flex h-full w-full flex-col items-center justify-center bg-[rgba(15,31,54,0.95)] p-4">
                <h2 className="mb-4 text-2xl font-bold text-white">Sprawl View</h2>
                <p className="text-center text-[var(--gs-text-2)]">
                  Manage your mining operations and resource extraction.
                </p>
              </div>
            </div>
          )}

          {/* VPR View — overlay panel */}
          {showHud && (
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                showVPRView
                  ? 'pointer-events-auto z-10 opacity-100'
                  : 'pointer-events-none z-0 opacity-0'
              }`}
            >
              <div className="flex h-full w-full flex-col items-center justify-center bg-[rgba(20,38,65,0.92)] p-4">
                <h2 className="mb-4 text-2xl font-bold text-white">Exploration View</h2>
                <p className="text-center text-[var(--gs-text-2)]">
                  Manage your exploration missions and scout ships.
                </p>
              </div>
            </div>
          )}

          {/* Galaxy Map — overlay panel */}
          {showHud && (
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                showGalaxyMap
                  ? 'pointer-events-auto z-10 opacity-100'
                  : 'pointer-events-none z-0 opacity-0'
              }`}
            >
              <GalaxyMap />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
