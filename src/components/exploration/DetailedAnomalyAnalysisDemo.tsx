import { useState } from 'react';
import { DetailedAnomalyAnalysis } from './DetailedAnomalyAnalysis';

// Define the Anomaly interface to match the one in DetailedAnomalyAnalysis
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
  analysisProgress?: number;
  analysisResults?: {
    composition?: string[];
    origin?: string;
    age?: string;
    energySignature?: string;
    potentialUses?: string[];
    dangerLevel?: number;
    notes?: string;
    // Enhanced analysis results
    spectrumAnalysis?: {
      frequencies: number[];
      amplitudes: number[];
      patterns: string[];
      anomalies: string[];
    };
    materialProperties?: {
      density?: number;
      conductivity?: number;
      radioactivity?: number;
      magnetism?: number;
      heatResistance?: number;
    };
    spatialDistortion?: {
      magnitude: number;
      radius: number;
      stability: number;
      fluctuationRate: number;
    };
    temporalEffects?: {
      timeDialation: number;
      chronoStability: number;
      temporalFlux: string[];
    };
    biologicalImpact?: {
      toxicity: number;
      mutagenicPotential: number;
      biocompatibility: number;
      lifeformDetection: boolean;
    };
  };
  images?: string[];
  // Enhanced properties
  scanHistory?: {
    date: number;
    findings: string;
    scannerType: string;
  }[];
  relatedAnomalies?: string[]; // IDs of related anomalies
  researchProgress?: {
    currentStage: string;
    completionPercentage: number;
    breakthroughs: string[];
    challenges: string[];
  };
  exploitationPotential?: {
    resourceValue: number;
    technologicalValue: number;
    scientificValue: number;
    strategicValue: number;
  };
  classification?: {
    category: string;
    subcategory: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'unique';
    knownInstances: number;
  };
}

// Sample data for demonstration
const SAMPLE_ANOMALIES: Anomaly[] = [
  {
    id: 'anomaly-1',
    type: 'artifact',
    severity: 'high',
    description: 'Ancient technological artifact',
    investigated: true,
    discoveryDate: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
    sectorId: 'sector-alpha-1',
    sectorName: 'Alpha Centauri IV',
    coordinates: { x: 142.5, y: 87.3 },
    analysisResults: {
      composition: ['Titanium', 'Unknown alloy', 'Rare earth elements'],
      origin: 'Ancient civilization',
      age: '12,500 years',
      potentialUses: ['Research', 'Technology advancement', 'Weapons research'],
      dangerLevel: 8.5,
      notes: 'Artifact emits low-level radiation and appears to be part of a larger system.',
      materialProperties: {
        density: 18.5,
        conductivity: 95.2,
        radioactivity: 2.7,
        magnetism: 85.3,
        heatResistance: 1850,
      },
      biologicalImpact: {
        toxicity: 6.8,
        mutagenicPotential: 4.2,
        biocompatibility: 35,
        lifeformDetection: false,
      },
    },
    images: [
      'https://via.placeholder.com/300x200/123456/ffffff?text=Artifact+View+1',
      'https://via.placeholder.com/300x200/234567/ffffff?text=Artifact+View+2',
    ],
    scanHistory: [
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 6,
        findings: 'Initial scan detected unusual material composition',
        scannerType: 'Standard',
      },
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 3,
        findings: 'Detailed scan revealed internal power source',
        scannerType: 'Advanced',
      },
    ],
    relatedAnomalies: ['anomaly-3'],
    exploitationPotential: {
      resourceValue: 6.5,
      technologicalValue: 9.2,
      scientificValue: 8.7,
      strategicValue: 7.8,
    },
    classification: {
      category: 'Technology',
      subcategory: 'Weapon',
      rarity: 'rare',
      knownInstances: 3,
    },
  },
  {
    id: 'anomaly-2',
    type: 'signal',
    severity: 'medium',
    description: 'Repeating signal pattern',
    investigated: true,
    discoveryDate: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    sectorId: 'sector-beta-7',
    sectorName: 'Proxima Nebula',
    coordinates: { x: 87.2, y: 123.8 },
    analysisResults: {
      energySignature: '78.5 THz',
      origin: 'Deep space',
      potentialUses: ['Communication', 'Navigation', 'Signal intelligence'],
      dangerLevel: 3.2,
      notes: 'Signal appears to be artificial in nature with a regular repeating pattern.',
      spectrumAnalysis: {
        frequencies: [245.7, 782.3, 912.5, 1024.8, 1256.3],
        amplitudes: [45.2, 67.8, 89.3, 34.5, 56.7],
        patterns: ['Repeating', 'Structured', 'Non-random', 'Encoded'],
        anomalies: ['Frequency shift', 'Amplitude modulation', 'Phase variance'],
      },
      temporalEffects: {
        timeDialation: 0.05,
        chronoStability: 92.7,
        temporalFlux: ['Minimal', 'Localized', 'Stable'],
      },
    },
    images: [
      'https://via.placeholder.com/300x200/345678/ffffff?text=Signal+Waveform',
      'https://via.placeholder.com/300x200/456789/ffffff?text=Signal+Spectrum',
    ],
    scanHistory: [
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 3,
        findings: 'Initial detection of repeating pattern',
        scannerType: 'Long-range',
      },
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 1,
        findings: 'Confirmed artificial origin',
        scannerType: 'Spectrum',
      },
    ],
    exploitationPotential: {
      resourceValue: 2.1,
      technologicalValue: 7.8,
      scientificValue: 8.5,
      strategicValue: 6.9,
    },
    classification: {
      category: 'Communication',
      subcategory: 'Artificial',
      rarity: 'uncommon',
      knownInstances: 12,
    },
  },
  {
    id: 'anomaly-3',
    type: 'phenomenon',
    severity: 'high',
    description: 'Spatial distortion field',
    investigated: true,
    discoveryDate: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    sectorId: 'sector-gamma-3',
    sectorName: 'Void Expanse',
    coordinates: { x: 203.7, y: 156.2 },
    analysisResults: {
      energySignature: '1,245 PJ',
      composition: ['Energy fluctuations', 'Spatial distortions', 'Quantum instabilities'],
      potentialUses: ['Energy harvesting', 'Spatial research', 'FTL research'],
      dangerLevel: 9.3,
      notes:
        'Extreme caution advised. Field exhibits unpredictable behavior and may pose significant navigational hazards.',
      spatialDistortion: {
        magnitude: 8.7,
        radius: 750,
        stability: 32,
        fluctuationRate: 6.8,
      },
      temporalEffects: {
        timeDialation: 0.42,
        chronoStability: 28.5,
        temporalFlux: ['Significant', 'Expanding', 'Unstable', 'Non-linear'],
      },
    },
    images: [
      'https://via.placeholder.com/300x200/567890/ffffff?text=Distortion+Field',
      'https://via.placeholder.com/300x200/678901/ffffff?text=Energy+Readings',
    ],
    scanHistory: [
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 5,
        findings: 'Initial detection of spatial anomalies',
        scannerType: 'Standard',
      },
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 4,
        findings: 'Confirmed presence of significant distortion field',
        scannerType: 'Spatial',
      },
      {
        date: Date.now() - 1000 * 60 * 60 * 24 * 2,
        findings: 'Detected temporal effects within the field',
        scannerType: 'Quantum',
      },
    ],
    relatedAnomalies: ['anomaly-1'],
    researchProgress: {
      currentStage: 'Initial Analysis',
      completionPercentage: 35,
      breakthroughs: ['Energy pattern identified', 'Spatial mapping completed'],
      challenges: ['Unstable field boundaries', 'Interference with scanning equipment'],
    },
    exploitationPotential: {
      resourceValue: 8.7,
      technologicalValue: 9.5,
      scientificValue: 9.8,
      strategicValue: 8.9,
    },
    classification: {
      category: 'Spatial',
      subcategory: 'Distortion',
      rarity: 'unique',
      knownInstances: 1,
    },
  },
  {
    id: 'anomaly-4',
    type: 'artifact',
    severity: 'low',
    description: 'Crystalline structure',
    investigated: false,
    discoveryDate: Date.now() - 1000 * 60 * 60 * 24 * 1, // 1 day ago
    sectorId: 'sector-delta-9',
    sectorName: 'Taurus Reach',
    coordinates: { x: 67.3, y: 189.5 },
    classification: {
      category: 'Material',
      subcategory: 'Unknown',
      rarity: 'common',
      knownInstances: 24,
    },
  },
  {
    id: 'anomaly-5',
    type: 'signal',
    severity: 'medium',
    description: 'Quantum fluctuation',
    investigated: false,
    discoveryDate: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
    sectorId: 'sector-epsilon-2',
    sectorName: 'Quantum Void',
    coordinates: { x: 156.8, y: 92.4 },
    classification: {
      category: 'Energy',
      subcategory: 'Quantum',
      rarity: 'uncommon',
      knownInstances: 8,
    },
  },
];

export function DetailedAnomalyAnalysisDemo() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>(SAMPLE_ANOMALIES);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [advancedMode, setAdvancedMode] = useState(false);

  // Handle investigation
  const handleInvestigate = (anomalyId: string) => {
    console.warn(`Investigating anomaly: ${anomalyId}`);
    // In a real implementation, this would trigger an API call or other async process
  };

  // Handle analysis complete
  const handleAnalysisComplete = (anomalyId: string, results: Anomaly['analysisResults']) => {
    console.warn(`Analysis complete for anomaly: ${anomalyId}`, results);
    // In a real implementation, this would update the anomaly with the results
    setAnomalies(prevAnomalies =>
      prevAnomalies.map(anomaly =>
        anomaly.id === anomalyId
          ? {
              ...anomaly,
              investigated: true,
              analysisResults: results,
            }
          : anomaly
      )
    );
  };

  // Handle export
  const handleExport = (anomalyId: string, format: 'pdf' | 'csv' | 'json') => {
    console.warn(`Exporting anomaly ${anomalyId} in ${format} format`);
    // In a real implementation, this would trigger a download
  };

  // Handle share
  const handleShare = (anomalyId: string) => {
    console.warn(`Sharing anomaly: ${anomalyId}`);
    // In a real implementation, this would open a share dialog
  };

  // Handle related anomaly select
  const handleRelatedAnomalySelect = (anomalyId: string) => {
    console.warn(`Selected related anomaly: ${anomalyId}`);
    // In a real implementation, this might update the UI or trigger navigation
  };

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      {/* Demo controls */}
      <div className="border-b border-gray-800 bg-gray-900 p-4">
        <h1 className="mb-4 text-xl font-bold">Detailed Anomaly Analysis Demo</h1>
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
          <div>
            <label className="block text-sm text-gray-400">Advanced Mode</label>
            <div className="mt-1">
              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={advancedMode}
                  onChange={e => setAdvancedMode(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                />
                <span className="ml-2 text-sm">Enabled</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Component container */}
      <div className="flex-grow overflow-hidden">
        <DetailedAnomalyAnalysis
          anomalies={anomalies}
          onInvestigate={handleInvestigate}
          onAnalysisComplete={handleAnalysisComplete}
          onExport={handleExport}
          onShare={handleShare}
          onRelatedAnomalySelect={handleRelatedAnomalySelect}
          quality={quality}
          advancedMode={advancedMode}
        />
      </div>
    </div>
  );
}
