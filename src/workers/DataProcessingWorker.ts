/**
 * Web Worker for handling intensive data processing operations
 *
 * This worker offloads computationally expensive operations from the main thread,
 * ensuring the UI remains responsive even when processing large datasets.
 */

// Message types for worker communication
export enum WorkerMessageType {
  PROCESS_CLUSTERING = 'PROCESS_CLUSTERING',
  PROCESS_PREDICTION = 'PROCESS_PREDICTION',
  PROCESS_RESOURCE_MAPPING = 'PROCESS_RESOURCE_MAPPING',
  TRANSFORM_DATA = 'TRANSFORM_DATA',
  DATA_SORTING = 'DATA_SORTING',
  DATA_FILTERING = 'DATA_FILTERING',
  CALCULATE_STATISTICS = 'CALCULATE_STATISTICS',
}

// Base message interface
interface WorkerMessage {
  type: WorkerMessageType;
  id: string; // For matching requests with responses
  payload: unknown;
}

// Response interface
interface WorkerResponse {
  id: string;
  result: unknown;
  error?: string;
}

// Statistics calculation payload
interface StatisticsPayload {
  data: number[];
  operations: ('mean' | 'median' | 'mode' | 'stdDev' | 'variance' | 'min' | 'max' | 'sum')[];
}

// Statistics calculation result
interface StatisticsResult {
  mean?: number;
  median?: number;
  mode?: number[];
  stdDev?: number;
  variance?: number;
  min?: number;
  max?: number;
  sum?: number;
}

// Data sorting payload
interface SortingPayload {
  data: Record<string, unknown>[];
  key: string;
  order: 'asc' | 'desc';
}

// Data filtering payload
interface FilteringPayload {
  data: Record<string, unknown>[];
  conditions: {
    key: string;
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
    value: unknown;
  }[];
  matchAll: boolean; // If true, all conditions must match (AND), otherwise unknown condition must match (OR)
}

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event?.data ?? {};

  try {
    let result;

    switch (type) {
      case WorkerMessageType.PROCESS_CLUSTERING:
        result = processClustering(payload);
        break;

      case WorkerMessageType.PROCESS_PREDICTION:
        result = processPrediction(payload);
        break;

      case WorkerMessageType.PROCESS_RESOURCE_MAPPING:
        result = processResourceMapping(payload);
        break;

      case WorkerMessageType.TRANSFORM_DATA:
        result = transformData(payload);
        break;

      case WorkerMessageType.DATA_SORTING:
        result = sortData(payload as SortingPayload);
        break;

      case WorkerMessageType.DATA_FILTERING:
        result = filterData(payload as FilteringPayload);
        break;

      case WorkerMessageType.CALCULATE_STATISTICS:
        result = calculateStatistics(payload as StatisticsPayload);
        break;

      default:
        throw new Error(`Unknown message type: ${'type'}`);
    }

    // Send the successful result back to the main thread
    const response: WorkerResponse = {
      id,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    // Send the error back to the main thread
    const response: WorkerResponse = {
      id,
      result: null,
      error: error instanceof Error ? error.message : String(error),
    };

    self.postMessage(response);
  }
});

/**
 * Process clustering data
 */
function processClustering(payload: unknown): unknown {
  // Clustering implementation would go here
  // For now, just echo back the payload
  return payload;
}

/**
 * Process prediction data
 */
function processPrediction(payload: unknown): unknown {
  // Prediction implementation would go here
  // For now, just echo back the payload
  return payload;
}

/**
 * Process resource mapping data
 */
function processResourceMapping(payload: unknown): unknown {
  // Resource mapping implementation would go here
  // For now, just echo back the payload
  return payload;
}

/**
 * Transform data
 */
function transformData(payload: unknown): unknown {
  // Data transformation implementation would go here
  // For now, just echo back the payload
  return payload;
}

/**
 * Sort data by key
 */
function sortData(payload: SortingPayload): Record<string, unknown>[] {
  const { data, key, order } = payload;

  return [...data].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    // Handle null/undefined values
    if (aValue == null && bValue == null) {
      return 0;
    }
    if (aValue == null) {
      return order === 'asc' ? -1 : 1;
    }
    if (bValue == null) {
      return order === 'asc' ? 1 : -1;
    }

    // Compare numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Convert to strings for comparison
    const aString = String('aValue');
    const bString = String('bValue');

    return order === 'asc' ? aString.localeCompare(bString) : bString.localeCompare(aString);
  });
}

/**
 * Filter data based on conditions
 */
function filterData(payload: FilteringPayload): Record<string, unknown>[] {
  const { data, conditions, matchAll } = payload;

  return data?.filter(item => {
    // Check each condition against the item
    const results = conditions.map(condition => {
      const { key, operator, value } = condition;
      const itemValue = item[key];

      switch (operator) {
        case '==':
          return itemValue === value;
        case '!=':
          return itemValue !== value;
        case '>':
          return typeof itemValue === 'number' && typeof value === 'number' && itemValue > value;
        case '<':
          return typeof itemValue === 'number' && typeof value === 'number' && itemValue < value;
        case '>=':
          return typeof itemValue === 'number' && typeof value === 'number' && itemValue >= value;
        case '<=':
          return typeof itemValue === 'number' && typeof value === 'number' && itemValue <= value;
        case 'contains':
          return (
            typeof itemValue === 'string' &&
            typeof value === 'string' &&
            itemValue.toLowerCase().includes(value.toLowerCase())
          );
        case 'startsWith':
          return (
            typeof itemValue === 'string' &&
            typeof value === 'string' &&
            itemValue.toLowerCase().startsWith(value.toLowerCase())
          );
        case 'endsWith':
          return (
            typeof itemValue === 'string' &&
            typeof value === 'string' &&
            itemValue.toLowerCase().endsWith(value.toLowerCase())
          );
        default:
          return false;
      }
    });

    // Combine results based on matchAll
    return matchAll
      ? results.every(result => result) // AND logic - all must match
      : results.some(result => result); // OR logic - unknown can match
  });
}

/**
 * Calculate statistics on numerical data
 */
function calculateStatistics(payload: StatisticsPayload): StatisticsResult {
  const { data, operations } = payload;
  const result: StatisticsResult = {};

  // Check if data is valid
  if (!data || !Array.isArray(data) || data?.length === 0) {
    return result;
  }

  // Filter out non-numeric values
  const numericData = data?.filter(value => typeof value === 'number' && !isNaN(value));

  if (numericData.length === 0) {
    return result;
  }

  // Calculate requested statistics
  operations.forEach(op => {
    switch (op) {
      case 'mean': {
        result.mean = numericData.reduce((sum, value) => sum + value, 0) / numericData.length;
        break;
      }

      case 'median': {
        const sorted = [...numericData].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        result.median =
          sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
        break;
      }

      case 'mode': {
        const counts: Record<number, number> = {};
        numericData.forEach(value => {
          counts[value] = (counts[value] ?? 0) + 1;
        });

        let maxCount = 0;
        let modes: number[] = [];

        for (const [value, count] of Object.entries(counts)) {
          const numValue = Number(value);
          if (count > maxCount) {
            maxCount = count;
            modes = [numValue];
          } else if (count === maxCount) {
            modes.push(numValue);
          }
        }

        result.mode = modes;
        break;
      }

      case 'min': {
        result.min = Math.min(...numericData);
        break;
      }

      case 'max': {
        result.max = Math.max(...numericData);
        break;
      }

      case 'sum': {
        result.sum = numericData.reduce((sum, value) => sum + value, 0);
        break;
      }

      case 'variance': {
        const mean = numericData.reduce((sum, value) => sum + value, 0) / numericData.length;
        result.variance =
          numericData.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
          numericData.length;
        break;
      }

      case 'stdDev': {
        const meanForStdDev =
          numericData.reduce((sum, value) => sum + value, 0) / numericData.length;
        const variance =
          numericData.reduce((sum, value) => sum + Math.pow(value - meanForStdDev, 2), 0) /
          numericData.length;
        result.stdDev = Math.sqrt(variance);
        break;
      }
    }
  });

  return result;
}
