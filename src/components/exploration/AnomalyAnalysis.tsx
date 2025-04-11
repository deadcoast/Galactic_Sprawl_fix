import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  FileText,
  MapIcon,
  Microscope,
  Zap,
} from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

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
  };
  images?: string[];
}

interface AnomalyAnalysisProps {
  anomalies: Anomaly[];
  onInvestigate: (anomalyId: string) => void;
  onAnalysisComplete: (anomalyId: string, results: Anomaly['analysisResults']) => void;
  className?: string;
}

export function AnomalyAnalysis({
  anomalies,
  onInvestigate,
  onAnalysisComplete,
  className = '',
}: AnomalyAnalysisProps) {
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'type'>('severity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | 'investigated' | 'uninvestigated'>('all');
  const [analysisInProgress, setAnalysisInProgress] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Sort and filter anomalies
  const sortedAnomalies = React.useMemo(() => {
    let filtered = [...anomalies];

    // Apply filter
    if (filter === 'investigated') {
      filtered = filtered.filter(a => a.investigated);
    } else if (filter === 'uninvestigated') {
      filtered = filtered.filter(a => !a.investigated);
    }

    // Apply sort
    return filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = a.discoveryDate - b.discoveryDate;
      } else if (sortBy === 'severity') {
        const severityValue = { low: 1, medium: 2, high: 3 };
        comparison = severityValue[a.severity] - severityValue[b.severity];
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [anomalies, sortBy, sortOrder, filter]);

  // Get the selected anomaly
  const selectedAnomaly = React.useMemo(() => {
    return anomalies.find(a => a.id === selectedAnomalyId) || null;
  }, [anomalies, selectedAnomalyId]);

  // Handle sort change
  const handleSortChange = (newSortBy: 'date' | 'severity' | 'type') => {
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
        } else if (anomaly.type === 'signal') {
          results.energySignature = `${Math.random() * 100 + 50} THz`;
          results.origin = Math.random() > 0.5 ? 'Deep space' : 'Nearby star system';
          results.potentialUses = ['Communication', 'Navigation'];
          results.dangerLevel = Math.random() * 5;
        } else if (anomaly.type === 'phenomenon') {
          results.energySignature = `${Math.random() * 1000 + 100} PJ`;
          results.composition = ['Energy fluctuations', 'Spatial distortions'];
          results.potentialUses = ['Energy harvesting', 'Spatial research'];
          results.dangerLevel = Math.random() * 8 + 2;
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
          <h2 className="text-lg font-bold text-white">Anomaly Analysis</h2>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as 'all' | 'investigated' | 'uninvestigated')}
            className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-300"
          >
            <option value="all">All Anomalies</option>
            <option value="investigated">Investigated</option>
            <option value="uninvestigated">Uninvestigated</option>
          </select>
        </div>
      </div>

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
          </div>

          {/* Anomaly items */}
          <div className="divide-y divide-gray-700">
            {sortedAnomalies.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No anomalies found matching the current filter.
              </div>
            ) : (
              sortedAnomalies.map(anomaly => (
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
              </div>

              {/* Coordinates */}
              <div className="mb-4 rounded-lg bg-gray-800 p-3">
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
              <div className="mb-4 overflow-hidden rounded-lg bg-gray-800">
                <div
                  className="flex cursor-pointer items-center justify-between p-3"
                  onClick={() => toggleSection('analysis')}
                >
                  <div className="flex items-center space-x-2">
                    <Microscope className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">Analysis</span>
                  </div>
                  {expandedSections['analysis'] ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {expandedSections['analysis'] && (
                  <div className="border-t border-gray-700 p-3 pt-0">
                    {selectedAnomaly.investigated ? (
                      <div className="space-y-3">
                        {selectedAnomaly.analysisResults?.composition && (
                          <div>
                            <h4 className="mb-1 text-xs text-gray-400">Composition</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedAnomaly.analysisResults.composition.map((item, index) => (
                                <span
                                  key={index}
                                  className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300"
                                >
                                  {item}
                                </span>
                              ))}
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
                              {selectedAnomaly.analysisResults.potentialUses.map((use, index) => (
                                <span
                                  key={index}
                                  className="rounded bg-blue-900/30 px-2 py-0.5 text-xs text-blue-300"
                                >
                                  {use}
                                </span>
                              ))}
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
              <div className="mb-4 overflow-hidden rounded-lg bg-gray-800">
                <div
                  className="flex cursor-pointer items-center justify-between p-3"
                  onClick={() => toggleSection('visuals')}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-white">Visual Data</span>
                  </div>
                  {expandedSections['visuals'] ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {expandedSections['visuals'] && (
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
                  {expandedSections['recommendations'] ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {expandedSections['recommendations'] && (
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
                                Deploy signal amplifiers to enhance and decode the transmission.
                              </p>
                            </div>
                            <div className="flex items-start space-x-2">
                              <div className="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-green-500"></div>
                              <p className="text-sm text-gray-300">
                                Establish a monitoring station to track signal changes over time.
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
                                Maintain safe distance until phenomenon stability can be determined.
                              </p>
                            </div>
                          </>
                        )}

                        <div className="flex items-start space-x-2">
                          <div className="mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-purple-500"></div>
                          <p className="text-sm text-gray-300">
                            Allocate resources for further investigation and potential exploitation.
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
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <AlertTriangle className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg">Select an anomaly to view details</p>
              <p className="mt-2 text-sm">
                {sortedAnomalies.length === 0
                  ? 'No anomalies match the current filter'
                  : `${sortedAnomalies.length} anomalies available`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
