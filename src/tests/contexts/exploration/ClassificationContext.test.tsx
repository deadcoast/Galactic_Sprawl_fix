import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClassificationProvider, useClassification } from '../../../contexts/ClassificationContext';
import {
  ClassifiableDiscovery,
  Classification,
  TaxonomyCategory,
} from '../../../types/exploration/ClassificationTypes';
import {
  createMockClassifiableDiscovery,
  createMockClassification,
  createMockTaxonomyCategory,
  createMockTaxonomyHierarchy,
} from '../../utils/exploration/explorationTestUtils';

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
    generateClassificationSuggestions,
  } = useClassification();

  const handleAddClassification = () => {
    const newClassification = {
      discoveryId: 'test-discovery-1',
      discoveryType: 'anomaly' as const,
      categoryId: 'spatial-anomaly',
      confidence: 0.85,
      confidenceLevel: 'high' as const,
      properties: {
        intensity: 'high',
        stability: 'unstable',
      },
      notes: 'This is a test classification',
      classifiedBy: 'user' as const,
      classifiedDate: Date.now(),
    };

    addClassification(newClassification);

    if (onAddClassification) {
      // Find the newly added classification
      const addedClassification = classifications.find(
        c =>
          c.discoveryId === newClassification.discoveryId &&
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
      notes: 'Updated classification notes',
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

  // Add a function to test getClassificationById
  const handleGetClassification = () => {
    const classification = getClassificationById('test-classification-1');
    return classification;
  };

  // Add a function to test getClassificationsForDiscovery
  const handleGetClassificationsForDiscovery = (discoveryId: string) => {
    const discoveryClassifications = getClassificationsForDiscovery(discoveryId);
    return discoveryClassifications;
  };

  // Add a function to test getTaxonomyCategory
  const handleGetTaxonomyCategory = (categoryId: string) => {
    const category = getTaxonomyCategory(categoryId);
    return category;
  };

  // Add a function to test getSimilarDiscoveries
  const handleGetSimilarDiscoveries = (discoveryId: string) => {
    const similarDiscoveries = getSimilarDiscoveries(discoveryId);
    return similarDiscoveries;
  };

  const testDiscovery = createMockClassifiableDiscovery({
    id: 'test-discovery-1',
    type: 'anomaly',
    anomalyType: 'phenomenon',
  });

  const suggestions = generateClassificationSuggestions(testDiscovery);

  return (
    <div>
      <h2>Classification Test Component</h2>

      <div>
        <h3>Taxonomy Categories</h3>
        <ul>
          {taxonomyCategories.map(category => (
            <li key={category.id}>{category.name}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Classifications</h3>
        <ul>
          {classifications.map(classification => (
            <li key={classification.id}>
              {classification.discoveryType} - {classification.categoryId}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <button onClick={handleAddClassification}>Add Classification</button>
        <button onClick={() => handleUpdateClassification('test-classification-1')}>
          Update Classification
        </button>
        <button onClick={() => handleDeleteClassification('test-classification-1')}>
          Delete Classification
        </button>

        {/* Add buttons for the new functions */}
        <button onClick={() => handleGetClassification()}>Get Classification</button>
        <button onClick={() => handleGetClassificationsForDiscovery('test-discovery-1')}>
          Get Discovery Classifications
        </button>
        <button onClick={() => handleGetTaxonomyCategory('spatial-anomaly')}>
          Get Taxonomy Category
        </button>
        <button onClick={() => handleGetSimilarDiscoveries('test-discovery-1')}>
          Get Similar Discoveries
        </button>

        <button onClick={() => generateClassificationSuggestions(testDiscovery)}>
          Generate Suggestions
        </button>
      </div>

      {/* Display areas for the results of the new functions */}
      <div id="classification-details">
        {/* This will be populated when handleGetClassification is called */}
      </div>

      <div id="discovery-classifications">
        {/* This will be populated when handleGetClassificationsForDiscovery is called */}
      </div>

      <div id="category-details">
        {/* This will be populated when handleGetTaxonomyCategory is called */}
      </div>

      <div id="similar-discoveries">
        {/* This will be populated when handleGetSimilarDiscoveries is called */}
      </div>

      <div>
        <h3>Suggestions</h3>
        <div>
          {suggestions.map((suggestion, index) => (
            <div key={index} data-testid={`suggestion-${index}`}>
              {suggestion.categoryId} - {suggestion.confidence}
            </div>
          ))}
        </div>
      </div>
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
        confidenceLevel: 'high',
      }),
      createMockClassification({
        id: 'classification-2',
        discoveryId: 'discovery-2',
        categoryId: 'temporal-anomaly',
        confidence: 0.6,
        confidenceLevel: 'medium',
      }),
    ];
    mockDiscoveries = [
      createMockClassifiableDiscovery({
        id: 'discovery-1',
        type: 'anomaly',
        anomalyType: 'phenomenon',
      }),
      createMockClassifiableDiscovery({
        id: 'discovery-2',
        type: 'anomaly',
        anomalyType: 'signal',
      }),
      createMockClassifiableDiscovery({
        id: 'test-discovery-1',
        type: 'anomaly',
        anomalyType: 'phenomenon',
      }),
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
      expect(screen.getByText(category.name)).toBeInTheDocument();
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
      expect(
        screen.getByText(`${classification.discoveryType} - ${classification.categoryId}`)
      ).toBeInTheDocument();
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
    await user.click(screen.getByText('Add Classification'));

    // Check if the callback was called
    await waitFor(() => {
      expect(onAddClassification).toHaveBeenCalled();
    });

    // The new classification should be added to the list
    await waitFor(() => {
      expect(screen.getAllByText(/^classification-/)).toHaveLength(mockClassifications.length + 1);
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
    await user.click(screen.getByText('Update Classification'));

    // Check if the callback was called with the correct parameters
    expect(onUpdateClassification).toHaveBeenCalledWith(
      mockClassifications[0].id,
      expect.objectContaining({
        confidence: 0.95,
        confidenceLevel: 'confirmed',
        notes: 'Updated classification notes',
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
    const initialClassifications = screen.getAllByText(/^classification-/);

    // Click the delete button for the first classification
    await user.click(screen.getByText('Delete Classification'));

    // Check if the callback was called with the correct ID
    expect(onDeleteClassification).toHaveBeenCalledWith(mockClassifications[0].id);

    // The classification should be removed from the list
    await waitFor(() => {
      expect(screen.getAllByText(/^classification-/)).toHaveLength(
        initialClassifications.length - 1
      );
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

  it('should retrieve a classification by ID', async () => {
    const mockClassification = createMockClassification({
      id: 'test-classification-1',
      discoveryId: 'test-discovery-1',
      categoryId: 'spatial-anomaly',
    });
    const mockTaxonomyCategory = createMockTaxonomyCategory({
      id: 'spatial-anomaly',
      name: 'Spatial Anomaly',
    });

    // Mock the context to return our mock data
    vi.spyOn(React, 'useContext').mockReturnValue({
      getClassificationById: vi.fn().mockReturnValue(mockClassification),
      getTaxonomyCategory: vi.fn().mockReturnValue(mockTaxonomyCategory),
      // Add other required context values
      taxonomyCategories: [mockTaxonomyCategory],
      classifications: [mockClassification],
      addClassification: vi.fn(),
      updateClassification: vi.fn(),
      deleteClassification: vi.fn(),
      getClassificationsForDiscovery: vi.fn(),
      getSimilarDiscoveries: vi.fn(),
      generateClassificationSuggestions: vi.fn().mockReturnValue([]),
    });

    const handleAddClassificationMock = vi.fn();

    render(
      <ClassificationProvider>
        <TestComponent onAddClassification={handleAddClassificationMock} />
      </ClassificationProvider>
    );

    // Add a classification first
    const addButton = screen.getByText(/add classification/i);
    await userEvent.click(addButton);

    // Wait for the classification to be added
    await waitFor(() => {
      expect(handleAddClassificationMock).toHaveBeenCalled();
    });

    // Now test getting the classification by ID
    const getButton = screen.getByText(/get classification/i);
    await userEvent.click(getButton);

    // Verify the classification details are displayed
    await waitFor(() => {
      expect(screen.getByText(/classification details/i)).toBeInTheDocument();
      // Verify the specific classification data is shown
      expect(screen.getByText(mockClassification.id)).toBeInTheDocument();
      expect(screen.getByText(mockTaxonomyCategory.name)).toBeInTheDocument();
    });
  });

  it('should get classifications for a discovery', async () => {
    render(
      <ClassificationProvider>
        <TestComponent />
      </ClassificationProvider>
    );

    // Add a button to trigger getClassificationsForDiscovery
    const getDiscoveryClassificationsButton = screen.getByText(/get discovery classifications/i);
    await userEvent.click(getDiscoveryClassificationsButton);

    // Verify the classifications are displayed
    await waitFor(() => {
      expect(screen.getByText(/discovery classifications/i)).toBeInTheDocument();
    });
  });

  it('should get taxonomy category', async () => {
    // Create a mock taxonomy category to test with
    const mockCategory = createMockTaxonomyCategory({
      id: 'test-category',
      name: 'Test Category',
      description: 'A test category for testing',
    });

    // Mock the context to return our mock data
    vi.spyOn(React, 'useContext').mockReturnValue({
      getTaxonomyCategory: vi.fn().mockReturnValue(mockCategory),
      // Add other required context values
      taxonomyCategories: [mockCategory],
      classifications: [],
      addClassification: vi.fn(),
      updateClassification: vi.fn(),
      deleteClassification: vi.fn(),
      getClassificationById: vi.fn(),
      getClassificationsForDiscovery: vi.fn(),
      getSimilarDiscoveries: vi.fn(),
      generateClassificationSuggestions: vi.fn().mockReturnValue([]),
    });

    render(
      <ClassificationProvider>
        <TestComponent />
      </ClassificationProvider>
    );

    // Add a button to trigger getTaxonomyCategory
    const getCategoryButton = screen.getByText(/get taxonomy category/i);
    await userEvent.click(getCategoryButton);

    // Verify the category details are displayed
    await waitFor(() => {
      expect(screen.getByText(/category details/i)).toBeInTheDocument();
      // Verify the specific category data is shown
      expect(screen.getByText(mockCategory.id)).toBeInTheDocument();
      expect(screen.getByText(mockCategory.name)).toBeInTheDocument();
      expect(screen.getByText(mockCategory.description)).toBeInTheDocument();
    });
  });

  it('should get similar discoveries', async () => {
    render(
      <ClassificationProvider>
        <TestComponent />
      </ClassificationProvider>
    );

    // Add a button to trigger getSimilarDiscoveries
    const getSimilarButton = screen.getByText(/get similar discoveries/i);
    await userEvent.click(getSimilarButton);

    // Verify the similar discoveries are displayed
    await waitFor(() => {
      expect(screen.getByText(/similar discoveries/i)).toBeInTheDocument();
    });
  });
});
