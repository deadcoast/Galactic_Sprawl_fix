# Data Analysis System Documentation

## Overview

The Data Analysis System provides comprehensive analytics capabilities for exploration data. The system is designed to collect, process, analyze, and visualize data from various exploration activities such as sector discovery, scanning, anomaly detection, and resource discovery.

## Architecture

The Data Analysis System consists of several key components:

1. **Data Collection Layer**
   - `DataCollectionService`: Collects and preprocesses data from exploration events
   - Event subscription system for real-time data updates
   - Data caching and filtering capabilities

2. **Analysis Layer**
   - `AnalysisAlgorithmService`: Implements various analysis algorithms
   - Support for trend analysis, correlation analysis, distribution analysis, etc.
   - Result caching for performance optimization

3. **Context Layer**
   - `DataAnalysisContext`: Provides a React context for data analysis capabilities
   - State management for datasets, analysis configurations, and results
   - Integration with Data Collection and Analysis services

4. **UI Components**
   - `DataAnalysisSystem`: Main component for the data analysis UI
   - `DatasetManager`: Component for dataset management
   - `AnalysisConfigManager`: Component for analysis configuration management
   - `DataFilterPanel`: Component for data filtering
   - `ResultsPanel`: Component for result visualization
   - Various visualization components for different analysis types

## Services

### DataCollectionService

The `DataCollectionService` is responsible for collecting data from exploration events and preparing it for analysis. It provides the following functionality:

- Subscribes to exploration events (sector discovery, scanning, anomaly detection, resource detection)
- Processes data into a standardized format for analysis
- Caches data for improved performance
- Provides filtering capabilities for refined data selection

```typescript
// Example usage
const dataCollectionService = new DataCollectionService(explorationManager);
dataCollectionService.initialize();

// Set up callback for data updates
dataCollectionService.setOnDataUpdated((type, dataPoint) => {
  console.log(`New data point of type ${type} received:`, dataPoint);
});

// Get data
const sectorData = dataCollectionService.getSectorData();
const anomalyData = dataCollectionService.getAnomalyData();
const resourceData = dataCollectionService.getResourceData();

// Filter data
const filteredData = dataCollectionService.filterData(resourceData, [
  { field: "properties.resourcePotential", operator: "greaterThan", value: 50 },
]);
```

### AnalysisAlgorithmService

The `AnalysisAlgorithmService` provides various algorithms for analyzing data. It includes:

- Methods for analyzing trends, correlations, distributions, etc.
- Caching mechanism for expensive calculations
- Standardized result format for consistent visualization

```typescript
// Example usage
const analysisService = new AnalysisAlgorithmService();

// Run analysis with a configuration and dataset
const result = await analysisService.runAnalysis(config, dataset);

// Run specific analysis
const trendResult = analysisService.analyzeTrend(
  dataset,
  "date",
  "resourcePotential",
  "resourceType",
  [startDate, endDate],
  "average",
);
```

## Context

### DataAnalysisContext

The `DataAnalysisContext` provides a React context for data analysis capabilities. It includes:

- State management for datasets, analysis configurations, and results
- Methods for creating, updating, and deleting datasets and configurations
- Integration with `DataCollectionService` and `AnalysisAlgorithmService`

```typescript
// Example usage in a component
const {
  datasets,
  analysisConfigs,
  analysisResults,
  createDataset,
  runAnalysis,
  refreshData,
  filterDataset,
} = useDataAnalysis();

// Refresh data from the collection service
refreshData();

// Filter data
const filteredData = filterDataset(datasetId, [
  { field: "properties.resourcePotential", operator: "greaterThan", value: 50 },
]);

// Run analysis
const resultId = await runAnalysis(configId);
```

## UI Components

### DataAnalysisSystem

The main component for the data analysis UI. It provides:

- Tabbed interface for datasets, analysis configurations, and results
- Integration with the `DataAnalysisContext`
- Responsive layout for different screen sizes

### DatasetManager

Component for managing datasets. It provides:

- List of available datasets
- Interface for creating new datasets
- Options for deleting datasets

### AnalysisConfigManager

Component for managing analysis configurations. It provides:

- List of available configurations
- Interface for creating new configurations
- Options for running and deleting configurations

### DataFilterPanel

Component for filtering data. It provides:

- Interface for creating complex filters
- Support for various filter operators (equals, not equals, greater than, less than, contains, etc.)
- Chip-based display of active filters

### ResultsPanel

Component for displaying analysis results. It provides:

- List of analysis results
- Details for each result (status, duration, etc.)
- Options for viewing result visualizations

## Data Flow

1. Exploration events (e.g., sector discovery, scanning) are emitted by the ExplorationManager
2. DataCollectionService subscribes to these events and processes the data
3. Processed data is stored in the service's cache and provided to the DataAnalysisContext
4. Users can create datasets and analysis configurations through the UI
5. When an analysis is run, the AnalysisAlgorithmService processes the data according to the configuration
6. Results are stored in the DataAnalysisContext and displayed in the UI

## Future Enhancements

1. **Advanced Visualization**
   - Implement real chart visualizations (line, bar, scatter, etc.)
   - Add custom visualization options
   - Improve visualization styling

2. **Performance Optimization**
   - Add pagination for large datasets
   - Implement virtualized lists for better performance
   - Optimize algorithm calculations

3. **New Analysis Types**
   - Implement clustering analysis
   - Add prediction capabilities
   - Create resource mapping visualization
