import * as React from "react";
import { useEffect, useState } from 'react';
import { FleetFormation } from '../../../types/combat/CombatTypes';
import { FormationVisualizer } from './FormationVisualizer';

interface FormationEditorProps {
  initialFormation: FleetFormation;
  onSaveFormation: (formation: FleetFormation) => void;
}

/**
 * FormationEditor - Component for creating and editing custom formations
 */
export function FormationEditor({ initialFormation, onSaveFormation }: FormationEditorProps) {
  const [formation, setFormation] = useState<FleetFormation>(initialFormation);

  // Update the formation state when initialFormation changes
  useEffect(() => {
    setFormation(initialFormation);
  }, [initialFormation]);

  // Handler for changing formation type
  const handleTypeChange = (type: 'offensive' | 'defensive' | 'balanced') => {
    setFormation(prev => ({
      ...prev,
      type,
    }));
  };

  // Handler for changing formation pattern
  const handlePatternChange = (pattern: FleetFormation['pattern']) => {
    setFormation(prev => ({
      ...prev,
      pattern,
    }));
  };

  // Handler for changing formation facing angle
  const handleFacingChange = (facing: number) => {
    setFormation(prev => ({
      ...prev,
      facing,
    }));
  };

  // Handler for changing formation spacing
  const handleSpacingChange = (spacing: number) => {
    setFormation(prev => ({
      ...prev,
      spacing,
    }));
  };

  // Handler for changing adaptive spacing option
  const handleAdaptiveSpacingChange = (adaptiveSpacing: boolean) => {
    setFormation(prev => ({
      ...prev,
      adaptiveSpacing,
    }));
  };

  // Handler for changing transition speed
  const handleTransitionSpeedChange = (transitionSpeed: number) => {
    setFormation(prev => ({
      ...prev,
      transitionSpeed,
    }));
  };

  // Handler for saving the formation
  const handleSave = () => {
    onSaveFormation(formation);
  };

  return (
    <div className="space-y-6">
      {/* Formation Visualizer */}
      <div className="mb-6 flex justify-center">
        <FormationVisualizer
          pattern={formation.pattern}
          type={formation.type}
          facing={formation.facing}
          spacing={formation.spacing}
          width={300}
          height={180}
        />
      </div>

      {/* Formation Type Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Formation Type</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange('offensive')}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              formation.type === 'offensive'
                ? 'border border-red-500/40 bg-red-500/20 text-white'
                : 'border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Offensive
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('defensive')}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              formation.type === 'defensive'
                ? 'border border-blue-500/40 bg-blue-500/20 text-white'
                : 'border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Defensive
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('balanced')}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              formation.type === 'balanced'
                ? 'border border-purple-500/40 bg-purple-500/20 text-white'
                : 'border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Balanced
          </button>
        </div>
      </div>

      {/* Formation Pattern Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Formation Pattern</label>
        <div className="grid grid-cols-4 gap-2">
          {['spearhead', 'shield', 'diamond', 'arrow', 'circle', 'wedge', 'line', 'scattered'].map(
            pattern => (
              <button
                key={pattern}
                type="button"
                onClick={() => handlePatternChange(pattern as FleetFormation['pattern'])}
                className={`rounded p-2 text-xs font-medium capitalize transition-colors ${
                  formation.pattern === pattern
                    ? 'border border-gray-500 bg-gray-600 text-white'
                    : 'border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {pattern}
              </button>
            )
          )}
        </div>
      </div>

      {/* Spacing Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-300">Spacing</label>
          <span className="text-sm text-gray-400">{formation.spacing}px</span>
        </div>
        <input
          type="range"
          min="50"
          max="250"
          step="10"
          value={formation.spacing}
          onChange={e => handleSpacingChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700"
        />
      </div>

      {/* Facing Angle Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-300">Facing Angle</label>
          <span className="text-sm text-gray-400">
            {Math.round(formation.facing * (180 / Math.PI))}°
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={Math.PI * 2}
          step="0.1"
          value={formation.facing}
          onChange={e => handleFacingChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700"
        />
      </div>

      {/* Transition Speed Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-300">Transition Speed</label>
          <span className="text-sm text-gray-400">{formation.transitionSpeed.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={formation.transitionSpeed}
          onChange={e => handleTransitionSpeedChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700"
        />
      </div>

      {/* Adaptive Spacing Toggle */}
      <div className="flex items-center">
        <input
          id="adaptive-spacing"
          type="checkbox"
          checked={formation.adaptiveSpacing}
          onChange={e => handleAdaptiveSpacingChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-opacity-25"
        />
        <label htmlFor="adaptive-spacing" className="ml-2 text-sm font-medium text-gray-300">
          Adaptive Spacing
        </label>
        <div className="ml-2 text-xs text-gray-500">
          (Automatically adjusts ship spacing based on unit count)
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500"
        >
          Apply Formation
        </button>
      </div>
    </div>
  );
}
