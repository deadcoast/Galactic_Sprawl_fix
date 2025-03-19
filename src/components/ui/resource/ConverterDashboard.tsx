import * as React from 'react';
import { useCallback, useState } from 'react';
import { ResourceConversionRecipe } from '../../../types/resources/ResourceTypes';
import { FlowNode } from '../../../types/resources/StandardizedResourceTypes';
import { ResourceType } from './../../../types/resources/ResourceTypes';
import ChainVisualization from './ChainVisualization';
import './ConverterDashboard.css';

// Import the ChainStatus interface from the ChainVisualization component
// Since ChainStatus is not exported from ChainVisualization, we need to redefine it here
// This should match the interface in ChainVisualization.tsx
interface ChainStatus {
  chainId: string;
  currentStepIndex: number;
  recipeIds: string[];
  startTime: number;
  estimatedEndTime: number;
  progress: number;
  stepStatus: Array<{
    recipeId: string;
    converterId: string;
    processId?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
  }>;
  resourceTransfers: Array<{
    type: ResourceType;
    amount: number;
    fromStep: number;
    toStep: number;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  active: boolean;
  paused: boolean;
  completed: boolean;
  failed: boolean;
  errorMessage?: string;
}

// Define the interfaces needed for the dashboard
interface ConverterSummary {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  efficiency: number;
  utilization: number;
  tier: number;
}

interface ConversionProcessSummary {
  processId: string;
  converterId: string;
  recipeId: string;
  progress: number;
  startTime: number;
  estimatedEndTime: number;
  status: 'in-progress' | 'completed' | 'failed' | 'paused';
}

interface ChainStatusSummary {
  chainId: string;
  name: string;
  steps: number;
  currentStep: number;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'paused';
}

interface EfficiencyFactors {
  base: number;
  quality: number;
  tech: number;
  environmental: number;
  applied: number;
}

interface ProductionMetrics {
  totalEfficiency: number;
  throughput: number;
  energyUse: number;
  queuedProcesses: number;
}

// Define the component props
interface ConverterDashboardProps {
  converters: ConverterSummary[];
  activeProcesses: ConversionProcessSummary[];
  activeChains: ChainStatusSummary[];
  metrics: ProductionMetrics;
  efficiencyFactors: EfficiencyFactors;
  // For visualization
  selectedChain?: {
    chain: ChainStatus; // Using the ChainStatus interface instead of any
    converters: Record<string, FlowNode>;
    recipes: Record<string, ResourceConversionRecipe>;
  };
  // Action handlers
  onConverterSelect: (converterId: string) => void;
  onProcessSelect: (processId: string) => void;
  onChainSelect: (chainId: string) => void;
  onStartProcess: () => void;
  onPauseProcess: (processId: string) => void;
  onStopProcess: (processId: string) => void;
  onOptimizeNetworks: () => void;
}

/**
 * ConverterDashboard - Main interface for managing converters and production chains
 *
 * Provides an overview of converters, processes, metrics, and controls for
 * managing resource conversion operations.
 */
const ConverterDashboard: React.FC<ConverterDashboardProps> = ({
  converters,
  activeProcesses,
  activeChains,
  metrics,
  efficiencyFactors,
  selectedChain,
  onConverterSelect,
  onProcessSelect,
  onChainSelect,
  onStartProcess,
  onPauseProcess,
  onStopProcess,
  onOptimizeNetworks,
}) => {
  // State for tracking selected items
  const [selectedConverterId, setSelectedConverterId] = useState<string | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);

  // Handler for converter selection
  const handleConverterClick = useCallback(
    (id: string) => {
      setSelectedConverterId(id);
      onConverterSelect(id);
    },
    [onConverterSelect]
  );

  // Handler for process selection
  const handleProcessClick = useCallback(
    (id: string) => {
      setSelectedProcessId(id);
      onProcessSelect(id);
    },
    [onProcessSelect]
  );

  // Handler for chain selection
  const handleChainClick = useCallback(
    (id: string) => {
      setSelectedChainId(id);
      onChainSelect(id);
    },
    [onChainSelect]
  );

  // Handler for clicking nodes in the chain visualization
  const handleChainNodeClick = useCallback(
    (nodeId: string, type: 'converter' | 'recipe') => {
      if (type === 'converter') {
        onConverterSelect(nodeId);
      }
    },
    [onConverterSelect]
  );

  return (
    <div className="converter-dashboard">
      <div className="dashboard-header">
        <h1>Converter Dashboard</h1>
      </div>

      <div className="dashboard-grid">
        {/* Converters Panel */}
        <div className="converters-panel panel">
          <h2>Converters</h2>
          <div className="converters-list">
            {converters.map(converter => (
              <div
                key={converter.id}
                className={`converter-item ${selectedConverterId === converter.id ? 'selected' : ''} ${converter.status}`}
                onClick={() => handleConverterClick(converter.id)}
              >
                <div className="converter-name">{converter.name}</div>
                <div className="converter-stats">
                  <span className="efficiency">
                    Eff: {(converter.efficiency * 100).toFixed(0)}%
                  </span>
                  <span className="tier">Tier: {converter.tier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Processes Panel */}
        <div className="processes-panel panel">
          <h2>Active Processes</h2>
          <div className="processes-list">
            {activeProcesses.map(process => (
              <div
                key={process.processId}
                className={`process-item ${selectedProcessId === process.processId ? 'selected' : ''} ${process.status}`}
                onClick={() => handleProcessClick(process.processId)}
              >
                <div className="process-name">
                  {process.recipeId.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="process-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${process.progress * 100}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{(process.progress * 100).toFixed(0)}%</span>
                </div>
                <div className="process-controls">
                  {process.status === 'in-progress' && (
                    <button
                      className="pause-button"
                      onClick={e => {
                        e.stopPropagation();
                        onPauseProcess(process.processId);
                      }}
                    >
                      Pause
                    </button>
                  )}
                  <button
                    className="stop-button"
                    onClick={e => {
                      e.stopPropagation();
                      onStopProcess(process.processId);
                    }}
                  >
                    Stop
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Production Metrics Panel */}
        <div className="metrics-panel panel">
          <h2>Production Metrics</h2>
          <div className="metrics-grid">
            <div className="metric">
              <div className="metric-label">Efficiency</div>
              <div className="metric-value">{(metrics.totalEfficiency * 100).toFixed(0)}%</div>
            </div>
            <div className="metric">
              <div className="metric-label">Throughput</div>
              <div className="metric-value">{metrics.throughput}/min</div>
            </div>
            <div className="metric">
              <div className="metric-label">Energy Use</div>
              <div className="metric-value">{metrics.energyUse}kW</div>
            </div>
            <div className="metric">
              <div className="metric-label">Queue</div>
              <div className="metric-value">{metrics.queuedProcesses} processes</div>
            </div>
          </div>
        </div>

        {/* Chain Visualization Panel */}
        <div className="visualization-panel panel">
          <h2>Chain Visualization</h2>
          <div className="visualization-container">
            {selectedChain ? (
              <ChainVisualization
                chain={selectedChain.chain}
                converters={selectedChain.converters}
                recipes={selectedChain.recipes}
                width={800}
                height={400}
                interactive={true}
                onNodeClick={handleChainNodeClick}
              />
            ) : (
              <div className="no-chain-selected">Select a production chain to visualize</div>
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="controls-panel panel">
          <h2>Controls</h2>
          <div className="controls-grid">
            <button className="control-button start" onClick={onStartProcess}>
              Start
            </button>
            <button className="control-button optimize" onClick={onOptimizeNetworks}>
              Optimize
            </button>
          </div>
        </div>

        {/* Efficiency Panel */}
        <div className="efficiency-panel panel">
          <h2>Efficiency</h2>
          <div className="efficiency-grid">
            <div className="efficiency-factor">
              <span className="factor-label">Base:</span>
              <span className="factor-value">{efficiencyFactors.base.toFixed(2)}</span>
            </div>
            <div className="efficiency-factor">
              <span className="factor-label">Tech:</span>
              <span className="factor-value">{efficiencyFactors.tech.toFixed(2)}</span>
            </div>
            <div className="efficiency-factor">
              <span className="factor-label">Quality:</span>
              <span className="factor-value">{efficiencyFactors.quality.toFixed(2)}</span>
            </div>
            <div className="efficiency-factor">
              <span className="factor-label">Env:</span>
              <span className="factor-value">{efficiencyFactors.environmental.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Chains List */}
      <div className="active-chains-section">
        <h2>Active Production Chains</h2>
        <div className="chains-list">
          {activeChains.map(chain => (
            <div
              key={chain.chainId}
              className={`chain-item ${selectedChainId === chain.chainId ? 'selected' : ''} ${chain.status}`}
              onClick={() => handleChainClick(chain.chainId)}
            >
              <div className="chain-header">
                <span className="chain-name">{chain.name}</span>
                <span className="chain-progress">{(chain.progress * 100).toFixed(0)}%</span>
              </div>
              <div className="chain-progress-bar">
                <div className="progress-fill" style={{ width: `${chain.progress * 100}%` }}></div>
              </div>
              <div className="chain-steps">
                <span className="steps-label">
                  Step {chain.currentStep + 1} of {chain.steps}
                </span>
                <span className="chain-status">{chain.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConverterDashboard;
