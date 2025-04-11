import { Filter, Search, ZoomIn, ZoomOut } from 'lucide-react';
import * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ResourceType } from './../../types/resources/ResourceTypes';

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

interface FactionControl {
  factionId: string;
  factionName: string;
  controlLevel: 'minimal' | 'partial' | 'full';
  hostility: 'friendly' | 'neutral' | 'hostile';
}

interface Anomaly {
  id: string;
  type: 'artifact' | 'signal' | 'phenomenon';
  severity: 'low' | 'medium' | 'high';
  description: string;
  investigated: boolean;
}

interface TradeRoute {
  id: string;
  sourceSectorId: string;
  targetSectorId: string;
  resourceType: ResourceType;
  volume: number; // 0-1 scale for line thickness
  active: boolean;
}

interface GalaxyMapSystemProps {
  sectors: Sector[];
  onSectorSelect: (sectorId: string) => void;
  selectedSectorId?: string;
  activeScanId?: string;
  onSectorScan?: (sectorId: string) => void;
  quality?: 'low' | 'medium' | 'high';
  className?: string;
  affectedSectorIds?: string[];
  tradeRoutes?: TradeRoute[];
  activeOverlays?: string[];
}

// Helper functions for colors
const getSectorColor = (sector: Sector): string => {
  // If sector has anomalies, show red
  if (sector.anomalies && sector.anomalies.length > 0) {
    return 'rgba(239, 68, 68, 0.8)'; // red-500
  }

  // Otherwise color based on status
  switch (sector.status) {
    case 'unmapped':
      return 'rgba(156, 163, 175, 0.8)'; // gray-400
    case 'mapped':
      return 'rgba(59, 130, 246, 0.8)'; // blue-500
    case 'scanning':
      return 'rgba(245, 158, 11, 0.8)'; // amber-500
    case 'analyzed':
      return 'rgba(16, 185, 129, 0.8)'; // emerald-500
    default:
      return 'rgba(156, 163, 175, 0.8)'; // gray-400
  }
};

const getResourceColor = (resourceType: ResourceType): string => {
  switch (resourceType) {
    case ResourceType.MINERALS:
      return 'rgba(59, 130, 246, 0.8)'; // blue-500
    case ResourceType.GAS:
      return 'rgba(16, 185, 129, 0.8)'; // emerald-500
    case ResourceType.ENERGY:
      return 'rgba(245, 158, 11, 0.8)'; // amber-500
    case ResourceType.ORGANIC:
      return 'rgba(139, 92, 246, 0.8)'; // purple-500
    case ResourceType.EXOTIC:
      return 'rgba(236, 72, 153, 0.8)'; // pink-500
    default:
      return 'rgba(156, 163, 175, 0.8)'; // gray-400
  }
};

export const GalaxyMapSystem: React.FC<GalaxyMapSystemProps> = ({
  sectors,
  onSectorSelect,
  selectedSectorId,
  activeScanId,
  onSectorScan,
  quality = 'medium',
  className,
  affectedSectorIds = [],
  tradeRoutes = [],
  activeOverlays = [],
}: GalaxyMapSystemProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Use the quality prop to adjust rendering settings
  const renderSettings = useMemo(() => {
    switch (quality) {
      case 'low':
        return {
          particleCount: 50,
          animationSpeed: 0.5,
          effectDetail: 'low',
          shadowQuality: 'none',
        };
      case 'high':
        return {
          particleCount: 200,
          animationSpeed: 1.5,
          effectDetail: 'high',
          shadowQuality: 'high',
        };
      case 'medium':
      default:
        return {
          particleCount: 100,
          animationSpeed: 1.0,
          effectDetail: 'medium',
          shadowQuality: 'medium',
        };
    }
  }, [quality]);

  // Handle map dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zooming with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  // Handle sector click
  const handleSectorClick = useCallback(
    (sectorId: string) => {
      onSectorSelect(sectorId);
      if (onSectorScan) {
        onSectorScan(sectorId);
      }
    },
    [onSectorSelect, onSectorScan]
  );

  return (
    <div
      ref={mapRef}
      className={`relative h-full w-full overflow-hidden bg-gray-900 ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background with stars based on quality setting */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(20, 20, 40, 0.8) 0%, rgba(10, 10, 20, 1) 100%)`,
          backgroundSize: 'cover',
        }}
      >
        {/* Generate stars based on renderSettings.particleCount */}
        {Array.from({ length: Math.floor(renderSettings.particleCount / 3) }).map((_, i) => {
          const size = Math.random() * 2 + 0.5;
          const opacity = Math.random() * 0.7 + 0.3;
          return (
            <div
              key={`star-${i}`}
              className="absolute rounded-full bg-white"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity,
                boxShadow:
                  size > 1.5 ? `0 0 ${size * 2}px rgba(255, 255, 255, ${opacity})` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Sectors */}
      <div
        className="absolute"
        style={{
          transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {sectors.map(sector => (
          <div
            key={sector.id}
            className={`absolute cursor-pointer rounded-full border ${
              sector.id === selectedSectorId
                ? 'border-blue-400 shadow-lg shadow-blue-400/50'
                : 'border-gray-600'
            } ${sector.id === activeScanId ? 'animate-pulse' : ''} ${
              affectedSectorIds.includes(sector.id) ? 'border-red-500' : ''
            }`}
            style={{
              left: `${sector.coordinates.x}px`,
              top: `${sector.coordinates.y}px`,
              width: '20px',
              height: '20px',
              backgroundColor: getSectorColor(sector),
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => handleSectorClick(sector.id)}
            title={sector.name}
          />
        ))}

        {/* Trade Routes */}
        {activeOverlays.includes('tradeRoutes') &&
          tradeRoutes
            .filter(route => route.active)
            .map(route => {
              const sourceSector = sectors.find(s => s.id === route.sourceSectorId);
              const targetSector = sectors.find(s => s.id === route.targetSectorId);

              if (!sourceSector || !targetSector) return null;

              const sourceX = sourceSector.coordinates.x;
              const sourceY = sourceSector.coordinates.y;
              const targetX = targetSector.coordinates.x;
              const targetY = targetSector.coordinates.y;

              // Calculate distance for curve adjustment
              const dx = targetX - sourceX;
              const dy = targetY - sourceY;
              const distance = Math.sqrt(dx * dx + dy * dy);

              // Adjust curve factor based on distance
              const curveFactor = 0.2 * (1 - Math.min(1, distance / 1000));

              // Calculate perpendicular point for quadratic curve
              const midX = (sourceX + targetX) / 2;
              const midY = (sourceY + targetY) / 2;
              const perpX = midX + curveFactor * (targetY - sourceY);
              const perpY = midY - curveFactor * (targetX - sourceX);

              return (
                <svg
                  key={route.id}
                  className="absolute top-0 left-0 h-full w-full overflow-visible"
                  style={{ pointerEvents: 'none' }}
                >
                  <path
                    d={`M ${sourceX} ${sourceY} Q ${perpX} ${perpY} ${targetX} ${targetY}`}
                    fill="none"
                    stroke={getResourceColor(route.resourceType)}
                    strokeWidth={1 + route.volume * 3}
                    strokeOpacity={0.7}
                    strokeDasharray={route.active ? 'none' : '5,5'}
                  />
                  <circle
                    cx={midX}
                    cy={midY}
                    r={3}
                    fill={getResourceColor(route.resourceType)}
                    opacity={0.8}
                  />
                </svg>
              );
            })}
      </div>

      {/* Controls */}
      <div className="absolute right-4 bottom-4 flex flex-col space-y-2">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700"
          onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
        >
          <ZoomIn size={20} />
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700"
          onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
        >
          <ZoomOut size={20} />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="absolute top-4 left-4 flex space-x-2">
        <div className="relative">
          <input
            type="text"
            className="w-40 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-400"
            placeholder="Search sectors..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="absolute top-2 right-2 h-5 w-5 text-gray-400" />
        </div>
        <button
          className="flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white hover:bg-gray-700"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} className="mr-1" />
          Filters
        </button>
      </div>

      {/* Apply visual effects based on quality setting */}
      {quality !== 'low' && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow:
              quality === 'high'
                ? 'inset 0 0 100px rgba(0, 30, 60, 0.5)'
                : 'inset 0 0 50px rgba(0, 20, 40, 0.3)',
            filter: `blur(${quality === 'high' ? '8px' : '4px'})`,
            opacity: 0.4,
          }}
        />
      )}
    </div>
  );
};
