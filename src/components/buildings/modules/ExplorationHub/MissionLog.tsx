import { AlertTriangle, Filter, Search, X, BarChart2, Clock, Award, Play } from 'lucide-react';
import React, { useMemo, useState } from 'react';
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
    type: string;
    amount: number;
  }[];
  anomalyDetails?: {
    type: string;
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
      totalXP: relevantEntries.reduce((sum, entry) => sum + (entry.xpGained || 0), 0),
      resourcesFound: relevantEntries.reduce((sum, entry) => 
        sum + (entry.resourcesFound?.reduce((r, res) => r + res.amount, 0) || 0), 0),
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Mission Log</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <BarChart2 className="w-5 h-5 text-teal-400" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && (
          <div className="mb-6 bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Mission Statistics</h3>
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value as 'day' | 'week' | 'month')}
                className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-white text-sm"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Total Missions</div>
                <div className="text-xl font-medium text-white">{stats.totalMissions}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Discoveries</div>
                <div className="text-xl font-medium text-green-400">{stats.discoveries}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Anomalies</div>
                <div className="text-xl font-medium text-yellow-400">{stats.anomalies}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">High Priority</div>
                <div className="text-xl font-medium text-red-400">{stats.highPriority}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Total XP Gained</div>
                <div className="text-xl font-medium text-teal-400">{stats.totalXP.toLocaleString()}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Resources Found</div>
                <div className="text-xl font-medium text-blue-400">{stats.resourcesFound.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search mission logs..."
              className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={e =>
                setFilter(e.target.value as 'all' | 'discoveries' | 'anomalies' | 'completions')
              }
              className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Entries</option>
              <option value="discoveries">Discoveries</option>
              <option value="anomalies">Anomalies</option>
              <option value="completions">Completions</option>
            </select>
          </div>
        </div>

        {/* Enhanced Mission Entries */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {filteredEntries.map(entry => (
            <div
              key={entry.id}
              className={`p-4 rounded-lg ${
                entry.importance === 'high'
                  ? 'bg-red-900/20 border border-red-700/30'
                  : entry.importance === 'medium'
                    ? 'bg-yellow-900/20 border border-yellow-700/30'
                    : 'bg-blue-900/20 border border-blue-700/30'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-white font-medium">{entry.description}</div>
                  <div className="text-sm text-gray-400">{entry.sector}</div>
                  {entry.xpGained && (
                    <div className="flex items-center text-teal-400 text-sm mt-1">
                      <Award className="w-4 h-4 mr-1" />
                      <span>+{entry.xpGained} XP</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedMissionId(entry.id)}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                    title="Replay Mission"
                  >
                    <Play className="w-4 h-4 text-teal-400" />
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
                    <span className="text-green-400 ml-2">• Investigated</span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between text-sm mt-2">
                <div
                  className={`px-2 py-0.5 rounded ${
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
                    <AlertTriangle className="w-4 h-4 mr-1" />
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
        <MissionReplay
          missionId={selectedMissionId}
          onClose={() => setSelectedMissionId(null)}
        />
      )}
    </div>
  );
}
