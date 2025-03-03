import * as React from 'react';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisConfig,
  AnalysisResult,
  DataAnalysisContextType,
  Dataset,
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

  // Create a new dataset
  const createDataset = useCallback(
    (dataset: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>): string => {
      const now = Date.now();
      const newDataset: Dataset = {
        ...dataset,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      setDatasets(prev => [...prev, newDataset]);
      return newDataset.id;
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
      const now = Date.now();
      const newConfig: AnalysisConfig = {
        ...config,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      setAnalysisConfigs(prev => [...prev, newConfig]);
      return newConfig.id;
    },
    []
  );

  // Update an existing analysis configuration
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

  // Run an analysis based on a configuration
  const runAnalysis = useCallback(
    async (configId: string): Promise<string> => {
      const config = analysisConfigs.find(c => c.id === configId);
      if (!config) {
        throw new Error(`Analysis configuration with ID ${configId} not found`);
      }

      const dataset = datasets.find(d => d.id === config.datasetId);
      if (!dataset) {
        throw new Error(`Dataset with ID ${config.datasetId} not found`);
      }

      // Create a new analysis result
      const resultId = uuidv4();
      const startTime = Date.now();

      const newResult: AnalysisResult = {
        id: resultId,
        analysisConfigId: configId,
        status: 'processing',
        startTime,
        data: {},
      };

      setAnalysisResults(prev => [...prev, newResult]);

      try {
        // Simulate analysis processing
        // In a real implementation, this would call analysis algorithms
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate mock result data based on analysis type
        const resultData = generateMockResultData(config, dataset);

        // Update the analysis result
        setAnalysisResults(prev =>
          prev.map(result => {
            if (result.id === resultId) {
              return {
                ...result,
                status: 'completed',
                endTime: Date.now(),
                data: resultData,
                summary: `Analysis of ${dataset.name} completed successfully.`,
                insights: generateMockInsights(config, dataset),
              };
            }
            return result;
          })
        );

        return resultId;
      } catch (error) {
        // Update the analysis result with error information
        setAnalysisResults(prev =>
          prev.map(result => {
            if (result.id === resultId) {
              return {
                ...result,
                status: 'failed',
                endTime: Date.now(),
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
            return result;
          })
        );

        throw error;
      }
    },
    [analysisConfigs, datasets]
  );

  // Get an analysis result by ID
  const getAnalysisResultById = useCallback(
    (id: string): AnalysisResult | undefined => {
      return analysisResults.find(result => result.id === id);
    },
    [analysisResults]
  );

  // Get analysis results by configuration ID
  const getAnalysisResultsByConfigId = useCallback(
    (configId: string): AnalysisResult[] => {
      return analysisResults.filter(result => result.analysisConfigId === configId);
    },
    [analysisResults]
  );

  // Helper function to generate mock result data
  const generateMockResultData = (
    config: AnalysisConfig,
    dataset: Dataset
  ): Record<string, unknown> => {
    // This is a placeholder implementation that would be replaced with actual analysis algorithms
    switch (config.type) {
      case 'trend':
        return {
          trendData: dataset.dataPoints.map((point, index) => ({
            x: index,
            y: Math.random() * 100,
            name: point.name,
          })),
        };
      case 'correlation':
        return {
          correlationMatrix: [
            [1, 0.7, 0.3],
            [0.7, 1, 0.5],
            [0.3, 0.5, 1],
          ],
          variables: ['var1', 'var2', 'var3'],
        };
      case 'distribution':
        return {
          distribution: Array.from({ length: 10 }, (_, i) => ({
            bin: i,
            count: Math.floor(Math.random() * 100),
          })),
        };
      case 'clustering':
        return {
          clusters: dataset.dataPoints.map(point => ({
            id: point.id,
            cluster: Math.floor(Math.random() * 3),
          })),
        };
      case 'prediction':
        return {
          predictions: dataset.dataPoints.map(point => ({
            id: point.id,
            actual: Math.random() * 100,
            predicted: Math.random() * 100,
          })),
          accuracy: 0.85,
          rmse: 12.3,
        };
      case 'comparison':
        return {
          groupComparisons: [
            { group: 'Group A', value: 75 },
            { group: 'Group B', value: 85 },
            { group: 'Group C', value: 65 },
          ],
        };
      case 'anomalyDetection':
        return {
          anomalies: dataset.dataPoints
            .filter(() => Math.random() > 0.9)
            .map(point => ({
              id: point.id,
              score: Math.random(),
              isAnomaly: true,
            })),
        };
      case 'resourceMapping':
        return {
          resourceMap: dataset.dataPoints.map(point => ({
            id: point.id,
            coordinates: point.coordinates,
            value: Math.random() * 100,
          })),
        };
      case 'sectorAnalysis':
        return {
          sectorMetrics: dataset.dataPoints.map(point => ({
            id: point.id,
            name: point.name,
            resourcePotential: Math.random() * 100,
            habitabilityScore: Math.random() * 100,
            anomalyCount: Math.floor(Math.random() * 10),
            resourceCount: Math.floor(Math.random() * 20),
          })),
        };
      default:
        return { data: 'Custom analysis result' };
    }
  };

  // Helper function to generate mock insights
  const generateMockInsights = (config: AnalysisConfig, dataset: Dataset): string[] => {
    const insights: string[] = [];

    // Use dataset to generate more relevant insights
    switch (config.type) {
      case 'trend':
        insights.push(`Detected an upward trend in ${dataset.name} over the last period.`);
        insights.push(`The rate of change is approximately 15% per unit time.`);
        insights.push(`Seasonal patterns detected with peaks every 4 units.`);
        break;
      case 'correlation':
        insights.push(
          `Strong positive correlation (0.87) found between variables in ${dataset.source} data.`
        );
        insights.push(`Weak negative correlation (-0.32) found between secondary variables.`);
        break;
      case 'distribution':
        insights.push(
          `Data in ${dataset.name} follows a normal distribution with slight right skew.`
        );
        insights.push(`Outliers detected at the 95th percentile.`);
        break;
      case 'clustering':
        insights.push(`Identified 3 distinct clusters in the ${dataset.source} dataset.`);
        insights.push(`Cluster 1 contains 45% of data points and is characterized by high values.`);
        break;
      default:
        insights.push(`Analysis completed successfully on ${dataset.name}.`);
        insights.push(`${dataset.dataPoints.length} data points were analyzed.`);
    }

    return insights;
  };

  // Provide the context value
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
