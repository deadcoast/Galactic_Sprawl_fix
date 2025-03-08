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
  ExplorationEvents,
  explorationManager,
  Sector,
} from '../managers/exploration/ExplorationManager';
import { AnalysisAlgorithmService } from '../services/AnalysisAlgorithmService';
import { DataCollectionService } from '../services/DataCollectionService';
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

  // Create references to the services for persistence across renders
  const dataCollectionServiceRef = useRef<DataCollectionService | null>(null);
  const analysisAlgorithmServiceRef = useRef<AnalysisAlgorithmService | null>(null);

  // Initialize services
  useEffect(() => {
    if (explorationManager) {
      // Initialize data collection service
      const dataCollectionService = new DataCollectionService(explorationManager);
      dataCollectionServiceRef.current = dataCollectionService;

      // Initialize analysis algorithm service
      const analysisAlgorithmService = new AnalysisAlgorithmService();
      analysisAlgorithmServiceRef.current = analysisAlgorithmService;

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
    // Also delete any analysis configs that use this dataset
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
      coordinates: sector.coordinates,
      properties: {
        status: sector.status,
        resourcePotential: sector.resourcePotential,
        habitabilityScore: sector.habitabilityScore,
        anomalyCount: sector.anomalies?.length || 0,
        resourceCount: sector.resources?.length || 0,
        lastScanned: sector.lastScanned || 0,
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
      coordinates: anomaly.position,
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
          quality: resource.quality || 0,
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
      const { sector } = event.data as { sector: Sector };
      if (!sector) return;

      // Get or create the sectors dataset
      const sectorsDatasetId = getOrCreateDatasetBySource('sectors', 'Explored Sectors');

      // Add the sector as a data point
      const dataPoint = sectorToDataPoint(sector);
      addDataPointToDataset(sectorsDatasetId, dataPoint);
    };

    // Handle anomaly detected events
    const handleAnomalyDetected = (event: BaseEvent) => {
      const { anomaly, sector } = event.data as { anomaly: Anomaly; sector: Sector };
      if (!anomaly) return;

      // Get or create the anomalies dataset
      const anomaliesDatasetId = getOrCreateDatasetBySource('anomalies', 'Detected Anomalies');

      // Add the anomaly as a data point
      const dataPoint = anomalyToDataPoint(anomaly);
      addDataPointToDataset(anomaliesDatasetId, dataPoint);
    };

    // Handle resource detected events
    const handleResourceDetected = (event: BaseEvent) => {
      const { resource, sector } = event.data as { resource: ResourceData; sector: Sector };
      if (!resource || !sector) return;

      // Get or create the resources dataset
      const resourcesDatasetId = getOrCreateDatasetBySource('resources', 'Discovered Resources');

      // Add the resource as a data point
      const dataPoint = resourceToDataPoint(resource, sector.id, sector.coordinates);
      addDataPointToDataset(resourcesDatasetId, dataPoint);
    };

    // Helper function to convert ExplorationEvents to EventType
    const asEventType = (event: ExplorationEvents): EventType => {
      return event as unknown as EventType;
    };

    // Subscribe to exploration events
    const unsubscribeSector = explorationManager.subscribeToEvent(
      asEventType(ExplorationEvents.SECTOR_DISCOVERED),
      handleSectorDiscovered
    );

    const unsubscribeAnomaly = explorationManager.subscribeToEvent(
      asEventType(ExplorationEvents.ANOMALY_DETECTED),
      handleAnomalyDetected
    );

    const unsubscribeResource = explorationManager.subscribeToEvent(
      asEventType(ExplorationEvents.RESOURCE_DETECTED),
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

  // Run an analysis
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

      try {
        let result: AnalysisResult;

        // Use the analysis algorithm service if available
        if (analysisAlgorithmServiceRef.current) {
          result = await analysisAlgorithmServiceRef.current.runAnalysis(config, dataset);
        } else {
          // Fallback to a basic implementation
          result = await runBasicAnalysis(config, dataset);
        }

        // Update the analysis results
        setAnalysisResults(prev => prev.map(r => (r.id === pendingResultId ? result : r)));

        return result.id;
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

  // Fix the refreshData function
  const refreshData = useCallback(() => {
    if (!dataCollectionServiceRef.current) return;

    // Get all data from the collection service
    const sectorData = dataCollectionServiceRef.current.getSectorData();
    const anomalyData = dataCollectionServiceRef.current.getAnomalyData();
    const resourceData = dataCollectionServiceRef.current.getResourceData();

    // Create or update datasets for each data type with correct mapping
    const sectorDatasetId = getOrCreateDatasetBySource('sectors');
    const anomalyDatasetId = getOrCreateDatasetBySource('anomalies');
    const resourceDatasetId = getOrCreateDatasetBySource('resources');

    // Add data points to datasets
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
  }, [getOrCreateDatasetBySource, addDataPointToDataset]);

  // Add a function to filter data points in a dataset
  const filterDataset = useCallback(
    (
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
    ): DataPoint[] => {
      const dataset = datasets.find(ds => ds.id === datasetId);
      if (!dataset) return [];

      if (!dataCollectionServiceRef.current) {
        // Simple filtering if the service is not available
        return dataset.dataPoints.filter(dataPoint =>
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
      }

      // Use the data collection service's filtering capability
      return dataCollectionServiceRef.current.filterData(dataset.dataPoints, filters);
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
      return analysisResults.find(result => result.id === id);
    },
    [analysisResults]
  );

  // Get analysis results by config ID
  const getAnalysisResultsByConfigId = useCallback(
    (configId: string): AnalysisResult[] => {
      return analysisResults.filter(result => result.analysisConfigId === configId);
    },
    [analysisResults]
  );

  // Generate mock analysis data (would be replaced with actual analysis logic)
  const generateMockAnalysisData = (
    config: AnalysisConfig,
    dataset: Dataset
  ): Record<string, unknown> => {
    // This is a placeholder that would be replaced with actual analysis logic
    switch (config.type) {
      case 'trend':
        return {
          xAxis: Array.from({ length: 10 }, (_, i) => i),
          yAxis: Array.from({ length: 10 }, () => Math.random() * 100),
        };
      case 'correlation':
        return {
          correlationMatrix: [
            [1, 0.7, 0.2],
            [0.7, 1, 0.5],
            [0.2, 0.5, 1],
          ],
          variables: ['resourcePotential', 'habitabilityScore', 'anomalyCount'],
        };
      case 'clustering':
        return {
          clusters: [
            { centroid: [0.2, 0.3], points: 5 },
            { centroid: [0.7, 0.8], points: 3 },
            { centroid: [0.5, 0.5], points: 7 },
          ],
        };
      default:
        return { message: 'Mock analysis data' };
    }
  };

  // Generate a summary for the analysis (would be replaced with actual summary generation)
  const generateAnalysisSummary = (
    config: AnalysisConfig,
    data: Record<string, unknown>
  ): string => {
    // This is a placeholder that would be replaced with actual summary generation
    return `Analysis of type ${config.type} completed successfully`;
  };

  // Generate insights for the analysis (would be replaced with actual insight generation)
  const generateAnalysisInsights = (
    config: AnalysisConfig,
    data: Record<string, unknown>
  ): string[] => {
    // This is a placeholder that would be replaced with actual insight generation
    return [
      'This is a mock insight',
      'This is another mock insight',
      'This is a third mock insight',
    ];
  };

  // Create the context value object
  const contextValue: DataAnalysisContextType = {
    datasets,
    analysisConfigs,
    analysisResults,
    createDataset,
    updateDataset,
    deleteDataset,
    getDatasetById,
    createAnalysisConfig,
    updateAnalysisConfig,
    deleteAnalysisConfig,
    getAnalysisConfigById,
    runAnalysis,
    getAnalysisResultById,
    getAnalysisResultsByConfigId,
    getOrCreateDatasetBySource,
    addDataPointToDataset,
    refreshData,
    filterDataset,
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
