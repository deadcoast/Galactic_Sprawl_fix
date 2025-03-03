import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ClassifiableDiscovery,
  Classification,
  ClassificationContextType,
  ClassificationSuggestion,
  TaxonomyCategory,
} from '../types/exploration/ClassificationTypes';

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
    description: 'Rare or unusual resources with special properties',
    parentId: 'resource-root',
    level: 1,
    color: '#d946ef',
  },
];

// Create the context with a default undefined value
const ClassificationContext = createContext<ClassificationContextType | undefined>(undefined);

// Provider props interface
interface ClassificationProviderProps {
  children: ReactNode;
  initialClassifications?: Classification[];
  initialTaxonomyCategories?: TaxonomyCategory[];
  discoveryData?: ClassifiableDiscovery[];
}

// Provider component
export const ClassificationProvider: React.FC<ClassificationProviderProps> = ({
  children,
  initialClassifications = [],
  initialTaxonomyCategories = defaultTaxonomyCategories,
  discoveryData = [],
}) => {
  // State for classifications and taxonomy categories
  const [classifications, setClassifications] = useState<Classification[]>(initialClassifications);
  const [taxonomyCategories, setTaxonomyCategories] =
    useState<TaxonomyCategory[]>(initialTaxonomyCategories);
  const [discoveries] = useState<ClassifiableDiscovery[]>(discoveryData);

  // Add a new classification
  const addClassification = useCallback((classification: Omit<Classification, 'id'>) => {
    const newClassification: Classification = {
      ...classification,
      id: uuidv4(),
    };
    setClassifications(prev => [...prev, newClassification]);
  }, []);

  // Update an existing classification
  const updateClassification = useCallback((id: string, updates: Partial<Classification>) => {
    setClassifications(prev =>
      prev.map(classification =>
        classification.id === id ? { ...classification, ...updates } : classification
      )
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

  // Get all classifications for a discovery
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

  // Get similar discoveries based on classification properties
  const getSimilarDiscoveries = useCallback(
    (discoveryId: string) => {
      const discovery = discoveries.find(d => d.id === discoveryId);
      if (!discovery || !discovery.classification) {
        return [];
      }

      const targetClassification = discovery.classification;

      // Find discoveries with similar classifications
      return discoveries.filter(d => {
        if (d.id === discoveryId || !d.classification) {
          return false;
        }

        // Check if they share the same category
        if (d.classification.categoryId === targetClassification.categoryId) {
          // Calculate similarity score based on properties
          let matchingProperties = 0;
          let totalProperties = 0;

          Object.entries(targetClassification.properties).forEach(([key, value]) => {
            totalProperties++;
            if (d.classification?.properties[key] === value) {
              matchingProperties++;
            }
          });

          // Return true if at least 50% of properties match
          return totalProperties > 0 && matchingProperties / totalProperties >= 0.5;
        }

        return false;
      });
    },
    [discoveries]
  );

  // Generate classification suggestions using simulated AI
  const generateClassificationSuggestions = useCallback(
    (discovery: ClassifiableDiscovery): ClassificationSuggestion[] => {
      const suggestions: ClassificationSuggestion[] = [];

      // Determine the root category based on discovery type
      const rootCategoryId = discovery.type === 'anomaly' ? 'anomaly-root' : 'resource-root';

      // Get all primary categories under the root
      const primaryCategories = taxonomyCategories.filter(
        category => category.parentId === rootCategoryId
      );

      // For anomalies, use the anomaly type and analysis results to suggest categories
      if (discovery.type === 'anomaly' && discovery.anomalyType) {
        // Map anomaly types to likely categories
        const typeToCategory: Record<string, string[]> = {
          artifact: ['technological-anomaly'],
          signal: ['energy-anomaly', 'spatial-anomaly'],
          phenomenon: [
            'spatial-anomaly',
            'temporal-anomaly',
            'energy-anomaly',
            'biological-anomaly',
          ],
        };

        const likelyCategoryIds = typeToCategory[discovery.anomalyType] || [];

        // Generate suggestions for each likely category
        likelyCategoryIds.forEach(categoryId => {
          const category = getTaxonomyCategory(categoryId);
          if (category) {
            // Calculate confidence based on analysis results if available
            let confidence = 0.7; // Default confidence

            if (discovery.analysisResults) {
              // Adjust confidence based on analysis results
              // This is a simplified simulation of AI confidence calculation
              confidence = Math.min(
                0.9,
                confidence + 0.1 * Object.keys(discovery.analysisResults).length
              );
            }

            suggestions.push({
              categoryId,
              confidence,
              reasoning: `Based on the anomaly type "${discovery.anomalyType}" and available analysis data.`,
              propertyValues: {},
            });
          }
        });
      }

      // For resources, use the resource type to suggest categories
      else if (discovery.type === 'resource' && discovery.resourceType) {
        // Map resource types to categories
        const typeToCategory: Record<string, string> = {
          minerals: 'mineral-resource',
          energy: 'energy-resource',
          gas: 'gas-resource',
          organic: 'organic-resource',
          exotic: 'exotic-resource',
        };

        const categoryId = typeToCategory[discovery.resourceType];
        if (categoryId) {
          const category = getTaxonomyCategory(categoryId);
          if (category) {
            // Calculate confidence based on resource quality and amount
            let confidence = 0.8; // Default confidence

            if (discovery.quality !== undefined && discovery.amount !== undefined) {
              // Higher quality and amount increase confidence
              confidence = Math.min(
                0.95,
                confidence + 0.05 * discovery.quality + 0.01 * Math.min(discovery.amount, 10)
              );
            }

            suggestions.push({
              categoryId,
              confidence,
              reasoning: `Based on the resource type "${discovery.resourceType}" and its properties.`,
              propertyValues: {
                quality: discovery.quality || 0,
                amount: discovery.amount || 0,
                distribution: discovery.distribution || 'scattered',
              },
            });
          }
        }
      }

      // If no specific suggestions were made, suggest based on primary categories with lower confidence
      if (suggestions.length === 0) {
        primaryCategories.forEach(category => {
          suggestions.push({
            categoryId: category.id,
            confidence: 0.3, // Low confidence for generic suggestions
            reasoning: 'Limited data available for precise classification.',
            propertyValues: {},
          });
        });
      }

      // Sort suggestions by confidence (highest first)
      return suggestions.sort((a, b) => b.confidence - a.confidence);
    },
    [taxonomyCategories, getTaxonomyCategory]
  );

  // Create the context value
  const contextValue = useMemo(
    () => ({
      taxonomyCategories,
      classifications,
      addClassification,
      updateClassification,
      deleteClassification,
      getClassificationById,
      getClassificationsForDiscovery,
      getTaxonomyCategory,
      getSimilarDiscoveries,
      generateClassificationSuggestions,
    }),
    [
      taxonomyCategories,
      classifications,
      addClassification,
      updateClassification,
      deleteClassification,
      getClassificationById,
      getClassificationsForDiscovery,
      getTaxonomyCategory,
      getSimilarDiscoveries,
      generateClassificationSuggestions,
    ]
  );

  return (
    <ClassificationContext.Provider value={contextValue}>{children}</ClassificationContext.Provider>
  );
};

// Custom hook to use the classification context
export const useClassification = (): ClassificationContextType => {
  const context = useContext(ClassificationContext);
  if (context === undefined) {
    throw new Error('useClassification must be used within a ClassificationProvider');
  }
  return context;
};
