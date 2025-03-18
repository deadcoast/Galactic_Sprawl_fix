import * as React from 'react';
import './ConverterDetailsView.css';

// Define the interfaces for the component
interface ConverterDetail {
  id: string;
  name: string;
  type: ResourceType;
  tier: number;
  status: 'active' | 'inactive' | 'error';
  efficiency: number;
  utilization: number;
  energyUse: number;
  energyCapacity: number;
  uptime: number; // in seconds
}

interface ConversionProcessDetail {
  processId: string;
  recipeId: string;
  progress: number;
  startTime: number;
  estimatedEndTime: number;
  status: 'in-progress' | 'completed' | 'failed' | 'paused';
}

interface RecipeDetail {
  id: string;
  name: string;
  baseEfficiency: number;
  inputs: Array<{
    type: string;
    amount: number;
  }>;
  outputs: Array<{
    type: string;
    amount: number;
  }>;
  byproducts?: Array<{
    type: string;
    amount: number;
  }>;
}

interface EfficiencyFactors {
  base: number;
  quality: number;
  tech: number;
  environmental: number;
  applied: number;
}

interface ConverterDetailsViewProps {
  converter: ConverterDetail;
  activeProcesses: ConversionProcessDetail[];
  availableRecipes: RecipeDetail[];
  efficiencyFactors: EfficiencyFactors;
  onStartProcess: (recipeId: string) => void;
  onPauseProcess: (processId: string) => void;
  onStopProcess: (processId: string) => void;
  onBack: () => void;
}

/**
 * ConverterDetailsView - Detailed view of a single converter
 *
 * Shows all stats, active processes, available recipes, and efficiency factors
 * for a specific converter with controls to start, pause, and stop processes.
 */
const ConverterDetailsView: React.FC<ConverterDetailsViewProps> = ({
  converter,
  activeProcesses,
  availableRecipes,
  efficiencyFactors,
  onStartProcess,
  onPauseProcess,
  onStopProcess,
  onBack,
}) => {
  // Format uptime as hours and minutes
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Format recipe name to be more readable
  const formatRecipeName = (name: string): string => {
    return name.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="converter-details">
      <div className="details-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Converter: {converter.name}</h1>
      </div>

      <div className="details-grid">
        {/* Converter Status Section */}
        <div className="status-section section">
          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">Status</div>
              <div className={`status-value ${converter.status}`}>
                {converter.status.charAt(0).toUpperCase() + converter.status.slice(1)}
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Tier</div>
              <div className="status-value">{converter.tier}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Efficiency</div>
              <div className="status-value">{(converter.efficiency * 100).toFixed(0)}%</div>
            </div>
            <div className="status-item">
              <div className="status-label">Utilization</div>
              <div className="status-value">{(converter.utilization * 100).toFixed(0)}%</div>
            </div>
            <div className="status-item">
              <div className="status-label">Energy</div>
              <div className="status-value">
                {converter.energyUse}kW/{converter.energyCapacity}kW
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Uptime</div>
              <div className="status-value">{formatUptime(converter.uptime)}</div>
            </div>
          </div>
        </div>

        {/* Active Processes Section */}
        <div className="processes-section section">
          <h2>Active Conversion Processes</h2>
          {activeProcesses.length > 0 ? (
            <div className="processes-list">
              {activeProcesses.map(process => (
                <div key={process.processId} className={`process-item ${process.status}`}>
                  <div className="process-info">
                    <div className="process-id">#{process.processId.split('-')[0]}</div>
                    <div className="process-name">{formatRecipeName(process.recipeId)}</div>
                    <div className="process-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${process.progress * 100}%` }}
                        />
                      </div>
                      <div className="progress-text">
                        {(process.progress * 100).toFixed(0)}% complete
                      </div>
                    </div>
                  </div>
                  <div className="process-controls">
                    {process.status === 'in-progress' && (
                      <button
                        className="pause-button"
                        onClick={() => onPauseProcess(process.processId)}
                      >
                        PAUSE
                      </button>
                    )}
                    {process.status === 'paused' && (
                      <button
                        className="resume-button"
                        onClick={() => onStartProcess(process.recipeId)}
                      >
                        RESUME
                      </button>
                    )}
                    <button
                      className="stop-button"
                      onClick={() => onStopProcess(process.processId)}
                    >
                      STOP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-processes">
              No active processes. Start a new process from the recipes below.
            </div>
          )}
        </div>

        {/* Available Recipes Section */}
        <div className="recipes-section section">
          <h2>Available Recipes</h2>
          <div className="recipes-list">
            {availableRecipes.map(recipe => (
              <div key={recipe.id} className="recipe-item">
                <div className="recipe-info">
                  <div className="recipe-name">{formatRecipeName(recipe.name)}</div>
                  <div className="recipe-details">
                    <div className="recipe-efficiency">
                      Base Eff: {recipe.baseEfficiency.toFixed(2)}
                    </div>
                    <div className="recipe-inputs">
                      Inputs:{' '}
                      {recipe.inputs.map(input => `${input.amount} ${input.type}`).join(', ')}
                    </div>
                    <div className="recipe-outputs">
                      Outputs:{' '}
                      {recipe.outputs.map(output => `${output.amount} ${output.type}`).join(', ')}
                    </div>
                    {recipe.byproducts && recipe.byproducts.length > 0 && (
                      <div className="recipe-byproducts">
                        Byproducts:{' '}
                        {recipe.byproducts.map(bp => `${bp.amount} ${bp.type}`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <button className="start-button" onClick={() => onStartProcess(recipe.id)}>
                  START
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency Factors Section */}
        <div className="efficiency-section section">
          <h2>Efficiency Factors</h2>
          <div className="efficiency-factors">
            <div className="factor-item">
              <div className="factor-label">Base Efficiency:</div>
              <div className="factor-value">{efficiencyFactors.base.toFixed(2)}</div>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{ width: `${Math.min(efficiencyFactors.base * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="factor-item">
              <div className="factor-label">Quality Modifier:</div>
              <div className="factor-value">{efficiencyFactors.quality.toFixed(2)}</div>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{ width: `${Math.min(efficiencyFactors.quality * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="factor-item">
              <div className="factor-label">Technology Modifier:</div>
              <div className="factor-value">{efficiencyFactors.tech.toFixed(2)}</div>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{ width: `${Math.min(efficiencyFactors.tech * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="factor-item">
              <div className="factor-label">Environmental Modifier:</div>
              <div className="factor-value">{efficiencyFactors.environmental.toFixed(2)}</div>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{ width: `${Math.min(efficiencyFactors.environmental * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="factor-item total">
              <div className="factor-label">Applied Efficiency:</div>
              <div className="factor-value">{efficiencyFactors.applied.toFixed(2)}</div>
              <div className="factor-formula">
                ({efficiencyFactors.base.toFixed(2)} × {efficiencyFactors.quality.toFixed(2)} ×{' '}
                {efficiencyFactors.tech.toFixed(2)} × {efficiencyFactors.environmental.toFixed(2)})
              </div>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{ width: `${Math.min(efficiencyFactors.applied * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConverterDetailsView;
