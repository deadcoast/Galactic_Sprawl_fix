import * as React from "react";
import { useState } from 'react';
import { useChartCoordination } from '../../../hooks/visualization/useChartCoordination';
import {
  BrushState,
  HighlightState,
  ViewportState,
} from '../../../lib/visualization/ChartCoordinationManager';

interface ChartCoordinationDemoProps {
  width?: number;
  height?: number;
  className?: string;
}

/**
 * ChartCoordinationDemo
 *
 * A demo component that shows how multiple charts can be coordinated for:
 * - Synchronized zooming/panning
 * - Linked brushing
 * - Synchronized highlighting
 * - Shared color scales
 */
export const ChartCoordinationDemo: React.FC<ChartCoordinationDemoProps> = ({
  width = 1200,
  height = 800,
  className = '',
}) => {
  // Sample data
  const data = React.useMemo(() => {
    const points = [];
    for (let i = 0; i < 100; i++) {
      points.push({
        id: `point-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        category: Math.random() > 0.5 ? 'A' : 'B',
        value: Math.random() * 100,
      });
    }
    return points;
  }, []);

  // Chart states
  const [scatterViewport, setScatterViewport] = useState<ViewportState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [scatterBrush, setScatterBrush] = useState<BrushState>({
    active: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });
  const [scatterHighlight, setScatterHighlight] = useState<HighlightState>({
    active: false,
    dataIds: [],
  });

  const [barViewport, setBarViewport] = useState<ViewportState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [barHighlight, setBarHighlight] = useState<HighlightState>({
    active: false,
    dataIds: [],
  });

  // Set up chart coordination
  const scatterCoordination = useChartCoordination({
    chartId: 'scatter-plot',
    groupId: 'demo-group',
    initialState: {
      viewport: scatterViewport,
      brush: scatterBrush,
      highlight: scatterHighlight,
    },
    onViewportChange: setScatterViewport,
    onBrushChange: setScatterBrush,
    onHighlightChange: setScatterHighlight,
  });

  const barCoordination = useChartCoordination({
    chartId: 'bar-chart',
    groupId: 'demo-group',
    initialState: {
      viewport: barViewport,
      highlight: barHighlight,
    },
    onViewportChange: setBarViewport,
    onHighlightChange: setBarHighlight,
  });

  // Handle interactions
  const handleScatterZoom = (scale: number, translateX: number, translateY: number) => {
    scatterCoordination.updateViewport({ scale, translateX, translateY });
  };

  const handleScatterBrush = (x1: number, y1: number, x2: number, y2: number) => {
    // Find points within brush
    const selectedPoints = data?.filter(
      point =>
        point.x >= Math.min(x1, x2) &&
        point.x <= Math.max(x1, x2) &&
        point.y >= Math.min(y1, y2) &&
        point.y <= Math.max(y1, y2)
    );

    scatterCoordination.updateBrush({
      active: true,
      x1,
      y1,
      x2,
      y2,
    });

    scatterCoordination.updateHighlight({
      active: true,
      dataIds: selectedPoints.map(p => p.id),
    });
  };

  const handleBarHighlight = (category: string) => {
    const selectedPoints = data?.filter(point => point.category === category);

    barCoordination.updateHighlight({
      active: true,
      dataIds: selectedPoints.map(p => p.id),
      category,
    });
  };

  return (
    <div className={`chart-coordination-demo ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          {/* Scatter Plot */}
          <div className="flex-1 rounded-lg border p-4 shadow-sm">
            <h3 className="mb-2 text-lg font-bold">Scatter Plot</h3>
            <div
              className="relative"
              style={{
                width: width / 2 - 32,
                height: height - 200,
                transform: `scale(${scatterViewport.scale}) translate(${scatterViewport.translateX}px, ${scatterViewport.translateY}px)`,
              }}
            >
              {/* Plot points */}
              {data?.map(point => (
                <div
                  key={point.id}
                  className={`absolute h-3 w-3 rounded-full transition-opacity ${
                    scatterHighlight.active && !scatterHighlight.dataIds.includes(point.id)
                      ? 'opacity-20'
                      : 'opacity-100'
                  }`}
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    backgroundColor: point.category === 'A' ? '#3B82F6' : '#EF4444',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}

              {/* Brush overlay */}
              {scatterBrush.active && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/10"
                  style={{
                    left: `${Math.min(scatterBrush.x1, scatterBrush.x2)}%`,
                    top: `${Math.min(scatterBrush.y1, scatterBrush.y2)}%`,
                    width: `${Math.abs(scatterBrush.x2 - scatterBrush.x1)}%`,
                    height: `${Math.abs(scatterBrush.y2 - scatterBrush.y1)}%`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex-1 rounded-lg border p-4 shadow-sm">
            <h3 className="mb-2 text-lg font-bold">Bar Chart</h3>
            <div
              className="relative"
              style={{
                width: width / 2 - 32,
                height: height - 200,
                transform: `scale(${barViewport.scale}) translate(${barViewport.translateX}px, ${barViewport.translateY}px)`,
              }}
            >
              {/* Category bars */}
              {['A', 'B'].map(category => {
                const categoryPoints = data?.filter(p => p.category === category);
                const average =
                  categoryPoints.reduce((sum, p) => sum + p.value, 0) / categoryPoints.length;

                return (
                  <div
                    key={category}
                    className={`absolute bottom-0 w-32 transition-opacity ${
                      barHighlight.active && barHighlight.category !== category
                        ? 'opacity-20'
                        : 'opacity-100'
                    }`}
                    style={{
                      left: category === 'A' ? '30%' : '60%',
                      height: `${average}%`,
                      backgroundColor: category === 'A' ? '#3B82F6' : '#EF4444',
                    }}
                    onClick={() => handleBarHighlight(category)}
                  >
                    <div className="absolute -top-6 w-full text-center">{category}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-bold">Controls</h3>
          <div className="flex gap-4">
            <div>
              <label className="block font-medium">Zoom</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={scatterViewport.scale}
                onChange={e => handleScatterZoom(parseFloat(e.target.value), 0, 0)}
                className="w-48"
              />
            </div>
            <button
              className="rounded bg-blue-500 px-4 py-2 text-white"
              onClick={() => {
                scatterCoordination.updateBrush({
                  active: false,
                  x1: 0,
                  y1: 0,
                  x2: 0,
                  y2: 0,
                });
                scatterCoordination.updateHighlight({
                  active: false,
                  dataIds: [],
                });
                barCoordination.updateHighlight({
                  active: false,
                  dataIds: [],
                });
              }}
            >
              Reset Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartCoordinationDemo;
