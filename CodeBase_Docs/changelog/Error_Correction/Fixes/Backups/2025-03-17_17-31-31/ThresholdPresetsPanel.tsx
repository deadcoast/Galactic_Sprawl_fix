/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { motion } from 'framer-motion';
import { Clock, Plus, Save, Trash2 } from 'lucide-react';
import * as React from "react";
import type { ThresholdHistoryEntry, ThresholdPreset } from '../../../../contexts/ThresholdContext';
import { useThreshold } from '../../../../contexts/ThresholdContext';

interface ThresholdPresetsPanelProps {
  onClose: () => void;
}

export function ThresholdPresetsPanel({ onClose }: ThresholdPresetsPanelProps) {
  const { state, dispatch } = useThreshold();
  const [activeTab, setActiveTab] = React.useState<'presets' | 'history'>('presets');
  const [newPresetName, setNewPresetName] = React.useState('');
  const [newPresetDescription, setNewPresetDescription] = React.useState('');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-gray-800 p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('presets')}
              className={`rounded px-4 py-2 ${
                activeTab === 'presets' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`rounded px-4 py-2 ${
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
              <div className="rounded-lg bg-gray-700 p-4">
                <h3 className="mb-4 text-lg font-semibold text-white">Create New Preset</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm text-gray-400">Preset Name</label>
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={e => setNewPresetName(e.target.value)}
                      className="w-full rounded bg-gray-600 px-3 py-2 text-white"
                      placeholder="Enter preset name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-400">Description</label>
                    <textarea
                      value={newPresetDescription}
                      onChange={e => setNewPresetDescription(e.target.value)}
                      className="w-full rounded bg-gray-600 px-3 py-2 text-white"
                      placeholder="Enter preset description"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={handleCreatePreset}
                    disabled={!newPresetName}
                    className="flex items-center space-x-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className={`rounded-lg bg-gray-700 p-4 ${
                      state.activePresetId === preset.id ? 'border-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">{preset.name}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApplyPreset(preset.id)}
                          className="rounded p-2 hover:bg-gray-600"
                          title="Apply Preset"
                        >
                          <Save size={16} className="text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleRemovePreset(preset.id)}
                          className="rounded p-2 hover:bg-gray-600"
                          title="Delete Preset"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{preset.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {state.history.map((entry, index) => (
                <div key={`${entry.timestamp}-${index}`} className="rounded-lg bg-gray-700 p-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock size={14} />
                    <span>{formatTimestamp(entry.timestamp)}</span>
                  </div>
                  <p className="mt-1 text-white">{getEventDescription(entry)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
