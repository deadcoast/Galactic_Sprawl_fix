import * as React from "react";
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ExplorationDataManager } from './ExplorationDataManager';
import { ResourceType } from "./../../types/resources/ResourceTypes";
// Types from ExplorationDataManager
interface Anomaly {
  id: string;
  type: 'artifact' | 'signal' | 'phenomenon';
  severity: 'low' | 'medium' | 'high';
  description: string;
  investigated: boolean;
  discoveryDate: number;
  sectorId: string;
  sectorName: string;
  coordinates: { x: number; y: number };
}

interface Sector {
  id: string;
  name: string;
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
  anomalies: Anomaly[];
  lastScanned?: number;
}

interface ResourceData {
  type: ResourceType.MINERALS | ResourceType.GAS | ResourceType.ENERGY | 'organic' | ResourceType.EXOTIC;
  name: string;
  amount: number;
  quality: number;
  accessibility: number;
  distribution: 'concentrated' | 'scattered' | 'veins';
  estimatedValue: number;
  extractionDifficulty: number;
}

interface ExplorationRecord {
  id: string;
  type: 'sector' | 'anomaly' | 'resource';
  name: string;
  date: number;
  tags: string[];
  starred: boolean;
  notes?: string;
  data: Sector | Anomaly | ResourceData;
  relatedRecords?: string[];
  category?: string;
}

interface ExplorationCategory {
  id: string;
  name: string;
  color: string;
  recordCount: number;
  parentId?: string;
  subCategories?: string[];
}

// Sample data generators
const generateSampleSectors = (count: number): Sector[] => {
  const sectors: Sector[] = [];
  const statuses: Sector['status'][] = ['unmapped', 'mapped', 'scanning', 'analyzed'];

  for (let i = 0; i < count; i++) {
    const id = uuidv4();
    sectors.push({
      id,
      name: `Sector ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 100)}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      coordinates: {
        x: Math.floor(Math.random() * 1000),
        y: Math.floor(Math.random() * 1000),
      },
      resourcePotential: Math.random(),
      habitabilityScore: Math.random(),
      anomalies: [],
      lastScanned:
        Math.random() > 0.3
          ? Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
          : undefined,
    });
  }

  return sectors;
};

const generateSampleAnomalies = (sectors: Sector[], count: number): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  const types: Anomaly['type'][] = ['artifact', 'signal', 'phenomenon'];
  const severities: Anomaly['severity'][] = ['low', 'medium', 'high'];

  for (let i = 0; i < count; i++) {
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];

    const anomaly: Anomaly = {
      id: uuidv4(),
      type,
      severity,
      description: getAnomalyDescription(type, severity),
      investigated: Math.random() > 0.7,
      discoveryDate: Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000),
      sectorId: sector.id,
      sectorName: sector.name,
      coordinates: {
        x: sector.coordinates.x + (Math.random() * 20 - 10),
        y: sector.coordinates.y + (Math.random() * 20 - 10),
      },
    };

    anomalies.push(anomaly);
    sector.anomalies.push(anomaly);
  }

  return anomalies;
};

const getAnomalyDescription = (type: Anomaly['type'], severity: Anomaly['severity']): string => {
  const descriptions = {
    artifact: {
      low: 'Remnants of ancient technology with minimal energy signature.',
      medium: 'Partially intact alien artifact with unusual energy patterns.',
      high: 'Fully operational alien technology with powerful energy emissions.',
    },
    signal: {
      low: 'Faint repeating signal of unknown origin.',
      medium: 'Structured communication signal with complex patterns.',
      high: 'Powerful transmission containing encrypted data packets.',
    },
    phenomenon: {
      low: 'Minor spatial distortion affecting sensor readings.',
      medium: 'Significant gravitational anomaly disrupting normal space.',
      high: 'Massive reality fluctuation creating unpredictable effects.',
    },
  };

  return descriptions[type][severity];
};

const generateSampleResources = (count: number): ResourceData[] => {
  const resources: ResourceData[] = [];
  const types: ResourceData['type'][] = [ResourceType.MINERALS, ResourceType.GAS, ResourceType.ENERGY, 'organic', ResourceType.EXOTIC];
  const distributions: ResourceData['distribution'][] = ['concentrated', 'scattered', 'veins'];
  const resourceNames = {
    minerals: ['Iron', 'Copper', 'Titanium', 'Platinum', 'Uranium'],
    gas: ['Hydrogen', 'Helium', 'Methane', 'Nitrogen', 'Xenon'],
    energy: ['Solar', 'Thermal', 'Quantum', 'Fusion', 'Dark Energy'],
    organic: ['Bacteria', 'Fungal', 'Plant', 'Protein', 'Enzyme'],
    exotic: ['Neutronium', 'Dark Matter', 'Quantum Foam', 'Tachyon Particles', 'Strange Matter'],
  };

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const nameOptions = resourceNames[type];
    const name = nameOptions[Math.floor(Math.random() * nameOptions.length)];
    const quality = Math.random();
    const amount = Math.floor(Math.random() * 100) + 1;

    resources.push({
      type,
      name,
      amount,
      quality,
      accessibility: Math.random(),
      distribution: distributions[Math.floor(Math.random() * distributions.length)],
      estimatedValue: amount * quality * 1000 * (Math.random() * 0.5 + 0.75),
      extractionDifficulty: Math.floor(Math.random() * 10) + 1,
    });
  }

  return resources;
};

const generateSampleCategories = (): ExplorationCategory[] => {
  const categories: ExplorationCategory[] = [
    {
      id: 'high-priority',
      name: 'High Priority',
      color: '#ef4444', // Red
      recordCount: 0,
    },
    {
      id: 'medium-priority',
      name: 'Medium Priority',
      color: '#f59e0b', // Amber
      recordCount: 0,
    },
    {
      id: 'low-priority',
      name: 'Low Priority',
      color: '#10b981', // Green
      recordCount: 0,
    },
    {
      id: 'anomalies',
      name: 'Anomalies',
      color: '#8b5cf6', // Purple
      recordCount: 0,
      subCategories: ['artifacts', 'signals', 'phenomena'],
    },
    {
      id: 'artifacts',
      name: 'Artifacts',
      color: '#c084fc', // Light purple
      recordCount: 0,
      parentId: 'anomalies',
    },
    {
      id: 'signals',
      name: 'Signals',
      color: '#a78bfa', // Medium purple
      recordCount: 0,
      parentId: 'anomalies',
    },
    {
      id: 'phenomena',
      name: 'Phenomena',
      color: '#7c3aed', // Dark purple
      recordCount: 0,
      parentId: 'anomalies',
    },
    {
      id: 'resources',
      name: 'Resources',
      color: '#3b82f6', // Blue
      recordCount: 0,
      subCategories: [ResourceType.MINERALS, 'gases', ResourceType.ENERGY, 'organics', 'exotics'],
    },
    {
      id: ResourceType.MINERALS,
      name: 'Minerals',
      color: '#60a5fa', // Light blue
      recordCount: 0,
      parentId: 'resources',
    },
    {
      id: 'gases',
      name: 'Gases',
      color: '#93c5fd', // Lighter blue
      recordCount: 0,
      parentId: 'resources',
    },
    {
      id: ResourceType.ENERGY,
      name: 'Energy',
      color: '#2563eb', // Dark blue
      recordCount: 0,
      parentId: 'resources',
    },
    {
      id: 'organics',
      name: 'Organics',
      color: '#34d399', // Teal
      recordCount: 0,
      parentId: 'resources',
    },
    {
      id: 'exotics',
      name: 'Exotics',
      color: '#f472b6', // Pink
      recordCount: 0,
      parentId: 'resources',
    },
  ];

  return categories;
};

const generateSampleRecords = (
  sectors: Sector[],
  anomalies: Anomaly[],
  resources: ResourceData[],
  categories: ExplorationCategory[]
): ExplorationRecord[] => {
  const records: ExplorationRecord[] = [];
  const tags = [
    'important',
    'follow-up',
    'verified',
    'unverified',
    'classified',
    'mission-critical',
  ];

  // Add sector records
  sectors.forEach(sector => {
    const categoryId =
      Math.random() > 0.7
        ? ['high-priority', 'medium-priority', 'low-priority'][Math.floor(Math.random() * 3)]
        : undefined;

    records.push({
      id: `sector-${sector.id}`,
      type: 'sector',
      name: sector.name,
      date: sector.lastScanned || Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000),
      tags: Array.from(
        { length: Math.floor(Math.random() * 3) },
        () => tags[Math.floor(Math.random() * tags.length)]
      ),
      starred: Math.random() > 0.8,
      notes: Math.random() > 0.7 ? `Notes for ${sector.name}` : undefined,
      data: sector,
      category: categoryId,
    });

    if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        category.recordCount++;
      }
    }
  });

  // Add anomaly records
  anomalies.forEach(anomaly => {
    const categoryMap = {
      artifact: 'artifacts',
      signal: 'signals',
      phenomenon: 'phenomena',
    };

    const categoryId = categoryMap[anomaly.type];

    records.push({
      id: `anomaly-${anomaly.id}`,
      type: 'anomaly',
      name: `${anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)} in ${anomaly.sectorName}`,
      date: anomaly.discoveryDate,
      tags: Array.from(
        { length: Math.floor(Math.random() * 3) },
        () => tags[Math.floor(Math.random() * tags.length)]
      ),
      starred: Math.random() > 0.7,
      notes: Math.random() > 0.6 ? `Notes for anomaly in ${anomaly.sectorName}` : undefined,
      data: anomaly,
      category: categoryId,
      relatedRecords: [`sector-${anomaly.sectorId}`],
    });

    const category = categories.find(c => c.id === categoryId);
    if (category) {
      category.recordCount++;
    }

    const anomaliesCategory = categories.find(c => c.id === 'anomalies');
    if (anomaliesCategory) {
      anomaliesCategory.recordCount++;
    }
  });

  // Add resource records
  resources.forEach((resource, index) => {
    const sectorIndex = Math.floor(Math.random() * sectors.length);
    const sector = sectors[sectorIndex];

    const categoryMap = {
      minerals: ResourceType.MINERALS,
      gas: 'gases',
      energy: ResourceType.ENERGY,
      organic: 'organics',
      exotic: 'exotics',
    };

    const categoryId = categoryMap[resource.type];

    records.push({
      id: `resource-${index}`,
      type: 'resource',
      name: `${resource.name} (${resource.type})`,
      date: Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000),
      tags: Array.from(
        { length: Math.floor(Math.random() * 3) },
        () => tags[Math.floor(Math.random() * tags.length)]
      ),
      starred: Math.random() > 0.8,
      notes: Math.random() > 0.7 ? `Notes for ${resource.name} resource` : undefined,
      data: resource,
      category: categoryId,
      relatedRecords: [`sector-${sector.id}`],
    });

    const category = categories.find(c => c.id === categoryId);
    if (category) {
      category.recordCount++;
    }

    const resourcesCategory = categories.find(c => c.id === 'resources');
    if (resourcesCategory) {
      resourcesCategory.recordCount++;
    }
  });

  return records;
};

export function ExplorationDataManagerDemo() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [_anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [_resources, setResources] = useState<ResourceData[]>([]);
  const [categories, setCategories] = useState<ExplorationCategory[]>([]);
  const [records, setRecords] = useState<ExplorationRecord[]>([]);

  // Initialize sample data
  useEffect(() => {
    const sampleSectors = generateSampleSectors(20);
    const sampleAnomalies = generateSampleAnomalies(sampleSectors, 15);
    const sampleResources = generateSampleResources(25);
    const sampleCategories = generateSampleCategories();
    const sampleRecords = generateSampleRecords(
      sampleSectors,
      sampleAnomalies,
      sampleResources,
      sampleCategories
    );

    setSectors(sampleSectors);
    setAnomalies(sampleAnomalies);
    setResources(sampleResources);
    setCategories(sampleCategories);
    setRecords(sampleRecords);
  }, []);

  // Handlers for ExplorationDataManager
  const handleSaveRecord = (record: ExplorationRecord) => {
    setRecords(prev => {
      const index = prev.findIndex(r => r.id === record.id);
      if (index >= 0) {
        const newRecords = [...prev];
        newRecords[index] = record;
        return newRecords;
      }
      return [...prev, record];
    });
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords(prev => prev.filter(r => r.id !== recordId));
  };

  const handleExportData = (recordIds: string[]) => {
    const recordsToExport = records.filter(r => recordIds.includes(r.id));
    console.warn('Exporting records:', recordsToExport);

    // In a real implementation, this would save to a file
    const dataStr = JSON.stringify(recordsToExport, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `exploration-data-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = () => {
    // In a real implementation, this would open a file dialog
    console.warn('Import data functionality would be implemented here');

    // For demo purposes, we'll just add a sample imported record
    const importedRecord: ExplorationRecord = {
      id: `imported-${uuidv4()}`,
      type: 'sector',
      name: 'Imported Sector X-99',
      date: Date.now(),
      tags: ['imported', 'verified'],
      starred: true,
      notes: 'This record was imported from an external source.',
      data: {
        id: uuidv4(),
        name: 'Sector X-99',
        status: 'analyzed',
        coordinates: { x: 500, y: 500 },
        resourcePotential: 0.85,
        habitabilityScore: 0.72,
        anomalies: [],
        lastScanned: Date.now() - 24 * 60 * 60 * 1000,
      },
      category: 'high-priority',
    };

    setRecords(prev => [...prev, importedRecord]);

    // Update category count
    setCategories(prev => {
      return prev.map(category => {
        if (category.id === 'high-priority') {
          return { ...category, recordCount: category.recordCount + 1 };
        }
        return category;
      });
    });
  };

  const handleCreateCategory = (category: Omit<ExplorationCategory, 'id' | 'recordCount'>) => {
    const newCategory: ExplorationCategory = {
      ...category,
      id: `category-${uuidv4()}`,
      recordCount: 0,
    };

    setCategories(prev => [...prev, newCategory]);
  };

  const handleUpdateCategory = (category: ExplorationCategory) => {
    setCategories(prev => {
      return prev.map(c => (c.id === category.id ? category : c));
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    // Remove category from categories
    setCategories(prev => prev.filter(c => c.id !== categoryId));

    // Update records that were in this category
    setRecords(prev => {
      return prev.map(record => {
        if (record.category === categoryId) {
          return { ...record, category: undefined };
        }
        return record;
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white">
      <h1 className="mb-4 text-2xl font-bold">Exploration Data Management System</h1>
      <p className="mb-6 text-gray-300">
        Organize, analyze, and manage exploration data including sectors, anomalies, and resources.
      </p>

      <div className="overflow-hidden rounded-lg bg-gray-800 shadow-lg">
        <ExplorationDataManager
          records={records}
          categories={categories}
          onSaveRecord={handleSaveRecord}
          onDeleteRecord={handleDeleteRecord}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onCreateCategory={handleCreateCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          className="min-h-[600px]"
        />
      </div>

      <div className="mt-6 rounded-lg bg-gray-800 p-4">
        <h2 className="mb-2 text-xl font-semibold">Demo Controls</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-700"
            onClick={() => {
              const newSectors = generateSampleSectors(5);
              setSectors(prev => [...prev, ...newSectors]);

              const newRecords = newSectors.map(sector => ({
                id: `sector-${sector.id}`,
                type: 'sector' as const,
                name: sector.name,
                date: sector.lastScanned || Date.now(),
                tags: [],
                starred: false,
                data: sector,
              }));

              setRecords(prev => [...prev, ...newRecords]);
            }}
          >
            Add Sample Sectors
          </button>

          <button
            className="rounded bg-purple-600 px-4 py-2 hover:bg-purple-700"
            onClick={() => {
              if (sectors.length === 0) return;

              const newAnomalies = generateSampleAnomalies(sectors, 3);
              setAnomalies(prev => [...prev, ...newAnomalies]);

              const anomalyRecords = newAnomalies.map(anomaly => {
                const categoryMap = {
                  artifact: 'artifacts',
                  signal: 'signals',
                  phenomenon: 'phenomena',
                };

                const categoryId = categoryMap[anomaly.type];

                return {
                  id: `anomaly-${anomaly.id}`,
                  type: 'anomaly' as const,
                  name: `${anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)} in ${anomaly.sectorName}`,
                  date: anomaly.discoveryDate,
                  tags: [],
                  starred: false,
                  data: anomaly,
                  category: categoryId,
                  relatedRecords: [`sector-${anomaly.sectorId}`],
                };
              });

              setRecords(prev => [...prev, ...anomalyRecords]);

              // Update category counts
              setCategories(prev => {
                return prev.map(category => {
                  if (category.id === 'anomalies') {
                    return { ...category, recordCount: category.recordCount + newAnomalies.length };
                  }

                  if (['artifacts', 'signals', 'phenomena'].includes(category.id)) {
                    const count = newAnomalies.filter(a => {
                      const categoryMap = {
                        artifact: 'artifacts',
                        signal: 'signals',
                        phenomenon: 'phenomena',
                      };
                      return categoryMap[a.type] === category.id;
                    }).length;

                    return { ...category, recordCount: category.recordCount + count };
                  }

                  return category;
                });
              });
            }}
          >
            Add Sample Anomalies
          </button>

          <button
            className="rounded bg-green-600 px-4 py-2 hover:bg-green-700"
            onClick={() => {
              const newResources = generateSampleResources(5);
              setResources(prev => [...prev, ...newResources]);

              if (sectors.length === 0) return;

              const resourceRecords = newResources.map((resource, index) => {
                const sectorIndex = Math.floor(Math.random() * sectors.length);
                const sector = sectors[sectorIndex];

                const categoryMap = {
                  minerals: ResourceType.MINERALS,
                  gas: 'gases',
                  energy: ResourceType.ENERGY,
                  organic: 'organics',
                  exotic: 'exotics',
                };

                const categoryId = categoryMap[resource.type];

                return {
                  id: `resource-new-${index}`,
                  type: 'resource' as const,
                  name: `${resource.name} (${resource.type})`,
                  date: Date.now(),
                  tags: [],
                  starred: false,
                  data: resource,
                  category: categoryId,
                  relatedRecords: [`sector-${sector.id}`],
                };
              });

              setRecords(prev => [...prev, ...resourceRecords]);

              // Update category counts
              setCategories(prev => {
                return prev.map(category => {
                  if (category.id === 'resources') {
                    return { ...category, recordCount: category.recordCount + newResources.length };
                  }

                  if (
                    [ResourceType.MINERALS, 'gases', ResourceType.ENERGY, 'organics', 'exotics'].includes(category.id)
                  ) {
                    const count = newResources.filter(r => {
                      const categoryMap = {
                        minerals: ResourceType.MINERALS,
                        gas: 'gases',
                        energy: ResourceType.ENERGY,
                        organic: 'organics',
                        exotic: 'exotics',
                      };
                      return categoryMap[r.type] === category.id;
                    }).length;

                    return { ...category, recordCount: category.recordCount + count };
                  }

                  return category;
                });
              });
            }}
          >
            Add Sample Resources
          </button>

          <button
            className="rounded bg-red-600 px-4 py-2 hover:bg-red-700"
            onClick={() => {
              setSectors([]);
              setAnomalies([]);
              setResources([]);
              setRecords([]);
              setCategories(generateSampleCategories());
            }}
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
