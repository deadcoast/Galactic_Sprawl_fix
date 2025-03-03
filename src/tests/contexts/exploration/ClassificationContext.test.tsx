import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ClassificationProvider, useClassification } from '../../../contexts/ClassificationContext';
import {
  createMockClassifiableDiscovery,
  createMockClassification,
  createMockTaxonomyCategory,
  createMockTaxonomyHierarchy
} from '../../utils/exploration/explorationTestUtils';
import { ClassifiableDiscovery, Classification, TaxonomyCategory } from '../../../types/exploration/ClassificationTypes';

// Test component that uses the ClassificationContext
const TestComponent: React.FC<{
  onAddClassification?: (classification: Classification) => void;
  onUpdateClassification?: (id: string, updates: Partial<Classification>) => void;
  onDeleteClassification?: (id: string) => void;
}> = ({ onAddClassification, onUpdateClassification, onDeleteClassification }) => {
  const {
    taxonomyCategories,
    classifications,
    addClassification,
    updateClassification,
    deleteClassification,
    getClassificationById,
    getClassificationsForDiscovery,
    getTaxonomyCategory,
    getSimilarDiscoveries,
    generateClassificationSuggestions
  } = useClassification();

  const handleAddClassification = () => {
    const newClassification = {
      discoveryId: 'test-discovery-1',
      discoveryType: 'anomaly' as const,
      categoryId: 'spatial-anomaly',
      confidence: 0.85,
      confidenceLevel: 'high' as const,
      properties: {
        name: 'Test Classification',
        intensity: 75,
        isStable: true
      },
      classifiedBy: 'user' as const,
      classifiedDate: Date.now()
    };
    
    addClassification(newClassification);
    
    if (onAddClassification) {
      // Find the newly added classification
      const addedClassification = classifications.find(
        c => c.discoveryId === newClassification.discoveryId && 
             c.categoryId === newClassification.categoryId
      );
      
      if (addedClassification) {
        onAddClassification(addedClassification);
      }
    }
  };

  const handleUpdateClassification = (id: string) => {
    const updates = {
      confidence: 0.95,
      confidenceLevel: 'confirmed' as const,
      notes: 'Updated classification notes'
    };
    
    updateClassification(id, updates);
    if (onUpdateClassification) {
      onUpdateClassification(id, updates);
    }
  };

  const handleDeleteClassification = (id: string) => {
    deleteClassification(id);
    if (onDeleteClassification) {
      onDeleteClassification(id);
    }
  };

  const testDiscovery = createMockClassifiableDiscovery({
    id: 'test-discovery-1',
    type: 'anomaly',
    anomalyType: 'phenomenon'
  });

  const suggestions = generateClassificationSuggestions(testDiscovery);

  return (
    <div>
      <h1>Classification Test Component</h1>
      
      <div>
        <h2>Taxonomy Categories ({taxonomyCategories.length})</h2>
        <ul>
          {taxonomyCategories.map(category => (
            <li key={category.id} data-testid={`category-${category.id}`}>
              {category.name} (Level: {category.level})
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h2>Classifications ({classifications.length})</h2>
        <ul>
          {classifications.map(classification => (
            <li key={classification.id} data-testid={`classification-${classification.id}`}>
              {classification.id} - Confidence: {classification.confidence}
              <button 
                onClick={() => handleUpdateClassification(classification.id)}
                data-testid={`update-${classification.id}`}
              >
                Update
              </button>
              <button 
                onClick={() => handleDeleteClassification(classification.id)}
                data-testid={`delete-${classification.id}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h2>Classification Suggestions ({suggestions.length})</h2>
        <ul>
          {suggestions.map((suggestion, index) => (
            <li key={index} data-testid={`suggestion-${index}`}>
              Category: {suggestion.categoryId} - Confidence: {suggestion.confidence}
            </li>
          ))}
        </ul>
      </div>
      
      <button onClick={handleAddClassification} data-testid="add-classification">
        Add Classification
      </button>
    </div>
  );
};

describe('ClassificationContext', () => {
  let mockTaxonomyCategories: TaxonomyCategory[];
  let mockClassifications: Classification[];
  let mockDiscoveries: ClassifiableDiscovery[];

  beforeEach(() => {
    mockTaxonomyCategories = createMockTaxonomyHierarchy();
    mockClassifications = [
      createMockClassification({
        id: 'classification-1',
        discoveryId: 'discovery-1',
        categoryId: 'spatial-anomaly',
        confidence: 0.8,
        confidenceLevel: 'high'
      }),
      createMockClassification({
        id: 'classification-2',
        discoveryId: 'discovery-2',
        categoryId: 'temporal-anomaly',
        confidence: 0.6,
        confidenceLevel: 'medium'
      })
    ];
    mockDiscoveries = [
      createMockClassifiableDiscovery({
        id: 'discovery-1',
        type: 'anomaly',
        anomalyType: 'phenomenon'
      }),
      createMockClassifiableDiscovery({
        id: 'discovery-2',
        type: 'anomaly',
        anomalyType: 'signal'
      }),
      createMockClassifiableDiscovery({
        id: 'test-discovery-1',
        type: 'anomaly',
        anomalyType: 'phenomenon'
      })
    ];
  });

  it('should render taxonomy categories', () => {
    render(
      <ClassificationProvider 
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={mockClassifications}
        discoveryData={mockDiscoveries}
      >
        <TestComponent />
      </ClassificationProvider>
    );

    // Check if all taxonomy categories are rendered
    mockTaxonomyCategories.forEach(category => {
      expect(screen.getByTestId(`category-${category.id}`)).toBeInTheDocument();
    });
  });

  it('should render classifications', () => {
    render(
      <ClassificationProvider 
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={mockClassifications}
        discoveryData={mockDiscoveries}
      >
        <TestComponent />
      </ClassificationProvider>
    );

    // Check if all classifications are rendered
    mockClassifications.forEach(classification => {
      expect(screen.getByTestId(`classification-${classification.id}`)).toBeInTheDocument();
    });
  });

  it('should add a new classification', async () => {
    const onAddClassification = vi.fn();
    const user = userEvent.setup();

    render(
      <ClassificationProvider 
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={mockClassifications}
        discoveryData={mockDiscoveries}
      >
        <TestComponent onAddClassification={onAddClassification} />
      </ClassificationProvider>
    );

    // Click the add classification button
    await user.click(screen.getByTestId('add-classification'));

    // Check if the callback was called
    await waitFor(() => {
      expect(onAddClassification).toHaveBeenCalled();
    });
    
    // The new classification should be added to the list
    await waitFor(() => {
      expect(screen.getAllByTestId(/^classification-/)).toHaveLength(mockClassifications.length + 1);
    });
  });

  it('should update a classification', async () => {
    const onUpdateClassification = vi.fn();
    const user = userEvent.setup();

    render(
      <ClassificationProvider 
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={mockClassifications}
        discoveryData={mockDiscoveries}
      >
        <TestComponent onUpdateClassification={onUpdateClassification} />
      </ClassificationProvider>
    );

    // Click the update button for the first classification
    await user.click(screen.getByTestId(`update-${mockClassifications[0].id}`));

    // Check if the callback was called with the correct parameters
    expect(onUpdateClassification).toHaveBeenCalledWith(
      mockClassifications[0].id,
      expect.objectContaining({
        confidence: 0.95,
        confidenceLevel: 'confirmed',
        notes: 'Updated classification notes'
      })
    );
  });

  it('should delete a classification', async () => {
    const onDeleteClassification = vi.fn();
    const user = userEvent.setup();

    render(
      <ClassificationProvider 
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={mockClassifications}
        discoveryData={mockDiscoveries}
      >
        <TestComponent onDeleteClassification={onDeleteClassification} />
      </ClassificationProvider>
    );

    // Get the initial number of classifications
    const initialClassifications = screen.getAllByTestId(/^classification-/);

    // Click the delete button for the first classification
    await user.click(screen.getByTestId(`delete-${mockClassifications[0].id}`));

    // Check if the callback was called with the correct ID
    expect(onDeleteClassification).toHaveBeenCalledWith(mockClassifications[0].id);
    
    // The classification should be removed from the list
    await waitFor(() => {
      expect(screen.getAllByTestId(/^classification-/)).toHaveLength(initialClassifications.length - 1);
    });
  });

  it('should generate classification suggestions', () => {
    render(
      <ClassificationProvider 
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={mockClassifications}
        discoveryData={mockDiscoveries}
      >
        <TestComponent />
      </ClassificationProvider>
    );

    // Check if suggestions are generated
    expect(screen.getAllByTestId(/^suggestion-/)).toHaveLength(expect.any(Number));
  });
}); 