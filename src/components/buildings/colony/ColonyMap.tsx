import React, { useEffect, useRef, useState } from 'react';

interface BuildingData {
  id: string;
  type: 'housing' | 'industry' | 'agriculture' | 'energy' | 'research' | 'infrastructure';
  name: string;
  level: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  status: 'operational' | 'constructing' | 'upgrading' | 'damaged' | 'inactive';
}

interface ColonyMapProps {
  colonyId: string;
  buildings: BuildingData[];
  population: number;
  maxPopulation: number;
  quality: 'low' | 'medium' | 'high';
  onBuildingClick?: (buildingId: string) => void;
  onMapClick?: (position: { x: number; y: number }) => void;
}

export function ColonyMap({
  colonyId: _colonyId,
  buildings,
  population: _population,
  maxPopulation: _maxPopulation,
  quality: _quality,
  onBuildingClick,
  onMapClick,
}: ColonyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [_dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  // Set up map dimensions
  useEffect(() => {
    if (mapRef.current) {
      const { width, height } = mapRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }

    const handleResize = () => {
      if (mapRef.current) {
        const { width, height } = mapRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle map dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle map zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = Math.max(0.5, Math.min(2, scale - e.deltaY * 0.001));
    setScale(newScale);
  };

  // Get building color based on type
  const getBuildingColor = (type: BuildingData['type']) => {
    switch (type) {
      case 'housing':
        return 'bg-blue-800 border-blue-600';
      case 'industry':
        return 'bg-amber-800 border-amber-600';
      case 'agriculture':
        return 'bg-green-800 border-green-600';
      case 'energy':
        return 'bg-yellow-800 border-yellow-600';
      case 'research':
        return 'bg-purple-800 border-purple-600';
      case 'infrastructure':
        return 'bg-gray-800 border-gray-600';
      default:
        return 'bg-gray-800 border-gray-600';
    }
  };

  // Get building status indicator
  const getBuildingStatusIndicator = (status: BuildingData['status']) => {
    switch (status) {
      case 'operational':
        return <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-500"></div>;
      case 'constructing':
        return <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500"></div>;
      case 'upgrading':
        return <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-purple-500"></div>;
      case 'damaged':
        return <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></div>;
      case 'inactive':
        return <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-gray-500"></div>;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Colony Map</h3>
        <div className="flex items-center space-x-2">
          <button
            className="rounded-md border border-gray-700 bg-gray-900 p-1 text-gray-400 hover:bg-gray-700"
            onClick={() => setScale(Math.min(2, scale + 0.1))}
            title="Zoom In"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
          <button
            className="rounded-md border border-gray-700 bg-gray-900 p-1 text-gray-400 hover:bg-gray-700"
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            title="Zoom Out"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
          </button>
          <button
            className="rounded-md border border-gray-700 bg-gray-900 p-1 text-gray-400 hover:bg-gray-700"
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            title="Reset View"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={mapRef}
        className="relative h-96 overflow-hidden rounded-lg border border-gray-700 bg-gray-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={e => {
          if (!isDragging && onMapClick) {
            const rect = mapRef.current?.getBoundingClientRect();
            if (rect) {
              const x = (e.clientX - rect.left - position.x) / scale;
              const y = (e.clientY - rect.top - position.y) / scale;
              onMapClick({ x, y });
            }
          }
        }}
      >
        {/* Map Grid */}
        <div
          className="absolute left-0 top-0 grid"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            gridTemplateColumns: 'repeat(20, 20px)',
            gridTemplateRows: 'repeat(20, 20px)',
            width: '400px',
            height: '400px',
          }}
        >
          {/* Grid Lines */}
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute border-t border-gray-800"
              style={{ top: `${i * 20}px`, left: 0, width: '100%' }}
            />
          ))}
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute border-l border-gray-800"
              style={{ left: `${i * 20}px`, top: 0, height: '100%' }}
            />
          ))}

          {/* Buildings */}
          {buildings.map(building => (
            <div
              key={building.id}
              className={`absolute cursor-pointer border ${getBuildingColor(building.type)} ${
                hoveredBuilding === building.id ? 'ring-2 ring-white' : ''
              }`}
              style={{
                left: `${building.position.x}px`,
                top: `${building.position.y}px`,
                width: `${building.size.width}px`,
                height: `${building.size.height}px`,
              }}
              onClick={e => {
                e.stopPropagation();
                onBuildingClick?.(building.id);
              }}
              onMouseEnter={() => setHoveredBuilding(building.id)}
              onMouseLeave={() => setHoveredBuilding(null)}
            >
              {getBuildingStatusIndicator(building.status)}

              <div className="absolute bottom-1 left-1 text-xs font-medium text-white">
                {building.name}
              </div>

              {building.level > 1 && (
                <div className="absolute bottom-1 right-1 rounded-full bg-gray-900 px-1 text-xs font-medium text-white">
                  {building.level}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Building Tooltip */}
        {hoveredBuilding && (
          <div className="absolute right-2 top-2 w-48 rounded-md border border-gray-700 bg-gray-800 p-2 shadow-lg">
            {(() => {
              const building = buildings.find(b => b.id === hoveredBuilding);
              if (!building) {
                return null;
              }

              return (
                <>
                  <div className="mb-1 text-sm font-medium text-white">{building.name}</div>
                  <div className="mb-1 text-xs text-gray-400">
                    Type: {building.type.charAt(0).toUpperCase() + building.type.slice(1)}
                  </div>
                  <div className="mb-1 text-xs text-gray-400">Level: {building.level}</div>
                  <div className="text-xs text-gray-400">
                    Status: {building.status.charAt(0).toUpperCase() + building.status.slice(1)}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-sm border border-blue-600 bg-blue-800"></div>
          <span className="text-xs text-gray-400">Housing</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-sm border border-amber-600 bg-amber-800"></div>
          <span className="text-xs text-gray-400">Industry</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-sm border border-green-600 bg-green-800"></div>
          <span className="text-xs text-gray-400">Agriculture</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-sm border border-yellow-600 bg-yellow-800"></div>
          <span className="text-xs text-gray-400">Energy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-sm border border-purple-600 bg-purple-800"></div>
          <span className="text-xs text-gray-400">Research</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-sm border border-gray-600 bg-gray-800"></div>
          <span className="text-xs text-gray-400">Infrastructure</span>
        </div>
      </div>
    </div>
  );
}
