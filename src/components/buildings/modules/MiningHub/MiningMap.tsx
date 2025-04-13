/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { AlertTriangle, Database, ZoomIn, ZoomOut } from 'lucide-react';
import * as React from 'react';
import { MiningResource, MiningShip } from '../../../../types/mining/MiningTypes';
import { ResourceType } from './../../../../types/resources/ResourceTypes';

interface MiningMapProps {
  resources: MiningResource[];
  selectedNode: MiningResource | null;
  onSelectNode: (resource: MiningResource) => void;
  techBonuses: {
    extractionRate: number;
    storageCapacity: number;
    efficiency: number;
  };
  ships: MiningShip[];
  children?: React.ReactNode;
  quality: 'low' | 'medium' | 'high';
}

export function MiningMap({
  resources,
  selectedNode,
  onSelectNode,
  techBonuses,
  ships,
  children,
  quality,
}: MiningMapProps) {
  const [zoom, setZoom] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const isDragging = React.useRef(false);
  const lastPosition = React.useRef({ x: 0, y: 0 });

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

    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const getResourceColor = (type: ResourceType): string => {
    switch (type) {
      case ResourceType.IRON:
      case ResourceType.COPPER:
      case ResourceType.TITANIUM:
        return 'text-blue-400';
      case ResourceType.HELIUM:
      case ResourceType.DEUTERIUM:
        return 'text-teal-400';
      case ResourceType.DARK_MATTER:
      case ResourceType.EXOTIC_MATTER:
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getResourceBackground = (type: ResourceType): string => {
    switch (type) {
      case ResourceType.IRON:
      case ResourceType.COPPER:
      case ResourceType.TITANIUM:
        return 'bg-blue-900/30';
      case ResourceType.HELIUM:
      case ResourceType.DEUTERIUM:
        return 'bg-teal-900/30';
      case ResourceType.DARK_MATTER:
      case ResourceType.EXOTIC_MATTER:
        return 'bg-purple-900/30';
      default:
        return 'bg-gray-900/30';
    }
  };

  return (
    <div className="relative flex-1">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={() => handleZoom(0.1)}
          className="rounded-lg bg-gray-800/90 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/90"
        >
          <ZoomIn className="h-5 w-5 text-teal-400" />
        </button>
        <button
          onClick={() => handleZoom(-0.1)}
          className="rounded-lg bg-gray-800/90 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/90"
        >
          <ZoomOut className="h-5 w-5 text-teal-400" />
        </button>
      </div>

      <div
        className="relative flex-1 cursor-move overflow-hidden rounded-lg bg-gray-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Starfield Background */}
        <div
          className={`absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=3000')] bg-cover ${
            quality === 'high' ? 'opacity-15' : quality === 'medium' ? 'opacity-10' : 'opacity-5'
          }`}
        />

        {/* Map Content */}
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          }}
        >
          {/* Resource Nodes */}
          {resources.map(resource => {
            const color = getResourceColor(resource.type);
            const background = getResourceBackground(resource.type);
            const isSelected = selectedNode?.id === resource.id;
            const assignedShips = ships.filter(ship => ship.targetNode === resource.id);
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * resource.distance;
            const y = Math.sin(angle) * resource.distance;

            // Calculate effective extraction rate with tech bonuses
            const effectiveExtractionRate =
              resource.extractionRate * (1 + techBonuses.extractionRate);

            return (
              <div
                key={resource.id}
                className="absolute"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <button onClick={() => onSelectNode(resource)} className="group relative">
                  {/* Resource Node Visualization */}
                  <div
                    className={`h-16 w-16 rounded-full ${background} relative ${
                      assignedShips.length > 0 ? 'animate-pulse' : ''
                    } ${isSelected ? `ring-2 ${color} ring-offset-2 ring-offset-gray-900` : ''}`}
                  >
                    <div
                      className={`absolute top-1/2 left-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${background}`}
                    >
                      <div
                        className={`absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full ${background} flex items-center justify-center`}
                      >
                        <Database className={color} />
                      </div>
                    </div>

                    {/* Depletion warning */}
                    {resource.depletion > 0.5 && (
                      <AlertTriangle className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                    )}

                    {/* Assigned Ships Indicator */}
                    {assignedShips.length > 0 && (
                      <div className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                        {assignedShips.length}
                      </div>
                    )}
                  </div>

                  {/* Resource Label */}
                  <div className="absolute top-full left-1/2 mt-2 -translate-x-1/2 text-center">
                    <div className={`${color} text-sm font-medium`}>{resource.name}</div>
                    <div className={`${color.replace('400', '300')}/70 text-xs`}>
                      {Math.round(resource.abundance * 100)}% • {resource.distance}ly
                      {assignedShips.length > 0 && ` • ${effectiveExtractionRate.toFixed(1)}/s`}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
          {children}
        </div>
      </div>
    </div>
  );
}
