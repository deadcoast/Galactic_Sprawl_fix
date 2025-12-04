import * as React from 'react';
import { useCallback, useState } from 'react';
import './ChainManagementInterface.css';

// Define the interfaces for the component
interface ChainStep {
  converterId: string;
  recipeId: string;
}

interface ChainStatus {
  chainId: string;
  name: string;
  steps: number;
  currentStep: number;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'paused';
  stepDetails: {
    converterId: string;
    converterName: string;
    recipeId: string;
    recipeName: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
  }[];
}

interface ChainTemplate {
  id: string;
  name: string;
  steps: ChainStep[];
}

interface ConverterSummary {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
}

interface RecipeDetail {
  id: string;
  name: string;
  baseEfficiency: number;
  inputs: {
    type: string;
    amount: number;
  }[];
  outputs: {
    type: string;
    amount: number;
  }[];
}

interface ChainManagementInterfaceProps {
  activeChains: ChainStatus[];
  availableConverters: ConverterSummary[];
  availableRecipes: RecipeDetail[];
  savedTemplates: ChainTemplate[];
  onStartChain: (steps: ChainStep[]) => void;
  onPauseChain: (chainId: string) => void;
  onResumeChain: (chainId: string) => void;
  onCancelChain: (chainId: string) => void;
  onSaveTemplate: (template: ChainTemplate) => void;
  onLoadTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
}

/**
 * ChainManagementInterface - Component for creating and managing production chains
 *
 * Provides interfaces for monitoring active chains, creating new chains,
 * and managing chain templates.
 */
const ChainManagementInterface: React.FC<ChainManagementInterfaceProps> = ({
  activeChains,
  availableConverters,
  availableRecipes,
  savedTemplates,
  onStartChain,
  onPauseChain,
  onResumeChain,
  onCancelChain,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
}) => {
  // State for chain creation
  const [chainSteps, setChainSteps] = useState<ChainStep[]>([{ converterId: '', recipeId: '' }]);
  const [templateName, setTemplateName] = useState<string>('');
  const [showTemplateSaveDialog, setShowTemplateSaveDialog] = useState<boolean>(false);

  // Format recipe/converter names to be more readable
  const formatName = (name: string): string => {
    return name.replace(/([A-Z])/g, ' $1').trim();
  };

  // Handler for adding a new step to the chain being created
  const handleAddStep = useCallback(() => {
    setChainSteps(prevSteps => [...prevSteps, { converterId: '', recipeId: '' }]);
  }, []);

  // Handler for updating a step in the chain being created
  const handleStepChange = useCallback(
    (index: number, field: 'converterId' | 'recipeId', value: string) => {
      setChainSteps(prevSteps => {
        const newSteps = [...prevSteps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        return newSteps;
      });
    },
    []
  );

  // Handler for removing a step from the chain being created
  const handleRemoveStep = useCallback((index: number) => {
    setChainSteps(prevSteps => prevSteps.filter((_, i) => i !== index));
  }, []);

  // Handler for starting a chain
  const handleStartChain = useCallback(() => {
    // Validate all steps have converter and recipe selected
    const isValid = chainSteps.every(step => step.converterId && step.recipeId);
    if (isValid && chainSteps.length > 0) {
      onStartChain(chainSteps);
    }
  }, [chainSteps, onStartChain]);

  // Handler for saving a template
  const handleSaveTemplate = useCallback(() => {
    if (templateName.trim() && chainSteps.length > 0) {
      const template: ChainTemplate = {
        id: `template_${Date.now()}`,
        name: templateName,
        steps: chainSteps,
      };
      onSaveTemplate(template);
      setTemplateName('');
      setShowTemplateSaveDialog(false);
    }
  }, [templateName, chainSteps, onSaveTemplate]);

  // Handler for loading a template
  const handleLoadTemplate = useCallback(
    (templateId: string) => {
      const template = savedTemplates.find(t => t.id === templateId);
      if (template) {
        setChainSteps(template.steps);
        onLoadTemplate(templateId);
      }
    },
    [savedTemplates, onLoadTemplate]
  );

  return (
    <div className="chain-management">
      <h1>Production Chain Management</h1>

      {/* Active Chains Section */}
      <div className="active-chains-section section">
        <h2>Active Chains</h2>
        <div className="chains-list">
          {activeChains.length > 0 ? (
            activeChains.map(chain => (
              <div key={chain.chainId} className={`chain-item ${chain.status}`}>
                <div className="chain-header">
                  <div className="chain-name">
                    {chain.name} ({chain.steps} steps, {Math.round(chain.progress * 100)}% complete)
                  </div>
                  <div className="chain-controls">
                    {chain.status === 'in-progress' && (
                      <button
                        className="pause-chain-button"
                        onClick={() => onPauseChain(chain.chainId)}
                      >
                        PAUSE
                      </button>
                    )}
                    {chain.status === 'paused' && (
                      <button
                        className="resume-chain-button"
                        onClick={() => onResumeChain(chain.chainId)}
                      >
                        RESUME
                      </button>
                    )}
                    {(chain.status === 'in-progress' ||
                      chain.status === 'paused' ||
                      chain.status === 'pending') && (
                      <button
                        className="cancel-chain-button"
                        onClick={() => onCancelChain(chain.chainId)}
                      >
                        CANCEL
                      </button>
                    )}
                  </div>
                </div>
                <div className="chain-steps">
                  {chain.stepDetails.map((step, index) => (
                    <div
                      key={`${chain.chainId}-step-${index}`}
                      className={`chain-step ${step.status}`}
                    >
                      <div className="step-indicator">Step {index + 1}:</div>
                      <div className="step-description">
                        {formatName(step.converterName)} → {formatName(step.recipeName)}
                      </div>
                      <div className="step-status">
                        [{step.status.replace(/_/g, ' ').toUpperCase()}]
                      </div>
                    </div>
                  ))}
                </div>
                <div className="chain-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${chain.progress * 100}%` }} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-chains">No active chains. Create a new chain below.</div>
          )}
        </div>
      </div>

      {/* Chain Creator Section */}
      <div className="chain-creator-section section">
        <h2>Chain Creator</h2>
        <div className="chain-creator">
          {chainSteps.map((step, index) => (
            <div key={`step-${index}`} className="chain-creator-step">
              <div className="step-number">Step {index + 1}:</div>
              <select
                className="converter-select"
                value={step.converterId}
                onChange={e => handleStepChange(index, 'converterId', e.target.value)}
              >
                <option value="">Select Converter</option>
                {availableConverters
                  .filter(c => c.status !== 'error')
                  .map(converter => (
                    <option key={converter.id} value={converter.id}>
                      {formatName(converter.name)} ({converter.type})
                    </option>
                  ))}
              </select>
              <select
                className="recipe-select"
                value={step.recipeId}
                onChange={e => handleStepChange(index, 'recipeId', e.target.value)}
                disabled={!step.converterId}
              >
                <option value="">Select Recipe</option>
                {availableRecipes.map(recipe => (
                  <option key={recipe.id} value={recipe.id}>
                    {formatName(recipe.name)}
                  </option>
                ))}
              </select>
              {chainSteps.length > 1 && (
                <button className="remove-step-button" onClick={() => handleRemoveStep(index)}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <div className="chain-creator-actions">
            <button className="add-step-button" onClick={handleAddStep}>
              + Add Step
            </button>
            <div className="chain-creator-main-actions">
              <button
                className="save-template-button"
                onClick={() => setShowTemplateSaveDialog(true)}
                disabled={chainSteps.some(step => !step.converterId || !step.recipeId)}
              >
                Save as Template
              </button>
              <button
                className="start-chain-button"
                onClick={handleStartChain}
                disabled={chainSteps.some(step => !step.converterId || !step.recipeId)}
              >
                Start Chain
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Save Dialog */}
      {showTemplateSaveDialog && (
        <div className="template-save-dialog">
          <div className="dialog-content">
            <h3>Save Chain Template</h3>
            <input
              type="text"
              className="template-name-input"
              placeholder="Enter template name"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
            />
            <div className="dialog-actions">
              <button className="cancel-button" onClick={() => setShowTemplateSaveDialog(false)}>
                Cancel
              </button>
              <button
                className="save-button"
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chain Templates Section */}
      <div className="chain-templates-section section">
        <h2>Chain Templates</h2>
        <div className="templates-list">
          {savedTemplates.length > 0 ? (
            savedTemplates.map(template => (
              <div key={template.id} className="template-item">
                <div className="template-info">
                  <div className="template-name">{template.name}</div>
                  <div className="template-steps">({template.steps.length} steps)</div>
                </div>
                <div className="template-actions">
                  <button
                    className="load-template-button"
                    onClick={() => handleLoadTemplate(template.id)}
                  >
                    LOAD
                  </button>
                  <button
                    className="delete-template-button"
                    onClick={() => onDeleteTemplate(template.id)}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-templates">No saved templates.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChainManagementInterface;
