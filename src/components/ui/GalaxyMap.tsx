import {
  AlertTriangle,
  ArrowRight,
  Layers,
  Lock,
  Rocket,
  Search,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CosmicEvent {
  id: string;
  type: 'storm' | 'solarFlare' | 'anomaly';
  position: { x: number; y: number };
  radius: number;
  duration: number;
  startTime: number;
  affectedSystems: string[];
}

interface StarSystem {
  id: string;
  name: string;
  status: 'locked' | 'unlocked' | 'colonized' | 'hostile';
  position: { x: number; y: number };
  resources?: string[];
  population?: number;
  faction?: string;
  techRequirements?: string[];
  reconRequired?: boolean;
  tradeRoutes?: string[];
}

interface ViewState {
  zoom: number;
  position: { x: number; y: number };
  selectedSystem: StarSystem | null;
  travelingTo: string | null;
  colonizationInProgress: string | null;
  showTutorial: boolean;
  activeOverlays: string[];
}

// Mock data for demonstration
const mockSystems: StarSystem[] = [
  {
    id: 'home',
    name: 'Sol System',
    status: 'colonized',
    position: { x: 0, y: 0 },
    resources: ['Iron', 'Titanium'],
    population: 1000,
    faction: 'Player',
    techRequirements: [],
    tradeRoutes: ['alpha'],
  },
  {
    id: 'alpha',
    name: 'Alpha Centauri',
    status: 'unlocked',
    position: { x: 100, y: -50 },
    resources: ['Helium-3', 'Dark Matter'],
    techRequirements: ['basic-radar'],
    tradeRoutes: ['home'],
  },
  {
    id: 'beta',
    name: 'Beta Hydri',
    status: 'hostile',
    position: { x: -75, y: 125 },
    faction: 'Pirates',
    techRequirements: ['advanced-radar'],
    reconRequired: true,
  },
  {
    id: 'gamma',
    name: 'Gamma Draconis',
    status: 'locked',
    position: { x: 150, y: 100 },
    techRequirements: ['ultra-radar'],
    reconRequired: true,
  },
];

// Mock tech tree state for demonstration
const unlockedTech = ['basic-radar'];

export function GalaxyMap() {
  const [cosmicEvents, setCosmicEvents] = useState<CosmicEvent[]>([]);

  const generateCosmicEvent = () => {
    const eventTypes = ['storm', 'solarFlare', 'anomaly'] as const;
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const position = {
      x: Math.random() * 300 - 150,
      y: Math.random() * 300 - 150,
    };

    const event: CosmicEvent = {
      id: `event-${Date.now()}`,
      type,
      position,
      radius: 30 + Math.random() * 20,
      duration: 15000 + Math.random() * 15000,
      startTime: Date.now(),
      affectedSystems: mockSystems
        .filter(system => {
          const dx = system.position.x - position.x;
          const dy = system.position.y - position.y;
          return Math.sqrt(dx * dx + dy * dy) < 50;
        })
        .map(system => system.id),
    };

    return event;
  };

  // Spawn cosmic events periodically
  useEffect(() => {
    const spawnEvent = () => {
      const newEvent = generateCosmicEvent();
      setCosmicEvents(prev => [...prev, newEvent]);

      // Remove event after duration
      setTimeout(() => {
        setCosmicEvents(prev => prev.filter(e => e.id !== newEvent.id));
      }, newEvent.duration);
    };

    const interval = setInterval(spawnEvent, 30000);
    return () => clearInterval(interval);
  }, []);

  const [view, setView] = useState<ViewState>({
    zoom: 1,
    position: { x: 0, y: 0 },
    selectedSystem: null,
    travelingTo: null,
    colonizationInProgress: null,
    showTutorial: true,
    activeOverlays: ['factions', 'trade'],
  });
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const canColonize = (system: StarSystem) => {
    if (system.status !== 'unlocked') {
      return false;
    }
    if (
      system.reconRequired &&
      !system.techRequirements?.every(tech => unlockedTech.includes(tech))
    ) {
      return false;
    }
    return true;
  };

  const startColonization = (systemId: string) => {
    setView(prev => ({ ...prev, colonizationInProgress: systemId }));

    // Simulate colonization process
    setTimeout(() => {
      mockSystems.find(s => s.id === systemId)!.status = 'colonized';
      mockSystems.find(s => s.id === systemId)!.population = 100;
      setView(prev => ({ ...prev, colonizationInProgress: null }));
    }, 3000);
  };

  const travelToSystem = (systemId: string) => {
    setView(prev => ({ ...prev, travelingTo: systemId }));

    // Simulate travel time
    setTimeout(() => {
      setView(prev => ({ ...prev, travelingTo: null }));
      // Here you would trigger the system transition
    }, 2000);
  };

  const mapRef = useRef<HTMLDivElement>(null);
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

  const selectSystem = (system: StarSystem) => {
    setView(prev => ({
      ...prev,
      selectedSystem: system,
    }));
  };

  const getSystemColor = (status: StarSystem['status']) => {
    switch (status) {
      case 'colonized':
        return 'cyan';
      case 'unlocked':
        return 'blue';
      case 'hostile':
        return 'red';
      default:
        return 'gray';
    }
  };

  const filteredSystems = mockSystems.filter(system => {
    if (searchQuery) {
      return system.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (filter === 'all') {
      return true;
    }
    return system.status === filter;
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setView(prev => ({ ...prev, selectedSystem: null }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="absolute inset-0 bg-gray-900 overflow-hidden">
      {/* Starfield Background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=3000')] bg-cover opacity-20" />

      {/* Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search systems..."
              className="w-64 px-4 py-2 bg-gray-800/90 rounded-lg border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          <select
            className="px-4 py-2 bg-gray-800/90 rounded-lg border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All Systems</option>
            <option value="colonized">Colonized</option>
            <option value="unlocked">Unlocked</option>
            <option value="hostile">Hostile</option>
            <option value="locked">Locked</option>
          </select>

          {/* Overlay Controls */}
          <div className="flex space-x-2">
            <button
              onClick={() =>
                setView(prev => ({
                  ...prev,
                  activeOverlays: prev.activeOverlays.includes('factions')
                    ? prev.activeOverlays.filter(o => o !== 'factions')
                    : [...prev.activeOverlays, 'factions'],
                }))
              }
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                view.activeOverlays.includes('factions')
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800/90 text-gray-400 hover:bg-gray-700/90'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Factions</span>
            </button>

            <button
              onClick={() =>
                setView(prev => ({
                  ...prev,
                  activeOverlays: prev.activeOverlays.includes('trade')
                    ? prev.activeOverlays.filter(o => o !== 'trade')
                    : [...prev.activeOverlays, 'trade'],
                }))
              }
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                view.activeOverlays.includes('trade')
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800/90 text-gray-400 hover:bg-gray-700/90'
              }`}
            >
              <Rocket className="w-4 h-4" />
              <span>Trade</span>
            </button>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 bg-gray-800/90 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm transition-colors"
          >
            <ZoomIn className="w-5 h-5 text-cyan-400" />
          </button>
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 bg-gray-800/90 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm transition-colors"
          >
            <ZoomOut className="w-5 h-5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Map Area */}
      <div
        ref={mapRef}
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
            <svg className="absolute inset-0 pointer-events-none">
              {mockSystems.map(system =>
                system.tradeRoutes?.map(targetId => {
                  const target = mockSystems.find(s => s.id === targetId);
                  if (!target) {
                    return null;
                  }

                  const startX = system.position.x + window.innerWidth / 2;
                  const startY = system.position.y + window.innerHeight / 2;
                  const endX = target.position.x + window.innerWidth / 2;
                  const endY = target.position.y + window.innerHeight / 2;

                  return (
                    <line
                      key={`${system.id}-${target.id}`}
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="rgba(99, 102, 241, 0.3)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="8"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </line>
                  );
                })
              )}
            </svg>
          )}

          {/* Cosmic Events */}
          {cosmicEvents.map(event => (
            <div
              key={event.id}
              className="absolute"
              style={{
                left: `calc(50% + ${event.position.x}px)`,
                top: `calc(50% + ${event.position.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className={`rounded-full animate-pulse ${
                  event.type === 'storm'
                    ? 'bg-purple-500/20'
                    : event.type === 'solarFlare'
                      ? 'bg-orange-500/20'
                      : 'bg-cyan-500/20'
                }`}
                style={{
                  width: `${event.radius * 2}px`,
                  height: `${event.radius * 2}px`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {event.type === 'storm' && <Zap className="w-8 h-8 text-purple-400" />}
                  {event.type === 'solarFlare' && (
                    <AlertTriangle className="w-8 h-8 text-orange-400" />
                  )}
                  {event.type === 'anomaly' && (
                    <div className="w-8 h-8 rounded-full bg-cyan-400/50" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Star Systems */}
          {filteredSystems.map(system => (
            <div
              key={system.id}
              className="absolute"
              style={{
                left: `calc(50% + ${system.position.x}px)`,
                top: `calc(50% + ${system.position.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <button onClick={() => selectSystem(system)} className="group relative">
                <div
                  className={`w-20 h-20 rounded-full bg-${getSystemColor(system.status)}-500/20 animate-pulse`}
                >
                  <div
                    className={`w-12 h-12 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-${getSystemColor(system.status)}-400/30`}
                  >
                    <div
                      className={`w-6 h-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-${getSystemColor(system.status)}-300/40`}
                    >
                      <div
                        className={`w-3 h-3 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-${getSystemColor(system.status)}-200`}
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center">
                  <div className={`text-${getSystemColor(system.status)}-200 font-medium`}>
                    {system.name}
                  </div>
                  {system.population && (
                    <div className={`text-${getSystemColor(system.status)}-300/70 text-sm`}>
                      Pop: {system.population.toLocaleString()}
                    </div>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System Details Panel */}
      {view.selectedSystem && (
        <div className="absolute right-6 top-20 w-96 bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <button
            onClick={() => setView(prev => ({ ...prev, selectedSystem: null }))}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-bold text-white mb-4">{view.selectedSystem.name}</h2>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className={`text-${getSystemColor(view.selectedSystem.status)}-400 capitalize`}>
                {view.selectedSystem.status}
              </div>
            </div>

            {view.selectedSystem.faction && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Faction</div>
                <div className="text-white">{view.selectedSystem.faction}</div>
              </div>
            )}

            {view.selectedSystem.resources && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Resources</div>
                <div className="flex flex-wrap gap-2">
                  {view.selectedSystem.resources.map(resource => (
                    <span
                      key={resource}
                      className="px-2 py-1 bg-gray-700 rounded-md text-sm text-gray-200"
                    >
                      {resource}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {view.selectedSystem.population && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Population</div>
                <div className="text-white">{view.selectedSystem.population.toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* Tech Requirements */}
          {view.selectedSystem.techRequirements &&
            view.selectedSystem.techRequirements.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-400 mb-2">Tech Requirements</div>
                <div className="space-y-2">
                  {view.selectedSystem.techRequirements.map(tech => (
                    <div
                      key={tech}
                      className={`flex items-center justify-between px-3 py-2 rounded-md ${
                        unlockedTech.includes(tech)
                          ? 'bg-green-900/20 border border-green-700/30'
                          : 'bg-gray-800 border border-gray-700'
                      }`}
                    >
                      <span className="text-sm text-gray-300">{tech}</span>
                      {unlockedTech.includes(tech) ? (
                        <div className="text-green-400 text-sm">Unlocked</div>
                      ) : (
                        <Lock className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {view.selectedSystem.status === 'unlocked' && (
              <button
                onClick={() => startColonization(view.selectedSystem!.id)}
                disabled={!canColonize(view.selectedSystem) || view.colonizationInProgress !== null}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  canColonize(view.selectedSystem)
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Rocket className="w-5 h-5" />
                <span>
                  {view.colonizationInProgress === view.selectedSystem.id
                    ? 'Colonizing...'
                    : 'Send Colony Ship'}
                </span>
              </button>
            )}

            {view.selectedSystem.status === 'colonized' && (
              <button
                onClick={() => travelToSystem(view.selectedSystem!.id)}
                disabled={view.travelingTo !== null}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
                <span>
                  {view.travelingTo === view.selectedSystem.id
                    ? 'Traveling...'
                    : 'Travel to System'}
                </span>
              </button>
            )}
          </div>

          {/* Requirements Notice */}
          {view.selectedSystem.status === 'unlocked' && !canColonize(view.selectedSystem) && (
            <div className="mt-3 text-sm text-gray-400 text-center">
              Complete all tech requirements to colonize this system
            </div>
          )}
        </div>
      )}

      {/* Tutorial Overlay */}
      {view.showTutorial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="max-w-md bg-gray-800/95 backdrop-blur-sm p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Welcome to the Galaxy Map</h3>
            <div className="space-y-4 text-gray-300">
              <p>• Click and drag to pan across the galaxy</p>
              <p>• Use the mouse wheel or buttons to zoom in/out</p>
              <p>• Click on star systems to view details and options</p>
              <p>• Toggle overlays to view faction territories and trade routes</p>
              <p>• Watch out for cosmic events that may affect travel!</p>
            </div>
            <button
              onClick={() => setView(prev => ({ ...prev, showTutorial: false }))}
              className="mt-6 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
