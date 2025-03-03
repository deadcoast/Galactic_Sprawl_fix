import { useState } from 'react';
import { ResourcePotentialVisualization } from './ResourcePotentialVisualization';

// Define the types to match those in ResourcePotentialVisualization
interface ResourceData {
  type: 'minerals' | 'gas' | 'energy' | 'organic' | 'exotic';
  name: string;
  amount: number; // 0-100 scale
  quality: number; // 0-1 scale
  accessibility: number; // 0-1 scale (how easy it is to extract)
  distribution: 'concentrated' | 'scattered' | 'veins';
  estimatedValue: number; // Credit value
  extractionDifficulty: number; // 0-10 scale
}

interface SectorResourceData {
  sectorId: string;
  sectorName: string;
  resources: ResourceData[];
  scanAccuracy: number; // 0-1 scale
  lastScanned?: number;
  notes?: string;
}

// Sample data for demonstration
const SAMPLE_SECTOR_DATA: SectorResourceData[] = [
  {
    sectorId: 'sector-1',
    sectorName: 'Alpha Centauri',
    resources: [
      {
        type: 'minerals',
        name: 'Iron Deposits',
        amount: 85,
        quality: 0.7,
        accessibility: 0.8,
        distribution: 'concentrated',
        estimatedValue: 250000,
        extractionDifficulty: 3,
      },
      {
        type: 'gas',
        name: 'Hydrogen Clouds',
        amount: 45,
        quality: 0.5,
        accessibility: 0.6,
        distribution: 'scattered',
        estimatedValue: 120000,
        extractionDifficulty: 5,
      },
    ],
    scanAccuracy: 0.9,
    lastScanned: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    notes: 'Rich in minerals with moderate gas deposits. Recommended for mining operations.',
  },
  {
    sectorId: 'sector-2',
    sectorName: 'Proxima Nebula',
    resources: [
      {
        type: 'energy',
        name: 'Plasma Streams',
        amount: 92,
        quality: 0.85,
        accessibility: 0.4,
        distribution: 'veins',
        estimatedValue: 380000,
        extractionDifficulty: 7,
      },
      {
        type: 'exotic',
        name: 'Quantum Particles',
        amount: 25,
        quality: 0.95,
        accessibility: 0.3,
        distribution: 'scattered',
        estimatedValue: 750000,
        extractionDifficulty: 9,
      },
    ],
    scanAccuracy: 0.75,
    lastScanned: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    notes: 'Rare exotic materials detected. High extraction difficulty but valuable resources.',
  },
  {
    sectorId: 'sector-3',
    sectorName: 'Taurus Expanse',
    resources: [
      {
        type: 'organic',
        name: 'Bacterial Colonies',
        amount: 78,
        quality: 0.6,
        accessibility: 0.9,
        distribution: 'concentrated',
        estimatedValue: 180000,
        extractionDifficulty: 2,
      },
      {
        type: 'minerals',
        name: 'Copper Deposits',
        amount: 55,
        quality: 0.5,
        accessibility: 0.7,
        distribution: 'veins',
        estimatedValue: 150000,
        extractionDifficulty: 4,
      },
    ],
    scanAccuracy: 0.85,
    lastScanned: Date.now() - 1000 * 60 * 60 * 24 * 1, // 1 day ago
    notes: 'Good source of organic materials. Moderate mineral deposits also present.',
  },
  {
    sectorId: 'sector-4',
    sectorName: 'Orion Belt',
    resources: [
      {
        type: 'minerals',
        name: 'Titanium Deposits',
        amount: 65,
        quality: 0.8,
        accessibility: 0.6,
        distribution: 'veins',
        estimatedValue: 320000,
        extractionDifficulty: 6,
      },
      {
        type: 'gas',
        name: 'Helium Pockets',
        amount: 40,
        quality: 0.7,
        accessibility: 0.5,
        distribution: 'scattered',
        estimatedValue: 180000,
        extractionDifficulty: 5,
      },
      {
        type: 'energy',
        name: 'Thermal Vents',
        amount: 35,
        quality: 0.6,
        accessibility: 0.7,
        distribution: 'concentrated',
        estimatedValue: 140000,
        extractionDifficulty: 4,
      },
    ],
    scanAccuracy: 0.8,
    lastScanned: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    notes: 'Diverse resource profile with good quality titanium deposits.',
  },
  {
    sectorId: 'sector-5',
    sectorName: 'Cygnus X-1',
    resources: [
      {
        type: 'energy',
        name: 'Radiation Fields',
        amount: 95,
        quality: 0.9,
        accessibility: 0.3,
        distribution: 'concentrated',
        estimatedValue: 450000,
        extractionDifficulty: 8,
      },
      {
        type: 'exotic',
        name: 'Dark Matter Traces',
        amount: 15,
        quality: 0.98,
        accessibility: 0.2,
        distribution: 'scattered',
        estimatedValue: 900000,
        extractionDifficulty: 10,
      },
    ],
    scanAccuracy: 0.65,
    lastScanned: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
    notes:
      'Extremely valuable but difficult to extract resources. Caution advised due to high radiation levels.',
  },
  {
    sectorId: 'sector-6',
    sectorName: 'Vega System',
    resources: [
      {
        type: 'minerals',
        name: 'Gold Deposits',
        amount: 30,
        quality: 0.9,
        accessibility: 0.5,
        distribution: 'veins',
        estimatedValue: 500000,
        extractionDifficulty: 7,
      },
      {
        type: 'organic',
        name: 'Alien Flora',
        amount: 60,
        quality: 0.75,
        accessibility: 0.8,
        distribution: 'concentrated',
        estimatedValue: 220000,
        extractionDifficulty: 3,
      },
    ],
    scanAccuracy: 0.7,
    lastScanned: Date.now() - 1000 * 60 * 60 * 24 * 4, // 4 days ago
    notes:
      'High quality gold deposits with significant organic material. Good for mixed operations.',
  },
  {
    sectorId: 'sector-7',
    sectorName: 'Pleiades Cluster',
    resources: [
      {
        type: 'gas',
        name: 'Methane Clouds',
        amount: 80,
        quality: 0.6,
        accessibility: 0.7,
        distribution: 'scattered',
        estimatedValue: 190000,
        extractionDifficulty: 4,
      },
      {
        type: 'minerals',
        name: 'Silicon Deposits',
        amount: 50,
        quality: 0.5,
        accessibility: 0.8,
        distribution: 'veins',
        estimatedValue: 130000,
        extractionDifficulty: 3,
      },
    ],
    scanAccuracy: 0.85,
    lastScanned: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    notes: 'Good source of methane gas. Silicon deposits also present in moderate amounts.',
  },
  {
    sectorId: 'sector-8',
    sectorName: 'Andromeda Fringe',
    resources: [
      {
        type: 'exotic',
        name: 'Antimatter Particles',
        amount: 10,
        quality: 0.99,
        accessibility: 0.1,
        distribution: 'scattered',
        estimatedValue: 1200000,
        extractionDifficulty: 10,
      },
    ],
    scanAccuracy: 0.5,
    lastScanned: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
    notes:
      'Extremely rare antimatter particles detected. Very difficult to extract but incredibly valuable.',
  },
];

export function ResourcePotentialVisualizationDemo() {
  const [selectedSectorId, setSelectedSectorId] = useState<string | undefined>(undefined);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSectorSelect = (sectorId: string) => {
    setSelectedSectorId(sectorId);
    console.warn(`Selected sector: ${sectorId}`);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      {/* Demo controls */}
      <div className="border-b border-gray-800 bg-gray-900 p-4">
        <h1 className="mb-4 text-xl font-bold">Resource Potential Visualization Demo</h1>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-gray-400">Quality Level</label>
            <select
              value={quality}
              onChange={e => setQuality(e.target.value as 'low' | 'medium' | 'high')}
              className="mt-1 rounded border border-gray-700 bg-gray-800 px-3 py-1 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Component container */}
      <div className="flex-grow overflow-hidden">
        <ResourcePotentialVisualization
          sectorData={SAMPLE_SECTOR_DATA}
          onSectorSelect={handleSectorSelect}
          selectedSectorId={selectedSectorId}
          quality={quality}
        />
      </div>
    </div>
  );
}
