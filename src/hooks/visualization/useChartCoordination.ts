import { useCallback, useEffect } from 'react';
import {
    BrushState,
    ChartState,
    ColorScale,
    HighlightState,
    ViewportState,
    chartCoordinationManager,
} from '../../lib/visualization/ChartCoordinationManager';

interface UseChartCoordinationProps {
  chartId: string;
  groupId?: string;
  initialState?: Partial<ChartState>;
  onViewportChange?: (viewport: ViewportState) => void;
  onBrushChange?: (brush: BrushState) => void;
  onHighlightChange?: (highlight: HighlightState) => void;
  onColorScaleChange?: (colorScales: Record<string, ColorScale>) => void;
}

/**
 * Hook for integrating a chart with the coordination manager
 */
export function useChartCoordination({
  chartId,
  groupId,
  initialState,
  onViewportChange,
  onBrushChange,
  onHighlightChange,
  onColorScaleChange,
}: UseChartCoordinationProps) {
  const manager = chartCoordinationManager;

  // Register chart with manager
  useEffect(() => {
    manager.registerChart(chartId, initialState as ChartState);

    // Add to group if specified
    if (groupId) {
      manager.linkCharts([chartId], groupId);
    }

    return () => {
      if (groupId) {
        manager.unlinkCharts([chartId], groupId);
      }
      manager.unregisterChart(chartId);
    };
  }, [chartId, groupId, initialState]);

  // Subscribe to events
  useEffect(() => {
    const subscriptions: (() => void)[] = [];

    if (onViewportChange) {
      subscriptions.push(
        manager.subscribeToChartEvents(chartId, 'viewport-change', event => {
          if (event.state.viewport) {
            onViewportChange(event.state.viewport);
          }
        })
      );
    }

    if (onBrushChange) {
      subscriptions.push(
        manager.subscribeToChartEvents(chartId, 'brush-change', event => {
          if (event.state.brush) {
            onBrushChange(event.state.brush);
          }
        })
      );
    }

    if (onHighlightChange) {
      subscriptions.push(
        manager.subscribeToChartEvents(chartId, 'highlight-change', event => {
          if (event.state.highlight) {
            onHighlightChange(event.state.highlight);
          }
        })
      );
    }

    if (onColorScaleChange) {
      subscriptions.push(
        manager.subscribeToChartEvents(chartId, 'color-scale-change', event => {
          if (event.state.colorScales) {
            onColorScaleChange(event.state.colorScales);
          }
        })
      );
    }

    return () => {
      subscriptions.forEach((unsubscribe: () => void) => unsubscribe());
    };
  }, [chartId, onViewportChange, onBrushChange, onHighlightChange, onColorScaleChange]);

  // Update handlers
  const updateViewport = useCallback(
    (viewport: ViewportState) => {
      manager.updateChartState(chartId, { viewport } as ChartState);
    },
    [chartId]
  );

  const updateBrush = useCallback(
    (brush: BrushState) => {
      manager.updateChartState(chartId, { brush } as ChartState);
    },
    [chartId]
  );

  const updateHighlight = useCallback(
    (highlight: HighlightState) => {
      manager.updateChartState(chartId, { highlight } as ChartState);
    },
    [chartId]
  );

  const updateColorScale = useCallback(
    (colorScales: Record<string, ColorScale>) => {
      manager.updateChartState(chartId, { colorScales } as ChartState);
    },
    [chartId]
  );

  return {
    updateViewport,
    updateBrush,
    updateHighlight,
    updateColorScale,
    getChartState: () => manager.getChartState(chartId)!,
    getLinkedCharts: (groupId: string) => manager.getLinkedCharts(groupId),
  };
}
