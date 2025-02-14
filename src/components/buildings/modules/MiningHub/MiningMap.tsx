import { AlertTriangle, Database, Truck, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface Resource {
  id: string;
  name: string;
  type: 'mineral' | 'gas' | 'exotic';
  abundance: number;
  distance: number;
  extractionRate: number;
  depletion: number;
  priority: number;
  thresholds: {
    min: number;
    max: number;
  };
}

interface MiningShip {
  id: string;
  name: string;
  type: 'rockBreaker' | 'voidDredger';
  status: 'idle' | 'mining' | 'returning' | 'maintenance';
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}

interface MiningMapProps {
  resources: Resource[];
  selectedNode: Resource | null;
  onSelectNode: (resource: Resource) => void;
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
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
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

  const getTypeColor = (type: Resource['type']) => {
    switch (type) {
      case 'mineral':
        return 'cyan';
      case 'gas':
        return 'purple';
      case 'exotic':
        return 'amber';
      default:
        return 'blue';
    }
  };

  return (
    <div className="relative flex-1">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex space-x-2 z-10">
        <button
          onClick={() => handleZoom(0.1)}
          className="p-2 bg-gray-800/90 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm transition-colors"
        >
          <ZoomIn className="w-5 h-5 text-teal-400" />
        </button>
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-2 bg-gray-800/90 hover:bg-gray-700/90 rounded-lg backdrop-blur-sm transition-colors"
        >
          <ZoomOut className="w-5 h-5 text-teal-400" />
        </button>
      </div>

      <div
        className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden cursor-move"
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
            const color = getTypeColor(resource.type);
            const isSelected = selectedNode?.id === resource.id;
            const angle = Math.random() * Math.PI * 2; // Random angle for position
            const x = Math.cos(angle) * resource.distance;
            const y = Math.sin(angle) * resource.distance;

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
                    className={`w-16 h-16 rounded-full bg-${color}-500/20 animate-pulse relative ${
                      isSelected
                        ? `ring-2 ring-${color}-400 ring-offset-2 ring-offset-gray-900`
                        : ''
                    }`}
                  >
                    <div
                      className={`w-10 h-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-${color}-400/30`}
                    >
                      <div
                        className={`w-6 h-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-${color}-300/40 flex items-center justify-center`}
                      >
                        <Database className={`w-4 h-4 text-${color}-200`} />
                      </div>
                    </div>

                    {/* Depletion Warning */}
                    {resource.depletion > 0.5 && (
                      <AlertTriangle className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
                    )}
                  </div>

                  {/* Resource Label */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center">
                    <div className={`text-${color}-200 text-sm font-medium`}>{resource.name}</div>
                    <div className={`text-${color}-300/70 text-xs`}>
                      {Math.round(resource.abundance * 100)}% • {resource.distance}ly
                    </div>
                  </div>
                </button>
              </div>
            );
          })}

          {/* Mining Ships */}
          {ships.map(ship => {
            const targetResource = resources.find(r => r.id === ship.targetNode);
            if (!targetResource) {
              return null;
            }

            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * targetResource.distance;
            const y = Math.sin(angle) * targetResource.distance;

            return (
              <div
                key={ship.id}
                className="absolute"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative group">
                  <Truck
                    className={`w-5 h-5 ${
                      ship.status === 'mining'
                        ? 'text-green-400'
                        : ship.status === 'returning'
                          ? 'text-yellow-400'
                          : 'text-gray-400'
                    }`}
                  />

                  {/* Ship Info Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-800/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-700 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{ship.name}</div>
                      <div className="text-xs text-gray-400">
                        {ship.status.charAt(0).toUpperCase() + ship.status.slice(1)} •{' '}
                        {Math.round((ship.currentLoad / ship.capacity) * 100)}% Full • Efficiency:{' '}
                        {Math.round((ship.efficiency + techBonuses.efficiency) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {children}
      </div>
    </div>
  );
}
