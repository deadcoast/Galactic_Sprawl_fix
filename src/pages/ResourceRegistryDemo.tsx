/**
 * ResourceRegistryDemo.tsx
 *
 * A demo page that showcases the ResourceRegistryUI component and demonstrates
 * the functionality of the ResourceRegistry.
 */

import * as React from 'react';
import { useEffect } from 'react';
import { ResourceRegistryUI } from '../components/ui/ResourceRegistryUI';
import { ResourceRegistry } from '../registry/ResourceRegistry';
import { ResourceCategory, ResourceType } from '../types/resources/ResourceTypes';

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    maxWidth: '800px',
    margin: '0 auto',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px',
  },
  description: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginRight: '10px',
    marginBottom: '10px',
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px',
    marginBottom: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '4px',
    overflow: 'auto',
    marginBottom: '20px',
  },
};

/**
 * ResourceRegistryDemo Component
 *
 * Demonstrates the ResourceRegistry and ResourceRegistryUI components
 */
const ResourceRegistryDemo: React.FC = () => {
  // Get the registry instance
  const registry = ResourceRegistry.getInstance();

  // Initialize the registry with additional resources on component mount
  useEffect(() => {
    // Add some additional resources for the demo
    registry.registerResource({
      metadata: {
        id: ResourceType.EXOTIC_MATTER,
        displayName: 'Exotic Matter',
        description: 'Rare and unstable material with unique properties',
        icon: 'exotic-icon',
        category: ResourceCategory.SPECIAL,
        defaultMax: 100,
        baseValue: 50.0,
        weight: 0.1,
        storageEfficiency: 0.3,
        qualityLevels: {
          low: 1.0,
          medium: 2.0,
          high: 4.0,
          premium: 8.0,
        },
        tags: ['rare', 'unstable', 'valuable', ResourceType.RESEARCH],
        relatedResources: [ResourceType.PLASMA],
        storageMultiplier: 0.5,
        valueMultiplier: 5.0,
        isRare: true,
        isStackable: false,
        maxStackSize: 1,
      },
    });

    registry.registerResource({
      metadata: {
        id: ResourceType.PLASMA,
        displayName: 'Plasma',
        description: 'High-energy ionized gas used for advanced power systems',
        icon: 'plasma-icon',
        category: ResourceCategory.ADVANCED,
        defaultMax: 500,
        baseValue: 10.0,
        weight: 0.2,
        storageEfficiency: 0.5,
        qualityLevels: {
          low: 0.8,
          medium: 1.0,
          high: 1.5,
          premium: 2.5,
        },
        tags: [ResourceType.ENERGY, 'advanced', 'unstable'],
        relatedResources: [ResourceType.ENERGY, ResourceType.EXOTIC_MATTER],
        storageMultiplier: 0.8,
        valueMultiplier: 2.0,
        isRare: false,
        isStackable: true,
        maxStackSize: 50,
      },
    });

    // Set up some conversion rates
    registry.setConversionRate(ResourceType.ENERGY, ResourceType.PLASMA, 0.2);
    registry.setConversionRate(ResourceType.PLASMA, ResourceType.ENERGY, 4.0);
    registry.setConversionRate(ResourceType.PLASMA, ResourceType.EXOTIC_MATTER, 0.05);
    registry.setConversionRate(ResourceType.EXOTIC_MATTER, ResourceType.PLASMA, 15.0);
    registry.setConversionRate(ResourceType.MINERALS, ResourceType.ENERGY, 0.1);
  }, [registry]);

  // Demo actions
  const addRandomResource = () => {
    const randomId = `CUSTOM_${Math.floor(Math.random() * 1000)}` as ResourceType;
    const categories = Object.values(ResourceCategory);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    registry.registerResource({
      metadata: {
        id: randomId,
        displayName: `Custom Resource ${randomId}`,
        description: 'A randomly generated resource for demonstration purposes',
        icon: 'random-icon',
        category: randomCategory,
        defaultMax: Math.floor(Math.random() * 1000) + 100,
        baseValue: Math.random() * 20,
        weight: Math.random() * 2,
        storageEfficiency: Math.random() * 0.5 + 0.3,
        qualityLevels: {
          low: 0.7,
          medium: 1.0,
          high: 1.5,
          premium: 2.0,
        },
        tags: ['custom', 'random', randomCategory.toLowerCase()],
        relatedResources: [ResourceType.MINERALS],
        storageMultiplier: Math.random() + 0.5,
        valueMultiplier: Math.random() + 0.5,
        isRare: Math.random() > 0.8,
        isStackable: Math.random() > 0.3,
        maxStackSize: Math.floor(Math.random() * 100) + 1,
      },
    });
  };

  const addRandomConversion = () => {
    const resourceTypes = registry.getAllResourceTypes();
    if (resourceTypes.length < 2) return;

    const sourceIndex = Math.floor(Math.random() * resourceTypes.length);
    let targetIndex = Math.floor(Math.random() * resourceTypes.length);

    // Ensure source and target are different
    while (targetIndex === sourceIndex) {
      targetIndex = Math.floor(Math.random() * resourceTypes.length);
    }

    const sourceType = resourceTypes[sourceIndex];
    const targetType = resourceTypes[targetIndex];
    const rate = Math.random() * 5;

    registry.setConversionRate(sourceType, targetType, rate);
  };

  const exportRegistryData = () => {
    const data = registry.exportRegistryData();
    console.warn('Registry Data:', data);
    alert('Registry data exported to console. Check the developer tools console.');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Resource Registry Demo</h1>
        <p style={styles.subtitle}>
          This demo showcases the ResourceRegistry and ResourceRegistryUI components, which provide
          a centralized system for managing game resources and their relationships.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Demo Controls</h2>
        <p style={styles.description}>
          Use these controls to interact with the Resource Registry and see the changes reflected in
          the UI.
        </p>

        <div style={styles.buttonGroup}>
          <button style={styles.button} onClick={addRandomResource}>
            Add Random Resource
          </button>
          <button style={styles.button} onClick={addRandomConversion}>
            Add Random Conversion
          </button>
          <button style={styles.button} onClick={exportRegistryData}>
            Export Registry Data
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Resource Registry UI</h2>
        <p style={styles.description}>
          The ResourceRegistryUI component provides a visual interface for viewing and managing
          resources. It displays resource metadata, conversion rates, and relationships between
          resources.
        </p>

        <div style={styles.card}>
          <ResourceRegistryUI />
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Implementation Details</h2>
        <p style={styles.description}>
          The Resource Registry system consists of several key components:
        </p>

        <div style={styles.card}>
          <h3>ResourceRegistry</h3>
          <p>
            A singleton class that serves as the central registry for resource types and metadata?.
            It provides methods for registering, unregistering, and querying resources, as well as
            managing conversion rates between resources.
          </p>
          <pre style={styles.code}>
            {`// Get the registry instance
const registry = ResourceRegistry.getInstance();

// Register a resource
registry.registerResource({
  metadata: {
    id: ResourceType.EXOTIC_MATTER,
    displayName: 'Exotic Matter',
    // ... other metadata
  }
});

// Set a conversion rate
registry.setConversionRate(ResourceType.ENERGY, ResourceType.PLASMA, 0.2);

// Get all resources of a category
const basicResources = registry.getResourcesByCategory(ResourceCategory.BASIC);`}
          </pre>
        </div>

        <div style={styles.card}>
          <h3>ResourceRegistryUI</h3>
          <p>
            A React component that provides a visual interface for the Resource Registry. It
            displays resources in a grid, allows filtering by category and tag, and shows conversion
            relationships between resources.
          </p>
          <pre style={styles.code}>
            {`// Use the ResourceRegistryUI component
<ResourceRegistryUI 
  initialTab="resources"
  showHeader={true}
  height="auto"
  width="100%"
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ResourceRegistryDemo;
