import { CircularProgress, Paper, Typography } from '@mui/material';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useService } from '../../hooks/services/useService';
import { DataPoint, anomalyDetectionService } from '../../services/AnomalyDetectionService';

interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

interface ChartCoordination {
  updateViewport: (viewport: ViewportState) => void;
  updateHighlight: (point: DataPoint | null) => void;
}

// Mock useChartCoordination until it's implemented
const useChartCoordination = ({
  _chartId,
  _groupId,
  _initialState,
  onViewportChange,
  onHighlightChange,
}: {
  _chartId: string;
  _groupId?: string;
  _initialState: {
    viewport: ViewportState;
    highlight: DataPoint | null;
  };
  onViewportChange: (viewport: ViewportState) => void;
  onHighlightChange: (point: DataPoint | null) => void;
}): ChartCoordination => {
  return {
    updateViewport: onViewportChange,
    updateHighlight: onHighlightChange,
  };
};

interface AnomalyVisualizationProps {
  width?: number;
  height?: number;
  data: DataPoint[];
  dimensions: [number, number]; // Which dimensions to plot [x, y]
  chartId: string;
  groupId?: string;
}

export function AnomalyVisualization({
  width = 800,
  height = 600,
  data,
  dimensions,
  chartId,
  groupId,
}: AnomalyVisualizationProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: 1 });
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  // Get anomaly detection service
  const { service: anomalyService, isLoading } =
    useService<typeof anomalyDetectionService>('anomalyDetection');

  // Setup chart coordination
  const { updateViewport, updateHighlight } = useChartCoordination({
    _chartId: chartId,
    _groupId: groupId,
    _initialState: {
      viewport,
      highlight: null,
    },
    onViewportChange: setViewport,
    onHighlightChange: (point: DataPoint | null) => setHoveredPoint(point),
  });

  // Calculate anomaly scores when data changes
  useEffect(() => {
    if (!anomalyService || !data.length) return;

    const detectAnomalies = async () => {
      try {
        (anomalyService as typeof anomalyDetectionService).addDataPoints(data);
        await (anomalyService as typeof anomalyDetectionService).detectAnomalies('statistical');
      } catch (error) {
        console.error('Error detecting anomalies:', error);
      }
    };

    detectAnomalies();
  }, [anomalyService, data]);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !anomalyService) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply viewport transform
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.scale, viewport.scale);

    // Draw points
    data.forEach(point => {
      const x = point.values[dimensions[0]];
      const y = point.values[dimensions[1]];
      const score = (anomalyService as typeof anomalyDetectionService).getAnomalyScore(point.id);

      // Determine point color based on anomaly score
      if (score) {
        const intensity = Math.floor(score.score * 255);
        ctx.fillStyle = `rgb(${intensity}, 0, 0)`;
      } else {
        ctx.fillStyle = 'blue';
      }

      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, point === hoveredPoint ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [data, dimensions, viewport, hoveredPoint, anomalyService]);

  // Draw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle mouse interactions
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - viewport.x) / viewport.scale;
      const y = (event.clientY - rect.top - viewport.y) / viewport.scale;

      // Find nearest point
      const nearest = data.reduce(
        (nearest, point) => {
          const px = point.values[dimensions[0]];
          const py = point.values[dimensions[1]];
          const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));

          if (!nearest || distance < nearest.distance) {
            return { point, distance };
          }
          return nearest;
        },
        null as { point: DataPoint; distance: number } | null
      );

      if (nearest && nearest.distance < 10 / viewport.scale) {
        updateHighlight(nearest.point);
      } else {
        updateHighlight(null);
      }
    },
    [data, dimensions, viewport, updateHighlight]
  );

  // Handle wheel zoom
  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const delta = -event.deltaY;
      const scale = viewport.scale * (1 + delta / 1000);

      updateViewport({
        ...viewport,
        scale: Math.max(0.1, Math.min(10, scale)),
      });
    },
    [viewport, updateViewport]
  );

  if (isLoading) {
    const boxStyle = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height,
    };

    return (
      <div style={boxStyle}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Anomaly Detection Visualization
      </Typography>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ccc' }}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      />
      {hoveredPoint && (
        <div style={{ marginTop: '8px' }}>
          <Typography variant="body2">
            Point ID: {hoveredPoint.id}
            {(anomalyService as typeof anomalyDetectionService)
              .getAnomalyScore(hoveredPoint.id)
              ?.explanation?.map((exp: string, i: number) => (
                <div key={i} style={{ color: 'red' }}>
                  {exp}
                </div>
              ))}
          </Typography>
        </div>
      )}
    </Paper>
  );
}
