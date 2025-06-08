import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Database,
  Download,
  FileText,
  Layers,
  MapIcon,
  Microscope,
  Share2,
  Shield,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ResourceType } from './../../types/resources/ResourceTypes';
// Enhanced Anomaly interface with additional properties for detailed analysis
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

interface DetailedAnomalyAnalysisProps {
  anomalies: Anomaly[];
  onInvestigate: (anomalyId: string) => void;
  onAnalysisComplete: (anomalyId: string, results: Anomaly['analysisResults']) => void;
  onExport?: (anomalyId: string, format: 'pdf' | 'csv' | 'json') => void;
  onShare?: (anomalyId: string) => void;
  onRelatedAnomalySelect?: (anomalyId: string) => void;
  className?: string;
  quality?: 'low' | 'medium' | 'high';
  advancedMode?: boolean;
}

export function DetailedAnomalyAnalysis({
  anomalies,
  onInvestigate,
  onAnalysisComplete,
  onExport,
  onShare,
  onRelatedAnomalySelect,
  className = '',
  quality = 'medium',
  advancedMode = false,
}: DetailedAnomalyAnalysisProps) {
  // State variables
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'type' | 'value'>('severity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | 'investigated' | 'uninvestigated' | 'high-value'>(
    'all'
  );
  const [analysisInProgress, setAnalysisInProgress] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'detailed' | ResourceType.RESEARCH | 'exploitation'
  >('overview');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  // Initialize expanded sections
  useEffect(() => {
    setExpandedSections({
      analysis: true,
      visuals: false,
      recommendations: false,
      research: false,
      exploitation: false,
      related: false,
    });
  }, []);

  // Calculate anomaly value score (for sorting by value)
  const calculateAnomalyValue = (anomaly: Anomaly): number => {
    if (anomaly.exploitationPotential) {
      const { resourceValue, technologicalValue, scientificValue, strategicValue } =
        anomaly.exploitationPotential;
      return (resourceValue + technologicalValue + scientificValue + strategicValue) / 4;
    }

    // Fallback calculation based on severity and type
    const severityValue = { low: 1, medium: 2, high: 3 }[anomaly.severity] || 1;
    const typeValue = { artifact: 3, signal: 2, phenomenon: 2.5 }[anomaly.type] || 1;

    return severityValue * typeValue;
  };

  // Sort and filter anomalies
  const filteredAndSortedAnomalies = useMemo(() => {
    let filtered = [...anomalies];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.description.toLowerCase().includes(query) ||
          a.sectorName.toLowerCase().includes(query) ||
          a.type.toLowerCase().includes(query) ||
          a.severity.toLowerCase().includes(query) ||
          (a.classification?.category?.toLowerCase().includes(query) ?? false) ||
          (a.classification?.subcategory?.toLowerCase().includes(query) ?? false)
      );
    }

    // Apply filter
    if (filter === 'investigated') {
      filtered = filtered.filter(a => a.investigated);
    } else if (filter === 'uninvestigated') {
      filtered = filtered.filter(a => !a.investigated);
    } else if (filter === 'high-value') {
      filtered = filtered.filter(a => calculateAnomalyValue(a) >= 5);
    }

    // Apply sort
    return filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = a.discoveryDate - b.discoveryDate;
      } else if (sortBy === 'severity') {
        const severityValue = { low: 1, medium: 2, high: 3 };
        comparison = (severityValue[a.severity] ?? 0) - (severityValue[b.severity] ?? 0);
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortBy === 'value') {
        comparison = calculateAnomalyValue(a) - calculateAnomalyValue(b);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [anomalies, sortBy, sortOrder, filter, searchQuery]);

  // Get the selected anomaly
  const selectedAnomaly = useMemo(() => {
    return anomalies.find(a => a.id === selectedAnomalyId) ?? null;
  }, [anomalies, selectedAnomalyId]);

  // Get related anomalies
  const relatedAnomalies = useMemo(() => {
    if (!selectedAnomaly?.relatedAnomalies) return [];
    return anomalies.filter(a => selectedAnomaly.relatedAnomalies?.includes(a.id));
  }, [anomalies, selectedAnomaly]);

  // Handle sort change
  const handleSortChange = (newSortBy: 'date' | 'severity' | 'type' | 'value') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // Handle investigation
  const handleInvestigate = (anomalyId: string) => {
    setAnalysisInProgress(prev => ({ ...prev, [anomalyId]: true }));
    onInvestigate(anomalyId);

    // Simulate analysis progress
    const duration = Math.random() * 3000 + 2000; // 2-5 seconds
    setTimeout(() => {
      setAnalysisInProgress(prev => ({ ...prev, [anomalyId]: false }));

      // Generate analysis results based on anomaly type and severity
      const anomaly = anomalies.find(a => a.id === anomalyId);
      if (anomaly) {
        const results: Anomaly['analysisResults'] = {};

        if (anomaly.type === 'artifact') {
          results.composition = ['Titanium', 'Unknown alloy', 'Trace elements'];
          results.origin = Math.random() > 0.7 ? 'Unknown' : 'Ancient civilization';
          results.age = `${Math.floor(Math.random() * 10000 + 1000)} years`;
          results.potentialUses = ['Research', 'Technology advancement'];
          results.dangerLevel = Math.random() * 10;

          // Enhanced results
          results.materialProperties = {
            density: Math.random() * 20 + 5,
            conductivity: Math.random() * 100,
            radioactivity: Math.random() * 5,
            magnetism: Math.random() * 100,
            heatResistance: Math.random() * 2000 + 500,
          };

          results.biologicalImpact = {
            toxicity: Math.random() * 10,
            mutagenicPotential: Math.random() * 10,
            biocompatibility: Math.random() * 100,
            lifeformDetection: Math.random() > 0.8,
          };
        } else if (anomaly.type === 'signal') {
          results.energySignature = `${Math.random() * 100 + 50} THz`;
          results.origin = Math.random() > 0.5 ? 'Deep space' : 'Nearby star system';
          results.potentialUses = ['Communication', 'Navigation'];
          results.dangerLevel = Math.random() * 5;

          // Enhanced results
          results.spectrumAnalysis = {
            frequencies: Array.from({ length: 5 }, () => Math.random() * 1000 + 100),
            amplitudes: Array.from({ length: 5 }, () => Math.random() * 100),
            patterns: ['Repeating', 'Structured', 'Non-random'],
            anomalies: ['Frequency shift', 'Amplitude modulation'],
          };

          results.temporalEffects = {
            timeDialation: Math.random() * 0.1,
            chronoStability: Math.random() * 100,
            temporalFlux: ['Minimal', 'Localized'],
          };
        } else if (anomaly.type === 'phenomenon') {
          results.energySignature = `${Math.random() * 1000 + 100} PJ`;
          results.composition = ['Energy fluctuations', 'Spatial distortions'];
          results.potentialUses = ['Energy harvesting', 'Spatial research'];
          results.dangerLevel = Math.random() * 8 + 2;

          // Enhanced results
          results.spatialDistortion = {
            magnitude: Math.random() * 10,
            radius: Math.random() * 1000 + 100,
            stability: Math.random() * 100,
            fluctuationRate: Math.random() * 10,
          };

          results.temporalEffects = {
            timeDialation: Math.random() * 0.5,
            chronoStability: Math.random() * 50 + 50,
            temporalFlux: ['Significant', 'Expanding', 'Unstable'],
          };
        }

        results.notes = 'Further investigation recommended.';

        onAnalysisComplete(anomalyId, results);
      }
    }, duration);
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Get severity color
  const getSeverityColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get type icon
  const getTypeIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'artifact':
        return <Database className="h-4 w-4" />;
      case 'signal':
        return <Zap className="h-4 w-4" />;
      case 'phenomenon':
        return <Microscope className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`flex h-full flex-col bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-bold text-white">Detailed Anomaly Analysis</h2>
          {advancedMode && (
            <span className="ml-2 rounded bg-blue-900 px-2 py-0.5 text-xs text-blue-200">
              Advanced Mode
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search anomalies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-48 rounded border border-gray-600 bg-gray-700 py-1 pr-2 pl-8 text-sm text-gray-300 placeholder-gray-500"
            />
            <FileText className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>

          {/* Filter dropdown */}
          <select
            value={filter}
            onChange={e =>
              setFilter(e.target.value as 'all' | 'investigated' | 'uninvestigated' | 'high-value')
            }
            className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-300"
          >
            <option value="all">All Anomalies</option>
            <option value="investigated">Investigated</option>
            <option value="uninvestigated">Uninvestigated</option>
            <option value="high-value">High Value</option>
          </select>

          {/* Advanced options toggle */}
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className={`rounded px-2 py-1 text-xs ${
              showAdvancedOptions ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Advanced Options
          </button>
        </div>
      </div>

      {/* Advanced options panel */}
      {showAdvancedOptions && (
        <div className="border-b border-gray-700 bg-gray-800 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs text-gray-400">Quality Level</label>
              <select
                value={quality}
                onChange={_e => {
                  // This would typically be handled by a parent component
                  console.warn('Quality level change would be handled by parent component');
                }}
                className="mt-1 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-300"
              >
                <option value="low">Low (Performance)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Quality)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400">Display Mode</label>
              <div className="mt-1 flex overflow-hidden rounded border border-gray-600">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-2 py-1 text-xs ${
                    activeTab === 'overview'
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('detailed')}
                  className={`px-2 py-1 text-xs ${
                    activeTab === 'detailed'
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Detailed
                </button>
                <button
                  onClick={() => setActiveTab(ResourceType.RESEARCH)}
                  className={`px-2 py-1 text-xs ${
                    activeTab === ResourceType.RESEARCH
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Research
                </button>
                <button
                  onClick={() => setActiveTab('exploitation')}
                  className={`px-2 py-1 text-xs ${
                    activeTab === 'exploitation'
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Exploitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-grow overflow-hidden">
        {/* Anomaly list */}
        <div className="w-1/3 overflow-y-auto border-r border-gray-700">
          {/* Sort controls */}
          <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-2 text-xs text-gray-300">
            <button
              onClick={() => handleSortChange('date')}
              className={`flex items-center space-x-1 rounded px-2 py-1 ${
                sortBy === 'date' ? 'bg-blue-900 text-blue-200' : 'hover:bg-gray-700'
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>Date</span>
              {sortBy === 'date' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </button>

            <button
              onClick={() => handleSortChange('severity')}
              className={`flex items-center space-x-1 rounded px-2 py-1 ${
                sortBy === 'severity' ? 'bg-blue-900 text-blue-200' : 'hover:bg-gray-700'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Severity</span>
              {sortBy === 'severity' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </button>

            <button
              onClick={() => handleSortChange('type')}
              className={`flex items-center space-x-1 rounded px-2 py-1 ${
                sortBy === 'type' ? 'bg-blue-900 text-blue-200' : 'hover:bg-gray-700'
              }`}
            >
              <FileText className="h-3 w-3" />
              <span>Type</span>
              {sortBy === 'type' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </button>

            <button
              onClick={() => handleSortChange('value')}
              className={`flex items-center space-x-1 rounded px-2 py-1 ${
                sortBy === 'value' ? 'bg-blue-900 text-blue-200' : 'hover:bg-gray-700'
              }`}
            >
              <BarChart2 className="h-3 w-3" />
              <span>Value</span>
              {sortBy === 'value' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </button>
          </div>

          {/* Anomaly items */}
          <div className="divide-y divide-gray-700">
            {filteredAndSortedAnomalies.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No anomalies found matching the current filter.
              </div>
            ) : (
              filteredAndSortedAnomalies.map(anomaly => (
                <div
                  key={anomaly.id}
                  className={`cursor-pointer p-3 transition-colors ${
                    selectedAnomalyId === anomaly.id ? 'bg-blue-900/30' : 'hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedAnomalyId(anomaly.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <div className={`mt-0.5 ${getSeverityColor(anomaly.severity)}`}>
                        {getTypeIcon(anomaly.type)}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">
                          {anomaly.description.length > 30
                            ? `${anomaly.description.substring(0, 30)}...`
                            : anomaly.description}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {anomaly.sectorName} • {formatDate(anomaly.discoveryDate)}
                        </p>

                        {/* Classification tag if available */}
                        {anomaly.classification && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300">
                              {anomaly.classification.category}
                            </span>
                            {anomaly.classification.rarity && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-xs ${
                                  anomaly.classification.rarity === 'unique'
                                    ? 'bg-purple-900/50 text-purple-300'
                                    : anomaly.classification.rarity === 'rare'
                                      ? 'bg-blue-900/50 text-blue-300'
                                      : anomaly.classification.rarity === 'uncommon'
                                        ? 'bg-green-900/50 text-green-300'
                                        : 'bg-gray-700 text-gray-300'
                                }`}
                              >
                                {anomaly.classification.rarity}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          anomaly.severity === 'high'
                            ? 'bg-red-900/50 text-red-300'
                            : anomaly.severity === 'medium'
                              ? 'bg-yellow-900/50 text-yellow-300'
                              : 'bg-blue-900/50 text-blue-300'
                        }`}
                      >
                        {anomaly.severity}
                      </span>

                      <span className="mt-1 text-xs text-gray-400">
                        {anomaly.investigated ? 'Investigated' : 'Uninvestigated'}
                      </span>

                      {/* Value indicator if available */}
                      {anomaly.exploitationPotential && (
                        <div className="mt-1 flex items-center space-x-1">
                          <BarChart2 className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-500">
                            {Math.round(calculateAnomalyValue(anomaly) * 10) / 10}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Anomaly details */}
        <div className="flex-grow overflow-y-auto">
          {selectedAnomaly ? (
            <div className="p-4">
              {/* Header with actions */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="mb-1 text-xl font-bold text-white">
                    {selectedAnomaly.description}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Discovered on {formatDate(selectedAnomaly.discoveryDate)} in{' '}
                    {selectedAnomaly.sectorName}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div
                    className={`rounded px-2 py-1 text-sm font-medium ${
                      selectedAnomaly.severity === 'high'
                        ? 'bg-red-900/50 text-red-300'
                        : selectedAnomaly.severity === 'medium'
                          ? 'bg-yellow-900/50 text-yellow-300'
                          : 'bg-blue-900/50 text-blue-300'
                    }`}
                  >
                    {selectedAnomaly.severity.toUpperCase()} {selectedAnomaly.type.toUpperCase()}
                  </div>

                  {/* Action buttons */}
                  {onExport && (
                    <button
                      onClick={() => onExport(selectedAnomaly.id, 'pdf')}
                      className="rounded bg-gray-700 p-1 text-gray-300 hover:bg-gray-600"
                      title="Export data"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}

                  {onShare && (
                    <button
                      onClick={() => onShare(selectedAnomaly.id)}
                      className="rounded bg-gray-700 p-1 text-gray-300 hover:bg-gray-600"
                      title="Share analysis"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tab navigation */}
              <div className="mb-4 flex border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`border-b-2 px-4 py-2 text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('detailed')}
                  className={`border-b-2 px-4 py-2 text-sm ${
                    activeTab === 'detailed'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Detailed Analysis
                </button>
                <button
                  onClick={() => setActiveTab(ResourceType.RESEARCH)}
                  className={`border-b-2 px-4 py-2 text-sm ${
                    activeTab === ResourceType.RESEARCH
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Research
                </button>
                <button
                  onClick={() => setActiveTab('exploitation')}
                  className={`border-b-2 px-4 py-2 text-sm ${
                    activeTab === 'exploitation'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Exploitation
                </button>
              </div>

              {/* Tab content */}
              <div>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Coordinates */}
                    <div className="rounded-lg bg-gray-800 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MapIcon className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-gray-300">Coordinates</span>
                        </div>
                        <div className="font-mono text-sm text-white">
                          X: {selectedAnomaly.coordinates.x.toFixed(2)}, Y:{' '}
                          {selectedAnomaly.coordinates.y.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Analysis section */}
                    <div className="overflow-hidden rounded-lg bg-gray-800">
                      <div
                        className="flex cursor-pointer items-center justify-between p-3"
                        onClick={() => toggleSection('analysis')}
                      >
                        <div className="flex items-center space-x-2">
                          <Microscope className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-medium text-white">Analysis</span>
                        </div>
                        {expandedSections.analysis ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>

                      {expandedSections.analysis && (
                        <div className="border-t border-gray-700 p-3 pt-0">
                          {selectedAnomaly.investigated ? (
                            <div className="space-y-3">
                              {selectedAnomaly.analysisResults?.composition && (
                                <div>
                                  <h4 className="mb-1 text-xs text-gray-400">Composition</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedAnomaly.analysisResults.composition.map(
                                      (item, index) => (
                                        <span
                                          key={index}
                                          className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300"
                                        >
                                          {item}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {selectedAnomaly.analysisResults?.origin && (
                                <div>
                                  <h4 className="mb-1 text-xs text-gray-400">Origin</h4>
                                  <p className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.origin}
                                  </p>
                                </div>
                              )}

                              {selectedAnomaly.analysisResults?.age && (
                                <div>
                                  <h4 className="mb-1 text-xs text-gray-400">Estimated Age</h4>
                                  <p className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.age}
                                  </p>
                                </div>
                              )}

                              {selectedAnomaly.analysisResults?.energySignature && (
                                <div>
                                  <h4 className="mb-1 text-xs text-gray-400">Energy Signature</h4>
                                  <p className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.energySignature}
                                  </p>
                                </div>
                              )}

                              {selectedAnomaly.analysisResults?.potentialUses && (
                                <div>
                                  <h4 className="mb-1 text-xs text-gray-400">Potential Uses</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedAnomaly.analysisResults.potentialUses.map(
                                      (use, index) => (
                                        <span
                                          key={index}
                                          className="rounded bg-blue-900/30 px-2 py-0.5 text-xs text-blue-300"
                                        >
                                          {use}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {selectedAnomaly.analysisResults?.dangerLevel !== undefined && (
                                <div>
                                  <h4 className="mb-1 text-xs text-gray-400">Danger Level</h4>
                                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                                    <div
                                      className={`h-full ${
                                        selectedAnomaly.analysisResults.dangerLevel > 7
                                          ? 'bg-red-500'
                                          : selectedAnomaly.analysisResults.dangerLevel > 4
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                      }`}
                                      style={{
                                        width: `${selectedAnomaly.analysisResults.dangerLevel * 10}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                                    <span>Safe</span>
                                    <span>Moderate</span>
                                    <span>Dangerous</span>
                                  </div>
                                </div>
                              )}

                              {selectedAnomaly.analysisResults?.notes && (
                                <div>
                                  <h4 className="mb-1 text-xs text-gray-400">Notes</h4>
                                  <p className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="py-4 text-center">
                              {analysisInProgress[selectedAnomaly.id] ? (
                                <div className="space-y-3">
                                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                                  <p className="text-sm text-gray-300">Analysis in progress...</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <p className="text-sm text-gray-300">
                                    This anomaly has not been investigated yet.
                                  </p>
                                  <button
                                    onClick={() => handleInvestigate(selectedAnomaly.id)}
                                    className="rounded bg-blue-700 px-3 py-1.5 text-white transition-colors hover:bg-blue-600"
                                  >
                                    Begin Analysis
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Visuals section */}
                    <div className="overflow-hidden rounded-lg bg-gray-800">
                      <div
                        className="flex cursor-pointer items-center justify-between p-3"
                        onClick={() => toggleSection('visuals')}
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-green-400" />
                          <span className="text-sm font-medium text-white">Visual Data</span>
                        </div>
                        {expandedSections.visuals ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>

                      {expandedSections.visuals && (
                        <div className="border-t border-gray-700 p-3 pt-0">
                          {selectedAnomaly.images && selectedAnomaly.images.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {selectedAnomaly.images.map((image, index) => (
                                <div key={index} className="overflow-hidden rounded bg-gray-700">
                                  <img
                                    src={image}
                                    alt={`Anomaly visual ${index + 1}`}
                                    className="h-auto w-full"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-4 text-center">
                              <p className="text-sm text-gray-300">No visual data available.</p>
                              {!selectedAnomaly.investigated && (
                                <p className="mt-1 text-xs text-gray-400">
                                  Visual data will be available after investigation.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Recommendations section */}
                    <div className="overflow-hidden rounded-lg bg-gray-800">
                      <div
                        className="flex cursor-pointer items-center justify-between p-3"
                        onClick={() => toggleSection('recommendations')}
                      >
                        <div className="flex items-center space-x-2">
                          <ArrowRight className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium text-white">Recommendations</span>
                        </div>
                        {expandedSections.recommendations ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>

                      {expandedSections.recommendations && (
                        <div className="border-t border-gray-700 p-3 pt-0">
                          {selectedAnomaly.investigated ? (
                            <div className="space-y-2">
                              {selectedAnomaly.type === 'artifact' && (
                                <>
                                  <div className="flex items-start space-x-2">
                                    <div className="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-blue-500"></div>
                                    <p className="text-sm text-gray-300">
                                      Dispatch research team to study the artifact's composition and
                                      technology.
                                    </p>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <div className="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-green-500"></div>
                                    <p className="text-sm text-gray-300">
                                      Consider establishing a research outpost for long-term study.
                                    </p>
                                  </div>
                                </>
                              )}

                              {selectedAnomaly.type === 'signal' && (
                                <>
                                  <div className="flex items-start space-x-2">
                                    <div className="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-blue-500"></div>
                                    <p className="text-sm text-gray-300">
                                      Deploy signal amplifiers to enhance and decode the
                                      transmission.
                                    </p>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <div className="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-green-500"></div>
                                    <p className="text-sm text-gray-300">
                                      Establish a monitoring station to track signal changes over
                                      time.
                                    </p>
                                  </div>
                                </>
                              )}

                              {selectedAnomaly.type === 'phenomenon' && (
                                <>
                                  <div className="flex items-start space-x-2">
                                    <div className="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-blue-500"></div>
                                    <p className="text-sm text-gray-300">
                                      Deploy sensor array to monitor energy fluctuations and spatial
                                      distortions.
                                    </p>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <div className="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-yellow-500"></div>
                                    <p className="text-sm text-gray-300">
                                      Maintain safe distance until phenomenon stability can be
                                      determined.
                                    </p>
                                  </div>
                                </>
                              )}

                              <div className="flex items-start space-x-2">
                                <div className="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-purple-500"></div>
                                <p className="text-sm text-gray-300">
                                  Allocate resources for further investigation and potential
                                  exploitation.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="py-4 text-center">
                              <p className="text-sm text-gray-300">
                                Recommendations will be available after investigation.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Related anomalies section */}
                    {relatedAnomalies.length > 0 && (
                      <div className="overflow-hidden rounded-lg bg-gray-800">
                        <div
                          className="flex cursor-pointer items-center justify-between p-3"
                          onClick={() => toggleSection('related')}
                        >
                          <div className="flex items-center space-x-2">
                            <Layers className="h-4 w-4 text-indigo-400" />
                            <span className="text-sm font-medium text-white">
                              Related Anomalies
                            </span>
                          </div>
                          {expandedSections.related ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>

                        {expandedSections.related && (
                          <div className="border-t border-gray-700 p-3 pt-0">
                            <div className="space-y-2">
                              {relatedAnomalies.map(anomaly => (
                                <div
                                  key={anomaly.id}
                                  className="flex cursor-pointer items-center justify-between rounded bg-gray-700 p-2 hover:bg-gray-600"
                                  onClick={() => {
                                    if (onRelatedAnomalySelect) {
                                      onRelatedAnomalySelect(anomaly.id);
                                    }
                                    setSelectedAnomalyId(anomaly.id);
                                  }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <div className={getSeverityColor(anomaly.severity)}>
                                      {getTypeIcon(anomaly.type)}
                                    </div>
                                    <span className="text-sm text-white">
                                      {anomaly.description}
                                    </span>
                                  </div>
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-xs ${
                                      anomaly.severity === 'high'
                                        ? 'bg-red-900/50 text-red-300'
                                        : anomaly.severity === 'medium'
                                          ? 'bg-yellow-900/50 text-yellow-300'
                                          : 'bg-blue-900/50 text-blue-300'
                                    }`}
                                  >
                                    {anomaly.severity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Detailed Analysis Tab */}
                {activeTab === 'detailed' && (
                  <div className="space-y-4">
                    {/* Spectrum Analysis */}
                    {selectedAnomaly.investigated &&
                      selectedAnomaly.analysisResults?.spectrumAnalysis && (
                        <div className="overflow-hidden rounded-lg bg-gray-800">
                          <div className="p-3">
                            <div className="flex items-center space-x-2">
                              <Zap className="h-4 w-4 text-blue-400" />
                              <span className="text-sm font-medium text-white">
                                Spectrum Analysis
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-gray-700 p-3">
                            <div className="space-y-3">
                              {/* Frequency visualization */}
                              <div>
                                <h4 className="mb-2 text-xs text-gray-400">
                                  Frequency Distribution
                                </h4>
                                <div className="h-24 w-full bg-gray-900 p-2">
                                  <div className="flex h-full items-end justify-between space-x-1">
                                    {selectedAnomaly.analysisResults.spectrumAnalysis.frequencies.map(
                                      (freq, index) => {
                                        const height = (freq / 1000) * 100;
                                        return (
                                          <div
                                            key={index}
                                            className="w-full bg-blue-500"
                                            style={{ height: `${Math.min(height, 100)}%` }}
                                            title={`${freq.toFixed(2)} Hz`}
                                          ></div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Patterns */}
                              <div>
                                <h4 className="mb-1 text-xs text-gray-400">Detected Patterns</h4>
                                <div className="flex flex-wrap gap-1">
                                  {selectedAnomaly.analysisResults.spectrumAnalysis.patterns.map(
                                    (pattern, index) => (
                                      <span
                                        key={index}
                                        className="rounded bg-blue-900/30 px-2 py-0.5 text-xs text-blue-300"
                                      >
                                        {pattern}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>

                              {/* Anomalies */}
                              <div>
                                <h4 className="mb-1 text-xs text-gray-400">Spectral Anomalies</h4>
                                <div className="flex flex-wrap gap-1">
                                  {selectedAnomaly.analysisResults.spectrumAnalysis.anomalies.map(
                                    (anomaly, index) => (
                                      <span
                                        key={index}
                                        className="rounded bg-purple-900/30 px-2 py-0.5 text-xs text-purple-300"
                                      >
                                        {anomaly}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Material Properties */}
                    {selectedAnomaly.investigated &&
                      selectedAnomaly.analysisResults?.materialProperties && (
                        <div className="overflow-hidden rounded-lg bg-gray-800">
                          <div className="p-3">
                            <div className="flex items-center space-x-2">
                              <Database className="h-4 w-4 text-green-400" />
                              <span className="text-sm font-medium text-white">
                                Material Properties
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-gray-700 p-3">
                            <div className="grid grid-cols-2 gap-4">
                              {/* Density */}
                              {selectedAnomaly.analysisResults.materialProperties.density !==
                                undefined && (
                                <div>
                                  <h4 className="mb-1 text-xs text-gray-400">Density</h4>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-white">
                                      {selectedAnomaly.analysisResults.materialProperties.density.toFixed(
                                        2
                                      )}{' '}
                                      g/cm³
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {selectedAnomaly.analysisResults.materialProperties.density >
                                      15
                                        ? 'Very Dense'
                                        : selectedAnomaly.analysisResults.materialProperties
                                              .density > 10
                                          ? 'Dense'
                                          : selectedAnomaly.analysisResults.materialProperties
                                                .density > 5
                                            ? 'Medium'
                                            : 'Light'}
                                    </span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                    <div
                                      className="h-full bg-green-500"
                                      style={{
                                        width: `${Math.min(
                                          (selectedAnomaly.analysisResults.materialProperties
                                            .density /
                                            25) *
                                            100,
                                          100
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              {/* Conductivity */}
                              {selectedAnomaly.analysisResults.materialProperties.conductivity !==
                                undefined && (
                                <div>
                                  <h4 className="mb-1 text-xs text-gray-400">Conductivity</h4>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-white">
                                      {selectedAnomaly.analysisResults.materialProperties.conductivity.toFixed(
                                        2
                                      )}{' '}
                                      S/m
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {selectedAnomaly.analysisResults.materialProperties
                                        .conductivity > 80
                                        ? 'Excellent'
                                        : selectedAnomaly.analysisResults.materialProperties
                                              .conductivity > 50
                                          ? 'Good'
                                          : selectedAnomaly.analysisResults.materialProperties
                                                .conductivity > 20
                                            ? 'Fair'
                                            : 'Poor'}
                                    </span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                    <div
                                      className="h-full bg-blue-500"
                                      style={{
                                        width: `${Math.min(
                                          (selectedAnomaly.analysisResults.materialProperties
                                            .conductivity /
                                            100) *
                                            100,
                                          100
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              {/* Radioactivity */}
                              {selectedAnomaly.analysisResults.materialProperties.radioactivity !==
                                undefined && (
                                <div>
                                  <h4 className="mb-1 text-xs text-gray-400">Radioactivity</h4>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-white">
                                      {selectedAnomaly.analysisResults.materialProperties.radioactivity.toFixed(
                                        2
                                      )}{' '}
                                      mSv/h
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {selectedAnomaly.analysisResults.materialProperties
                                        .radioactivity > 4
                                        ? 'Dangerous'
                                        : selectedAnomaly.analysisResults.materialProperties
                                              .radioactivity > 2
                                          ? 'High'
                                          : selectedAnomaly.analysisResults.materialProperties
                                                .radioactivity > 1
                                            ? 'Moderate'
                                            : 'Low'}
                                    </span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                    <div
                                      className={`h-full ${
                                        selectedAnomaly.analysisResults.materialProperties
                                          .radioactivity > 3
                                          ? 'bg-red-500'
                                          : selectedAnomaly.analysisResults.materialProperties
                                                .radioactivity > 1
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          (selectedAnomaly.analysisResults.materialProperties
                                            .radioactivity /
                                            5) *
                                          100,
                                          100
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              {/* Heat Resistance */}
                              {selectedAnomaly.analysisResults.materialProperties.heatResistance !==
                                undefined && (
                                <div>
                                  <h4 className="mb-1 text-xs text-gray-400">Heat Resistance</h4>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-white">
                                      {selectedAnomaly.analysisResults.materialProperties.heatResistance.toFixed(
                                        0
                                      )}{' '}
                                      K
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {selectedAnomaly.analysisResults.materialProperties
                                        .heatResistance > 1500
                                        ? 'Extreme'
                                        : selectedAnomaly.analysisResults.materialProperties
                                              .heatResistance > 1000
                                          ? 'Very High'
                                          : selectedAnomaly.analysisResults.materialProperties
                                                .heatResistance > 500
                                            ? 'High'
                                            : 'Moderate'}
                                    </span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                    <div
                                      className="h-full bg-orange-500"
                                      style={{
                                        width: `${Math.min(
                                          (selectedAnomaly.analysisResults.materialProperties
                                            .heatResistance /
                                            2500) *
                                            100,
                                          100
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Spatial Distortion */}
                    {selectedAnomaly.investigated &&
                      selectedAnomaly.analysisResults?.spatialDistortion && (
                        <div className="overflow-hidden rounded-lg bg-gray-800">
                          <div className="p-3">
                            <div className="flex items-center space-x-2">
                              <Compass className="h-4 w-4 text-purple-400" />
                              <span className="text-sm font-medium text-white">
                                Spatial Distortion
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-gray-700 p-3">
                            <div className="grid grid-cols-2 gap-4">
                              {/* Magnitude */}
                              <div>
                                <h4 className="mb-1 text-xs text-gray-400">Magnitude</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.spatialDistortion.magnitude.toFixed(
                                      2
                                    )}{' '}
                                    units
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {selectedAnomaly.analysisResults.spatialDistortion.magnitude > 7
                                      ? 'Extreme'
                                      : selectedAnomaly.analysisResults.spatialDistortion
                                            .magnitude > 5
                                        ? 'Severe'
                                        : selectedAnomaly.analysisResults.spatialDistortion
                                              .magnitude > 3
                                          ? 'Moderate'
                                          : 'Mild'}
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                  <div
                                    className={`h-full ${
                                      selectedAnomaly.analysisResults.spatialDistortion.magnitude >
                                      7
                                        ? 'bg-red-500'
                                        : selectedAnomaly.analysisResults.spatialDistortion
                                              .magnitude > 4
                                          ? 'bg-yellow-500'
                                          : 'bg-blue-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        (selectedAnomaly.analysisResults.spatialDistortion
                                          .magnitude /
                                          10) *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {/* Radius */}
                              <div>
                                <h4 className="mb-1 text-xs text-gray-400">Affected Radius</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.spatialDistortion.radius.toFixed(
                                      0
                                    )}{' '}
                                    m
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {selectedAnomaly.analysisResults.spatialDistortion.radius > 800
                                      ? 'Vast'
                                      : selectedAnomaly.analysisResults.spatialDistortion.radius >
                                          500
                                        ? 'Large'
                                        : selectedAnomaly.analysisResults.spatialDistortion.radius >
                                            200
                                          ? 'Medium'
                                          : 'Small'}
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                  <div
                                    className="h-full bg-purple-500"
                                    style={{
                                      width: `${Math.min(
                                        (selectedAnomaly.analysisResults.spatialDistortion.radius /
                                          1000) *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {/* Stability */}
                              <div>
                                <h4 className="mb-1 text-xs text-gray-400">Stability</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.spatialDistortion.stability.toFixed(
                                      0
                                    )}
                                    %
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {selectedAnomaly.analysisResults.spatialDistortion.stability >
                                    80
                                      ? 'Very Stable'
                                      : selectedAnomaly.analysisResults.spatialDistortion
                                            .stability > 60
                                        ? 'Stable'
                                        : selectedAnomaly.analysisResults.spatialDistortion
                                              .stability > 40
                                          ? 'Unstable'
                                          : 'Highly Unstable'}
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                  <div
                                    className={`h-full ${
                                      selectedAnomaly.analysisResults.spatialDistortion.stability >
                                      70
                                        ? 'bg-green-500'
                                        : selectedAnomaly.analysisResults.spatialDistortion
                                              .stability > 40
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        selectedAnomaly.analysisResults.spatialDistortion.stability,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {/* Fluctuation Rate */}
                              <div>
                                <h4 className="mb-1 text-xs text-gray-400">Fluctuation Rate</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.spatialDistortion.fluctuationRate.toFixed(
                                      2
                                    )}{' '}
                                    Hz
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {selectedAnomaly.analysisResults.spatialDistortion
                                      .fluctuationRate > 7
                                      ? 'Rapid'
                                      : selectedAnomaly.analysisResults.spatialDistortion
                                            .fluctuationRate > 4
                                        ? 'Moderate'
                                        : selectedAnomaly.analysisResults.spatialDistortion
                                              .fluctuationRate > 2
                                          ? 'Slow'
                                          : 'Very Slow'}
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                  <div
                                    className="h-full bg-indigo-500"
                                    style={{
                                      width: `${Math.min(
                                        (selectedAnomaly.analysisResults.spatialDistortion
                                          .fluctuationRate /
                                          10) *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Biological Impact */}
                    {selectedAnomaly.investigated &&
                      selectedAnomaly.analysisResults?.biologicalImpact && (
                        <div className="overflow-hidden rounded-lg bg-gray-800">
                          <div className="p-3">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4 text-red-400" />
                              <span className="text-sm font-medium text-white">
                                Biological Impact
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-gray-700 p-3">
                            <div className="grid grid-cols-2 gap-4">
                              {/* Toxicity */}
                              <div>
                                <h4 className="mb-1 text-xs text-gray-400">Toxicity</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.biologicalImpact.toxicity.toFixed(
                                      1
                                    )}{' '}
                                    / 10
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {selectedAnomaly.analysisResults.biologicalImpact.toxicity > 7
                                      ? 'Lethal'
                                      : selectedAnomaly.analysisResults.biologicalImpact.toxicity >
                                          5
                                        ? 'Severe'
                                        : selectedAnomaly.analysisResults.biologicalImpact
                                              .toxicity > 3
                                          ? 'Moderate'
                                          : 'Low'}
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                  <div
                                    className={`h-full ${
                                      selectedAnomaly.analysisResults.biologicalImpact.toxicity > 7
                                        ? 'bg-red-500'
                                        : selectedAnomaly.analysisResults.biologicalImpact
                                              .toxicity > 4
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        (selectedAnomaly.analysisResults.biologicalImpact.toxicity /
                                          10) *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {/* Mutagenic Potential */}
                              <div>
                                <h4 className="mb-1 text-xs text-gray-400">Mutagenic Potential</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.biologicalImpact.mutagenicPotential.toFixed(
                                      1
                                    )}{' '}
                                    / 10
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {selectedAnomaly.analysisResults.biologicalImpact
                                      .mutagenicPotential > 7
                                      ? 'Extreme'
                                      : selectedAnomaly.analysisResults.biologicalImpact
                                            .mutagenicPotential > 5
                                        ? 'High'
                                        : selectedAnomaly.analysisResults.biologicalImpact
                                              .mutagenicPotential > 3
                                          ? 'Moderate'
                                          : 'Low'}
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                  <div
                                    className={`h-full ${
                                      selectedAnomaly.analysisResults.biologicalImpact
                                        .mutagenicPotential > 7
                                        ? 'bg-purple-500'
                                        : selectedAnomaly.analysisResults.biologicalImpact
                                              .mutagenicPotential > 4
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        (selectedAnomaly.analysisResults.biologicalImpact
                                          .mutagenicPotential /
                                          10) *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {/* Biocompatibility */}
                              <div>
                                <h4 className="mb-1 text-xs text-gray-400">Biocompatibility</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.biologicalImpact.biocompatibility.toFixed(
                                      0
                                    )}
                                    %
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {selectedAnomaly.analysisResults.biologicalImpact
                                      .biocompatibility > 80
                                      ? 'Excellent'
                                      : selectedAnomaly.analysisResults.biologicalImpact
                                            .biocompatibility > 60
                                        ? 'Good'
                                        : selectedAnomaly.analysisResults.biologicalImpact
                                              .biocompatibility > 40
                                          ? 'Fair'
                                          : 'Poor'}
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                  <div
                                    className={`h-full ${
                                      selectedAnomaly.analysisResults.biologicalImpact
                                        .biocompatibility > 70
                                        ? 'bg-green-500'
                                        : selectedAnomaly.analysisResults.biologicalImpact
                                              .biocompatibility > 40
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        selectedAnomaly.analysisResults.biologicalImpact
                                          .biocompatibility,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {/* Lifeform Detection */}
                              <div>
                                <h4 className="mb-1 text-xs text-gray-400">Lifeform Detection</h4>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className={`h-3 w-3 rounded-full ${
                                      selectedAnomaly.analysisResults.biologicalImpact
                                        .lifeformDetection
                                        ? 'bg-green-500'
                                        : 'bg-red-500'
                                    }`}
                                  ></div>
                                  <span className="text-sm text-white">
                                    {selectedAnomaly.analysisResults.biologicalImpact
                                      .lifeformDetection
                                      ? 'Detected'
                                      : 'Not Detected'}
                                  </span>
                                </div>
                                {selectedAnomaly.analysisResults.biologicalImpact
                                  .lifeformDetection && (
                                  <p className="mt-1 text-xs text-gray-400">
                                    Further analysis recommended to identify lifeform type and
                                    characteristics.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Not investigated message */}
                    {!selectedAnomaly.investigated && (
                      <div className="flex flex-col items-center justify-center rounded-lg bg-gray-800 p-6 text-center">
                        <Microscope className="mb-3 h-10 w-10 text-gray-500" />
                        <h3 className="mb-2 text-lg font-medium text-white">
                          Detailed Analysis Unavailable
                        </h3>
                        <p className="mb-4 text-sm text-gray-400">
                          This anomaly has not been investigated yet. Begin analysis to access
                          detailed information.
                        </p>
                        <button
                          onClick={() => handleInvestigate(selectedAnomaly.id)}
                          className="rounded bg-blue-700 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                        >
                          Begin Analysis
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Research tab will be implemented in the next step */}
                {activeTab === ResourceType.RESEARCH && (
                  <div className="p-4 text-white">
                    Research tab content will be implemented in the next step
                  </div>
                )}

                {/* Exploitation tab will be implemented in the next step */}
                {activeTab === 'exploitation' && (
                  <div className="p-4 text-white">
                    Exploitation tab content will be implemented in the next step
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <AlertTriangle className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg">Select an anomaly to view details</p>
              <p className="mt-2 text-sm">
                {filteredAndSortedAnomalies.length === 0
                  ? 'No anomalies match the current filter'
                  : `${filteredAndSortedAnomalies.length} anomalies available`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
