import * as React from "react";
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscoveryClassification } from '../../../components/exploration/DiscoveryClassification';
import { ClassificationProvider } from '../../../contexts/ClassificationContext';
import {
  ClassificationProperty,
  TaxonomyCategory,
} from '../../../types/exploration/ClassificationTypes';
import {
  createMockClassifiableDiscovery,
  createMockClassification,
  createMockClassificationProperty,
  createMockTaxonomyHierarchy,
} from '../../utils/exploration/explorationTestUtils';

// Mock the useClassification hook
vi.mock('../../../contexts/ClassificationContext', async () => {
  const actual = await vi.importActual('../../../contexts/ClassificationContext');
  return {
    ...actual,
    useClassification: () => ({
      taxonomyCategories: mockTaxonomyCategories,
      classifications: mockClassifications,
      addClassification: vi.fn(),
      updateClassification: vi.fn(),
      deleteClassification: vi.fn(),
      getClassificationById: vi.fn(),
      getClassificationsForDiscovery: vi.fn().mockReturnValue([mockClassification]),
      getTaxonomyCategory: vi.fn(),
      getSimilarDiscoveries: vi.fn().mockReturnValue([]),
      generateClassificationSuggestions: vi.fn().mockReturnValue([
        {
          categoryId: 'spatial-anomaly',
          confidence: 0.85,
          reasoning: 'Based on the spatial distortion patterns',
          propertyValues: {
            stability: 75,
            radiationType: 'Gamma',
          },
        },
      ]),
    }),
  };
});

// Create mock data before tests run
const mockTaxonomyCategories = createMockTaxonomyHierarchy();
const mockDiscovery = createMockClassifiableDiscovery({
  id: 'discovery-test-1',
  type: 'anomaly',
  name: 'Test Anomaly',
  anomalyType: 'phenomenon',
  severity: 'high',
});

const mockClassification = createMockClassification({
  id: 'classification-test-1',
  discoveryId: mockDiscovery.id,
  discoveryType: 'anomaly',
  categoryId: 'spatial-anomaly',
  confidence: 0.85,
  confidenceLevel: 'high',
});

const mockDiscoveries = [mockDiscovery];
const mockClassifications = [mockClassification];

describe('DiscoveryClassification', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  it('should render the component with discovery information', () => {
    render(
      <ClassificationProvider
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={mockClassifications}
        discoveryData={mockDiscoveries}
      >
        <DiscoveryClassification discovery={mockDiscovery} />
      </ClassificationProvider>
    );

    // Check if the discovery name is rendered
    expect(screen.getByText(mockDiscovery.name)).toBeInTheDocument();

    // Check if the classification information is rendered
    expect(screen.getByText(/Confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('should display taxonomy categories', async () => {
    render(
      <ClassificationProvider
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={mockClassifications}
        discoveryData={mockDiscoveries}
      >
        <DiscoveryClassification discovery={mockDiscovery} />
      </ClassificationProvider>
    );

    // Check if taxonomy categories are rendered
    expect(screen.getByText('Spatial Anomalies')).toBeInTheDocument();
    expect(screen.getByText('Temporal Anomalies')).toBeInTheDocument();
  });

  it('should allow selecting a category', async () => {
    const user = userEvent.setup();

    render(
      <ClassificationProvider
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={[]}
        discoveryData={mockDiscoveries}
      >
        <DiscoveryClassification discovery={mockDiscovery} />
      </ClassificationProvider>
    );

    // Find and click on a category
    const categoryElement = screen.getByText('Spatial Anomalies');
    await user.click(categoryElement);

    // Check if the category is selected (this might vary based on your implementation)
    await waitFor(() => {
      expect(
        categoryElement.closest('[data-selected="true"]') ||
          categoryElement.closest('.selected') ||
          categoryElement.closest('[aria-selected="true"]')
      ).toBeInTheDocument();
    });
  });

  it('should display confidence controls', () => {
    render(
      <ClassificationProvider
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={mockClassifications}
        discoveryData={mockDiscoveries}
      >
        <DiscoveryClassification discovery={mockDiscovery} />
      </ClassificationProvider>
    );

    // Check if confidence controls are rendered
    expect(screen.getByText(/Confidence/i)).toBeInTheDocument();

    // This might vary based on your implementation
    const confidenceSlider = screen.getByRole('slider') || screen.getByLabelText(/confidence/i);
    expect(confidenceSlider).toBeInTheDocument();
  });

  it('should display property fields for the selected category', async () => {
    const user = userEvent.setup();

    // Create properties with correct types
    const stabilityProperty: ClassificationProperty = createMockClassificationProperty({
      id: 'property-1',
      name: 'Stability',
      description: 'Stability of the anomaly',
      type: 'number',
      required: true,
      unit: '%',
    });

    const radiationProperty: ClassificationProperty = createMockClassificationProperty({
      id: 'property-2',
      name: 'Radiation Type',
      description: 'Type of radiation emitted',
      type: 'enum',
      required: false,
      options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
    });

    // Add properties to the spatial anomaly category
    const mockCategoriesWithProperties: TaxonomyCategory[] = mockTaxonomyCategories.map(
      category => {
        if (category.id === 'spatial-anomaly') {
          return {
            ...category,
            properties: [stabilityProperty, radiationProperty],
          };
        }
        return category;
      }
    );

    render(
      <ClassificationProvider
        initialTaxonomyCategories={mockCategoriesWithProperties}
        initialClassifications={[]}
        discoveryData={mockDiscoveries}
      >
        <DiscoveryClassification discovery={mockDiscovery} />
      </ClassificationProvider>
    );

    // Find and click on the spatial anomaly category
    const categoryElement = screen.getByText('Spatial Anomalies');
    await user.click(categoryElement);

    // Check if property fields are rendered
    await waitFor(() => {
      expect(screen.getByText('Stability')).toBeInTheDocument();
      expect(screen.getByText('Radiation Type')).toBeInTheDocument();
    });
  });

  it('should display AI suggestions when available', async () => {
    // No need to mock the generateClassificationSuggestions function
    // as it's already mocked in the vi.mock above

    render(
      <ClassificationProvider
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={[]}
        discoveryData={mockDiscoveries}
      >
        <DiscoveryClassification discovery={mockDiscovery} />
      </ClassificationProvider>
    );

    // Check if AI suggestions are rendered
    await waitFor(() => {
      expect(screen.getByText(/AI Suggestions/i)).toBeInTheDocument();
      expect(screen.getByText(/Spatial Anomalies \(85%\)/i)).toBeInTheDocument();
    });
  });

  it('should allow saving a classification', async () => {
    const user = userEvent.setup();
    const onClassify = vi.fn();

    render(
      <ClassificationProvider
        initialTaxonomyCategories={mockTaxonomyCategories}
        initialClassifications={[]}
        discoveryData={mockDiscoveries}
      >
        <DiscoveryClassification discovery={mockDiscovery} onClassify={onClassify} />
      </ClassificationProvider>
    );

    // Find and click on a category
    const categoryElement = screen.getByText('Spatial Anomalies');
    await user.click(categoryElement);

    // Find and click the save/classify button
    const saveButton = screen.getByRole('button', { name: /save|classify|confirm/i });
    await user.click(saveButton);

    // Check if the onClassify callback was called
    await waitFor(() => {
      expect(onClassify).toHaveBeenCalled();
    });
  });
});
