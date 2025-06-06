import { useCallback, useEffect } from 'react';
import
  {
    BrushState,
    ChartCoordinationManager,
    ChartState,
    ColorScale,
    HighlightState,
    ViewportState,
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
  const manager = ChartCoordinationManager.getInstance();

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
        manager.subscribe(chartId, 'viewport-change', (event) => {
          onViewportChange?.(event.state.viewport as ViewportState);
        })
      );
    }

    if (onBrushChange) {
      subscriptions.push(
        manager.subscribe(chartId, 'brush-change', (event) => {
          onBrushChange?.(event.state.brush as BrushState);
        })
      );
    }

    if (onHighlightChange) {
      subscriptions.push(
        manager.subscribe(chartId, 'highlight-change', (event) => {
          onHighlightChange?.(event.state.highlight as HighlightState);
        })
      );
    }

    if (onColorScaleChange) {
      subscriptions.push(
        manager.subscribe(chartId, 'color-scale-change', (event) => {
          onColorScaleChange?.(event.state.colorScales as Record<string, ColorScale>);
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
