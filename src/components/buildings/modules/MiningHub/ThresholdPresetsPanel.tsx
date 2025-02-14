import { useThreshold } from '../../../../contexts/ThresholdContext';
import { motion } from 'framer-motion';
import { Clock, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ThresholdHistoryEntry, ThresholdPreset } from '../../../../contexts/ThresholdContext';

interface ThresholdPresetsPanelProps {
  onClose: () => void;
}

export function ThresholdPresetsPanel({ onClose }: ThresholdPresetsPanelProps) {
  const { state, dispatch } = useThreshold();
  const [activeTab, setActiveTab] = useState<'presets' | 'history'>('presets');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');

  const handleCreatePreset = () => {
    if (!newPresetName) {
      return;
    }

    const newPreset: ThresholdPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName,
      description: newPresetDescription,
      thresholds: Object.fromEntries(
        Object.entries(state.resources).map(([id, resource]) => [id, { ...resource.thresholds }])
      ),
      autoMineStates: Object.fromEntries(
        Object.entries(state.resources).map(([id, resource]) => [id, resource.autoMine])
      ),
    };

    dispatch({ type: 'ADD_PRESET', payload: newPreset });
    setNewPresetName('');
    setNewPresetDescription('');
  };

  const handleApplyPreset = (presetId: string) => {
    dispatch({ type: 'APPLY_PRESET', payload: { presetId } });
  };

  const handleRemovePreset = (presetId: string) => {
    dispatch({ type: 'REMOVE_PRESET', payload: { presetId } });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventDescription = (entry: ThresholdHistoryEntry) => {
    const resource = state.resources[entry.resourceId];
    if (!resource) {
      return '';
    }

    switch (entry.event) {
      case 'threshold_change':
        return `${resource.name} thresholds updated to min: ${entry.thresholds.min}, max: ${entry.thresholds.max}`;
      case 'amount_update':
        return `${resource.name} amount changed to ${entry.amount}`;
      case 'auto_mine_toggle':
        return `${resource.name} auto-mining ${entry.amount ? 'enabled' : 'disabled'}`;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-4 py-2 rounded ${
                activeTab === 'presets' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded ${
                activeTab === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              History
            </button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'presets' ? (
            <div className="space-y-4">
              {/* Create New Preset */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Create New Preset</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Preset Name</label>
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={e => setNewPresetName(e.target.value)}
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                      placeholder="Enter preset name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <textarea
                      value={newPresetDescription}
                      onChange={e => setNewPresetDescription(e.target.value)}
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                      placeholder="Enter preset description"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={handleCreatePreset}
                    disabled={!newPresetName}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                    <span>Create Preset</span>
                  </button>
                </div>
              </div>

              {/* Preset List */}
              <div className="space-y-4">
                {state.presets.map(preset => (
                  <div
                    key={preset.id}
                    className={`bg-gray-700 rounded-lg p-4 ${
                      state.activePresetId === preset.id ? 'border-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{preset.name}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApplyPreset(preset.id)}
                          className="p-2 hover:bg-gray-600 rounded"
                          title="Apply Preset"
                        >
                          <Save size={16} className="text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleRemovePreset(preset.id)}
                          className="p-2 hover:bg-gray-600 rounded"
                          title="Delete Preset"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">{preset.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {state.history.map((entry, index) => (
                <div key={`${entry.timestamp}-${index}`} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock size={14} />
                    <span>{formatTimestamp(entry.timestamp)}</span>
                  </div>
                  <p className="text-white mt-1">{getEventDescription(entry)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
