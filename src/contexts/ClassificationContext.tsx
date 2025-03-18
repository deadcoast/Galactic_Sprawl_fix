import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Anomaly,
  EXPLORATION_EVENTS,
  explorationManager,
  Sector,
} from '../managers/exploration/ExplorationManager';
import { BaseEvent, EventType } from '../types/events/EventTypes';
import {
  ClassifiableDiscovery,
  Classification,
  ClassificationContextType,
  ClassificationSuggestion,
  TaxonomyCategory,
} from '../types/exploration/ClassificationTypes';
import { ResourceData } from '../types/exploration/DataAnalysisTypes';
import { ResourceType } from './../types/resources/ResourceTypes';

// Default taxonomy categories
const defaultTaxonomyCategories: TaxonomyCategory[] = [
  {
    id: 'anomaly-root',
    name: 'Anomalies',
    description: 'Root category for all anomaly classifications',
    level: 0,
    color: '#6366f1',
  },
  {
    id: 'resource-root',
    name: 'Resources',
    description: 'Root category for all resource classifications',
    level: 0,
    color: '#10b981',
  },
  // Anomaly primary categories
  {
    id: 'spatial-anomaly',
    name: 'Spatial Anomalies',
    description: 'Anomalies that affect or exist within space',
    parentId: 'anomaly-root',
    level: 1,
    color: '#8b5cf6',
  },
  {
    id: 'temporal-anomaly',
    name: 'Temporal Anomalies',
    description: 'Anomalies that affect or exist within time',
    parentId: 'anomaly-root',
    level: 1,
    color: '#3b82f6',
  },
  {
    id: 'energy-anomaly',
    name: 'Energy Anomalies',
    description: 'Anomalies related to energy patterns or emissions',
    parentId: 'anomaly-root',
    level: 1,
    color: '#ec4899',
  },
  {
    id: 'biological-anomaly',
    name: 'Biological Anomalies',
    description: 'Anomalies with biological properties or effects',
    parentId: 'anomaly-root',
    level: 1,
    color: '#84cc16',
  },
  {
    id: 'technological-anomaly',
    name: 'Technological Anomalies',
    description: 'Anomalies of artificial or technological origin',
    parentId: 'anomaly-root',
    level: 1,
    color: '#f59e0b',
  },
  // Resource primary categories
  {
    id: 'mineral-resource',
    name: 'Mineral Resources',
    description: 'Solid mineral-based resources',
    parentId: 'resource-root',
    level: 1,
    color: '#6b7280',
  },
  {
    id: 'energy-resource',
    name: 'Energy Resources',
    description: 'Resources that provide energy',
    parentId: 'resource-root',
    level: 1,
    color: '#f97316',
  },
  {
    id: 'gas-resource',
    name: 'Gaseous Resources',
    description: 'Resources in gaseous form',
    parentId: 'resource-root',
    level: 1,
    color: '#0ea5e9',
  },
  {
    id: 'organic-resource',
    name: 'Organic Resources',
    description: 'Resources of biological origin',
    parentId: 'resource-root',
    level: 1,
    color: '#22c55e',
  },
  {
    id: 'exotic-resource',
    name: 'Exotic Resources',
    description: 'Rare or unusual resources with unique properties',
    parentId: 'resource-root',
    level: 1,
    color: '#d946ef',
  },
  // Anomaly subcategories
  {
    id: 'wormhole',
    name: 'Wormholes',
    description: 'Spatial anomalies connecting two points in space-time',
    parentId: 'spatial-anomaly',
    level: 2,
    color: '#a78bfa',
  },
  {
    id: 'gravity-well',
    name: 'Gravity Wells',
    description: 'Regions with abnormal gravitational properties',
    parentId: 'spatial-anomaly',
    level: 2,
    color: '#818cf8',
  },
  {
    id: 'time-dilation',
    name: 'Time Dilation',
    description: 'Regions where time flows at different rates',
    parentId: 'temporal-anomaly',
    level: 2,
    color: '#60a5fa',
  },
  {
    id: 'energy-vortex',
    name: 'Energy Vortices',
    description: 'Swirling concentrations of energy',
    parentId: 'energy-anomaly',
    level: 2,
    color: '#f472b6',
  },
  // Resource subcategories
  {
    id: 'precious-metals',
    name: 'Precious Metals',
    description: 'Valuable metallic resources',
    parentId: 'mineral-resource',
    level: 2,
    color: '#9ca3af',
  },
  {
    id: 'fusion-material',
    name: 'Fusion Materials',
    description: 'Resources suitable for fusion energy production',
    parentId: 'energy-resource',
    level: 2,
    color: '#fdba74',
  },
];

// Helper function to convert event type
const asEventType = (event: EventType): EventType => {
  return event;
};

// Create the context
const ClassificationContext = createContext<ClassificationContextType | undefined>(undefined);

interface ClassificationProviderProps {
  children: ReactNode;
  initialClassifications?: Classification[];
  initialTaxonomyCategories?: TaxonomyCategory[];
  discoveryData?: ClassifiableDiscovery[];
}

export const ClassificationProvider: React.FC<ClassificationProviderProps> = ({
  children,
  initialClassifications = [],
  initialTaxonomyCategories = defaultTaxonomyCategories,
  discoveryData = [],
}) => {
  const [taxonomyCategories, setTaxonomyCategories] =
    useState<TaxonomyCategory[]>(initialTaxonomyCategories);
  const [classifications, setClassifications] = useState<Classification[]>(initialClassifications);
  const [discoveries, setDiscoveries] = useState<ClassifiableDiscovery[]>(discoveryData);

  // (...args: unknown[]) => unknown to convert an Anomaly to a ClassifiableDiscovery
  const anomalyToDiscovery = useCallback(
    (anomaly: Anomaly, sector?: Sector): ClassifiableDiscovery => {
      const anomalyType = determineAnomalyType(anomaly.type);
      const sectorName = sector?.name || 'Unknown Sector';

      return {
        id: anomaly.id,
        type: 'anomaly',
        name: `${anomaly.type} Anomaly`,
        discoveryDate: anomaly.discoveredAt,
        sectorId: anomaly.sectorId,
        sectorName,
        coordinates: anomaly.position,
        anomalyType,
        severity: anomaly.severity,
        analysisResults: anomaly.data as Record<string, string | number | boolean | object>,
      };
    },
    []
  );

  // (...args: unknown[]) => unknown to convert a Resource to a ClassifiableDiscovery
  const resourceToDiscovery = useCallback(
    (
      resource: ResourceData,
      sectorId: string,
      coordinates: { x: number; y: number },
      sectorName: string
    ): ClassifiableDiscovery => {
      // Convert the resource type to a proper ResourceType enum value
      const resourceTypeMapping: Record<string, ResourceType> = {
        minerals: ResourceType.MINERALS,
        energy: ResourceType.ENERGY,
        gas: ResourceType.GAS,
        exotic: ResourceType.EXOTIC,
        plasma: ResourceType.PLASMA,
        metals: ResourceType.MINERALS, // Map metals to minerals
        water: ResourceType.MINERALS, // Map water to minerals as fallback
      };

      const resourceType = resourceTypeMapping[resource.type] || ResourceType.MINERALS;

      return {
        id: `${sectorId}-${resource.type}-${Date.now()}`,
        type: 'resource',
        name: `${resource.type} Resource`,
        discoveryDate: Date.now(),
        sectorId,
        sectorName,
        coordinates,
        resourceType,
        amount: resource.amount,
        quality: resource.quality ?? 0,
        distribution: 'scattered', // Default, would need proper detection
      };
    },
    []
  );

  // Helper function to determine anomaly type from string
  const determineAnomalyType = useCallback((type: string): 'artifact' | 'signal' | 'phenomenon' => {
    const typeMapping: Record<string, 'artifact' | 'signal' | 'phenomenon'> = {
      spatial: 'phenomenon',
      temporal: 'phenomenon',
      quantum: 'signal',
      biological: 'artifact',
      gravitational: 'phenomenon',
      unknown: 'signal',
      // Add more mappings as needed
    };

    return typeMapping[type] || 'phenomenon';
  }, []);

  // Add a classification
  const addClassification = useCallback((classificationData: Omit<Classification, 'id'>) => {
    const newClassification: Classification = {
      ...classificationData,
      id: uuidv4(),
    };

    setClassifications(prev => [...prev, newClassification]);
  }, []);

  // Update a classification
  const updateClassification = useCallback((id: string, updates: Partial<Classification>) => {
    setClassifications(prev =>
      prev.map(classification => {
        if (classification.id === id) {
          return { ...classification, ...updates };
        }
        return classification;
      })
    );
  }, []);

  // Delete a classification
  const deleteClassification = useCallback((id: string) => {
    setClassifications(prev => prev.filter(classification => classification.id !== id));
  }, []);

  // Get a classification by ID
  const getClassificationById = useCallback(
    (id: string) => {
      return classifications.find(classification => classification.id === id);
    },
    [classifications]
  );

  // Get classifications for a discovery
  const getClassificationsForDiscovery = useCallback(
    (discoveryId: string) => {
      return classifications.filter(classification => classification.discoveryId === discoveryId);
    },
    [classifications]
  );

  // Get a taxonomy category by ID
  const getTaxonomyCategory = useCallback(
    (id: string) => {
      return taxonomyCategories.find(category => category.id === id);
    },
    [taxonomyCategories]
  );

  // Add a taxonomy category
  const addTaxonomyCategory = useCallback((categoryData: Omit<TaxonomyCategory, 'id'>) => {
    const newCategory: TaxonomyCategory = {
      ...categoryData,
      id: uuidv4(),
    };

    setTaxonomyCategories(prev => [...prev, newCategory]);
  }, []);

  // Update a taxonomy category
  const updateTaxonomyCategory = useCallback((id: string, updates: Partial<TaxonomyCategory>) => {
    setTaxonomyCategories(prev =>
      prev.map(category => {
        if (category.id === id) {
          return { ...category, ...updates };
        }
        return category;
      })
    );
  }, []);

  // Delete a taxonomy category
  const deleteTaxonomyCategory = useCallback(
    (id: string) => {
      // Check if there are any classifications using this category
      const usedInClassifications = classifications.some(
        classification => classification.categoryId === id
      );

      if (usedInClassifications) {
        console.warn('Cannot delete category that is used in classifications');
        return;
      }

      setTaxonomyCategories(prev => prev.filter(category => category.id !== id));
    },
    [classifications]
  );

  // Get similar discoveries
  const getSimilarDiscoveries = useCallback(
    (discoveryId: string) => {
      const discovery = discoveries.find(d => d.id === discoveryId);
      if (!discovery) {
        return [];
      }

      // Get all discoveries of the same type
      const sameTypeDiscoveries = discoveries.filter(
        d => d.type === discovery.type && d.id !== discoveryId
      );

      // Simple similarity calculation based on properties
      if (discovery.type === 'anomaly') {
        return sameTypeDiscoveries.filter(
          d => d.anomalyType === discovery.anomalyType || d.sectorId === discovery.sectorId
        );
      } else {
        // Resource type
        return sameTypeDiscoveries.filter(
          d => d.resourceType === discovery.resourceType || d.sectorId === discovery.sectorId
        );
      }
    },
    [discoveries]
  );

  // Generate classification suggestions
  const generateClassificationSuggestions = useCallback(
    (discovery: ClassifiableDiscovery): ClassificationSuggestion[] => {
      const suggestions: ClassificationSuggestion[] = [];

      if (discovery.type === 'anomaly') {
        // For anomalies, suggest based on anomaly type
        switch (discovery.anomalyType) {
          case 'artifact':
            suggestions.push({
              categoryId: 'technological-anomaly',
              confidence: 0.85,
              reasoning:
                'The anomaly has characteristics consistent with artificial technology, suggesting it was created by an intelligent species.',
              propertyValues: {
                origin: 'unknown',
                age: 'ancient',
                techLevel: 'advanced',
              },
            });
            break;
          case 'signal':
            suggestions.push({
              categoryId: 'energy-anomaly',
              confidence: 0.78,
              reasoning:
                'The anomaly is emitting energy patterns that suggest it is related to unusual energy behaviors.',
              propertyValues: {
                frequency: 'variable',
                pattern: 'repeating',
                intensity: 'moderate',
              },
            });
            break;
          case 'phenomenon':
            suggestions.push({
              categoryId: 'spatial-anomaly',
              confidence: 0.92,
              reasoning:
                'The anomaly is distorting space in its vicinity, suggesting it may be a spatial phenomenon.',
              propertyValues: {
                radius: 'medium',
                stability: 'unstable',
                effect: 'distortion',
              },
            });
            break;
          default:
            // No specific suggestions for unknown types
            break;
        }
      } else {
        // For resources, suggest based on resource type
        switch (discovery.resourceType) {
          case ResourceType.MINERALS:
            suggestions.push({
              categoryId: 'mineral-resource',
              confidence: 0.88,
              reasoning:
                'The resource consists of solid, crystalline materials consistent with mineral composition.',
              propertyValues: {
                purity: 'high',
                extraction: 'mining',
                density: 'high',
              },
            });
            break;
          case ResourceType.GAS:
            suggestions.push({
              categoryId: 'gas-resource',
              confidence: 0.95,
              reasoning:
                'The resource exists in gaseous form, requiring specialized extraction methods.',
              propertyValues: {
                density: 'low',
                extraction: 'collection',
                stability: 'stable',
              },
            });
            break;
          case ResourceType.ENERGY:
            suggestions.push({
              categoryId: 'energy-resource',
              confidence: 0.82,
              reasoning:
                'The resource can be harnessed to produce energy through various conversion methods.',
              propertyValues: {
                output: 'high',
                stability: 'volatile',
                conversion: 'direct',
              },
            });
            break;
          case ResourceType.EXOTIC:
            suggestions.push({
              categoryId: 'exotic-resource',
              confidence: 0.75,
              reasoning:
                'The resource has unusual properties that do not match common classification patterns.',
              propertyValues: {
                rarity: 'very high',
                stability: 'unknown',
                uses: ResourceType.RESEARCH,
              },
            });
            break;
          default:
            // No specific suggestions for unknown types
            break;
        }
      }

      return suggestions;
    },
    []
  );

  // Add a new discovery
  const addDiscovery = useCallback(
    (discovery: ClassifiableDiscovery) => {
      // Check if the discovery already exists
      if (discoveries.some(d => d.id === discovery.id)) {
        return;
      }

      setDiscoveries(prev => [...prev, discovery]);
    },
    [discoveries]
  );

  // Subscribe to exploration events
  useEffect(() => {
    // Handle anomaly detected events
    const handleAnomalyDetected = (event: BaseEvent) => {
      const { anomaly, sector } = event?.data as { anomaly: Anomaly; sector: Sector };
      if (!anomaly) return;

      const discovery = anomalyToDiscovery(anomaly, sector);
      addDiscovery(discovery);
    };

    // Handle resource detected events
    const handleResourceDetected = (event: BaseEvent) => {
      const { resource, sector } = event?.data as { resource: ResourceData; sector: Sector };
      if (!resource || !sector) return;

      const discovery = resourceToDiscovery(resource, sector.id, sector.coordinates, sector.name);
      addDiscovery(discovery);
    };

    // Subscribe to exploration events
    const unsubscribeAnomaly = explorationManager.subscribeToEvent(
      asEventType(EXPLORATION_EVENTS.ANOMALY_DETECTED),
      handleAnomalyDetected
    );

    const unsubscribeResource = explorationManager.subscribeToEvent(
      asEventType(EXPLORATION_EVENTS.RESOURCE_DETECTED),
      handleResourceDetected
    );

    // Initialize discoveries from existing data in the exploration manager
    const initializeExistingDiscoveries = () => {
      // Get all sectors
      const sectors = explorationManager.getAllSectors();

      // Get all anomalies and convert to discoveries
      const anomalies = explorationManager.getAllAnomalies();
      for (const anomaly of anomalies) {
        const sector = sectors.find(s => s.id === anomaly.sectorId);
        const discovery = anomalyToDiscovery(anomaly, sector);
        addDiscovery(discovery);
      }

      // Resources are harder to access directly from the manager
      // We would need a proper way to get all resources, but for now we rely on events
    };

    // Initialize existing discoveries
    initializeExistingDiscoveries();

    // Cleanup on unmount
    return () => {
      unsubscribeAnomaly();
      unsubscribeResource();
    };
  }, [anomalyToDiscovery, resourceToDiscovery, addDiscovery]);

  // Context value
  const contextValue: ClassificationContextType = {
    taxonomyCategories,
    classifications,
    discoveries,
    addClassification,
    updateClassification,
    deleteClassification,
    getClassificationById,
    getClassificationsForDiscovery,
    getTaxonomyCategory,
    getSimilarDiscoveries,
    generateClassificationSuggestions,
    addTaxonomyCategory,
    updateTaxonomyCategory,
    deleteTaxonomyCategory,
    addDiscovery,
  };

  return (
    <ClassificationContext.Provider value={contextValue}>{children}</ClassificationContext.Provider>
  );
};

export const useClassification = (): ClassificationContextType => {
  const context = useContext(ClassificationContext);
  if (context === undefined) {
    throw new Error('useClassification must be used within a ClassificationProvider');
  }
  return context;
};

// Export the context for testing
export { ClassificationContext };
