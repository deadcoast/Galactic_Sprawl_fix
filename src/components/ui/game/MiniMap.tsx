/**
 * @context: ui-system, component-library, map-system
 * 
 * MiniMap component for displaying a simplified version of the galaxy map
 */
import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { ZoomIn, ZoomOut, Move, Target } from 'lucide-react';

// Define base interfaces for the mini map
interface Position {
  x: number;
  y: number;
}

export interface ViewportConfig {
  position: Position;
  zoom: number;
  width: number;
  height: number;
}

export interface MiniMapStar {
  id: string;
  name: string;
  position: Position;
  status: 'locked' | 'unlocked' | 'colonized' | 'hostile';
  resources?: ResourceType[];
  faction?: string;
}

// Status colors for different star systems
const STATUS_COLORS = {
  locked: '#9e9e9e',
  unlocked: '#2196f3',
  colonized: '#4caf50',
  hostile: '#f44336'
};

// Faction colors
const FACTION_COLORS: Record<string, string> = {
  player: '#4287f5',
  enemy: '#f44336',
  neutral: '#9e9e9e',
  ally: '#4caf50',
  'space-rats': '#ff9800',
  'lost-nova': '#9c27b0',
  'equator-horizon': '#009688'
};

interface MiniMapProps {
  /**
   * Star systems to display
   */
  stars: MiniMapStar[];
  
  /**
   * Current viewport configuration
   */
  viewport: ViewportConfig;
  
  /**
   * Whether the mini map is in interactive mode
   * @default true
   */
  interactive?: boolean;
  
  /**
   * Custom width of the mini map
   * @default 200
   */
  width?: number;
  
  /**
   * Custom height of the mini map
   * @default 200
   */
  height?: number;
  
  /**
   * Handler for viewport changes
   */
  onViewportChange?: (viewport: ViewportConfig) => void;
  
  /**
   * Handler for star selection
   */
  onStarSelected?: (starId: string) => void;
  
  /**
   * Current player position
   */
  playerPosition?: Position;
  
  /**
   * Custom class name
   */
  className?: string;
}

/**
 * MiniMap component that displays a simplified version of the galaxy map
 */
export function MiniMap({
  stars,
  viewport,
  interactive = true,
  width = 200,
  height = 200,
  onViewportChange,
  onStarSelected,
  playerPosition,
  className = '',
}: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Position>({ x: 0, y: 0 });
  
  // Calculate world to screen conversion
  const worldToScreen = (worldPos: Position): Position => {
    const scale = viewport.zoom;
    const offsetX = viewport.position.x;
    const offsetY = viewport.position.y;
    
    return {
      x: ((worldPos.x - offsetX) * scale) + (width / 2),
      y: ((worldPos.y - offsetY) * scale) + (height / 2)
    };
  };
  
  // Calculate screen to world conversion
  const screenToWorld = (screenPos: Position): Position => {
    const scale = viewport.zoom;
    const offsetX = viewport.position.x;
    const offsetY = viewport.position.y;
    
    return {
      x: (screenPos.x - (width / 2)) / scale + offsetX,
      y: (screenPos.y - (height / 2)) / scale + offsetY
    };
  };
  
  // Handle canvas drawing
  const drawMiniMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background (deep space)
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw viewport rectangle
    const viewportRect = {
      x: (width / 2) - ((viewport.width / 2) * viewport.zoom),
      y: (height / 2) - ((viewport.height / 2) * viewport.zoom),
      width: viewport.width * viewport.zoom,
      height: viewport.height * viewport.zoom
    };
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(viewportRect.x, viewportRect.y, viewportRect.width, viewportRect.height);
    
    // Draw stars
    stars.forEach(star => {
      const screenPos = worldToScreen(star.position);
      
      // Check if the star is within the canvas
      if (
        screenPos.x >= -5 && 
        screenPos.x <= width + 5 && 
        screenPos.y >= -5 && 
        screenPos.y <= height + 5
      ) {
        // Draw star background (glow)
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = star.faction 
          ? FACTION_COLORS[star.faction] || '#ffffff'
          : STATUS_COLORS[star.status];
        ctx.globalAlpha = 0.3;
        ctx.fill();
        
        // Draw star
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = star.faction 
          ? FACTION_COLORS[star.faction] || '#ffffff'
          : STATUS_COLORS[star.status];
        ctx.globalAlpha = 1;
        ctx.fill();
      }
    });
    
    // Draw player position if provided
    if (playerPosition) {
      const playerScreenPos = worldToScreen(playerPosition);
      
      // Draw player indicator
      ctx.beginPath();
      ctx.arc(playerScreenPos.x, playerScreenPos.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(playerScreenPos.x, playerScreenPos.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#4287f5';
      ctx.fill();
    }
  };
  
  // Handle mouse down event
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) {
      return;
    }
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setLastMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  
  // Handle mouse move event
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !isDragging) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const dx = mousePos.x - lastMousePos.x;
    const dy = mousePos.y - lastMousePos.y;
    
    // Update viewport position
    const newViewport = {
      ...viewport,
      position: {
        x: viewport.position.x - dx / viewport.zoom,
        y: viewport.position.y - dy / viewport.zoom
      }
    };
    
    setLastMousePos(mousePos);
    if (onViewportChange) {
      onViewportChange(newViewport);
    }
    
    drawMiniMap();
  };
  
  // Handle mouse up event
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle click event
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || isDragging || !onStarSelected) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Convert click position to world coordinates
    const worldPos = screenToWorld(clickPos);
    
    // Find the closest star
    let closestStar: MiniMapStar | null = null;
    let closestDistance = Number.MAX_VALUE;
    
    for (const star of stars) {
      const dx = star.position.x - worldPos.x;
      const dy = star.position.y - worldPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < closestDistance && distance < 10 / viewport.zoom) {
        closestDistance = distance;
        closestStar = star;
      }
    }
    
    if (closestStar) {
      onStarSelected(closestStar.id);
    }
  };
  
  // Handle zoom in button click
  const handleZoomIn = () => {
    if (!interactive) {
      return;
    }
    
    const newViewport = {
      ...viewport,
      zoom: viewport.zoom * 1.2
    };
    
    if (onViewportChange) {
      onViewportChange(newViewport);
    }
  };
  
  // Handle zoom out button click
  const handleZoomOut = () => {
    if (!interactive) {
      return;
    }
    
    const newViewport = {
      ...viewport,
      zoom: viewport.zoom / 1.2
    };
    
    if (onViewportChange) {
      onViewportChange(newViewport);
    }
  };
  
  // Handle reset view button click
  const handleResetView = () => {
    if (!interactive) {
      return;
    }
    
    const newViewport = {
      ...viewport,
      position: { x: 0, y: 0 },
      zoom: 1
    };
    
    if (onViewportChange) {
      onViewportChange(newViewport);
    }
  };
  
  // Center on player button click
  const handleCenterOnPlayer = () => {
    if (!interactive || !playerPosition) {
      return;
    }
    
    const newViewport = {
      ...viewport,
      position: { ...playerPosition }
    };
    
    if (onViewportChange) {
      onViewportChange(newViewport);
    }
  };
  
  // Draw the mini map when the component mounts or when relevant props change
  useEffect(() => {
    drawMiniMap();
  }, [stars, viewport, playerPosition, width, height]);
  
  return (
    <div 
      ref={containerRef}
      className={`mini-map relative ${className}`}
      data-testid="mini-map"
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="mini-map__canvas rounded-lg overflow-hidden border border-gray-700"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
      
      {interactive && (
        <div className="mini-map__controls absolute bottom-2 right-2 flex flex-col gap-1">
          <button 
            className="mini-map__control-btn w-6 h-6 flex items-center justify-center bg-gray-800 text-white rounded-full hover:bg-gray-700"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button 
            className="mini-map__control-btn w-6 h-6 flex items-center justify-center bg-gray-800 text-white rounded-full hover:bg-gray-700"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button 
            className="mini-map__control-btn w-6 h-6 flex items-center justify-center bg-gray-800 text-white rounded-full hover:bg-gray-700"
            onClick={handleResetView}
            title="Reset View"
          >
            <Move className="w-4 h-4" />
          </button>
          
          {playerPosition && (
            <button 
              className="mini-map__control-btn w-6 h-6 flex items-center justify-center bg-gray-800 text-white rounded-full hover:bg-gray-700"
              onClick={handleCenterOnPlayer}
              title="Center on Player"
            >
              <Target className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
} 