import { useEffect, useState } from 'react';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { GalaxyMappingSystem } from './GalaxyMappingSystem';

// Interfaces
interface Sector {
  id: string;
  name: string;
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
  anomalies: Anomaly[];
  lastScanned?: number;
  resources?: ResourceData[];
  factionControl?: FactionControl;
}

interface Anomaly {
  id: string;
  type: 'artifact' | 'signal' | 'phenomenon';
  severity: 'low' | 'medium' | 'high';
  description: string;
  investigated: boolean;
}

interface ResourceData {
  type: ResourceType;
  amount: number;
  quality: number;
  extractionDifficulty: number;
}

interface FactionControl {
  factionId: string;
  factionName: string;
  controlLevel: 'minimal' | 'partial' | 'full';
  hostility: 'friendly' | 'neutral' | 'hostile';
}

interface TradeRoute {
  id: string;
  sourceSectorId: string;
  targetSectorId: string;
  resourceType: ResourceType;
  volume: number; // 0-1 scale for line thickness
  active: boolean;
}

// Sample data for demonstration
const generateSampleSectors = (count: number): Sector[] => {
  const sectors: Sector[] = [];
  const statuses = ['unmapped', 'mapped', 'scanning', 'analyzed'] as const;
  const anomalyTypes = ['artifact', 'signal', 'phenomenon'] as const;
  const severities = ['low', 'medium', 'high'] as const;
  const resourceTypes = ['minerals', 'gas', 'energy', 'organic', 'exotic'] as const;
  const factionNames = [
    'Equator Horizon',
    'Lost Nova',
    'Space Rats',
    'Stellar Accord',
    'Void Walkers',
  ];
  const hostilities = ['friendly', 'neutral', 'hostile'] as const;
  const controlLevels = ['minimal', 'partial', 'full'] as const;

  // Create a spiral pattern for sector coordinates
  for (let i = 0; i < count; i++) {
    const angle = 0.1 * i;
    const radius = 5 * Math.sqrt(i);
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    // Randomly determine if sector has anomalies
    const hasAnomalies = Math.random() > 0.7;
    const anomalies = hasAnomalies
      ? Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, _index) => ({
          id: `anomaly-${i}-${_index}`,
          type: anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          description: `Sample anomaly ${_index + 1} in sector ${i + 1}`,
          investigated: Math.random() > 0.5,
        }))
      : [];

    // Randomly determine if sector has resources
    const hasResources = Math.random() > 0.4;
    const resources = hasResources
      ? Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, index) => ({
          type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)] as ResourceType,
          amount: Math.floor(Math.random() * 100),
          quality: Math.max(0.1, Math.min(1.0, 0.5 + index * 0.2)),
          extractionDifficulty: Math.random(),
        }))
      : [];

    // Randomly determine if sector has faction control
    const hasFactionControl = Math.random() > 0.6;
    const factionControl = hasFactionControl
      ? {
          factionId: `faction-${Math.floor(Math.random() * 5)}`,
          factionName: factionNames[Math.floor(Math.random() * factionNames.length)],
          controlLevel: controlLevels[Math.floor(Math.random() * controlLevels.length)],
          hostility: hostilities[Math.floor(Math.random() * hostilities.length)],
        }
      : undefined;

    sectors.push({
      id: `sector-${i}`,
      name: `Sector ${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      coordinates: { x, y },
      resourcePotential: Math.random(),
      habitabilityScore: Math.random(),
      anomalies,
      lastScanned:
        Math.random() > 0.5 ? Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7 : undefined,
      resources,
      factionControl,
    });
  }

  return sectors;
};

// Generate sample trade routes
const generateSampleTradeRoutes = (sectors: Sector[], count: number): TradeRoute[] => {
  const routes: TradeRoute[] = [];
  const resourceTypes = ['minerals', 'gas', 'energy', 'organic', 'exotic'] as const;

  for (let i = 0; i < count; i++) {
    const sourceIndex = Math.floor(Math.random() * sectors.length);
    let targetIndex = Math.floor(Math.random() * sectors.length);

    // Ensure source and target are different
    while (targetIndex === sourceIndex) {
      targetIndex = Math.floor(Math.random() * sectors.length);
    }

    routes.push({
      id: `route-${i}`,
      sourceSectorId: sectors[sourceIndex].id,
      targetSectorId: sectors[targetIndex].id,
      resourceType: resourceTypes[Math.floor(Math.random() * resourceTypes.length)] as ResourceType,
      volume: Math.random(),
      active: Math.random() > 0.2, // 80% chance of being active
    });
  }

  return routes;
};

export function GalaxyMappingSystemDemo() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [tradeRoutes, setTradeRoutes] = useState<TradeRoute[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string | undefined>(undefined);
  const [activeScanId, setActiveScanId] = useState<string | undefined>(undefined);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Generate sample data on component mount
  useEffect(() => {
    const sampleSectors = generateSampleSectors(100);
    setSectors(sampleSectors);
    setTradeRoutes(generateSampleTradeRoutes(sampleSectors, 20));
  }, []);

  // Handle sector selection
  const handleSectorSelect = (sectorId: string) => {
    setSelectedSectorId(sectorId);
    console.warn(`Selected sector: ${sectorId}`);
  };

  // Handle sector scanning
  const handleSectorScan = (sectorId: string) => {
    setActiveScanId(sectorId);

    // Simulate scan completion after 3 seconds
    setTimeout(() => {
      setActiveScanId(undefined);

      // Update sector status to 'analyzed' after scan
      setSectors(prev =>
        prev.map(sector =>
          sector.id === sectorId
            ? { ...sector, status: 'analyzed', lastScanned: Date.now() }
            : sector
        )
      );

      console.warn(`Scan completed for sector: ${sectorId}`);
    }, 3000);
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between bg-gray-800 p-4">
        <h1 className="text-xl font-bold text-white">Galaxy Mapping System Demo</h1>

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
              const sampleSectors = generateSampleSectors(100);
              setSectors(sampleSectors);
              setTradeRoutes(generateSampleTradeRoutes(sampleSectors, 20));
            }}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            Regenerate Data
          </button>
        </div>
      </div>

      <div className="flex-grow">
        <GalaxyMappingSystem
          sectors={sectors}
          tradeRoutes={tradeRoutes}
          onSectorSelect={handleSectorSelect}
          onSectorScan={handleSectorScan}
          selectedSectorId={selectedSectorId}
          activeScanId={activeScanId}
          quality={quality}
        />
      </div>

      <div className="bg-gray-800 p-4 text-sm text-gray-300">
        <p>
          <strong>Instructions:</strong> Use the buttons in the top-right corner to toggle different
          overlays. Click on sectors to select them. The tutorial button (?) provides more
          information.
        </p>
        <p className="mt-2">
          <strong>Sectors:</strong> {sectors.length} | <strong>Trade Routes:</strong>{' '}
          {tradeRoutes.length} | <strong>Selected Sector:</strong> {selectedSectorId || 'None'}
        </p>
      </div>
    </div>
  );
}
