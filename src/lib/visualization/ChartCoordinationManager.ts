import { EventEmitter } from '../events/EventEmitter';

export interface ViewportState {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface BrushState {
  active: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface HighlightState {
  active: boolean;
  dataIds: string[];
  category?: string;
  value?: number;
}

export interface ColorScale {
  domain: [number, number];
  range: string[];
  type: 'linear' | 'ordinal';
}

export interface ChartState {
  id: string;
  viewport: ViewportState;
  brush: BrushState;
  highlight: HighlightState;
  colorScales: Record<string, ColorScale>;
}

export type ChartEventType =
  | 'viewport-change'
  | 'brush-change'
  | 'highlight-change'
  | 'color-scale-change';

export interface ChartEvent {
  type: ChartEventType;
  chartId: string;
  state: Partial<ChartState>;
  propagate?: boolean;
}

interface ChartEvents {
  [key: string]: ChartEvent;
  [key: `${string}:viewport-change`]: ChartEvent;
  [key: `${string}:brush-change`]: ChartEvent;
  [key: `${string}:highlight-change`]: ChartEvent;
  [key: `${string}:color-scale-change`]: ChartEvent;
}

/**
 * ChartCoordinationManager
 *
 * Manages synchronized interactions between multiple charts, including:
 * - Synchronized zooming/panning
 * - Linked brushing
 * - Synchronized highlighting
 * - Shared color scales
 */
export class ChartCoordinationManager {
  private static instance: ChartCoordinationManager;
  private eventEmitter: EventEmitter<ChartEvents>;
  private charts: Map<string, ChartState>;
  private linkedGroups: Map<string, Set<string>>;

  private constructor() {
    this.eventEmitter = new EventEmitter<ChartEvents>();
    this.charts = new Map();
    this.linkedGroups = new Map();
  }

  public static getInstance(): ChartCoordinationManager {
    if (!ChartCoordinationManager.instance) {
      ChartCoordinationManager.instance = new ChartCoordinationManager();
    }
    return ChartCoordinationManager.instance;
  }

  /**
   * Register a chart with the coordination manager
   */
  public registerChart(chartId: string, initialState?: Partial<ChartState>): void {
    const defaultState: ChartState = {
      id: chartId,
      viewport: { scale: 1, translateX: 0, translateY: 0 },
      brush: { active: false, x1: 0, y1: 0, x2: 0, y2: 0 },
      highlight: { active: false, dataIds: [] },
      colorScales: {},
    };

    this.charts.set(chartId, {
      ...defaultState,
      ...initialState,
    });
  }

  /**
   * Unregister a chart
   */
  public unregisterChart(chartId: string): void {
    this.charts.delete(chartId);
    // Remove from all linked groups
    this.linkedGroups.forEach(group => group.delete(chartId));
  }

  /**
   * Link charts together for synchronized interactions
   */
  public linkCharts(chartIds: string[], groupId: string): void {
    const group = this.linkedGroups.get(groupId) || new Set();
    chartIds.forEach(id => group.add(id));
    this.linkedGroups.set(groupId, group);
  }

  /**
   * Unlink charts
   */
  public unlinkCharts(chartIds: string[], groupId: string): void {
    const group = this.linkedGroups.get(groupId);
    if (group) {
      chartIds.forEach(id => group.delete(id));
      if (group.size === 0) {
        this.linkedGroups.delete(groupId);
      }
    }
  }

  /**
   * Update chart state and notify linked charts
   */
  public updateChartState(chartId: string, update: Partial<ChartState>, propagate = true): void {
    const chart = this.charts.get(chartId);
    if (!chart) return;

    // Update chart state
    this.charts.set(chartId, {
      ...chart,
      ...update,
    });

    if (propagate) {
      // Find all groups containing this chart
      this.linkedGroups.forEach(group => {
        if (group.has(chartId)) {
          // Notify all other charts in the group
          group.forEach(linkedChartId => {
            if (linkedChartId !== chartId) {
              this.notifyChartUpdate(linkedChartId, update);
            }
          });
        }
      });
    }
  }

  /**
   * Subscribe to chart events
   */
  public subscribe(
    chartId: string,
    eventType: ChartEventType,
    callback: (event: ChartEvent) => void
  ): () => void {
    const eventName = `${chartId}:${eventType}` as keyof ChartEvents;
    const unsubscribe = (event: ChartEvent) => callback(event);
    this.eventEmitter.on(eventName, unsubscribe);
    return () => this.eventEmitter.off(eventName, unsubscribe);
  }

  /**
   * Emit a chart event
   */
  public emit(event: ChartEvent): void {
    const eventName = `${event?.chartId}:${event?.type}` as keyof ChartEvents;
    this.eventEmitter.emit(eventName, event);
  }

  /**
   * Get current state of a chart
   */
  public getChartState(chartId: string): ChartState | undefined {
    return this.charts.get(chartId);
  }

  /**
   * Get all charts in a linked group
   */
  public getLinkedCharts(groupId: string): string[] {
    const group = this.linkedGroups.get(groupId);
    return group ? Array.from(group) : [];
  }

  /**
   * Notify a chart of state updates
   */
  private notifyChartUpdate(chartId: string, update: Partial<ChartState>): void {
    // Determine event type based on what changed
    if (update.viewport) {
      this.emit({
        type: 'viewport-change',
        chartId,
        state: { viewport: update.viewport },
        propagate: false,
      });
    }
    if (update.brush) {
      this.emit({
        type: 'brush-change',
        chartId,
        state: { brush: update.brush },
        propagate: false,
      });
    }
    if (update.highlight) {
      this.emit({
        type: 'highlight-change',
        chartId,
        state: { highlight: update.highlight },
        propagate: false,
      });
    }
    if (update.colorScales) {
      this.emit({
        type: 'color-scale-change',
        chartId,
        state: { colorScales: update.colorScales },
        propagate: false,
      });
    }
  }
}
