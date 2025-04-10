import * as React from 'react';
import {
  TooltipRenderer,
  VisualizationValue,
} from '../../../../types/exploration/AnalysisComponentTypes';
import { ChartTooltipProps } from './BaseChart';

/**
 * Type for Recharts payload items
 */
interface TooltipPayloadItem {
  value: VisualizationValue;
  name?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * TooltipAdapter acts as a bridge between the Recharts tooltip component system
 * and our type-safe tooltip renderer functions. It takes a renderer function that
 * works with strongly-typed data objects and adapts it to work with Recharts'
 * tooltip component props?.
 */
interface TooltipAdapterProps<T> extends ChartTooltipProps {
  renderer: TooltipRenderer<T>;
  /**
   * Optional mapping function to convert from Recharts payload to your data type
   * If not provided, will try to use the first payload item's payload property
   */
  dataMapper?: (payload: TooltipPayloadItem[]) => T;
}

/**
 * Generic tooltip adapter that can work with unknown data type
 */
export function TooltipAdapter<T>({
  active,
  payload,
  renderer,
  dataMapper,
}: TooltipAdapterProps<T>): React.ReactElement | null {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Extract the data item from the payload
  let dataItem: T;

  if (dataMapper) {
    // Use the provided mapper function
    dataItem = dataMapper(payload as TooltipPayloadItem[]);
  } else {
    // Default behavior - use the first payload item
    dataItem = (payload[0] as TooltipPayloadItem).payload as unknown as T;
  }

  // Use the renderer function with the extracted data
  return renderer(dataItem) as React.ReactElement;
}

/**
 * Creates a tooltip component that uses the given renderer function
 * This is a convenience function to avoid having to use the adapter directly
 */
export function createTooltipComponent<T>(
  renderer: TooltipRenderer<T>,
  dataMapper?: (payload: TooltipPayloadItem[]) => T
): React.FC<ChartTooltipProps> {
  return (props: ChartTooltipProps) => (
    <TooltipAdapter<T> {...props} renderer={renderer} dataMapper={dataMapper} />
  );
}
