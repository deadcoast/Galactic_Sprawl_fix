/**
 * BaseMap Component
 * 
 * A unified base component for map visualizations in the exploration system.
 * This component provides core map functionality including:
 * - Panning and zooming
 * - Entity selection and highlighting
 * - Layer rendering system for different map elements
 * - Configurable visual settings
 */

import * as React from "react";
import { useRef, useState, useEffect, useCallback } from 'react';
import { 
  MapViewport, 
  MapVisualSettings, 
  MapSelection, 
  Coordinates,
  DetailLevel,
  MapTheme
} from '../../../../types/exploration/unified';
import { cn } from '../../../../utils/cn';

// Default viewport settings
const DEFAULT_VIEWPORT: MapViewport = {
  x: 0,
  y: 0,
  scale: 1,
  width: 800,
  height: 600
};

// Default visual settings
const DEFAULT_VISUAL_SETTINGS: MapVisualSettings = {
  showGrid: true,
  showLabels: true,
  showResourceIcons: true,
  showAnomalyIcons: true,
  showFactionBorders: false,
  showTradeRoutes: true,
  detailLevel: DetailLevel.MEDIUM,
  theme: MapTheme.STANDARD
};

// Map layer types
export type MapLayerType = 
  | 'background'
  | 'grid'
  | 'sectors'
  | 'systems'
  | 'resources'
  | 'anomalies'
  | 'tradeRoutes'
  | 'factionBorders'
  | 'selection'
  | 'labels'
  | 'custom';

// Map layer render function
export type MapLayerRenderer = (
  ctx: CanvasRenderingContext2D,
  viewport: MapViewport,
  settings: MapVisualSettings
) => void;

// Map click handler
export type MapClickHandler = (
  x: number,
  y: number,
  viewport: MapViewport
) => void;

// Map layer definition
export interface MapLayer {
  id: string;
  type: MapLayerType;
  zIndex: number;
  visible: boolean;
  render: MapLayerRenderer;
}

// BaseMap Props
export interface BaseMapProps {
  /** Map width in pixels */
  width?: number;
  
  /** Map height in pixels */
  height?: number;
  
  /** Initial viewport settings */
  initialViewport?: Partial<MapViewport>;
  
  /** Visual settings */
  visualSettings?: Partial<MapVisualSettings>;
  
  /** Map layers to render */
  layers?: MapLayer[];
  
  /** Selected entities */
  selection?: MapSelection[];
  
  /** Called when an entity is clicked */
  onEntityClick?: (entityId: string, entityType: string) => void;
  
  /** Called when the map is clicked (no entity) */
  onMapClick?: (x: number, y: number) => void;
  
  /** Called when the viewport changes */
  onViewportChange?: (viewport: MapViewport) => void;
  
  /** Custom class name */
  className?: string;
  
  /** Whether to allow panning */
  allowPanning?: boolean;
  
  /** Whether to allow zooming */
  allowZooming?: boolean;
  
  /** The ID to use for the canvas element */
  id?: string;
}

/**
 * BaseMap Component
 */
export const BaseMap: React.FC<BaseMapProps> = ({
  width = 800,
  height = 600,
  initialViewport,
  visualSettings,
  layers = [],
  selection = [],
  onEntityClick,
  onMapClick,
  onViewportChange,
  className,
  allowPanning = true,
  allowZooming = true,
  id
}) => {
  // References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  // State
  const [viewport, setViewport] = useState<MapViewport>({
    ...DEFAULT_VIEWPORT,
    width,
    height,
    ...initialViewport
  });
  
  const [settings, setSettings] = useState<MapVisualSettings>({
    ...DEFAULT_VISUAL_SETTINGS,
    ...visualSettings
  });
  
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Update viewport when width/height changes
  useEffect(() => {
    setViewport(prev => ({
      ...prev,
      width,
      height
    }));
  }, [width, height]);
  
  // Update settings when visualSettings changes
  useEffect(() => {
    if (visualSettings) {
      setSettings(prev => ({
        ...prev,
        ...visualSettings
      }));
    }
  }, [visualSettings]);
  
  // Sort layers by z-index
  const sortedLayers = React.useMemo(() => {
    return [...layers].sort((a, b) => a.zIndex - b.zIndex);
  }, [layers]);
  
  // Convert coordinates from world to screen
  const worldToScreen = useCallback((worldX: number, worldY: number): [number, number] => {
    const screenX = (worldX - viewport.x) * viewport.scale + viewport.width / 2;
    const screenY = (worldY - viewport.y) * viewport.scale + viewport.height / 2;
    return [screenX, screenY];
  }, [viewport]);
  
  // Convert coordinates from screen to world
  const screenToWorld = useCallback((screenX: number, screenY: number): [number, number] => {
    const worldX = (screenX - viewport.width / 2) / viewport.scale + viewport.x;
    const worldY = (screenY - viewport.height / 2) / viewport.scale + viewport.y;
    return [worldX, worldY];
  }, [viewport]);
  
  // Render grid layer
  const renderGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!settings.showGrid) return;
    
    const { width, height, x, y, scale } = viewport;
    
    // Calculate grid size based on scale
    const gridSize = 50 * scale;
    
    // Calculate grid offset
    const offsetX = (x * scale) % gridSize;
    const offsetY = (y * scale) % gridSize;
    
    // Draw grid
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = -offsetX; i <= width; i += gridSize) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
    }
    
    // Horizontal lines
    for (let i = -offsetY; i <= height; i += gridSize) {
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
    }
    
    ctx.stroke();
  }, [viewport, settings.showGrid]);
  
  // Render map
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    
    // Render grid
    renderGrid(ctx);
    
    // Render layers
    for (const layer of sortedLayers) {
      if (layer.visible) {
        // Save context
        ctx.save();
        
        // Render layer
        layer.render(ctx, viewport, settings);
        
        // Restore context
        ctx.restore();
      }
    }
    
    // Render selection
    if (selection.length > 0) {
      ctx.save();
      
      for (const selected of selection) {
        if (selected.selected) {
          const [screenX, screenY] = worldToScreen(
            selected.coordinates.x,
            selected.coordinates.y
          );
          
          // Draw selection circle
          ctx.beginPath();
          ctx.strokeStyle = selected.highlightColor || '#ffcc00';
          ctx.lineWidth = 2;
          ctx.arc(screenX, screenY, 20 * viewport.scale, 0, Math.PI * 2);
          ctx.stroke();
          
          // Draw pulsing effect
          const pulseSize = 20 * viewport.scale + Math.sin(Date.now() / 200) * 5;
          ctx.beginPath();
          ctx.strokeStyle = selected.highlightColor || 'rgba(255, 204, 0, 0.5)';
          ctx.lineWidth = 1;
          ctx.arc(screenX, screenY, pulseSize, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      ctx.restore();
    }
    
    // Request next frame
    animationFrameRef.current = requestAnimationFrame(renderMap);
  }, [viewport, settings, sortedLayers, selection, worldToScreen, renderGrid]);
  
  // Start and cleanup animation frame
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(renderMap);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderMap]);
  
  // Pan map when dragging
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!allowPanning) return;
    
    setIsPanning(true);
    setLastMousePos({
      x: e.clientX,
      y: e.clientY
    });
  }, [allowPanning]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning || !allowPanning) return;
    
    const dx = (e.clientX - lastMousePos.x) / viewport.scale;
    const dy = (e.clientY - lastMousePos.y) / viewport.scale;
    
    setViewport(prev => {
      const newViewport = {
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy
      };
      
      if (onViewportChange) {
        onViewportChange(newViewport);
      }
      
      return newViewport;
    });
    
    setLastMousePos({
      x: e.clientX,
      y: e.clientY
    });
  }, [isPanning, allowPanning, lastMousePos, viewport.scale, onViewportChange]);
  
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);
  
  // Handle map click
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to world coordinates
    const [worldX, worldY] = screenToWorld(x, y);
    
    // Check if clicked on an entity
    const entityClicked = false;
    
    // Call onMapClick if no entity was clicked
    if (!entityClicked && onMapClick) {
      onMapClick(worldX, worldY);
    }
  }, [isPanning, screenToWorld, onMapClick]);
  
  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!allowZooming) return;
    
    e.preventDefault();
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = viewport.scale * scaleFactor;
    
    // Limit scale
    if (newScale < 0.1 || newScale > 10) return;
    
    setViewport(prev => {
      const newViewport = {
        ...prev,
        scale: newScale
      };
      
      if (onViewportChange) {
        onViewportChange(newViewport);
      }
      
      return newViewport;
    });
  }, [allowZooming, viewport.scale, onViewportChange]);
  
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        id={id}
        width={width}
        height={height}
        className="cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
    </div>
  );
};

export default BaseMap;