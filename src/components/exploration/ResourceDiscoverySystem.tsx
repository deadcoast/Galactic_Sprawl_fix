import { Database, Droplet, Leaf, Loader, Search, Sparkles, Zap } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ResourceType } from './../../types/resources/ResourceTypes';
// Import error logging service

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
  signalType:
    | ResourceType.MINERALS
    | ResourceType.ENERGY
    | ResourceType.GAS
    | ResourceType.ORGANIC
    | ResourceType.EXOTIC
    | 'unknown';
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

interface ResourceDiscoverySystemProps {
  discoveries: ResourceDiscovery[];
  sectors: Sector[];
  onProcessDiscovery: (discoveryId: string, processedData: ResourceData[]) => void;
  onUpdateNotes: (discoveryId: string, notes: string) => void;
  className?: string;
  quality?: 'low' | 'medium' | 'high';
}

// Resource name generators by type - updated to use enum values
const resourceNames: Record<string, string[]> = {
  [ResourceType.MINERALS]: [
    'Iron Deposits',
    'Copper Veins',
    'Titanium Ore',
    'Platinum Clusters',
    'Gold Nuggets',
    'Silver Deposits',
    'Uranium Ore',
    'Cobalt Formations',
    'Nickel Veins',
    'Aluminum Deposits',
    'Rare Earth Metals',
    'Tungsten Ore',
    'Chromium Deposits',
    'Manganese Nodules',
    'Zirconium Crystals',
  ],
  [ResourceType.ENERGY]: [
    'Thermal Vents',
    'Solar Radiation Pockets',
    'Plasma Streams',
    'Geothermal Hotspots',
    'Fusion Materials',
    'Radioactive Isotopes',
    'Quantum Particles',
    'Antimatter Traces',
    'Dark Energy Nodes',
    'Neutron Sources',
    'Tachyon Emissions',
    'Zero-Point Fields',
  ],
  [ResourceType.GAS]: [
    'Hydrogen Clouds',
    'Helium Pockets',
    'Methane Reservoirs',
    'Nitrogen Bubbles',
    'Oxygen Pockets',
    'Carbon Dioxide Vents',
    'Neon Clusters',
    'Argon Deposits',
    'Xenon Pockets',
    'Ammonia Clouds',
    'Chlorine Vents',
    'Sulfur Dioxide Pockets',
  ],
  [ResourceType.ORGANIC]: [
    'Bacterial Colonies',
    'Fungal Growths',
    'Plant Analogs',
    'Protein Compounds',
    'Amino Acid Pools',
    'Enzyme Clusters',
    'Microbial Mats',
    'Spore Formations',
    'Algae Blooms',
    'Viral Particles',
    'DNA Fragments',
    'RNA Strands',
    'Cellular Structures',
  ],
  [ResourceType.EXOTIC]: [
    'Quantum Crystals',
    'Dark Matter Nodes',
    'Temporal Anomalies',
    'Dimensional Rifts',
    'Exotic Particles',
    'Strange Matter',
    'Antimatter Pockets',
    'Graviton Clusters',
    'Tachyon Fields',
    'Higgs Boson Concentrations',
    'Monopole Magnets',
    'Quark-Gluon Plasma',
  ],
  [ResourceType.POPULATION]: [
    'Settlement Sites',
    'Habitable Zones',
    'Colony Locations',
    'Terraforming Candidates',
    'Shelter Regions',
    'Expansion Areas',
  ],
  [ResourceType.RESEARCH]: [
    'Ancient Ruins',
    'Alien Artifacts',
    'Scientific Phenomena',
    'Knowledge Repositories',
    'Research Specimens',
    'Data Caches',
  ],
  [ResourceType.PLASMA]: [
    'Plasma Clouds',
    'Ionized Gas Pockets',
    'Charged Particle Fields',
    'Electromagnetic Anomalies',
    'Fusion Reaction Sites',
    'Plasma Storms',
  ],
};

export function ResourceDiscoverySystem({
  discoveries,
  sectors,
  onProcessDiscovery,
  onUpdateNotes,
  className = '',
  quality = 'medium',
}: ResourceDiscoverySystemProps) {
  const [selectedDiscoveryId, setSelectedDiscoveryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'discovered' | 'analyzing' | 'processed'
  >('all');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'potential'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [processingDiscoveryId, setProcessingDiscoveryId] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [notes, setNotes] = useState('');

  // Quality settings for visualization and processing
  const qualitySettings = useMemo(() => {
    switch (quality) {
      case 'low':
        return {
          processingSpeed: 50, // ms between processing steps
          confidenceDecimalPlaces: 1,
        };
      case 'high':
        return {
          processingSpeed: 20,
          confidenceDecimalPlaces: 3,
        };
      case 'medium':
      default:
        return {
          processingSpeed: 35,
          confidenceDecimalPlaces: 2,
        };
    }
  }, [quality]);

  // Get the selected discovery
  const selectedDiscovery = useMemo(
    () => discoveries.find(d => d.id === selectedDiscoveryId) || null,
    [discoveries, selectedDiscoveryId]
  );

  // Filter and sort discoveries
  const filteredDiscoveries = useMemo(() => {
    let filtered = [...discoveries];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        d =>
          d.sectorName.toLowerCase().includes(query) ||
          d.id.toLowerCase().includes(query) ||
          (d.notes && d.notes.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = a.discoveryDate - b.discoveryDate;
      } else if (sortBy === 'confidence') {
        comparison = a.confidence - b.confidence;
      } else if (sortBy === 'potential') {
        const sectorA = sectors.find(s => s.id === a.sectorId);
        const sectorB = sectors.find(s => s.id === b.sectorId);
        comparison = (sectorA?.resourcePotential ?? 0) - (sectorB?.resourcePotential ?? 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [discoveries, statusFilter, searchQuery, sortBy, sortOrder, sectors]);

  // Process a discovery
  const processDiscovery = useCallback(
    (discoveryId: string) => {
      const discovery = discoveries.find(d => d.id === discoveryId);
      if (!discovery || discovery.status === 'processed') return;

      setProcessingDiscoveryId(discoveryId);
      setProcessingProgress(0);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setProcessingProgress(progress);

        if (progress >= 100) {
          clearInterval(interval);
          const processedData = generateProcessedData(discovery);
          onProcessDiscovery(discoveryId, processedData);
          setProcessingDiscoveryId(null);
        }
      }, qualitySettings.processingSpeed); // Use quality setting for processing speed

      return () => clearInterval(interval);
    },
    [discoveries, onProcessDiscovery, qualitySettings]
  );

  // Generate processed resource data from raw data
  const generateProcessedData = (discovery: ResourceDiscovery): ResourceData[] => {
    return discovery.rawData.map(raw => {
      // Determine resource type - Simplified logic
      let type: ResourceType;
      if (raw.signalType === 'unknown') {
        // Select a random resource type from the valid ResourceType values
        const resourceTypes: ResourceType[] = [
          ResourceType.MINERALS,
          ResourceType.ENERGY,
          ResourceType.GAS,
          ResourceType.PLASMA,
          ResourceType.EXOTIC,
          ResourceType.ORGANIC, // Added ORGANIC to potential random types
        ];
        type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      } else {
        // Directly use the enum value from signalType
        type = raw.signalType;
      }

      // Generate resource name based on type
      // Try to get names directly from the enum key
      let nameOptions = resourceNames[type]; // Directly use the enum as key

      // Fallback to minerals if no names found (should be rare now)
      if (!nameOptions) {
        nameOptions = resourceNames[ResourceType.MINERALS];
      }

      const name = nameOptions[Math.floor(Math.random() * nameOptions.length)];

      // Calculate resource properties based on raw data and add some randomness
      const quality = Math.min(1, Math.max(0, raw.signalStrength * (0.7 + Math.random() * 0.6)));
      const amount = Math.floor(quality * (50 + Math.random() * 50));
      const accessibility = Math.min(
        1,
        Math.max(0, (1 - raw.signalDepth) * (0.6 + Math.random() * 0.8))
      );
      const distribution =
        raw.signalPattern === 'unknown'
          ? (['concentrated', 'scattered', 'veins'][Math.floor(Math.random() * 3)] as
              | 'concentrated'
              | 'scattered'
              | 'veins')
          : raw.signalPattern;

      // Calculate extraction difficulty (inverse of accessibility)
      const extractionDifficulty = Math.round((1 - accessibility) * 10);

      // Calculate estimated value based on type, quality, amount, and accessibility
      let baseValue = 0;
      switch (type) {
        case ResourceType.MINERALS:
          baseValue = 1000;
          break;
        case ResourceType.ENERGY:
          baseValue = 1500;
          break;
        case ResourceType.GAS:
          baseValue = 1200;
          break;
        case ResourceType.PLASMA:
          baseValue = 2500;
          break;
        case ResourceType.EXOTIC:
          baseValue = 5000;
          break;
        case ResourceType.POPULATION:
          baseValue = 3000;
          break;
        case ResourceType.RESEARCH:
          baseValue = 4000;
          break;
        default:
          baseValue = 1000;
      }

      const estimatedValue = Math.round(
        baseValue *
          amount *
          quality *
          (0.5 + accessibility * 0.5) *
          (distribution === 'concentrated' ? 1.2 : distribution === 'veins' ? 1.0 : 0.8)
      );

      return {
        type,
        name,
        amount,
        quality,
        accessibility,
        distribution,
        estimatedValue,
        extractionDifficulty,
        coordinates: raw.coordinates,
      };
    });
  };

  // Update notes when changed
  useEffect(() => {
    if (selectedDiscovery && notes !== selectedDiscovery.notes) {
      setNotes(selectedDiscovery.notes ?? '');
    }
  }, [selectedDiscovery]);

  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  // Save notes
  const saveNotes = () => {
    if (selectedDiscoveryId) {
      onUpdateNotes(selectedDiscoveryId, notes);
    }
  };

  // Get resource type icon - updated to handle enum values directly
  const getResourceTypeIcon = (type: ResourceType | 'unknown') => {
    // Remove deprecation warning and string conversion
    // if (typeof type === 'string') {
    //   console.warn(
    //     `Using string resource type '${type}' is deprecated. Use ResourceType enum instead.`
    //   );
    // }

    // Switch directly on ResourceType or 'unknown'
    switch (type) {
      case ResourceType.MINERALS:
        return <Database className="h-4 w-4 text-blue-400" />;
      case ResourceType.ENERGY:
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case ResourceType.GAS:
        return <Droplet className="h-4 w-4 text-cyan-400" />;
      case ResourceType.ORGANIC:
        return <Leaf className="h-4 w-4 text-green-400" />;
      case ResourceType.EXOTIC:
        return <Sparkles className="h-4 w-4 text-purple-400" />;
      case ResourceType.PLASMA: // Added missing case
        return <Zap className="h-4 w-4 text-orange-400" />; // Example icon/color
      case 'unknown': // Handle unknown case explicitly
        return <Search className="h-4 w-4 text-gray-400" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div
      className={`flex h-full flex-col rounded-lg border border-gray-700 bg-gray-800 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-3">
        <h2 className="text-lg font-semibold text-white">Resource Discovery System</h2>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search discoveries..."
              className="w-48 rounded border border-gray-600 bg-gray-700 py-1 pr-2 pl-8 text-sm text-white placeholder-gray-400"
            />
            <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e =>
              setStatusFilter(e.target.value as 'all' | 'discovered' | 'analyzing' | 'processed')
            }
            className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white"
          >
            <option value="all">All Status</option>
            <option value="discovered">Discovered</option>
            <option value="analyzing">Analyzing</option>
            <option value="processed">Processed</option>
          </select>

          {/* Sort options */}
          <div className="flex items-center rounded border border-gray-600 bg-gray-700">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'date' | 'confidence' | 'potential')}
              className="border-r border-gray-600 bg-transparent px-2 py-1 text-sm text-white"
            >
              <option value="date">Discovery Date</option>
              <option value="confidence">Confidence</option>
              <option value="potential">Resource Potential</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-2 py-1 text-sm text-white"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-grow overflow-hidden">
        {/* Discoveries list */}
        <div className="w-1/3 overflow-y-auto border-r border-gray-700">
          {filteredDiscoveries.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-gray-400">
              No discoveries match your filters
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredDiscoveries.map(discovery => (
                <div
                  key={discovery.id}
                  className={`cursor-pointer p-3 transition-colors hover:bg-gray-700 ${
                    discovery.id === selectedDiscoveryId ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => setSelectedDiscoveryId(discovery.id)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">{discovery.sectorName}</h3>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        discovery.status === 'discovered'
                          ? 'bg-blue-900 text-blue-200'
                          : discovery.status === 'analyzing'
                            ? 'bg-yellow-900 text-yellow-200'
                            : 'bg-green-900 text-green-200'
                      }`}
                    >
                      {discovery.status.charAt(0).toUpperCase() + discovery.status.slice(1)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center text-xs text-gray-400">
                    <span>
                      {new Date(discovery.discoveryDate).toLocaleDateString()} •
                      {discovery.rawData.length} signals •{Math.round(discovery.confidence * 100)}%
                      confidence
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {discovery.rawData.slice(0, 5).map((raw, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${
                          raw.signalType === ResourceType.MINERALS
                            ? 'bg-blue-900/50 text-blue-200'
                            : raw.signalType === ResourceType.ENERGY
                              ? 'bg-yellow-900/50 text-yellow-200'
                              : raw.signalType === ResourceType.GAS
                                ? 'bg-cyan-900/50 text-cyan-200'
                                : raw.signalType === ResourceType.ORGANIC
                                  ? 'bg-green-900/50 text-green-200'
                                  : raw.signalType === ResourceType.EXOTIC
                                    ? 'bg-purple-900/50 text-purple-200'
                                    : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {getResourceTypeIcon(raw.signalType)}
                        <span className="ml-1">
                          {raw.signalType === 'unknown' ? 'Unknown' : raw.signalType}
                        </span>
                      </span>
                    ))}
                    {discovery.rawData.length > 5 && (
                      <span className="inline-flex items-center rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300">
                        +{discovery.rawData.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discovery details */}
        <div className="flex-grow overflow-y-auto p-4">
          {!selectedDiscovery ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              Select a discovery to view details
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {selectedDiscovery.sectorName}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Discovered on {new Date(selectedDiscovery.discoveryDate).toLocaleString()}
                    {selectedDiscovery.processedDate &&
                      ` • Processed on ${new Date(selectedDiscovery.processedDate).toLocaleString()}`}
                  </p>
                </div>

                {selectedDiscovery.status !== 'processed' && (
                  <button
                    onClick={() => processDiscovery(selectedDiscovery.id)}
                    disabled={processingDiscoveryId === selectedDiscovery.id}
                    className={`rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {processingDiscoveryId === selectedDiscovery.id ? (
                      <div className="flex items-center">
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Processing... {Math.round(processingProgress)}%
                      </div>
                    ) : (
                      'Process Discovery'
                    )}
                  </button>
                )}
              </div>

              {/* Discovery info */}
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="bg-gray-750 rounded border border-gray-700 p-3">
                  <h3 className="mb-1 text-sm font-medium text-gray-300">Confidence Level</h3>
                  <div className="flex items-end">
                    <span className="text-2xl font-semibold text-white">
                      {Math.round(selectedDiscovery.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="bg-gray-750 rounded border border-gray-700 p-3">
                  <h3 className="mb-1 text-sm font-medium text-gray-300">Scan Quality</h3>
                  <div className="flex items-end">
                    <span className="text-2xl font-semibold text-white">
                      {Math.round(selectedDiscovery.scanQuality * 100)}%
                    </span>
                  </div>
                </div>

                <div className="bg-gray-750 rounded border border-gray-700 p-3">
                  <h3 className="mb-1 text-sm font-medium text-gray-300">Raw Signals</h3>
                  <div className="flex items-end">
                    <span className="text-2xl font-semibold text-white">
                      {selectedDiscovery.rawData.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raw signals or processed resources */}
              <div className="mb-4">
                <h3 className="mb-2 text-lg font-medium text-white">
                  {selectedDiscovery.status === 'processed' ? 'Processed Resources' : 'Raw Signals'}
                </h3>

                <div className="bg-gray-750 rounded border border-gray-700 p-3">
                  {selectedDiscovery.status === 'processed' && selectedDiscovery.processedData ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selectedDiscovery.processedData.map((resource, index) => (
                        <div key={index} className="rounded border border-gray-600 bg-gray-800 p-3">
                          <div className="mb-2 flex items-center">
                            {getResourceTypeIcon(resource.type)}
                            <span className="ml-2 font-medium text-white">{resource.name}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <span className="text-gray-400">Type:</span>{' '}
                              {/* Display ResourceType enum value */}
                              <span className="text-white">{resource.type}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Amount:</span>{' '}
                              <span className="text-white">{resource.amount}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Quality:</span>{' '}
                              <span className="text-white">
                                {Math.round(resource.quality * 100)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Accessibility:</span>{' '}
                              <span className="text-white">
                                {Math.round(resource.accessibility * 100)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Distribution:</span>{' '}
                              <span className="text-white">{resource.distribution}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Extraction:</span>{' '}
                              <span className="text-white">{resource.extractionDifficulty}/10</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-400">Est. Value:</span>{' '}
                              <span className="text-white">
                                {resource.estimatedValue.toLocaleString()} credits
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selectedDiscovery.rawData.map((signal, index) => (
                        <div key={index} className="rounded border border-gray-600 bg-gray-800 p-3">
                          <div className="mb-2 flex items-center">
                            {getResourceTypeIcon(signal.signalType)}
                            <span className="ml-2 font-medium text-white">
                              Signal #{index + 1} ({signal.signalType})
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <span className="text-gray-400">Strength:</span>{' '}
                              <span className="text-white">
                                {Math.round(signal.signalStrength * 100)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Pattern:</span>{' '}
                              <span className="text-white">{signal.signalPattern}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Depth:</span>{' '}
                              <span className="text-white">
                                {Math.round(signal.signalDepth * 100)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Coordinates:</span>{' '}
                              <span className="text-white">
                                {signal.coordinates.x.toFixed(1)}, {signal.coordinates.y.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Notes</h3>
                  <button
                    onClick={saveNotes}
                    className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
                  >
                    Save Notes
                  </button>
                </div>

                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Add notes about this discovery..."
                  className="bg-gray-750 h-32 w-full rounded border border-gray-700 p-2 text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
