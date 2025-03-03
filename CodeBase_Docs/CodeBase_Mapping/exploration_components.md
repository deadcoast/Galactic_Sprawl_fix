# Exploration System Components

## Core Components

| Component                      | File Path                                                     | Description                                                     |
| ------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------- |
| AutomatedSectorScanner         | src/components/exploration/AutomatedSectorScanner.tsx         | Automated scanning of sectors for resources and anomalies       |
| RealTimeMapUpdates             | src/components/exploration/RealTimeMapUpdates.tsx             | Real-time visualization of map changes                          |
| AdvancedFilteringSystem        | src/components/exploration/AdvancedFilteringSystem.tsx        | Advanced filtering capabilities for exploration data            |
| DetailedAnomalyAnalysis        | src/components/exploration/DetailedAnomalyAnalysis.tsx        | Comprehensive anomaly analysis with visualizations              |
| ResourcePotentialVisualization | src/components/exploration/ResourcePotentialVisualization.tsx | Visualization of resource potential across sectors              |
| GalaxyMappingSystem            | src/components/exploration/GalaxyMappingSystem.tsx            | Enhanced galaxy map with various data layers                    |
| ResourceDiscoverySystem        | src/components/exploration/ResourceDiscoverySystem.tsx        | Resource discovery processing and visualization                 |
| ExplorationDataManager         | src/components/exploration/ExplorationDataManager.tsx         | Comprehensive exploration data management system                |
| DiscoveryClassification        | src/components/exploration/DiscoveryClassification.tsx        | Classification system for discoveries (anomalies and resources) |
| ReconShipCoordination          | src/components/exploration/ReconShipCoordination.tsx          | Coordination system for recon ships and fleet formations        |
| DataAnalysisSystem             | src/components/exploration/DataAnalysisSystem.tsx             | Data analysis and visualization for exploration data            |

## Demo Components

| Component                          | File Path                                                         | Description                             |
| ---------------------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| AdvancedFilteringDemo              | src/components/exploration/AdvancedFilteringDemo.tsx              | Demo for AdvancedFilteringSystem        |
| DetailedAnomalyAnalysisDemo        | src/components/exploration/DetailedAnomalyAnalysisDemo.tsx        | Demo for DetailedAnomalyAnalysis        |
| ResourcePotentialVisualizationDemo | src/components/exploration/ResourcePotentialVisualizationDemo.tsx | Demo for ResourcePotentialVisualization |
| GalaxyMappingSystemDemo            | src/components/exploration/GalaxyMappingSystemDemo.tsx            | Demo for GalaxyMappingSystem            |
| ResourceDiscoveryDemo              | src/components/exploration/ResourceDiscoveryDemo.tsx              | Demo for ResourceDiscoverySystem        |
| ExplorationDataManagerDemo         | src/components/exploration/ExplorationDataManagerDemo.tsx         | Demo for ExplorationDataManager         |
| DiscoveryClassificationDemo        | src/components/exploration/DiscoveryClassificationDemo.tsx        | Demo for DiscoveryClassification        |
| ReconShipCoordinationDemo          | src/components/exploration/ReconShipCoordinationDemo.tsx          | Demo for ReconShipCoordination          |
| DataAnalysisSystemDemo             | src/components/exploration/DataAnalysisSystemDemo.tsx             | Demo for DataAnalysisSystem             |

## Integration Components

| Component                    | File Path                                                   | Description                                    |
| ---------------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| ExplorationSystemIntegration | src/components/exploration/ExplorationSystemIntegration.tsx | Integration example for exploration components |

## Supporting Files

| File                  | Path                                                | Description                                                |
| --------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| ClassificationTypes   | src/types/exploration/ClassificationTypes.ts        | Types and interfaces for the classification system         |
| ClassificationContext | src/contexts/ClassificationContext.tsx              | Context provider for the classification system             |
| ReconShipManagerImpl  | src/managers/exploration/ReconShipManagerImpl.ts    | Implementation of recon ship management and coordination   |
| DataAnalysisTypes     | src/types/exploration/DataAnalysisTypes.ts          | Types and interfaces for the data analysis system          |
| DataAnalysisContext   | src/contexts/DataAnalysisContext.tsx                | Context provider for the data analysis system              |

## Component Relationships

- **AutomatedSectorScanner** → Generates data for → **RealTimeMapUpdates**
- **RealTimeMapUpdates** → Visualizes data from → **AutomatedSectorScanner**
- **AdvancedFilteringSystem** → Filters data for → All exploration components
- **DetailedAnomalyAnalysis** → Analyzes anomalies discovered by → **AutomatedSectorScanner**
- **ResourcePotentialVisualization** → Visualizes resources discovered by → **AutomatedSectorScanner**
- **GalaxyMappingSystem** → Provides map interface for → All exploration components
- **ResourceDiscoverySystem** → Processes resource signals from → **AutomatedSectorScanner**
- **ExplorationDataManager** → Manages data from → All exploration components
- **DiscoveryClassification** → Classifies discoveries from → **DetailedAnomalyAnalysis** and **ResourceDiscoverySystem**
- **DiscoveryClassification** → Stores data in → **ExplorationDataManager**
- **ReconShipCoordination** → Coordinates ships managed by → **ReconShipManagerImpl**
- **ReconShipCoordination** → Enhances scanning efficiency for → **AutomatedSectorScanner**
- **ReconShipManagerImpl** → Provides fleet formation capabilities for → **ReconShipCoordination**
- **DataAnalysisSystem** → Analyzes data from → **ExplorationDataManager**, **ResourceDiscoverySystem**, and **DetailedAnomalyAnalysis**
- **DataAnalysisSystem** → Provides insights and visualizations for → All exploration data
