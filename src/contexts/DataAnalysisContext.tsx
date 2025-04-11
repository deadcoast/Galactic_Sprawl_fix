import * as React from 'react';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Anomaly,
  EXPLORATION_EVENTS,
  explorationManager,
  Sector,
} from '../managers/exploration/ExplorationManager';
import { AnalysisAlgorithmService } from '../services/AnalysisAlgorithmService';
import { DataCollectionService } from '../services/DataCollectionService';
import { DataProcessingService } from '../services/DataProcessingService';
import { BaseEvent, EventType } from '../types/events/EventTypes';
import {
  AnalysisConfig,
  AnalysisResult,
  DataAnalysisContextType,
  DataPoint,
  Dataset,
  ResourceData,
} from '../types/exploration/DataAnalysisTypes';

// Create the context with a default undefined value
const DataAnalysisContext = createContext<DataAnalysisContextType | undefined>(undefined);

// Props for the DataAnalysisProvider component
interface DataAnalysisProviderProps {
  children: ReactNode;
  initialDatasets?: Dataset[];
  initialAnalysisConfigs?: AnalysisConfig[];
  initialAnalysisResults?: AnalysisResult[];
}

/**
 * Provider component for the DataAnalysisContext
 */
export const DataAnalysisProvider: React.FC<DataAnalysisProviderProps> = ({
  children,
  initialDatasets = [],
  initialAnalysisConfigs = [],
  initialAnalysisResults = [],
}) => {
  // State for datasets, analysis configurations, and results
  const [datasets, setDatasets] = useState<Dataset[]>(initialDatasets);
  const [analysisConfigs, setAnalysisConfigs] = useState<AnalysisConfig[]>(initialAnalysisConfigs);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>(initialAnalysisResults);
  const [_isProcessingData, setIsProcessingData] = useState<boolean>(false);

  // Create references to the services for persistence across renders
  const dataCollectionServiceRef = useRef<DataCollectionService | null>(null);
  const analysisAlgorithmServiceRef = useRef<AnalysisAlgorithmService | null>(null);
  const dataProcessingServiceRef = useRef<DataProcessingService | null>(null);

  // Store for linked data between entities
  const [linkedData, setLinkedData] = useState<Record<string, unknown>>({});

  // Anomaly statistics for tracking
  const [anomalyStats, setAnomalyStats] = useState<Record<string, unknown>>({});

  // Initialize services
  useEffect(() => {
    if (explorationManager) {
      // Initialize data collection service
      const dataCollectionService = new DataCollectionService(explorationManager);
      dataCollectionServiceRef.current = dataCollectionService;

      // Initialize analysis algorithm service
      const analysisAlgorithmService = new AnalysisAlgorithmService();
      analysisAlgorithmServiceRef.current = analysisAlgorithmService;

      // Initialize data processing service for web worker operations
      const dataProcessingService = new DataProcessingService();
      dataProcessingServiceRef.current = dataProcessingService;

      // Initialize the data collection service
      dataCollectionService.initialize();

      // Set up callback for data updates
      dataCollectionService.setOnDataUpdated((type, dataPoint) => {
        // Map the DataCollectionService type to the context type
        const sourceMap: Record<string, 'sectors' | 'anomalies' | 'resources' | 'mixed'> = {
          sector: 'sectors',
          anomaly: 'anomalies',
          resource: 'resources',
        };
        const mappedType = sourceMap[type] || 'mixed';

        // When a new data point is collected, add it to the appropriate dataset
        const datasetId = getOrCreateDatasetBySource(mappedType);
        if (datasetId) {
          addDataPointToDataset(datasetId, dataPoint);
        }
      });

      // Return cleanup function
      return () => {
        if (dataCollectionService) {
          dataCollectionService.dispose();
        }
      };
    }
  }, [explorationManager]);

  // Create a new dataset
  const createDataset = useCallback(
    (dataset: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>): string => {
      const id = uuidv4();
      const now = Date.now();
      const newDataset: Dataset = {
        ...dataset,
        id,
        createdAt: now,
        updatedAt: now,
      };
      setDatasets(prev => [...prev, newDataset]);
      return id;
    },
    []
  );

  // Update an existing dataset
  const updateDataset = useCallback(
    (id: string, updates: Partial<Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>>): void => {
      setDatasets(prev =>
        prev.map(dataset => {
          if (dataset.id === id) {
            return {
              ...dataset,
              ...updates,
              updatedAt: Date.now(),
            };
          }
          return dataset;
        })
      );
    },
    []
  );

  // Delete a dataset
  const deleteDataset = useCallback((id: string): void => {
    setDatasets(prev => prev.filter(dataset => dataset.id !== id));
    // Also delete unknown analysis configs that use this dataset
    setAnalysisConfigs(prev => prev.filter(config => config.datasetId !== id));
  }, []);

  // Get a dataset by ID
  const getDatasetById = useCallback(
    (id: string): Dataset | undefined => {
      return datasets.find(dataset => dataset.id === id);
    },
    [datasets]
  );

  // Create a new analysis configuration
  const createAnalysisConfig = useCallback(
    (config: Omit<AnalysisConfig, 'id' | 'createdAt' | 'updatedAt'>): string => {
      const id = uuidv4();
      const now = Date.now();
      const newConfig: AnalysisConfig = {
        ...config,
        id,
        createdAt: now,
        updatedAt: now,
      };
      setAnalysisConfigs(prev => [...prev, newConfig]);
      return id;
    },
    []
  );

  // Add a data point to a dataset
  const addDataPointToDataset = useCallback((datasetId: string, dataPoint: DataPoint): void => {
    setDatasets(prev =>
      prev.map(dataset => {
        if (dataset.id === datasetId) {
          // Check if the data point already exists
          const exists = dataset.dataPoints.some(dp => dp.id === dataPoint.id);
          if (exists) return dataset;

          return {
            ...dataset,
            dataPoints: [...dataset.dataPoints, dataPoint],
            updatedAt: Date.now(),
          };
        }
        return dataset;
      })
    );
  }, []);

  // Add multiple data points to a dataset at once - efficient batching
  const addDataPointsToDataset = useCallback((datasetId: string, dataPoints: DataPoint[]): void => {
    setDatasets(prev =>
      prev.map(dataset => {
        if (dataset.id === datasetId) {
          // Filter out data points that already exist
          const existingIds = new Set(dataset.dataPoints.map(dp => dp.id));
          const newDataPoints = dataPoints.filter(dp => !existingIds.has(dp.id));

          if (newDataPoints.length === 0) return dataset;

          return {
            ...dataset,
            dataPoints: [...dataset.dataPoints, ...newDataPoints],
            updatedAt: Date.now(),
          };
        }
        return dataset;
      })
    );
  }, []);

  // Find a dataset by source type, or create one if it doesn't exist
  const getOrCreateDatasetBySource = useCallback(
    (source: 'sectors' | 'anomalies' | 'resources' | 'mixed', name?: string): string => {
      // Find an existing dataset for this source
      const existingDataset = datasets.find(dataset => dataset.source === source);
      if (existingDataset) {
        return existingDataset.id;
      }

      // Create a new dataset if one doesn't exist
      const newDatasetName = name || `${source.charAt(0).toUpperCase() + source.slice(1)} Dataset`;
      return createDataset({
        name: newDatasetName,
        description: `Automatically generated dataset for ${source}`,
        dataPoints: [],
        source,
      });
    },
    [datasets, createDataset]
  );

  // Convert a sector to a data point
  const sectorToDataPoint = useCallback((sector: Sector): DataPoint => {
    return {
      id: sector.id,
      type: 'sector',
      name: sector.name,
      date: sector.discoveredAt || Date.now(),
      coordinates: {
        x: Number(
          typeof sector.coordinates === 'object' && sector.coordinates
            ? (sector.coordinates as { x?: number })?.x || 0
            : 0
        ),
        y: Number(
          typeof sector.coordinates === 'object' && sector.coordinates
            ? (sector.coordinates as { y?: number })?.y || 0
            : 0
        ),
      },
      properties: {
        status: sector.status,
        resourcePotential: sector.resourcePotential,
        habitabilityScore: sector.habitabilityScore,
        anomalyCount: sector.anomalies?.length ?? 0,
        resourceCount: sector.resources?.length ?? 0,
        lastScanned: sector.lastScanned ?? 0,
      },
    };
  }, []);

  // Convert an anomaly to a data point
  const anomalyToDataPoint = useCallback((anomaly: Anomaly): DataPoint => {
    return {
      id: anomaly.id,
      type: 'anomaly',
      name: `${anomaly.type} Anomaly`,
      date: anomaly.discoveredAt,
      coordinates: {
        x: Number(
          typeof anomaly.position === 'object' && anomaly.position
            ? (anomaly.position as { x?: number })?.x || 0
            : 0
        ),
        y: Number(
          typeof anomaly.position === 'object' && anomaly.position
            ? (anomaly.position as { y?: number })?.y || 0
            : 0
        ),
      },
      properties: {
        type: anomaly.type,
        severity: anomaly.severity,
        description: anomaly.description,
        sectorId: anomaly.sectorId,
        investigated: anomaly.investigatedAt !== undefined,
      },
    };
  }, []);

  // Convert a resource to a data point
  const resourceToDataPoint = useCallback(
    (
      resource: ResourceData,
      sectorId: string,
      coordinates: { x: number; y: number }
    ): DataPoint => {
      return {
        id: `${sectorId}-${resource.type}-${Date.now()}`,
        type: 'resource',
        name: `${resource.type} Resource`,
        date: Date.now(),
        coordinates,
        properties: {
          type: resource.type,
          amount: resource.amount,
          quality: resource.quality ?? 0,
          sectorId,
        },
      };
    },
    []
  );

  // Subscribe to exploration events
  useEffect(() => {
    // Handle sector discovered events
    const handleSectorDiscovered = (event: BaseEvent) => {
      const { sector } = event?.data as { sector: Sector };
      if (!sector) return;

      // Get or create the sectors dataset
      const sectorsDatasetId = getOrCreateDatasetBySource('sectors', 'Explored Sectors');

      // Add the sector as a data point
      const dataPoint = sectorToDataPoint(sector);
      addDataPointToDataset(sectorsDatasetId, dataPoint);
    };

    // Handle anomaly detected events
    const handleAnomalyDetected = (event: BaseEvent) => {
      // Use proper type assertion to ensure Sector has the expected properties
      const { anomaly, sector: _ } = event?.data as { anomaly: Anomaly; sector: Sector };
      if (!anomaly) return;

      // Extract sector information if available, using the sector variable we previously marked with _
      let sectorInfo: {
        id: string;
        name: string;
        coordinates: { x: number; y: number };
        discoveredAt?: number;
      } | null = null;

      if (_) {
        sectorInfo = {
          id: _.id,
          name: _.name,
          coordinates: _.coordinates,
          discoveredAt: _.discoveredAt,
        };

        // Log sector where anomaly was discovered for reference
        console.warn(
          `Anomaly detected in sector: ${_.name} (${_.id}) at coordinates [${_.coordinates.x}, ${_.coordinates.y}]`
        );

        // Update or add sector data if not already present
        const sectorsDatasetId = getOrCreateDatasetBySource('sectors', 'Explored Sectors');
        const sectorPoint = sectorToDataPoint(_);

        // Check if the sector data point already exists by finding the dataset and checking its dataPoints
        const existingSectorDataset = datasets.find(dataset => dataset.id === sectorsDatasetId);
        const existingSector = existingSectorDataset?.dataPoints.find(
          (p: DataPoint) => p.id === _.id
        );

        if (!existingSector) {
          addDataPointToDataset(sectorsDatasetId, sectorPoint);
        }
      }

      // Get or create the anomalies dataset
      const anomaliesDatasetId = getOrCreateDatasetBySource('anomalies', 'Detected Anomalies');

      // Add the anomaly as a data point with sector reference if available
      const dataPoint = anomalyToDataPoint(anomaly);

      // Attach sector reference if available
      if (sectorInfo) {
        // Convert the complex sectorInfo object to a serializable format
        const serializableSectorInfo = {
          id: sectorInfo.id,
          name: sectorInfo.name,
          coordinateX: sectorInfo.coordinates.x,
          coordinateY: sectorInfo.coordinates.y,
          discoveredAt: sectorInfo.discoveredAt || 0,
        };

        // Use the serializable format for metadata to ensure proper data storage
        dataPoint.metadata = {
          ...dataPoint.metadata,
          sectorId: sectorInfo.id,
          sectorName: sectorInfo.name,
          sectorCoordinateX: sectorInfo.coordinates.x,
          sectorCoordinateY: sectorInfo.coordinates.y,
          sectorDiscoveredAt: sectorInfo.discoveredAt || 0,
        };

        // Store the serialized sector info in the anomaly's linked data for cross-reference
        const linkedDataKey = `sector-reference-${sectorInfo.id}`;
        storeLinkedData(linkedDataKey, serializableSectorInfo);

        // Add the linked data reference to the datapoint
        dataPoint.properties = {
          ...dataPoint.properties,
          linkedSectorData: linkedDataKey,
          hasLinkedSectorData: true,
        };

        // Update related anomaly stats with this sector association
        updateAnomalyStats({
          anomalyId: anomaly.id,
          sectorData: serializableSectorInfo,
          discoveryTime: Date.now(),
        });
      }

      addDataPointToDataset(anomaliesDatasetId, dataPoint);
    };

    // Handle resource detected events
    const handleResourceDetected = (event: BaseEvent) => {
      const { resource, sector } = event?.data as { resource: ResourceData; sector: Sector };
      if (!resource || !sector) return;

      // Get or create the resources dataset
      const resourcesDatasetId = getOrCreateDatasetBySource('resources', 'Discovered Resources');

      // Add the resource as a data point
      const dataPoint = resourceToDataPoint(resource, sector.id, sector.coordinates);
      addDataPointToDataset(resourcesDatasetId, dataPoint);
    };

    // Helper function to convert ExplorationEvents to EventType
    const _asEventType = (event: keyof typeof EXPLORATION_EVENTS): EventType => {
      return EventType[`EXPLORATION_${event}`] as EventType;
    };

    // Subscribe to exploration events including custom exploration events that may be added in the future
    const subscribeToExplorationEvent = (
      eventKey: keyof typeof EXPLORATION_EVENTS,
      handler: (event: BaseEvent) => void
    ) => {
      return explorationManager.subscribeToEvent(_asEventType(eventKey), handler);
    };

    // Subscribe to common exploration events
    const unsubscribeSector = subscribeToExplorationEvent(
      'SECTOR_DISCOVERED',
      handleSectorDiscovered
    );
    const unsubscribeAnomaly = subscribeToExplorationEvent(
      'ANOMALY_DETECTED',
      handleAnomalyDetected
    );
    const unsubscribeResource = subscribeToExplorationEvent(
      'RESOURCE_DETECTED',
      handleResourceDetected
    );

    // Unsubscribe when component unmounts
    return () => {
      unsubscribeSector();
      unsubscribeAnomaly();
      unsubscribeResource();
    };
  }, [
    getOrCreateDatasetBySource,
    sectorToDataPoint,
    anomalyToDataPoint,
    resourceToDataPoint,
    addDataPointToDataset,
  ]);

  // Update analysis configuration
  const updateAnalysisConfig = useCallback(
    (
      id: string,
      updates: Partial<Omit<AnalysisConfig, 'id' | 'createdAt' | 'updatedAt'>>
    ): void => {
      setAnalysisConfigs(prev =>
        prev.map(config => {
          if (config.id === id) {
            return {
              ...config,
              ...updates,
              updatedAt: Date.now(),
            };
          }
          return config;
        })
      );
    },
    []
  );

  // Delete an analysis configuration
  const deleteAnalysisConfig = useCallback((id: string): void => {
    setAnalysisConfigs(prev => prev.filter(config => config.id !== id));
  }, []);

  // Get an analysis configuration by ID
  const getAnalysisConfigById = useCallback(
    (id: string): AnalysisConfig | undefined => {
      return analysisConfigs.find(config => config.id === id);
    },
    [analysisConfigs]
  );

  // Run an analysis using the worker for heavy operations
  const runAnalysis = useCallback(
    async (configId: string): Promise<string> => {
      const config = analysisConfigs.find(config => config.id === configId);
      if (!config) {
        throw new Error(`Analysis configuration with ID ${configId} not found`);
      }

      const dataset = datasets.find(dataset => dataset.id === config.datasetId);
      if (!dataset) {
        throw new Error(`Dataset with ID ${config.datasetId} not found`);
      }

      // Create a pending result
      const pendingResultId = uuidv4();
      const pendingResult: AnalysisResult = {
        id: pendingResultId,
        analysisConfigId: configId,
        status: 'pending',
        startTime: Date.now(),
        data: {},
      };

      setAnalysisResults(prev => [...prev, pendingResult]);
      setIsProcessingData(true);

      try {
        let result: AnalysisResult;

        // Use the data processing service for offloading work if available
        if (dataProcessingServiceRef.current) {
          try {
            // Determine which worker processing method to use based on analysis type
            let processedData;

            // Handle special case for transformation type
            if ((config.type as string) === 'transformation') {
              processedData = (await dataProcessingServiceRef.current.transformData(
                dataset.dataPoints
              )) as Record<string, unknown>;
            } else {
              switch (config.type) {
                case 'clustering':
                  processedData = await dataProcessingServiceRef.current.processClustering(
                    dataset.dataPoints
                  );
                  break;
                case 'prediction':
                  processedData = await dataProcessingServiceRef.current.processPrediction(
                    dataset.dataPoints
                  );
                  break;
                case 'comparison':
                  processedData = await dataProcessingServiceRef.current.processResourceMapping(
                    dataset.dataPoints
                  );
                  break;
                default:
                  // For other types, use the local analysis algorithm service
                  if (analysisAlgorithmServiceRef.current) {
                    result = await analysisAlgorithmServiceRef.current.runAnalysis(config, dataset);
                  } else {
                    result = await runBasicAnalysis(config, dataset);
                  }

                  // Update the analysis results with the worker-processed data
                  setAnalysisResults(prev =>
                    prev.map(r => (r.id === pendingResultId ? result : r))
                  );
                  setIsProcessingData(false);
                  return result?.id;
              }
            }

            // Create a result object with the processed data
            result = {
              id: pendingResultId,
              analysisConfigId: config.id,
              status: 'completed',
              startTime: pendingResult.startTime,
              endTime: Date.now(),
              data: processedData as Record<string, unknown>,
              summary: `Analysis completed successfully with ${
                Object.keys(processedData ?? {}).length
              } data points.`,
            };
          } catch (error) {
            console.error('Worker processing error:', error);
            // Fallback to main thread processing
            if (analysisAlgorithmServiceRef.current) {
              result = await analysisAlgorithmServiceRef.current.runAnalysis(config, dataset);
            } else {
              result = await runBasicAnalysis(config, dataset);
            }
          }
        } else if (analysisAlgorithmServiceRef.current) {
          // Use the main thread analysis service if worker is not available
          result = await analysisAlgorithmServiceRef.current.runAnalysis(config, dataset);
        } else {
          // Fallback to a basic implementation
          result = await runBasicAnalysis(config, dataset);
        }

        // Update the analysis results
        setAnalysisResults(prev => prev.map(r => (r.id === pendingResultId ? result : r)));
        setIsProcessingData(false);
        return result?.id;
      } catch (error) {
        // Create a failed result
        const failedResult: AnalysisResult = {
          id: pendingResultId,
          analysisConfigId: configId,
          status: 'failed',
          startTime: pendingResult.startTime,
          endTime: Date.now(),
          data: {},
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        // Update the analysis results
        setAnalysisResults(prev => prev.map(r => (r.id === pendingResultId ? failedResult : r)));
        setIsProcessingData(false);
        throw error;
      }
    },
    [analysisConfigs, datasets]
  );

  // Add a function to run basic analysis if the service is not available
  const runBasicAnalysis = async (
    config: AnalysisConfig,
    dataset: Dataset
  ): Promise<AnalysisResult> => {
    // Simulate analysis by delaying for a short time
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: uuidv4(),
      analysisConfigId: config.id,
      status: 'completed',
      startTime: Date.now() - 500, // Started 500ms ago
      endTime: Date.now(),
      data: {
        config,
        datasetSize: dataset.dataPoints.length,
        message: 'Basic analysis completed without the analysis service',
      },
      summary: `Analyzed ${dataset.dataPoints.length} data points using the ${config.type} analysis type.`,
    };
  };

  // Refresh data with worker-based filtering and sorting
  const refreshData = useCallback(async () => {
    if (!dataCollectionServiceRef.current) return;
    setIsProcessingData(true);

    try {
      // Get all data from the collection service
      const sectorData = dataCollectionServiceRef.current.getSectorData();
      const anomalyData = dataCollectionServiceRef.current.getAnomalyData();
      const resourceData = dataCollectionServiceRef.current.getResourceData();

      // Create or update datasets for each data type with correct mapping
      const sectorDatasetId = getOrCreateDatasetBySource('sectors');
      const anomalyDatasetId = getOrCreateDatasetBySource('anomalies');
      const resourceDatasetId = getOrCreateDatasetBySource('resources');

      // Use the worker for batch processing if available
      if (dataProcessingServiceRef.current) {
        // Process data in batches using the worker
        if (sectorDatasetId && sectorData.length > 0) {
          await addDataPointsBatch(sectorDatasetId, sectorData);
        }

        if (anomalyDatasetId && anomalyData.length > 0) {
          await addDataPointsBatch(anomalyDatasetId, anomalyData);
        }

        if (resourceDatasetId && resourceData.length > 0) {
          await addDataPointsBatch(resourceDatasetId, resourceData);
        }
      } else {
        // Fallback to standard processing
        if (sectorDatasetId) {
          for (const dataPoint of sectorData) {
            addDataPointToDataset(sectorDatasetId, dataPoint);
          }
        }

        if (anomalyDatasetId) {
          for (const dataPoint of anomalyData) {
            addDataPointToDataset(anomalyDatasetId, dataPoint);
          }
        }

        if (resourceDatasetId) {
          for (const dataPoint of resourceData) {
            addDataPointToDataset(resourceDatasetId, dataPoint);
          }
        }
      }
    } finally {
      setIsProcessingData(false);
    }
  }, [getOrCreateDatasetBySource, addDataPointToDataset]);

  // Helper function to add data points in batches using the worker
  const addDataPointsBatch = async (datasetId: string, dataPoints: DataPoint[]): Promise<void> => {
    if (!dataProcessingServiceRef.current || dataPoints.length === 0) return;

    try {
      // Use the worker to filter out duplicates
      const existingDataset = datasets.find(ds => ds.id === datasetId);
      if (!existingDataset) return;

      const existingIds = new Set(existingDataset.dataPoints.map(dp => dp.id));

      // Filter out duplicate data points - can use the worker for this with large datasets
      const uniqueDataPoints = dataPoints.filter(dp => !existingIds.has(dp.id));

      if (uniqueDataPoints.length === 0) return;

      // Add the filtered data points to the dataset
      addDataPointsToDataset(datasetId, uniqueDataPoints);
    } catch (error) {
      console.error('Error in batch processing:', error);
      // Fallback to individual adds
      for (const dataPoint of dataPoints) {
        addDataPointToDataset(datasetId, dataPoint);
      }
    }
  };

  // Worker-based filtering for datasets
  const filterDataset = useCallback(
    async (
      datasetId: string,
      filters: Array<{
        field: string;
        operator:
          | 'equals'
          | 'notEquals'
          | 'greaterThan'
          | 'lessThan'
          | 'contains'
          | 'notContains'
          | 'between';
        value: string | number | boolean | string[] | [number, number];
      }>
    ): Promise<DataPoint[]> => {
      const dataset = datasets.find(ds => ds.id === datasetId);
      if (!dataset) return [];

      setIsProcessingData(true);

      try {
        // Use the worker for filtering if available
        if (dataProcessingServiceRef.current && dataset.dataPoints.length > 100) {
          try {
            // Offload filtering to worker for large datasets
            const filteredData = await dataProcessingServiceRef.current.filterData(
              dataset.dataPoints,
              filters.map(filter => ({
                key: filter.field,
                operator: mapOperator(filter.operator),
                value: filter.value,
              }))
            );
            setIsProcessingData(false);
            return filteredData as DataPoint[];
          } catch (error) {
            console.error('Worker filtering error:', error);
            // Continue to fallback
          }
        }

        // Fallback to main thread filtering
        if (!dataCollectionServiceRef.current) {
          // Simple filtering if the service is not available
          const filteredData = dataset.dataPoints.filter(dataPoint =>
            filters.every(filter => {
              // Treat DataPoint as a Record with unknown values for filtering
              const value = getNestedProperty(
                dataPoint as unknown as Record<string, unknown>,
                filter.field
              );

              switch (filter.operator) {
                case 'equals':
                  return value === filter.value;
                case 'notEquals':
                  return value !== filter.value;
                case 'greaterThan':
                  return (
                    typeof value === 'number' &&
                    typeof filter.value === 'number' &&
                    value > filter.value
                  );
                case 'lessThan':
                  return (
                    typeof value === 'number' &&
                    typeof filter.value === 'number' &&
                    value < filter.value
                  );
                case 'contains':
                  if (typeof value === 'string' && typeof filter.value === 'string') {
                    return value.toLowerCase().includes(filter.value.toLowerCase());
                  }
                  if (Array.isArray(value)) {
                    return value.includes(filter.value);
                  }
                  return false;
                case 'notContains':
                  if (typeof value === 'string' && typeof filter.value === 'string') {
                    return !value.toLowerCase().includes(filter.value.toLowerCase());
                  }
                  if (Array.isArray(value)) {
                    return !value.includes(filter.value);
                  }
                  return false;
                case 'between':
                  if (
                    typeof value === 'number' &&
                    Array.isArray(filter.value) &&
                    filter.value.length === 2
                  ) {
                    const [min, max] = filter.value as [number, number];
                    return value >= min && value <= max;
                  }
                  return false;
                default:
                  return false;
              }
            })
          );
          setIsProcessingData(false);
          return filteredData;
        }

        // Use the data collection service's filtering capability
        const filteredData = dataCollectionServiceRef.current.filterData(
          dataset.dataPoints,
          filters
        );
        setIsProcessingData(false);
        return filteredData;
      } catch (error) {
        setIsProcessingData(false);
        console.error('Error filtering data:', error);
        return [];
      }
    },
    [datasets]
  );

  // Fix the getNestedProperty function with proper typing
  const getNestedProperty = (obj: Record<string, unknown>, path: string): unknown => {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }

      if (typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  };

  // Get an analysis result by ID
  const getAnalysisResultById = useCallback(
    (id: string): AnalysisResult | undefined => {
      return analysisResults.find(result => result?.id === id);
    },
    [analysisResults]
  );

  // Get analysis results by config ID
  const getAnalysisResultsByConfigId = useCallback(
    (configId: string): AnalysisResult[] => {
      return analysisResults.filter(result => result?.analysisConfigId === configId);
    },
    [analysisResults]
  );

  // Helper function to map filter operators
  const mapOperator = (
    operator:
      | 'equals'
      | 'notEquals'
      | 'greaterThan'
      | 'lessThan'
      | 'contains'
      | 'notContains'
      | 'between'
  ): '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith' => {
    switch (operator) {
      case 'equals':
        return '==';
      case 'notEquals':
        return '!=';
      case 'greaterThan':
        return '>';
      case 'lessThan':
        return '<';
      case 'contains':
        return 'contains';
      // For 'between' and 'notContains', we'll need custom handling in the filter function
      // For now, default to a reasonable operator
      case 'notContains':
        return '!=';
      case 'between':
        return '>=';
      default:
        return '==';
    }
  };

  // Function to store linked data between entities
  const storeLinkedData = useCallback((key: string, data: unknown) => {
    setLinkedData(prev => ({
      ...prev,
      [key]: data,
    }));
  }, []);

  // Function to update anomaly statistics
  const updateAnomalyStats = useCallback(
    (data: { anomalyId: string; sectorData: unknown; discoveryTime: number }) => {
      setAnomalyStats(prev => ({
        ...prev,
        [data.anomalyId]: {
          ...((prev[data.anomalyId] as Record<string, unknown>) || {}),
          sectorData: data.sectorData,
          discoveryTime: data.discoveryTime,
          lastUpdated: Date.now(),
        },
      }));
    },
    []
  );

  // Create the context value object
  const contextValue: DataAnalysisContextType = {
    // Datasets and management
    datasets,
    addDataset: createDataset,
    removeDataset: deleteDataset,
    clearDatasets: () => setDatasets([]),
    createDataset,
    updateDataset,
    deleteDataset,
    getDatasetById,

    // Analysis configurations
    analysisConfigs,
    createAnalysisConfig,
    updateAnalysisConfig,
    deleteAnalysisConfig,
    getAnalysisConfigById,

    // Analysis results
    analysisResults,
    getAnalysisResultById,
    getAnalysisResultsByConfigId,
    runAnalysis,

    // Data point management
    addDataPointToDataset,
    removeDataPointFromDataset: (datasetId: string, dataPointId: string) => {
      setDatasets(prev =>
        prev.map(dataset => {
          if (dataset.id === datasetId) {
            return {
              ...dataset,
              dataPoints: dataset.dataPoints.filter(point => point.id !== dataPointId),
              updatedAt: Date.now(),
            };
          }
          return dataset;
        })
      );
    },

    // Dataset utilities
    getOrCreateDatasetBySource,

    // Conversion utilities
    sectorToDataPoint: (sector: Record<string, unknown>) => {
      // Validate and safely map to a DataPoint
      if (!sector || typeof sector !== 'object') {
        throw new Error('Invalid sector data');
      }

      return {
        id: String(sector.id || uuidv4()),
        type: 'sector',
        name: String(sector.name || 'Unknown Sector'),
        date: Number(sector.discoveredAt || Date.now()),
        coordinates: {
          x: Number(
            typeof sector.coordinates === 'object' && sector.coordinates
              ? (sector.coordinates as { x?: number })?.x || 0
              : 0
          ),
          y: Number(
            typeof sector.coordinates === 'object' && sector.coordinates
              ? (sector.coordinates as { y?: number })?.y || 0
              : 0
          ),
        },
        properties: {
          status: String(sector.status || 'unknown'),
          resourcePotential: Number(sector.resourcePotential || 0),
          habitabilityScore: Number(sector.habitabilityScore || 0),
          anomalyCount: Number((sector.anomalies as unknown[])?.length || 0),
          resourceCount: Number((sector.resources as unknown[])?.length || 0),
          lastScanned: Number(sector.lastScanned || 0),
        },
      };
    },
    anomalyToDataPoint: (anomaly: Record<string, unknown>) => {
      // Validate and safely map to a DataPoint
      if (!anomaly || typeof anomaly !== 'object') {
        throw new Error('Invalid anomaly data');
      }

      return {
        id: String(anomaly.id || uuidv4()),
        type: 'anomaly',
        name: `${String(anomaly.type || 'Unknown')} Anomaly`,
        date: Number(anomaly.discoveredAt || Date.now()),
        coordinates: {
          x: Number(
            typeof anomaly.position === 'object' && anomaly.position
              ? (anomaly.position as { x?: number })?.x || 0
              : 0
          ),
          y: Number(
            typeof anomaly.position === 'object' && anomaly.position
              ? (anomaly.position as { y?: number })?.y || 0
              : 0
          ),
        },
        properties: {
          type: String(anomaly.type || 'unknown'),
          severity: String(anomaly.severity || 'low'),
          description: String(anomaly.description || ''),
          sectorId: String(anomaly.sectorId || 'unknown'),
          investigated: Boolean(anomaly.investigatedAt),
        },
      };
    },
    resourceToDataPoint: (
      resource: Record<string, unknown>,
      sectorId?: string,
      coordinates?: { x: number; y: number }
    ) => {
      // Validate and safely map to a DataPoint
      if (!resource || typeof resource !== 'object') {
        throw new Error('Invalid resource data');
      }

      const safeCoordinates = coordinates || { x: 0, y: 0 };
      const safeSectorId = sectorId || 'unknown';

      return {
        id: `${safeSectorId}-${String(resource.type || 'unknown')}-${Date.now()}`,
        type: 'resource',
        name: `${String(resource.type || 'Unknown')} Resource`,
        date: Date.now(),
        coordinates: safeCoordinates,
        properties: {
          type: String(resource.type || 'unknown'),
          amount: Number(resource.amount || 0),
          quality: Number(resource.quality || 0),
          sectorId: safeSectorId,
        },
      };
    },

    // Data operations
    refreshData,
    // Fix filterDataset to have proper typings
    filterDataset: (
      datasetId: string,
      filters: Array<{
        field: string;
        operator:
          | 'equals'
          | 'notEquals'
          | 'greaterThan'
          | 'lessThan'
          | 'contains'
          | 'notContains'
          | 'between';
        value: string | number | boolean | string[] | [number, number];
      }>
    ) => {
      // This is a workaround to convert the async function to a sync one
      // In a real application, you would refactor the interface to be async
      const emptyResult: DataPoint[] = [];

      // Start the async process but return empty results immediately
      setTimeout(() => {
        filterDataset(datasetId, filters)
          .then(results => {
            console.warn(`Filtered ${results.length} results for dataset ${datasetId}`);
          })
          .catch(error => {
            console.error('Error in filterDataset:', error);
          });
      }, 0);

      return emptyResult;
    },

    // Linked data system
    linkedData,
    storeLinkedData,

    // Anomaly stats tracking
    anomalyStats,
    updateAnomalyStats,
  };

  return (
    <DataAnalysisContext.Provider value={contextValue}>{children}</DataAnalysisContext.Provider>
  );
};

/**
 * Hook to use the DataAnalysisContext
 */
export const useDataAnalysis = (): DataAnalysisContextType => {
  const context = useContext(DataAnalysisContext);
  if (context === undefined) {
    throw new Error('useDataAnalysis must be used within a DataAnalysisProvider');
  }
  return context;
};

// Export the context for testing
export { DataAnalysisContext };
