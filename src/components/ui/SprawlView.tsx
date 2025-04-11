import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Crown,
  Database,
  Flag,
  HelpCircle,
  Layers,
  Map,
  Rocket,
  Search,
  Star,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { GameLayout } from './GameLayout';

interface EmpireDetails {
  name: string;
  bannerColor: string;
}

interface Asset {
  id: string;
  type: 'colony' | 'dysonSphere' | 'starStation' | 'tradeHub';
  name: string;
  position: { x: number; y: number };
  population?: number;
  resources?: ResourceType[];
  tradeConnections?: { target: string; volume: number }[];
  status: 'active' | 'constructing' | 'damaged';
  developmentLevel: number;
  lastUpdate?: number;
}

interface ViewState {
  zoom: number;
  focusedAsset: string | null;
  position: { x: number; y: number };
  activeOverlays: string[];
  searchQuery: string;
  notifications: {
    id: string;
    type: 'info' | 'warning' | 'success';
    message: string;
    timestamp: number;
  }[];
  dayNightCycle: number;
}

export function SprawlView({ empire }: { empire: EmpireDetails }) {
  const [view, setView] = useState<ViewState>({
    zoom: 1,
    focusedAsset: null,
    position: { x: 0, y: 0 },
    activeOverlays: ['trade', 'resources'],
    searchQuery: '',
    notifications: [],
    dayNightCycle: 0,
  });

  const [assets, setAssets] = useState<Asset[]>([
    {
      id: 'alpha-colony',
      type: 'colony',
      name: 'Alpha Prime',
      position: { x: 0, y: 0 },
      population: 10000,
      resources: [ResourceType.IRON, ResourceType.TITANIUM],
      tradeConnections: [
        { target: 'beta-station', volume: 0.8 },
        { target: 'gamma-sphere', volume: 0.5 },
      ],
      status: 'active',
      developmentLevel: 0.8,
      lastUpdate: Date.now(),
    },
    {
      id: 'beta-station',
      type: 'starStation',
      name: 'Beta Station',
      position: { x: 150, y: -100 },
      population: 5000,
      resources: [ResourceType.HELIUM],
      tradeConnections: [{ target: 'alpha-colony', volume: 0.8 }],
      status: 'active',
      developmentLevel: 0.6,
      lastUpdate: Date.now(),
    },
    {
      id: 'gamma-sphere',
      type: 'dysonSphere',
      name: 'Gamma Sphere',
      position: { x: -120, y: 80 },
      tradeConnections: [
        { target: 'alpha-colony', volume: 0.5 },
        { target: 'delta-hub', volume: 0.3 },
      ],
      status: 'constructing',
      developmentLevel: 0.4,
      lastUpdate: Date.now(),
    },
    {
      id: 'delta-hub',
      type: 'tradeHub',
      name: 'Delta Trading Post',
      position: { x: 80, y: 120 },
      population: 2000,
      tradeConnections: [{ target: 'gamma-sphere', volume: 0.3 }],
      status: 'active',
      developmentLevel: 0.3,
      lastUpdate: Date.now(),
    },
  ]);

  // Day/Night cycle effect
  useEffect(() => {
    const interval = setInterval(() => {
      setView(prev => ({
        ...prev,
        dayNightCycle: (prev.dayNightCycle + 0.01) % 1,
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(currentAssets => {
        return currentAssets.map(asset => {
          if (asset.status === 'active' && Math.random() > 0.8) {
            const populationChange = Math.floor(Math.random() * 100) - 30;
            const newPopulation = asset.population ? asset.population + populationChange : 0;

            if (populationChange > 0) {
              addNotification(
                'success',
                `${asset.name}: Population increased by ${populationChange}`,
                asset.id
              );
            }

            return {
              ...asset,
              population: Math.max(0, newPopulation),
              lastUpdate: Date.now(),
            };
          }
          return asset;
        });
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const addNotification = (
    type: 'info' | 'warning' | 'success',
    message: string,
    assetId: string
  ) => {
    const notification = {
      id: `${assetId}-${Date.now()}`,
      type,
      message,
      timestamp: Date.now(),
    };

    setView(prev => ({
      ...prev,
      notifications: [...prev.notifications, notification],
    }));

    // Remove notification after 5 seconds
    setTimeout(() => {
      setView(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notification.id),
      }));
    }, 5000);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) {
      return;
    }

    const deltaX = e.clientX - lastPosition.current.x;
    const deltaY = e.clientY - lastPosition.current.y;

    setView(prev => ({
      ...prev,
      position: {
        x: prev.position.x + deltaX,
        y: prev.position.y + deltaY,
      },
    }));

    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleZoom = (delta: number) => {
    setView(prev => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(2, prev.zoom + delta)),
    }));
  };

  const focusAsset = (assetName: string) => {
    setView(prev => ({
      ...prev,
      focusedAsset: assetName,
      zoom: 1.5,
    }));
  };

  const getAssetIcon = (type: Asset['type']) => {
    switch (type) {
      case 'colony':
        return Crown;
      case 'dysonSphere':
        return Star;
      case 'starStation':
        return Rocket;
      case 'tradeHub':
        return Database;
      default:
        return Crown;
    }
  };

  const getAssetColor = (asset: Asset) => {
    if (asset.status === 'constructing') {
      return 'yellow';
    }
    if (asset.status === 'damaged') {
      return 'red';
    }
    switch (asset.type) {
      case 'colony':
        return 'cyan';
      case 'dysonSphere':
        return 'orange';
      case 'starStation':
        return 'purple';
      case 'tradeHub':
        return 'emerald';
      default:
        return 'blue';
    }
  };

  const filteredAssets = assets.filter(asset =>
    view.searchQuery ? asset.name.toLowerCase().includes(view.searchQuery.toLowerCase()) : true
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setView(prev => ({
          ...prev,
          focusedAsset: null,
          zoom: 1,
        }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const onToggleSprawlView = () => {
    // Implement the logic to toggle the sprawl view
    console.warn('Sprawl view toggled');
  };

  return (
    <GameLayout empireName={empire.name} bannerColor={empire.bannerColor}>
      <div className="absolute inset-0 overflow-hidden bg-gray-900">
        {/* Multi-layered Starfield Background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${0.3 + Math.sin(view.dayNightCycle * Math.PI * 2) * 0.2})`,
          }}
        >
          <div
            className="absolute inset-0 scale-100 transform bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=3000')] bg-cover opacity-20"
            style={{ transition: 'transform 120s linear' }}
          />
          <div
            className="absolute inset-0 scale-150 transform bg-[url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2013')] bg-cover opacity-10"
            style={{ transition: 'transform 180s linear' }}
          />

          {/* Aurora Effect */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent"
            style={{
              transform: `translateY(${Math.sin(view.dayNightCycle * Math.PI * 2) * 20}px)`,
              opacity: 0.3 + Math.sin(view.dayNightCycle * Math.PI * 2) * 0.2,
            }}
          />
        </div>

        {/* Controls */}
        <div className="absolute top-6 right-6 left-6 z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search assets..."
                className="w-64 rounded-lg border border-gray-700 bg-gray-800/90 px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                value={view.searchQuery}
                onChange={e => setView(prev => ({ ...prev, searchQuery: e.target.value }))}
              />
              <Search className="absolute top-2.5 right-3 h-5 w-5 text-gray-400" />
            </div>

            {/* Overlay Toggles */}
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setView(prev => ({
                    ...prev,
                    activeOverlays: prev.activeOverlays.includes('trade')
                      ? prev.activeOverlays.filter(o => o !== 'trade')
                      : [...prev.activeOverlays, 'trade'],
                  }))
                }
                className={`flex items-center space-x-2 rounded-lg px-3 py-2 transition-colors ${
                  view.activeOverlays.includes('trade')
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800/90 text-gray-400 hover:bg-gray-700/90'
                }`}
              >
                <Database className="h-4 w-4" />
                <span>Trade Routes</span>
              </button>

              <button
                onClick={() =>
                  setView(prev => ({
                    ...prev,
                    activeOverlays: prev.activeOverlays.includes('resources')
                      ? prev.activeOverlays.filter(o => o !== 'resources')
                      : [...prev.activeOverlays, 'resources'],
                  }))
                }
                className={`flex items-center space-x-2 rounded-lg px-3 py-2 transition-colors ${
                  view.activeOverlays.includes('resources')
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800/90 text-gray-400 hover:bg-gray-700/90'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Resources</span>
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleZoom(0.1)}
              className="rounded-lg bg-gray-800/90 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/90"
            >
              <ZoomIn className="h-5 w-5 text-cyan-400" />
            </button>
            <button
              onClick={() => handleZoom(-0.1)}
              className="rounded-lg bg-gray-800/90 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/90"
            >
              <ZoomOut className="h-5 w-5 text-cyan-400" />
            </button>
            <button className="group relative rounded-lg bg-gray-800/90 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/90">
              <HelpCircle className="h-5 w-5 text-cyan-400" />
              <div className="absolute top-full right-0 mt-2 hidden w-64 rounded-lg border border-gray-700 bg-gray-800/95 p-3 group-hover:block">
                <h4 className="mb-2 font-medium text-white">Navigation Help</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li className="flex items-center">
                    <ZoomIn className="mr-2 h-4 w-4" /> Zoom in view
                  </li>
                  <li className="flex items-center">
                    <ZoomOut className="mr-2 h-4 w-4" /> Zoom out view
                  </li>
                  <li className="flex items-center">
                    <Flag className="mr-2 h-4 w-4" /> Mark territory
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="mr-2 h-4 w-4" /> Navigate sectors
                  </li>
                </ul>
              </div>
            </button>
          </div>
        </div>

        {/* Map Area */}
        <div
          ref={containerRef}
          className="absolute inset-0 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${view.position.x}px, ${view.position.y}px) scale(${view.zoom})`,
            }}
          >
            {/* Trade Routes */}
            {view.activeOverlays.includes('trade') && (
              <svg className="pointer-events-none absolute inset-0">
                {assets.map(asset =>
                  asset.tradeConnections?.map(connection => {
                    const target = assets.find(a => a.id === connection.target);
                    if (!target) {
                      return null;
                    }

                    const startX = asset.position.x + window.innerWidth / 2;
                    const startY = asset.position.y + window.innerHeight / 2;
                    const endX = target.position.x + window.innerWidth / 2;
                    const endY = target.position.y + window.innerHeight / 2;

                    return (
                      <g key={`${asset.id}-${target.id}`}>
                        <line
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke="rgba(99, 102, 241, 0.3)"
                          strokeWidth={2 + connection.volume * 4}
                          strokeDasharray="4 4"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            from="0"
                            to="8"
                            dur={`${1 / connection.volume}s`}
                            repeatCount="indefinite"
                          />
                        </line>
                        {/* Trade Volume Indicator */}
                        <circle
                          cx={(startX + endX) / 2}
                          cy={(startY + endY) / 2}
                          r={4 + connection.volume * 4}
                          fill="rgba(99, 102, 241, 0.2)"
                          className="animate-pulse"
                        />
                      </g>
                    );
                  })
                )}
              </svg>
            )}

            {/* Assets */}
            {filteredAssets.map(asset => {
              const Icon = getAssetIcon(asset.type);
              const color = getAssetColor(asset);

              return (
                <div
                  key={asset.id}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${asset.position.x}px)`,
                    top: `calc(50% + ${asset.position.y}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <button onClick={() => focusAsset(asset.id)} className="group relative">
                    <div
                      className={`h-24 w-24 rounded-full bg-${color}-500/20 relative animate-pulse`}
                      style={{
                        boxShadow: `0 0 ${20 + asset.developmentLevel * 30}px ${asset.developmentLevel * 20}px rgba(${
                          color === 'cyan'
                            ? '34, 211, 238'
                            : color === 'orange'
                              ? '234, 88, 12'
                              : color === 'purple'
                                ? '147, 51, 234'
                                : color === 'emerald'
                                  ? '16, 185, 129'
                                  : '59, 130, 246'
                        }, ${0.1 + asset.developmentLevel * 0.2})`,
                      }}
                    >
                      <div
                        className={`absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-${color}-400/30`}
                        style={{
                          transform: `translate(-50%, -50%) scale(${0.8 + Math.sin(Date.now() / 1000) * 0.1})`,
                        }}
                      >
                        <div
                          className={`absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-${color}-300/40 animate-spin-slow flex items-center justify-center`}
                        >
                          <Icon className={`h-5 w-5 text-${color}-200`} />
                        </div>
                      </div>

                      {/* Development Level Rings */}
                      {Array.from({
                        length: Math.ceil(asset.developmentLevel * 5),
                      }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute inset-0 rounded-full border"
                          style={{
                            borderColor: `rgba(${
                              color === 'cyan'
                                ? '34, 211, 238'
                                : color === 'orange'
                                  ? '234, 88, 12'
                                  : color === 'purple'
                                    ? '147, 51, 234'
                                    : color === 'emerald'
                                      ? '16, 185, 129'
                                      : '59, 130, 246'
                            }, ${0.1 + (i / 5) * 0.2})`,
                            transform: `scale(${1.2 + i * 0.2}) rotate(${i * 30}deg)`,
                            animation: `spin ${10 + i * 5}s linear infinite`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Asset Label */}
                    <div className="absolute top-full left-1/2 mt-2 -translate-x-1/2 text-center">
                      <div className={`text-${color}-200 font-medium`}>{asset.name}</div>
                      {asset.population && (
                        <div className={`text-${color}-300/70 text-sm`}>
                          Pop: {asset.population.toLocaleString()}
                        </div>
                      )}
                      {asset.status === 'constructing' && (
                        <div className="flex items-center justify-center text-sm text-yellow-300/70">
                          <Zap className="mr-1 h-4 w-4" />
                          Power Required
                        </div>
                      )}
                    </div>

                    {/* Hover Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="rounded-lg border border-gray-700 bg-gray-800/95 px-3 py-2 whitespace-nowrap backdrop-blur-sm">
                        {asset.resources && view.activeOverlays.includes('resources') && (
                          <div className="flex items-center gap-2 text-sm">
                            {asset.resources.map(resource => (
                              <span key={resource} className="text-gray-300">
                                {resource}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="fixed bottom-6 left-6 space-y-2">
          {view.notifications.map(notification => (
            <div
              key={notification.id}
              className={`flex items-center space-x-2 rounded-lg px-4 py-2 backdrop-blur-sm transition-all ${
                notification.type === 'success'
                  ? 'bg-green-900/80 text-green-200'
                  : notification.type === 'warning'
                    ? 'bg-yellow-900/80 text-yellow-200'
                    : 'bg-blue-900/80 text-blue-200'
              }`}
              style={{
                animation: 'slideIn 0.3s ease-out',
              }}
            >
              {notification.type === 'success' && <Bell className="h-4 w-4" />}
              {notification.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
              {notification.type === 'info' && <Database className="h-4 w-4" />}
              <span>{notification.message}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onToggleSprawlView}
          className="group w-full rounded-lg border border-indigo-700/50 bg-gradient-to-r from-indigo-950/80 to-indigo-900/80 px-4 py-3 text-left backdrop-blur-sm transition-all hover:bg-indigo-800/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Map className="h-5 w-5 text-indigo-400" />
              <span className="font-medium text-indigo-100">{empire.name} Map</span>
            </div>
            <span className="text-sm text-indigo-400 opacity-60 transition-opacity group-hover:opacity-100">
              Press S
            </span>
          </div>
        </button>
      </div>
    </GameLayout>
  );
}
