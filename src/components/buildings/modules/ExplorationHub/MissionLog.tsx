import { AlertTriangle, Award, BarChart2, Filter, Play, Search, X } from 'lucide-react';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { ResourceType } from '../../../../types/resources/ResourceTypes';
import { MissionReplay } from './MissionReplay';

interface MissionEntry {
  id: string;
  timestamp: number;
  type: 'discovery' | 'anomaly' | 'completion';
  description: string;
  sector: string;
  importance: 'low' | 'medium' | 'high';
  shipId?: string;
  xpGained?: number;
  resourcesFound?: {
    type: ResourceType;
    amount: number;
  }[];
  anomalyDetails?: {
    type: ResourceType;
    severity: string;
    investigated: boolean;
  };
}

const mockEntries: MissionEntry[] = [
  {
    id: 'mission-1',
    timestamp: Date.now() - 3600000,
    type: 'discovery',
    description: 'New habitable planet discovered in Alpha Sector',
    sector: 'Alpha Sector',
    importance: 'high',
  },
  {
    id: 'mission-2',
    timestamp: Date.now() - 7200000,
    type: 'anomaly',
    description: 'Strange energy signatures detected',
    sector: 'Beta Sector',
    importance: 'medium',
  },
  {
    id: 'mission-3',
    timestamp: Date.now() - 10800000,
    type: 'completion',
    description: 'Sector mapping completed',
    sector: 'Gamma Sector',
    importance: 'low',
  },
];

interface MissionLogProps {
  onClose: () => void;
}

export function MissionLog({ onClose }: MissionLogProps) {
  const [filter, setFilter] = React.useState<'all' | 'discoveries' | 'anomalies' | 'completions'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showStats, setShowStats] = React.useState(false);
  const [timeRange, setTimeRange] = React.useState<'day' | 'week' | 'month'>('day');
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = Date.now();
    const timeLimit = {
      day: now - 24 * 60 * 60 * 1000,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
    }[timeRange];

    const relevantEntries = mockEntries.filter(entry => entry.timestamp >= timeLimit);

    return {
      totalMissions: relevantEntries.length,
      discoveries: relevantEntries.filter(e => e.type === 'discovery').length,
      anomalies: relevantEntries.filter(e => e.type === 'anomaly').length,
      completions: relevantEntries.filter(e => e.type === 'completion').length,
      totalXP: relevantEntries.reduce((sum, entry) => sum + (entry.xpGained ?? 0), 0),
      resourcesFound: relevantEntries.reduce(
        (sum, entry) => sum + (entry.resourcesFound?.reduce((r, res) => r + res.amount, 0) ?? 0),
        0
      ),
      highPriority: relevantEntries.filter(e => e.importance === 'high').length,
    };
  }, [timeRange, mockEntries]);

  const filteredEntries = mockEntries.filter(entry => {
    if (searchQuery && !entry.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter === 'discoveries' && entry.type !== 'discovery') {
      return false;
    }
    if (filter === 'anomalies' && entry.type !== 'anomaly') {
      return false;
    }
    if (filter === 'completions' && entry.type !== 'completion') {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Mission Log</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="rounded-lg p-2 transition-colors hover:bg-gray-800"
            >
              <BarChart2 className="h-5 w-5 text-teal-400" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && (
          <div className="mb-6 rounded-lg bg-gray-800/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-300">Mission Statistics</h3>
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value as 'day' | 'week' | 'month')}
                className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg bg-gray-800 p-3">
                <div className="mb-1 text-sm text-gray-400">Total Missions</div>
                <div className="text-xl font-medium text-white">{stats.totalMissions}</div>
              </div>
              <div className="rounded-lg bg-gray-800 p-3">
                <div className="mb-1 text-sm text-gray-400">Discoveries</div>
                <div className="text-xl font-medium text-green-400">{stats.discoveries}</div>
              </div>
              <div className="rounded-lg bg-gray-800 p-3">
                <div className="mb-1 text-sm text-gray-400">Anomalies</div>
                <div className="text-xl font-medium text-yellow-400">{stats.anomalies}</div>
              </div>
              <div className="rounded-lg bg-gray-800 p-3">
                <div className="mb-1 text-sm text-gray-400">High Priority</div>
                <div className="text-xl font-medium text-red-400">{stats.highPriority}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-800 p-3">
                <div className="mb-1 text-sm text-gray-400">Total XP Gained</div>
                <div className="text-xl font-medium text-teal-400">
                  {stats.totalXP.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg bg-gray-800 p-3">
                <div className="mb-1 text-sm text-gray-400">Resources Found</div>
                <div className="text-xl font-medium text-blue-400">
                  {stats.resourcesFound.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search mission logs..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute top-2.5 right-3 h-5 w-5 text-gray-400" />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={e =>
                setFilter(e.target.value as 'all' | 'discoveries' | 'anomalies' | 'completions')
              }
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="all">All Entries</option>
              <option value="discoveries">Discoveries</option>
              <option value="anomalies">Anomalies</option>
              <option value="completions">Completions</option>
            </select>
          </div>
        </div>

        {/* Enhanced Mission Entries */}
        <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
          {filteredEntries.map(entry => (
            <div
              key={entry.id}
              className={`rounded-lg p-4 ${
                entry.importance === 'high'
                  ? 'border border-red-700/30 bg-red-900/20'
                  : entry.importance === 'medium'
                    ? 'border border-yellow-700/30 bg-yellow-900/20'
                    : 'border border-blue-700/30 bg-blue-900/20'
              }`}
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="font-medium text-white">{entry.description}</div>
                  <div className="text-sm text-gray-400">{entry.sector}</div>
                  {entry.xpGained && (
                    <div className="mt-1 flex items-center text-sm text-teal-400">
                      <Award className="mr-1 h-4 w-4" />
                      <span>+{entry.xpGained} XP</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedMissionId(entry.id)}
                    className="rounded p-1 transition-colors hover:bg-gray-800"
                    title="Replay Mission"
                  >
                    <Play className="h-4 w-4 text-teal-400" />
                  </button>
                  <div className="text-sm text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              {entry.resourcesFound && entry.resourcesFound.length > 0 && (
                <div className="mt-2 space-y-1">
                  {entry.resourcesFound.map((resource, idx) => (
                    <div key={idx} className="text-sm text-blue-400">
                      Found {resource.amount} {resource.type}
                    </div>
                  ))}
                </div>
              )}
              {entry.anomalyDetails && (
                <div className="mt-2 text-sm">
                  <span className="text-yellow-400">
                    {entry.anomalyDetails.type} Anomaly ({entry.anomalyDetails.severity})
                  </span>
                  {entry.anomalyDetails.investigated && (
                    <span className="ml-2 text-green-400">• Investigated</span>
                  )}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-sm">
                <div
                  className={`rounded px-2 py-0.5 ${
                    entry.type === 'discovery'
                      ? 'bg-green-900/50 text-green-400'
                      : entry.type === 'anomaly'
                        ? 'bg-yellow-900/50 text-yellow-400'
                        : 'bg-blue-900/50 text-blue-400'
                  }`}
                >
                  {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                </div>
                {entry.importance === 'high' && (
                  <div className="flex items-center text-red-400">
                    <AlertTriangle className="mr-1 h-4 w-4" />
                    <span>High Priority</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission Replay Modal */}
      {selectedMissionId && (
        <MissionReplay missionId={selectedMissionId} onClose={() => setSelectedMissionId(null)} />
      )}
    </div>
  );
}
