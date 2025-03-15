import * as React from "react";
import { useEffect, useState } from 'react';
import { ResourceType } from "./../../types/resources/ResourceTypes";
import { ResourceDiscoverySystem } from './ResourceDiscoverySystem';

// Interfaces
interface ResourceDiscovery {
  id: string;
  sectorId: string;
  sectorName: string;
  discoveryDate: number;
  processedDate?: number;
  status: 'discovered' | 'analyzing' | 'processed';
  confidence: number; // 0-1 scale
  rawData: RawResourceData[];
  processedData?: ResourceData[];
  scanQuality: number; // 0-1 scale
  notes?: string;
}

interface RawResourceData {
  signalStrength: number; // 0-1 scale
  signalType: 'mineral' | ResourceType.ENERGY | ResourceType.GAS | 'organic' | ResourceType.EXOTIC | 'unknown';
  signalPattern: 'concentrated' | 'scattered' | 'veins' | 'unknown';
  signalDepth: number; // 0-1 scale (deeper = harder to access)
  coordinates: { x: number; y: number }; // Relative to sector center
}

interface ResourceData {
  type: ResourceType;
  name: string;
  amount: number; // 0-100 scale
  quality: number; // 0-1 scale
  accessibility: number; // 0-1 scale (how easy it is to extract)
  distribution: 'concentrated' | 'scattered' | 'veins';
  estimatedValue: number; // Credit value
  extractionDifficulty: number; // 0-10 scale
  coordinates: { x: number; y: number }; // Relative to sector center
}

interface Sector {
  id: string;
  name: string;
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
  lastScanned?: number;
}

// Sample sector names
const sectorNames = [
  'Alpha Centauri',
  'Proxima Centauri',
  "Barnard's Star",
  'Wolf 359',
  'Lalande 21185',
  'Sirius',
  'Luyten 726-8',
  'Ross 154',
  'Ross 248',
  'Epsilon Eridani',
  'Lacaille 9352',
  'Ross 128',
  'EZ Aquarii',
  'Procyon',
  'Struve 2398',
  'Groombridge 34',
  'Epsilon Indi',
  'Tau Ceti',
  'Gliese 1061',
  'YZ Ceti',
  "Luyten's Star",
  "Teegarden's Star",
  "Kapteyn's Star",
  'Lacaille 8760',
  'Kruger 60',
];

// Generate sample sectors
const generateSampleSectors = (count: number): Sector[] => {
  const sectors: Sector[] = [];
  const statuses: ('unmapped' | 'mapped' | 'scanning' | 'analyzed')[] = [
    'unmapped',
    'mapped',
    'scanning',
    'analyzed',
  ];

  for (let i = 0; i < count; i++) {
    // Create a spiral pattern for sector coordinates
    const angle = 0.1 * i;
    const radius = 5 * Math.sqrt(i);
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    sectors.push({
      id: `sector-${i + 1}`,
      name: sectorNames[i % sectorNames.length],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      coordinates: { x, y },
      resourcePotential: Math.random(),
      habitabilityScore: Math.random(),
      lastScanned:
        Math.random() > 0.3 ? Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30 : undefined,
    });
  }

  return sectors;
};

// Generate sample raw resource data
const generateRawResourceData = (count: number): RawResourceData[] => {
  const rawData: RawResourceData[] = [];
  const signalTypes: ('mineral' | ResourceType.ENERGY | ResourceType.GAS | 'organic' | ResourceType.EXOTIC | 'unknown')[] = [
    'mineral',
    ResourceType.ENERGY,
    ResourceType.GAS,
    'organic',
    ResourceType.EXOTIC,
    'unknown',
  ];
  const signalPatterns: ('concentrated' | 'scattered' | 'veins' | 'unknown')[] = [
    'concentrated',
    'scattered',
    'veins',
    'unknown',
  ];

  for (let i = 0; i < count; i++) {
    rawData.push({
      signalStrength: Math.random(),
      signalType: signalTypes[Math.floor(Math.random() * signalTypes.length)],
      signalPattern: signalPatterns[Math.floor(Math.random() * signalPatterns.length)],
      signalDepth: Math.random(),
      coordinates: {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
      },
    });
  }

  return rawData;
};

// Generate sample discoveries
const generateSampleDiscoveries = (sectors: Sector[], count: number): ResourceDiscovery[] => {
  const discoveries: ResourceDiscovery[] = [];
  const statuses: ('discovered' | 'analyzing' | 'processed')[] = [
    'discovered',
    'analyzing',
    'processed',
  ];

  for (let i = 0; i < count; i++) {
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const discoveryDate = Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30; // Up to 30 days ago
    const rawData = generateRawResourceData(Math.floor(Math.random() * 5) + 1);

    const discovery: ResourceDiscovery = {
      id: `discovery-${i + 1}`,
      sectorId: sector.id,
      sectorName: sector.name,
      discoveryDate,
      status,
      confidence: 0.3 + Math.random() * 0.7,
      rawData,
      scanQuality: 0.4 + Math.random() * 0.6,
    };

    // Add processed data and date for processed discoveries
    if (status === 'processed') {
      discovery.processedDate = discoveryDate + Math.random() * 1000 * 60 * 60 * 24 * 5; // 0-5 days after discovery
      discovery.processedData = []; // This will be filled by the component
    }

    // Add notes for some discoveries
    if (Math.random() > 0.7) {
      discovery.notes = `Sample notes for ${sector.name} discovery. This sector shows ${
        rawData.length
      } potential resource signals with varying strengths and patterns.`;
    }

    discoveries.push(discovery);
  }

  return discoveries;
};

export function ResourceDiscoveryDemo() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [discoveries, setDiscoveries] = useState<ResourceDiscovery[]>([]);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Generate sample data on component mount
  useEffect(() => {
    const sampleSectors = generateSampleSectors(25);
    const sampleDiscoveries = generateSampleDiscoveries(sampleSectors, 15);
    setSectors(sampleSectors);
    setDiscoveries(sampleDiscoveries);
  }, []);

  // Handle processing a discovery
  const handleProcessDiscovery = (discoveryId: string, processedData: ResourceData[]) => {
    setDiscoveries(prev =>
      prev.map(discovery =>
        discovery.id === discoveryId
          ? {
              ...discovery,
              status: 'processed' as const,
              processedDate: Date.now(),
              processedData,
            }
          : discovery
      )
    );
  };

  // Handle updating notes
  const handleUpdateNotes = (discoveryId: string, notes: string) => {
    setDiscoveries(prev =>
      prev.map(discovery => (discovery.id === discoveryId ? { ...discovery, notes } : discovery))
    );
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Resource Discovery System Demo</h1>

        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="quality" className="mr-2 text-sm text-gray-300">
              Quality:
            </label>
            <select
              id="quality"
              value={quality}
              onChange={e => setQuality(e.target.value as 'low' | 'medium' | 'high')}
              className="rounded bg-gray-700 px-2 py-1 text-sm text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <button
            onClick={() => {
              const sampleSectors = generateSampleSectors(25);
              const sampleDiscoveries = generateSampleDiscoveries(sampleSectors, 15);
              setSectors(sampleSectors);
              setDiscoveries(sampleDiscoveries);
            }}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            Regenerate Data
          </button>
        </div>
      </div>

      <div className="flex-grow">
        <ResourceDiscoverySystem
          discoveries={discoveries}
          sectors={sectors}
          onProcessDiscovery={handleProcessDiscovery}
          onUpdateNotes={handleUpdateNotes}
          quality={quality}
        />
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <p>
          This demo showcases the Resource Discovery System component with randomly generated data.
          You can process discoveries, update notes, and filter/sort the discoveries list.
        </p>
      </div>
    </div>
  );
}
