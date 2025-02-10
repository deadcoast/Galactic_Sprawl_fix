import React from 'react';
import { X, AlertTriangle, Search, Filter } from 'lucide-react';

interface MissionEntry {
  id: string;
  timestamp: number;
  type: 'discovery' | 'anomaly' | 'completion';
  description: string;
  sector: string;
  importance: 'low' | 'medium' | 'high';
}

const mockEntries: MissionEntry[] = [
  {
    id: 'mission-1',
    timestamp: Date.now() - 3600000,
    type: 'discovery',
    description: 'New habitable planet discovered in Alpha Sector',
    sector: 'Alpha Sector',
    importance: 'high'
  },
  {
    id: 'mission-2',
    timestamp: Date.now() - 7200000,
    type: 'anomaly',
    description: 'Strange energy signatures detected',
    sector: 'Beta Sector',
    importance: 'medium'
  },
  {
    id: 'mission-3',
    timestamp: Date.now() - 10800000,
    type: 'completion',
    description: 'Sector mapping completed',
    sector: 'Gamma Sector',
    importance: 'low'
  }
];

interface MissionLogProps {
  onClose: () => void;
}

export function MissionLog({ onClose }: MissionLogProps) {
  const [filter, setFilter] = React.useState<'all' | 'discoveries' | 'anomalies' | 'completions'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

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
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search mission logs..."
              className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Entries</option>
            <option value="discoveries">Discoveries</option>
            <option value="anomalies">Anomalies</option>
            <option value="completions">Completions</option>
          </select>
        </div>

        {/* Mission Entries */}
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
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className={`px-2 py-0.5 rounded ${
                  entry.type === 'discovery'
                    ? 'bg-green-900/50 text-green-400'
                    : entry.type === 'anomaly'
                    ? 'bg-yellow-900/50 text-yellow-400'
                    : 'bg-blue-900/50 text-blue-400'
                }`}>
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
    </div>
  );
}