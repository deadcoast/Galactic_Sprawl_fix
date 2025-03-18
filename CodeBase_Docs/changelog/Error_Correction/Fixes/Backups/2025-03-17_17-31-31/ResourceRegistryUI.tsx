/**
 * ResourceRegistryUI.tsx
 *
 * A debug UI component for viewing and managing resources in the Resource Registry.
 * This component provides visualization of resource flows and conversions.
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ExtendedResourceMetadata,
  ResourceQuality,
  ResourceRegistry,
} from '../registry/ResourceRegistry';
import { ResourceCategory, ResourceType } from './../types/resources/ResourceTypes';

// Styles
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #ddd',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    fontWeight: 500,
  },
  activeTab: {
    borderBottom: '2px solid #007bff',
    color: '#007bff',
  },
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  resourceCard: {
    backgroundColor: '#fff',
    borderRadius: '6px',
    padding: '15px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease',
    cursor: 'pointer',
    position: 'relative' as const,
  },
  resourceCardHover: {
    transform: 'translateY(-5px)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  resourceHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  resourceIcon: {
    width: '32px',
    height: '32px',
    marginRight: '10px',
    backgroundColor: '#eee',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  resourceName: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  resourceCategory: {
    position: 'absolute' as const,
    top: '15px',
    right: '15px',
    fontSize: '12px',
    padding: '3px 8px',
    borderRadius: '12px',
    backgroundColor: '#eee',
  },
  resourceDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
  },
  resourceTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '5px',
    marginBottom: '10px',
  },
  resourceTag: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: '#e9f5ff',
    color: '#0066cc',
  },
  resourceProperty: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    marginBottom: '5px',
  },
  resourcePropertyLabel: {
    color: '#666',
  },
  resourcePropertyValue: {
    fontWeight: 500,
  },
  qualityLevels: {
    marginTop: '15px',
  },
  qualityTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  qualityBars: {
    display: 'flex',
    height: '8px',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  qualityBar: {
    height: '100%',
  },
  conversionSection: {
    marginTop: '30px',
  },
  conversionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  conversionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
  },
  conversionCard: {
    backgroundColor: '#fff',
    borderRadius: '6px',
    padding: '15px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  conversionArrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '10px 0',
    fontSize: '20px',
    color: '#666',
  },
  conversionRate: {
    textAlign: 'center' as const,
    fontWeight: 'bold',
    fontSize: '16px',
  },
  flowSection: {
    marginTop: '30px',
  },
  flowTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  flowVisualization: {
    backgroundColor: '#fff',
    borderRadius: '6px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    height: '400px',
    position: 'relative' as const,
  },
  filterSection: {
    marginBottom: '20px',
  },
  filterRow: {
    display: 'flex',
    gap: '15px',
    marginBottom: '10px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginRight: '10px',
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
  },
  searchInput: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    width: '250px',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    width: '600px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative' as const,
  },
  modalClose: {
    position: 'absolute' as const,
    top: '15px',
    right: '15px',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  formGroup: {
    marginBottom: '15px',
  },
  formLabel: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  formInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  formRow: {
    display: 'flex',
    gap: '15px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
};

// Color mapping for resource categories
const categoryColors = {
  [ResourceCategory.BASIC]: '#4caf50',
  [ResourceCategory.ADVANCED]: '#2196f3',
  [ResourceCategory.SPECIAL]: '#9c27b0',
};

// Color mapping for quality levels
const qualityColors = {
  [ResourceQuality.LOW]: '#ff9800',
  [ResourceQuality.MEDIUM]: '#4caf50',
  [ResourceQuality.HIGH]: '#2196f3',
  [ResourceQuality.PREMIUM]: '#9c27b0',
};

// Interface for component props
interface ResourceRegistryUIProps {
  initialTab?: 'resources' | 'conversions' | 'flows';
  showHeader?: boolean;
  height?: string | number;
  width?: string | number;
}

/**
 * ResourceRegistryUI Component
 *
 * A debug UI for viewing and managing resources in the Resource Registry.
 */
export const ResourceRegistryUI: React.FC<ResourceRegistryUIProps> = ({
  initialTab = 'resources',
  showHeader = true,
  height = 'auto',
  width = '100%',
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'resources' | 'conversions' | 'flows'>(initialTab);
  const [resources, setResources] = useState<ExtendedResourceMetadata[]>([]);
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
  const [hoveredResource, setHoveredResource] = useState<ResourceType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string | 'all'>('all');
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showEditResourceModal, setShowEditResourceModal] = useState(false);
  const [showAddConversionModal, setShowAddConversionModal] = useState(false);

  // Get the registry instance
  const registry = useMemo(() => ResourceRegistry.getInstance(), []);

  // Load resources from registry
  useEffect(() => {
    const loadResources = () => {
      const resourceTypes = registry.getAllResourceTypes();
      const resourceData = resourceTypes
        .map(type => registry.getResourceMetadata(type))
        .filter((metadata): metadata is ExtendedResourceMetadata => metadata !== undefined);

      setResources(resourceData);
    };

    loadResources();

    // Subscribe to registry events
    const unsubscribeRegistered = registry.subscribe('resourceRegistered', () => {
      loadResources();
    });

    const unsubscribeUnregistered = registry.subscribe('resourceUnregistered', () => {
      loadResources();
    });

    const unsubscribeMetadataUpdated = registry.subscribe('resourceMetadataUpdated', () => {
      loadResources();
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeRegistered();
      unsubscribeUnregistered();
      unsubscribeMetadataUpdated();
    };
  }, [registry]);

  // Get all unique tags from resources
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    resources.forEach(resource => {
      resource.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [resources]);

  // Filter resources based on search query, category, and tag
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      // Filter by search query
      const matchesSearch =
        searchQuery === '' ||
        resource.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filter by category
      const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;

      // Filter by tag
      const matchesTag = tagFilter === 'all' || resource.tags.includes(tagFilter);

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [resources, searchQuery, categoryFilter, tagFilter]);

  // Get conversion data for the selected resource
  const resourceConversions = useMemo(() => {
    if (!selectedResource) return { inputs: [], outputs: [] };

    const inputs = Array.from(registry.findConversionSources(selectedResource).entries()).map(
      ([sourceType, rate]) => ({
        sourceType,
        targetType: selectedResource,
        rate,
      })
    );

    const outputs = Array.from(registry.getAllConversionRates(selectedResource).entries()).map(
      ([targetType, rate]) => ({
        sourceType: selectedResource,
        targetType,
        rate,
      })
    );

    return { inputs, outputs };
  }, [registry, selectedResource]);

  // Render resource card
  const renderResourceCard = (resource: ExtendedResourceMetadata) => {
    const isHovered = hoveredResource === resource.id;
    const isSelected = selectedResource === resource.id;

    return (
      <div
        key={resource.id}
        style={{
          ...styles.resourceCard,
          ...(isHovered ? styles.resourceCardHover : {}),
          border: isSelected ? '2px solid #007bff' : '1px solid #ddd',
        }}
        onMouseEnter={() => setHoveredResource(resource.id)}
        onMouseLeave={() => setHoveredResource(null)}
        onClick={() => setSelectedResource(resource.id)}
      >
        <div style={styles.resourceHeader}>
          <div style={styles.resourceIcon}>
            {resource.icon ? (
              <img src={resource.icon} alt={resource.displayName} width="24" height="24" />
            ) : (
              resource.displayName.charAt(0)
            )}
          </div>
          <h3 style={styles.resourceName}>{resource.displayName}</h3>
        </div>

        <div
          style={{
            ...styles.resourceCategory,
            backgroundColor: categoryColors[resource.category] || '#eee',
            color: '#fff',
          }}
        >
          {resource.category}
        </div>

        <p style={styles.resourceDescription}>{resource.description}</p>

        <div style={styles.resourceTags}>
          {resource.tags.map(tag => (
            <span key={tag} style={styles.resourceTag}>
              {tag}
            </span>
          ))}
        </div>

        <div style={styles.resourceProperty}>
          <span style={styles.resourcePropertyLabel}>Base Value:</span>
          <span style={styles.resourcePropertyValue}>{resource.baseValue}</span>
        </div>

        <div style={styles.resourceProperty}>
          <span style={styles.resourcePropertyLabel}>Weight:</span>
          <span style={styles.resourcePropertyValue}>{resource.weight}</span>
        </div>

        <div style={styles.resourceProperty}>
          <span style={styles.resourcePropertyLabel}>Storage Efficiency:</span>
          <span style={styles.resourcePropertyValue}>
            {(resource.storageEfficiency * 100).toFixed(0)}%
          </span>
        </div>

        <div style={styles.resourceProperty}>
          <span style={styles.resourcePropertyLabel}>Max Storage:</span>
          <span style={styles.resourcePropertyValue}>{resource.defaultMax}</span>
        </div>

        <div style={styles.qualityLevels}>
          <div style={styles.qualityTitle}>Quality Levels</div>
          <div style={styles.qualityBars}>
            {Object.entries(resource.qualityLevels).map(([quality, value]) => (
              <div
                key={quality}
                style={{
                  ...styles.qualityBar,
                  backgroundColor: qualityColors[quality as ResourceQuality] || '#eee',
                  width: `${(value / Object.values(resource.qualityLevels).reduce((a, b) => a + b, 0)) * 100}%`,
                }}
                title={`${quality}: ${value}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render conversion card
  const renderConversionCard = (
    sourceType: ResourceType,
    targetType: ResourceType,
    rate: number
  ) => {
    const sourceMetadata = registry.getResourceMetadata(sourceType);
    const targetMetadata = registry.getResourceMetadata(targetType);

    if (!sourceMetadata || !targetMetadata) return null;

    return (
      <div key={`${sourceType}-${targetType}`} style={styles.conversionCard}>
        <div style={styles.resourceHeader}>
          <div style={styles.resourceIcon}>
            {sourceMetadata.icon ? (
              <img
                src={sourceMetadata.icon}
                alt={sourceMetadata.displayName}
                width="24"
                height="24"
              />
            ) : (
              sourceMetadata.displayName.charAt(0)
            )}
          </div>
          <h3 style={styles.resourceName}>{sourceMetadata.displayName}</h3>
        </div>

        <div style={styles.conversionArrow}>→</div>

        <div style={styles.resourceHeader}>
          <div style={styles.resourceIcon}>
            {targetMetadata.icon ? (
              <img
                src={targetMetadata.icon}
                alt={targetMetadata.displayName}
                width="24"
                height="24"
              />
            ) : (
              targetMetadata.displayName.charAt(0)
            )}
          </div>
          <h3 style={styles.resourceName}>{targetMetadata.displayName}</h3>
        </div>

        <div style={styles.conversionRate}>Rate: {rate.toFixed(2)}</div>
      </div>
    );
  };

  // Render resources tab
  const renderResourcesTab = () => {
    return (
      <div>
        <div style={styles.filterSection}>
          <div style={styles.filterRow}>
            <input
              type="text"
              placeholder="Search resources..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            <div>
              <span style={styles.filterLabel}>Category:</span>
              <select
                style={styles.filterSelect}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as ResourceCategory | 'all')}
              >
                <option value="all">All Categories</option>
                {Object.values(ResourceCategory).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span style={styles.filterLabel}>Tag:</span>
              <select
                style={styles.filterSelect}
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            <button style={styles.button} onClick={() => setShowAddResourceModal(true)}>
              Add Resource
            </button>
          </div>
        </div>

        <div style={styles.resourceGrid}>
          {filteredResources.map(resource => renderResourceCard(resource))}
        </div>

        {selectedResource && (
          <div style={styles.conversionSection}>
            <h2 style={styles.conversionTitle}>
              Conversions for {registry.getDisplayName(selectedResource)}
            </h2>

            <div style={styles.filterRow}>
              <button style={styles.button} onClick={() => setShowAddConversionModal(true)}>
                Add Conversion
              </button>

              <button style={styles.button} onClick={() => setShowEditResourceModal(true)}>
                Edit Resource
              </button>
            </div>

            <h3>Input Conversions</h3>
            <div style={styles.conversionGrid}>
              {resourceConversions.inputs.length > 0 ? (
                resourceConversions.inputs.map(({ sourceType, targetType, rate }) =>
                  renderConversionCard(sourceType, targetType, rate)
                )
              ) : (
                <p>No input conversions found.</p>
              )}
            </div>

            <h3>Output Conversions</h3>
            <div style={styles.conversionGrid}>
              {resourceConversions.outputs.length > 0 ? (
                resourceConversions.outputs.map(({ sourceType, targetType, rate }) =>
                  renderConversionCard(sourceType, targetType, rate)
                )
              ) : (
                <p>No output conversions found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render conversions tab
  const renderConversionsTab = () => {
    // Get all conversions from the registry
    const allConversions: { sourceType: ResourceType; targetType: ResourceType; rate: number }[] =
      [];

    resources.forEach(resource => {
      const sourceType = resource.id;
      const conversions = registry.getAllConversionRates(sourceType);

      conversions.forEach((rate, targetType) => {
        allConversions.push({ sourceType, targetType, rate });
      });
    });

    return (
      <div>
        <div style={styles.filterSection}>
          <div style={styles.filterRow}>
            <input
              type="text"
              placeholder="Search conversions..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            <button style={styles.button} onClick={() => setShowAddConversionModal(true)}>
              Add Conversion
            </button>
          </div>
        </div>

        <div style={styles.conversionGrid}>
          {allConversions.length > 0 ? (
            allConversions
              .filter(({ sourceType, targetType }) => {
                if (searchQuery === '') return true;

                const sourceMetadata = registry.getResourceMetadata(sourceType);
                const targetMetadata = registry.getResourceMetadata(targetType);

                if (!sourceMetadata || !targetMetadata) return false;

                return (
                  sourceMetadata.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  targetMetadata.displayName.toLowerCase().includes(searchQuery.toLowerCase())
                );
              })
              .map(({ sourceType, targetType, rate }) =>
                renderConversionCard(sourceType, targetType, rate)
              )
          ) : (
            <p>No conversions found.</p>
          )}
        </div>
      </div>
    );
  };

  // Render flows tab
  const renderFlowsTab = () => {
    return (
      <div>
        <div style={styles.flowSection}>
          <h2 style={styles.flowTitle}>Resource Flows</h2>
          <div style={styles.flowVisualization}>
            <p>Resource flow visualization will be implemented here.</p>
            <p>This will show a network graph of resource flows between different systems.</p>
          </div>
        </div>
      </div>
    );
  };

  // Render add resource modal
  const renderAddResourceModal = () => {
    // This would be implemented with a form to add a new resource
    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.modalClose} onClick={() => setShowAddResourceModal(false)}>
            ×
          </div>
          <h2>Add New Resource</h2>
          <p>Form to add a new resource would go here.</p>
          <div style={styles.formActions}>
            <button
              style={{ ...styles.button, backgroundColor: '#ccc', color: '#333' }}
              onClick={() => setShowAddResourceModal(false)}
            >
              Cancel
            </button>
            <button style={styles.button}>Add Resource</button>
          </div>
        </div>
      </div>
    );
  };

  // Render edit resource modal
  const renderEditResourceModal = () => {
    // This would be implemented with a form to edit the selected resource
    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.modalClose} onClick={() => setShowEditResourceModal(false)}>
            ×
          </div>
          <h2>Edit Resource</h2>
          <p>Form to edit the selected resource would go here.</p>
          <div style={styles.formActions}>
            <button
              style={{ ...styles.button, backgroundColor: '#ccc', color: '#333' }}
              onClick={() => setShowEditResourceModal(false)}
            >
              Cancel
            </button>
            <button style={styles.button}>Save Changes</button>
          </div>
        </div>
      </div>
    );
  };

  // Render add conversion modal
  const renderAddConversionModal = () => {
    // This would be implemented with a form to add a new conversion
    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.modalClose} onClick={() => setShowAddConversionModal(false)}>
            ×
          </div>
          <h2>Add New Conversion</h2>
          <p>Form to add a new conversion would go here.</p>
          <div style={styles.formActions}>
            <button
              style={{ ...styles.button, backgroundColor: '#ccc', color: '#333' }}
              onClick={() => setShowAddConversionModal(false)}
            >
              Cancel
            </button>
            <button style={styles.button}>Add Conversion</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ ...styles.container, height, width }}>
      {showHeader && (
        <div style={styles.header}>
          <h1 style={styles.title}>Resource Registry</h1>
        </div>
      )}

      <div style={styles.tabs}>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'resources' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('resources')}
        >
          Resources
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'conversions' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('conversions')}
        >
          Conversions
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'flows' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('flows')}
        >
          Flows
        </div>
      </div>

      {activeTab === 'resources' && renderResourcesTab()}
      {activeTab === 'conversions' && renderConversionsTab()}
      {activeTab === 'flows' && renderFlowsTab()}

      {showAddResourceModal && renderAddResourceModal()}
      {showEditResourceModal && renderEditResourceModal()}
      {showAddConversionModal && renderAddConversionModal()}
    </div>
  );
};
