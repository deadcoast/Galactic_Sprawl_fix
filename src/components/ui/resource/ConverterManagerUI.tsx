/**
 * @context: ui-library, resource-system
 *
 * UI component for managing resource converters and production chains.
 */
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { getResourceFlowManager } from '../../../managers/ManagerRegistry'; // Adjust path as needed
import {
  ChainExecutionStatus,
  ConversionChain,
  ConverterFlowNode,
  FlowNodeType,
  ResourceConversionRecipe,
} from '../../../types/resources/ResourceTypes'; // Adjust path as needed

// Placeholder components if base UI is not available
interface PlaceholderButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}
const Button = ({ children, onClick, disabled }: PlaceholderButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      margin: '5px',
      padding: '5px 10px',
      border: '1px solid #ccc',
      background: disabled ? '#eee' : '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {children}
  </button>
);
interface PlaceholderCardProps {
  title: string;
  children: React.ReactNode;
}
const Card = ({ title, children }: PlaceholderCardProps) => (
  <div
    style={{ border: '1px solid #ddd', borderRadius: '4px', marginBottom: '15px', padding: '15px' }}
  >
    <h3
      style={{
        marginTop: 0,
        marginBottom: '10px',
        borderBottom: '1px solid #eee',
        paddingBottom: '5px',
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);
interface PlaceholderSelectProps {
  children: React.ReactNode;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  value?: string | number;
}
const Select = ({ children, onChange, value }: PlaceholderSelectProps) => (
  <select onChange={onChange} value={value} style={{ marginRight: '10px', padding: '5px' }}>
    {children}
  </select>
);
interface PlaceholderOptionProps {
  children: React.ReactNode;
  value: string | number;
}
const Option = ({ children, value }: PlaceholderOptionProps) => (
  <option value={value}>{children}</option>
);
// --- End Placeholder Components ---

/**
 * Displays a list of resource converters and allows management of their processes and chains.
 */
export const ConverterManagerUI: React.FC /*<ConverterManagerUIProps>*/ = (/*{}*/) => {
  // Removed props type and empty object
  const [converters, setConverters] = useState<ConverterFlowNode[]>([]);
  const [recipes, setRecipes] = useState<ResourceConversionRecipe[]>([]);
  const [chains, setChains] = useState<ConversionChain[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<Record<string, string>>({}); // { [converterId]: recipeId }
  const [selectedChains, setSelectedChains] = useState<Record<string, string>>({}); // { [converterId]: chainId }
  const [activeChainExecutions, setActiveChainExecutions] = useState<
    Map<string, ChainExecutionStatus>
  >(new Map());

  const resourceFlowManager = getResourceFlowManager();

  // Fetch initial data
  useEffect(() => {
    try {
      const allNodes = resourceFlowManager.getNodes();
      const converterNodes = allNodes.filter(
        (node): node is ConverterFlowNode => node.type === FlowNodeType.CONVERTER
      );
      // --- Correction: Fetch recipes using the correct method ---
      const allRecipes = resourceFlowManager.getAllRecipeDefinitions(); // Use the new method
      // const placeholderRecipes: ResourceConversionRecipe[] = []; // Placeholder - REMOVED
      // const allRecipes = placeholderRecipes; // Use placeholder for now - REMOVED
      // ---------------------------------------------------------
      const allChains = resourceFlowManager.getAllConversionChains();

      setConverters(converterNodes);
      setRecipes(allRecipes); // Removed cast
      setChains(allChains);
      // Fetch active chain executions periodically (or via events if implemented)
      const intervalId = setInterval(() => {
        try {
          setActiveChainExecutions(resourceFlowManager.getChainExecutions());
        } catch (e) {
          console.error('Error fetching chain executions:', e);
          // Optionally set an error state specific to chain execution fetching
        }
      }, 2000); // Fetch every 2 seconds

      setError(null);
      return () => clearInterval(intervalId); // Cleanup interval on unmount
    } catch (e) {
      console.error('Error fetching converter data:', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [resourceFlowManager]);

  const handleStartRecipe = useCallback(
    (converterId: string) => {
      const recipeId = selectedRecipes[converterId];
      if (!recipeId) {
        alert('Please select a recipe.');
        return;
      }
      console.log(`[UI] Attempting to start recipe ${recipeId} on converter ${converterId}`);
      try {
        const result = resourceFlowManager.startConversionProcess(converterId, recipeId);
        if (result.success) {
          alert(`Started process ${result.processId} for recipe ${recipeId}`);
          // TODO: Update UI state to reflect new active process
        } else {
          alert(`Failed to start recipe ${recipeId}: ${result.error}`);
          setError(`Failed to start recipe ${recipeId}: ${result.error}`);
        }
      } catch (e) {
        console.error(`Error starting recipe ${recipeId}:`, e);
        setError(e instanceof Error ? e.message : String(e));
        alert(`Error starting recipe: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [resourceFlowManager, selectedRecipes]
  );

  const handleStartChain = useCallback(
    (converterId: string) => {
      const chainId = selectedChains[converterId];
      if (!chainId) {
        alert('Please select a chain.');
        return;
      }
      console.log(`[UI] Attempting to start chain ${chainId} on converter ${converterId}`);
      try {
        const executionId = resourceFlowManager.startConversionChain(chainId, converterId);
        if (executionId) {
          alert(`Started chain execution ${executionId} for chain ${chainId}`);
          // TODO: Update UI state to reflect new active chain
        } else {
          alert(`Failed to start chain ${chainId}.`);
          setError(`Failed to start chain ${chainId}.`);
        }
      } catch (e) {
        console.error(`Error starting chain ${chainId}:`, e);
        setError(e instanceof Error ? e.message : String(e));
        alert(`Error starting chain: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [resourceFlowManager, selectedChains]
  );

  const handleRecipeSelect = (converterId: string, recipeId: string) => {
    setSelectedRecipes(prev => ({ ...prev, [converterId]: recipeId }));
  };

  const handleChainSelect = (converterId: string, chainId: string) => {
    setSelectedChains(prev => ({ ...prev, [converterId]: chainId }));
  };

  // --- Control Handlers --- START
  const handlePauseProcess = useCallback(
    (processId: string) => {
      if (resourceFlowManager.pauseConversionProcess(processId)) {
        alert(`Process ${processId} paused.`);
        // TODO: Force UI refresh or rely on polling/events
      } else {
        alert(`Failed to pause process ${processId}.`);
      }
    },
    [resourceFlowManager]
  );

  const handleResumeProcess = useCallback(
    (processId: string) => {
      if (resourceFlowManager.resumeConversionProcess(processId)) {
        alert(`Process ${processId} resumed.`);
        // TODO: Force UI refresh or rely on polling/events
      } else {
        alert(`Failed to resume process ${processId}.`);
      }
    },
    [resourceFlowManager]
  );

  const handleCancelProcess = useCallback(
    (processId: string) => {
      if (resourceFlowManager.cancelConversionProcess(processId)) {
        alert(`Process ${processId} cancelled.`);
        // TODO: Force UI refresh or rely on polling/events
      } else {
        alert(`Failed to cancel process ${processId}.`);
      }
    },
    [resourceFlowManager]
  );

  const handlePauseChain = useCallback(
    (executionId: string) => {
      if (resourceFlowManager.pauseChainExecution(executionId)) {
        alert(`Chain execution ${executionId} paused.`);
        // TODO: Force UI refresh or rely on polling/events
      } else {
        alert(`Failed to pause chain execution ${executionId}.`);
      }
    },
    [resourceFlowManager]
  );

  const handleResumeChain = useCallback(
    (executionId: string) => {
      if (resourceFlowManager.resumeChainExecution(executionId)) {
        alert(`Chain execution ${executionId} resumed.`);
        // TODO: Force UI refresh or rely on polling/events
      } else {
        alert(`Failed to resume chain execution ${executionId}.`);
      }
    },
    [resourceFlowManager]
  );

  const handleCancelChain = useCallback(
    (executionId: string) => {
      if (resourceFlowManager.cancelChainExecution(executionId)) {
        alert(`Chain execution ${executionId} cancelled.`);
        // TODO: Force UI refresh or rely on polling/events
      } else {
        alert(`Failed to cancel chain execution ${executionId}.`);
      }
    },
    [resourceFlowManager]
  );
  // --- Control Handlers --- END

  if (loading) {
    return <div>Loading Converter Data...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error loading converter data: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Converter Management</h2>
      {converters.length === 0 ? (
        <p>No converters found.</p>
      ) : (
        converters.map(converter => (
          <Card key={converter.id} title={`Converter: ${converter.id}`}>
            <p>Status: {converter.status}</p>
            <p>Efficiency: {converter.efficiency?.toFixed(2) ?? 'N/A'}</p>
            <p>Active Processes: {converter.activeProcessIds?.join(', ') ?? 'None'}</p>
            {/* Display active processes with controls */}
            {converter.activeProcessIds && converter.activeProcessIds.length > 0 && (
              <div>
                <strong>Processes:</strong>
                <ul>
                  {converter.activeProcessIds.map(pid => {
                    // Find process details (might need more efficient lookup)
                    // const process = resourceFlowManager.getProcessDetails(pid); // Assumes getProcessDetails exists - REMOVED
                    // For now, just display ID. More info requires exposing data from manager.
                    // const isPaused = process?.paused;
                    return (
                      <li key={pid}>
                        {/* Display simplified info for now */}
                        Process: {pid}
                        {/* <Button onClick={() => isPaused ? handleResumeProcess(pid) : handlePauseProcess(pid)}>
                          {isPaused ? 'Resume' : 'Pause'}
                        </Button> */}
                        {/* Pause/Resume buttons removed as process state isn't easily accessible here */}
                        <Button onClick={() => handlePauseProcess(pid)}>Pause</Button>
                        <Button onClick={() => handleResumeProcess(pid)}>Resume</Button>
                        <Button onClick={() => handleCancelProcess(pid)}>Cancel</Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {/* Display active chain executions */}
            <div>
              <strong>Active Chains:</strong>
              <ul>
                {Array.from(activeChainExecutions.entries())
                  .filter(
                     
                    ([_, status]) =>
                      status.active &&
                      status.stepStatus.some(
                        step => step.converterId === converter.id && step.status === 'in_progress'
                      )
                  )
                  .map(([execId, status]) => {
                    const isPaused = status.paused;
                    return (
                      <li key={execId}>
                        {execId} (Chain: {status.chainId}, Step: {status.currentStepIndex + 1}/
                        {status.recipeIds.length}, Progress: {(status.progress * 100).toFixed(1)}%)
                        <Button
                          onClick={() =>
                            isPaused ? handleResumeChain(execId) : handlePauseChain(execId)
                          }
                        >
                          {isPaused ? 'Resume' : 'Pause'}
                        </Button>
                        <Button onClick={() => handleCancelChain(execId)}>Cancel</Button>
                      </li>
                    );
                  })}
              </ul>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center' }}>
              <Select
                value={selectedRecipes[converter.id] || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleRecipeSelect(converter.id, e.target.value)
                }
              >
                <Option value="">-- Select Recipe --</Option>
                {(converter.supportedRecipeIds
                  ? recipes.filter(r => converter.supportedRecipeIds?.includes(r.id))
                  : recipes
                ).map(recipe => (
                  <Option key={recipe.id} value={recipe.id}>
                    {recipe.name} ({recipe.id})
                  </Option>
                ))}
              </Select>
              <Button
                onClick={() => handleStartRecipe(converter.id)}
                disabled={!selectedRecipes[converter.id]}
              >
                Start Recipe
              </Button>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
              <Select
                value={selectedChains[converter.id] || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleChainSelect(converter.id, e.target.value)
                }
              >
                <Option value="">-- Select Chain --</Option>
                {/* Filter chains: show only those whose first recipe is supported by the converter */}
                {chains
                  .filter(chain => {
                    if (!chain.steps || chain.steps.length === 0) return false;
                    const firstRecipeId = chain.steps[0];
                    return converter.supportedRecipeIds?.includes(firstRecipeId) ?? true; // Show if supported or if converter supports all
                  })
                  .map(chain => (
                    <Option key={chain.id} value={chain.id}>
                      {chain.name} ({chain.id})
                    </Option>
                  ))}
              </Select>
              <Button
                onClick={() => handleStartChain(converter.id)}
                disabled={!selectedChains[converter.id]}
              >
                Start Chain
              </Button>
            </div>
            {/* TODO: Add controls for pausing/stopping processes/chains - ADDED ABOVE */}
          </Card>
        ))
      )}
    </div>
  );
};

export default ConverterManagerUI;
