import { AlertTriangle, Compass, Info, Layers, Route, Users, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ResourceType } from './../../types/resources/ResourceTypes';
import { GalaxyMapSystem } from './GalaxyMapSystem';

// Interfaces
interface Sector {
  id: string;
  name: string;
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
  anomalies: Anomaly[];
  lastScanned?: number;
  resources?: Array<{
    type: ResourceType;
    amount: number;
  }>;
  factionControl?: FactionControl;
}

interface Anomaly {
  id: string;
  type: 'artifact' | 'signal' | 'phenomenon';
  severity: 'low' | 'medium' | 'high';
  description: string;
  investigated: boolean;
}

interface FactionControl {
  factionId: string;
  factionName: string;
  controlLevel: 'minimal' | 'partial' | 'full';
  hostility: 'friendly' | 'neutral' | 'hostile';
}

interface TradeRoute {
  id: string;
  sourceSectorId: string;
  targetSectorId: string;
  resourceType: ResourceType;
  volume: number; // 0-1 scale for line thickness
  active: boolean;
}

interface CosmicEvent {
  id: string;
  type: 'storm' | 'solarFlare' | 'anomaly';
  position: { x: number; y: number };
  radius: number;
  duration: number; // in seconds
  startTime: number; // timestamp
  affectedSectors: string[]; // sector IDs
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface GalaxyMappingSystemProps {
  sectors: Sector[];
  onSectorSelect: (sectorId: string) => void;
  onSectorScan?: (sectorId: string) => void;
  selectedSectorId?: string;
  activeScanId?: string;
  className?: string;
  quality?: 'low' | 'medium' | 'high';
  tradeRoutes?: TradeRoute[];
}

export function GalaxyMappingSystem({
  sectors,
  onSectorSelect,
  onSectorScan,
  selectedSectorId,
  activeScanId,
  className = '',
  quality = 'medium',
  tradeRoutes = [],
}: GalaxyMappingSystemProps) {
  // State for overlays and view options
  const [view, setView] = useState({
    activeOverlays: [] as ('factions' | 'tradeRoutes' | 'resources' | 'anomalies')[],
    showTutorial: false,
    dayNightCycle: 0,
  });

  // State for cosmic events
  const [cosmicEventsState, setCosmicEvents] = useState<CosmicEvent[]>([]);

  // Update day/night cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setView(prev => ({
        ...prev,
        dayNightCycle: (prev.dayNightCycle + 0.001) % 1,
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Generate cosmic events periodically
  useEffect(() => {
    const generateEvent = () => {
      if (cosmicEventsState.length >= 3) return; // Limit to 3 active events

      const eventTypes = ['storm', 'solarFlare', 'anomaly'] as const;
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      // Create a new cosmic event
      const newEvent: CosmicEvent = {
        id: `event-${Date.now()}`,
        type,
        position: {
          x: Math.random() * 1000,
          y: Math.random() * 1000,
        },
        radius: 100 + Math.random() * 200,
        duration: 30000 + Math.random() * 60000,
        startTime: Date.now(),
        affectedSectors: sectors.map(s => s.id).filter(() => Math.random() > 0.7),
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        description: `A cosmic event has been detected in this region.`,
      };

      setCosmicEvents(prev => [...prev, newEvent]);

      // Remove event after duration
      setTimeout(() => {
        setCosmicEvents(prev => prev.filter(e => e.id !== newEvent.id));
      }, newEvent.duration);
    };

    const interval = setInterval(generateEvent, 15000);
    return () => clearInterval(interval);
  }, [sectors]);

  // Toggle tutorial
  const toggleTutorial = useCallback(() => {
    setView(prev => ({ ...prev, showTutorial: !prev.showTutorial }));
  }, []);

  // Toggle overlay
  const toggleOverlay = useCallback(
    (overlay: 'factions' | 'tradeRoutes' | 'resources' | 'anomalies') => {
      setView(prev => ({
        ...prev,
        activeOverlays: prev.activeOverlays.includes(overlay)
          ? prev.activeOverlays.filter(o => o !== overlay)
          : [...prev.activeOverlays, overlay],
      }));
    },
    []
  );

  // Use the affected sectors directly from the cosmic events
  const affectedSectorIds = useMemo(() => {
    return cosmicEventsState.flatMap(event => event?.affectedSectors);
  }, [cosmicEventsState]);

  return (
    <div className="relative flex h-full flex-col">
      {/* Parallax Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 scale-100 transform bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=3000')] bg-cover opacity-20"
          style={{
            transition: 'transform 120s linear',
            transform: `scale(${1 + Math.sin(view.dayNightCycle * Math.PI) * 0.05})`,
          }}
        />
        <div
          className="absolute inset-0 scale-150 transform bg-[url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2013')] bg-cover opacity-10"
          style={{
            transition: 'transform 180s linear',
            transform: `scale(${1 + Math.cos(view.dayNightCycle * Math.PI) * 0.08})`,
          }}
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

      {/* Overlay Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={() => toggleOverlay('factions')}
          className={`rounded-full p-2 transition-colors ${
            view.activeOverlays.includes('factions')
              ? 'bg-indigo-700 text-white'
              : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80'
          }`}
          title="Toggle Faction Territories"
        >
          <Users size={20} />
        </button>
        <button
          onClick={() => toggleOverlay('tradeRoutes')}
          className={`rounded-full p-2 transition-colors ${
            view.activeOverlays.includes('tradeRoutes')
              ? 'bg-amber-700 text-white'
              : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80'
          }`}
          title="Toggle Trade Routes"
        >
          <Route size={20} />
        </button>
        <button
          onClick={() => toggleOverlay('resources')}
          className={`rounded-full p-2 transition-colors ${
            view.activeOverlays.includes('resources')
              ? 'bg-emerald-700 text-white'
              : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80'
          }`}
          title="Toggle Resource Visualization"
        >
          <Layers size={20} />
        </button>
        <button
          onClick={() => toggleOverlay('anomalies')}
          className={`rounded-full p-2 transition-colors ${
            view.activeOverlays.includes('anomalies')
              ? 'bg-purple-700 text-white'
              : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80'
          }`}
          title="Toggle Anomaly Visualization"
        >
          <Compass size={20} />
        </button>
        <button
          onClick={toggleTutorial}
          className="rounded-full bg-gray-800/80 p-2 text-gray-400 transition-colors hover:bg-gray-700/80"
          title="Show Tutorial"
        >
          <Info size={20} />
        </button>
      </div>

      {/* Cosmic Events */}
      {cosmicEventsState.map(event => (
        <div
          key={event?.id}
          className="absolute z-20"
          style={{
            left: `calc(50% + ${event?.position.x}px)`,
            top: `calc(50% + ${event?.position.y}px)`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          <div
            className={`animate-pulse rounded-full ${
              event?.type === 'storm'
                ? 'bg-purple-500/20'
                : event?.type === 'solarFlare'
                  ? 'bg-orange-500/20'
                  : 'bg-cyan-500/20'
            }`}
            style={{
              width: `${event?.radius * 2}px`,
              height: `${event?.radius * 2}px`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {event?.type === 'storm' && <Zap className="h-8 w-8 text-purple-400" />}
              {event?.type === 'solarFlare' && (
                <AlertTriangle className="h-8 w-8 text-orange-400" />
              )}
              {event?.type === 'anomaly' && <div className="h-8 w-8 rounded-full bg-cyan-400/50" />}
            </div>
          </div>
        </div>
      ))}

      {/* Galaxy Map System */}
      <GalaxyMapSystem
        sectors={sectors}
        onSectorSelect={onSectorSelect}
        onSectorScan={onSectorScan}
        selectedSectorId={selectedSectorId}
        activeScanId={activeScanId}
        className={className}
        quality={quality}
        affectedSectorIds={affectedSectorIds}
        tradeRoutes={tradeRoutes}
        activeOverlays={view.activeOverlays}
      />

      {/* Tutorial Overlay */}
      {view.showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-md rounded-lg border border-gray-700 bg-gray-800/95 p-6 backdrop-blur-sm">
            <h3 className="mb-4 text-xl font-bold text-white">Welcome to the Galaxy Map</h3>
            <div className="space-y-4 text-gray-300">
              <p>• Click and drag to pan across the galaxy</p>
              <p>• Use the mouse wheel or buttons to zoom in/out</p>
              <p>• Click on star systems to view details and options</p>
              <p>• Toggle overlays to view faction territories and trade routes</p>
              <p>• Watch out for cosmic events that may affect travel!</p>
              <p>• Use the search and filters to find specific sectors</p>
              <p>• Sectors with anomalies are marked with a pulsing indicator</p>
            </div>
            <button
              onClick={toggleTutorial}
              className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
