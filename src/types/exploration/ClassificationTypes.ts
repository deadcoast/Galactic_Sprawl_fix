import { ResourceType } from './../resources/ResourceTypes';

/**
 * Represents a taxonomic category in the classification system
 */
export interface TaxonomyCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  level: number; // Hierarchy level (0 = root, 1 = primary, 2 = secondary, etc.)
  color?: string;
  icon?: string;
  properties?: ClassificationProperty[]; // Properties specific to this category
}

/**
 * Represents a property that can be used to classify discoveries
 */
export interface ClassificationProperty {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  required: boolean;
  options?: string[]; // For enum type
  unit?: string; // For number type (e.g., "kg", "light-years")
  defaultValue?: string | number | boolean | string[];
}

/**
 * Represents a classification confidence level
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'confirmed';

/**
 * Represents a classification for a discovery
 */
export interface Classification {
  id: string;
  discoveryId: string;
  discoveryType: 'anomaly' | 'resource';
  categoryId: string;
  confidence: number; // 0-1 scale
  confidenceLevel: ConfidenceLevel;
  properties: Record<string, string | number | boolean | string[]>; // Property values specific to this classification
  notes?: string;
  classifiedBy: 'ai' | 'user' | 'system';
  classifiedDate: number;
  verifiedBy?: string;
  verifiedDate?: number;
  previousClassifications?: string[]; // IDs of previous classifications if reclassified
  similarDiscoveries?: string[]; // IDs of similar discoveries
}

/**
 * Represents a discovery that can be classified (either anomaly or resource)
 */
export interface ClassifiableDiscovery {
  id: string;
  type: 'anomaly' | 'resource';
  name: string;
  discoveryDate: number;
  sectorId: string;
  sectorName: string;
  coordinates: { x: number; y: number };
  classification?: Classification;
  // Properties specific to anomalies
  anomalyType?: 'artifact' | 'signal' | 'phenomenon';
  severity?: 'low' | 'medium' | 'high';
  analysisResults?: Record<string, string | number | boolean | object>;
  // Properties specific to resources
  resourceType?: ResourceType;
  amount?: number;
  quality?: number;
  distribution?: 'concentrated' | 'scattered' | 'veins';
}

/**
 * Represents a classification suggestion generated by the AI
 */
export interface ClassificationSuggestion {
  categoryId: string;
  confidence: number;
  reasoning: string;
  propertyValues: Record<string, string | number | boolean | string[]>;
}

/**
 * Context for the classification system
 */
export interface ClassificationContextType {
  taxonomyCategories: TaxonomyCategory[];
  classifications: Classification[];
  discoveries: ClassifiableDiscovery[];
  addClassification: (classification: Omit<Classification, 'id'>) => void;
  updateClassification: (id: string, updates: Partial<Classification>) => void;
  deleteClassification: (id: string) => void;
  getClassificationById: (id: string) => Classification | undefined;
  getClassificationsForDiscovery: (discoveryId: string) => Classification[];
  getTaxonomyCategory: (id: string) => TaxonomyCategory | undefined;
  getSimilarDiscoveries: (discoveryId: string) => ClassifiableDiscovery[];
  generateClassificationSuggestions: (
    discovery: ClassifiableDiscovery
  ) => ClassificationSuggestion[];
  addTaxonomyCategory: (category: Omit<TaxonomyCategory, 'id'>) => void;
  updateTaxonomyCategory: (id: string, updates: Partial<TaxonomyCategory>) => void;
  deleteTaxonomyCategory: (id: string) => void;
  addDiscovery: (discovery: ClassifiableDiscovery) => void;
}
