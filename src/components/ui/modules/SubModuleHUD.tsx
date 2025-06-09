import * as React from 'react';
import { useEffect, useState } from 'react';
import { useSubModules } from '../../../hooks/modules/useSubModules';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { subModuleManager, SubModuleManager } from '../../../managers/module/SubModuleManager';
import {
  BaseModule,
  SubModule,
  SubModuleConfig,
  SubModuleEffect,
  SubModuleType,
} from '../../../types/buildings/ModuleTypes';
import {
  calculateSubModuleComplexity,
  calculateSubModulePower,
  calculateSubModuleSpace,
} from '../../../utils/modules/moduleValidation';

interface SubModuleHUDProps {
  subModuleId: string;
  showDetails?: boolean;
  showControls?: boolean;
  onActivate?: (subModuleId: string) => void;
  onDeactivate?: (subModuleId: string) => void;
  onUpgrade?: (subModuleId: string) => void;
}

interface SubModuleStats {
  power: number;
  space: number;
  complexity: number;
}

/**
 * Component for displaying a single sub-module
 */
export const SubModuleHUD: React.FC<SubModuleHUDProps> = ({
  subModuleId,
  showDetails = true,
  showControls = true,
  onActivate,
  onDeactivate,
  onUpgrade,
}) => {
  const [subModule, setSubModule] = useState<SubModule | null>(null);
  const [config, setConfig] = useState<SubModuleConfig | null>(null);
  const [stats, setStats] = useState<SubModuleStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [parentModule, setParentModule] = useState<BaseModule | null>(null);

  // Load sub-module data
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const subModuleData = subModuleManager.getSubModule(subModuleId);
      if (!subModuleData) {
        setError(`Sub-module ${subModuleId} not found`);
        setIsLoading(false);
        return;
      }

      setSubModule(subModuleData);

      // Get parent module
      const parent = moduleManager.getModule(subModuleData.parentModuleId);
      setParentModule(parent ?? null);

      // Get sub-module configuration
      const manager = subModuleManager;
      const { configs } = manager as unknown as { configs: Map<SubModuleType, SubModuleConfig> };
      if (configs && configs instanceof Map) {
        const configData = configs.get(subModuleData.type);
        if (configData) {
          setConfig(configData);

          // Calculate sub-module stats
          setStats({
            power: calculateSubModulePower(subModuleData, configData),
            space: calculateSubModuleSpace(subModuleData, configData),
            complexity: calculateSubModuleComplexity(subModuleData, configData),
          });
        }
      }

      setIsLoading(false);
    } catch (err) {
      setError(`Error loading sub-module data: ${err}`);
      setIsLoading(false);
    }
  }, [subModuleId]);

  // Handle sub-module activation
  const handleActivate = () => {
    if (subModule && !subModule.isActive && onActivate) {
      onActivate(subModuleId);
    }
  };

  // Handle sub-module deactivation
  const handleDeactivate = () => {
    if (subModule && subModule.isActive && onDeactivate) {
      onDeactivate(subModuleId);
    }
  };

  // Handle sub-module upgrade
  const handleUpgrade = () => {
    if (subModule && onUpgrade) {
      onUpgrade(subModuleId);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="sub-module-hud sub-module-hud--loading">Loading sub-module data?...</div>
    );
  }

  // Render error state
  if (error) {
    return <div className="sub-module-hud sub-module-hud--error">{error}</div>;
  }

  // Render empty state
  if (!subModule || !config || !stats) {
    return <div className="sub-module-hud sub-module-hud--empty">No sub-module data available</div>;
  }

  // Get status color
  const getStatusColor = () => {
    switch (subModule.status) {
      case 'active':
        return 'green';
      case 'constructing':
        return 'yellow';
      case 'inactive':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Format effect value
  const formatEffectValue = (effect: SubModuleEffect) => {
    const prefix = effect.value >= 0 ? '+' : '';
    return `${prefix}${effect.value}${effect.isPercentage ? '%' : ''}`;
  };

  return (
    <div
      className={`sub-module-hud sub-module-hud--${subModule.type} sub-module-hud--${subModule.status}`}
    >
      {/* Sub-module header */}
      <div className="sub-module-hud__header">
        <h4 className="sub-module-hud__title">{subModule.name}</h4>
        <div className="sub-module-hud__status" style={{ backgroundColor: getStatusColor() }}>
          {subModule.status}
        </div>
        <div className="sub-module-hud__level">Level {subModule.level}</div>
      </div>

      {/* Sub-module details */}
      {showDetails && (
        <div className="sub-module-hud__details">
          <div className="sub-module-hud__description">{config.description}</div>

          <div className="sub-module-hud__stats">
            <div className="sub-module-hud__stat">
              <span className="sub-module-hud__stat-label">Power:</span>
              <span className="sub-module-hud__stat-value">{stats.power}</span>
            </div>
            <div className="sub-module-hud__stat">
              <span className="sub-module-hud__stat-label">Space:</span>
              <span className="sub-module-hud__stat-value">{stats.space}</span>
            </div>
            <div className="sub-module-hud__stat">
              <span className="sub-module-hud__stat-label">Complexity:</span>
              <span className="sub-module-hud__stat-value">{stats.complexity}</span>
            </div>
          </div>

          {/* Effects */}
          <div className="sub-module-hud__effects">
            <h5 className="sub-module-hud__effects-title">Effects</h5>
            <ul className="sub-module-hud__effects-list">
              {subModule.effects.map((effect, index) => (
                <li key={index} className="sub-module-hud__effect">
                  <span className="sub-module-hud__effect-target">{effect.target}:</span>
                  <span className="sub-module-hud__effect-value">{formatEffectValue(effect)}</span>
                  <span className="sub-module-hud__effect-description">{effect.description}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Construction progress */}
          {subModule.status === 'constructing' && subModule.progress !== undefined && (
            <div className="sub-module-hud__progress">
              <div className="sub-module-hud__progress-label">Construction Progress</div>
              <div className="sub-module-hud__progress-bar">
                <div
                  className="sub-module-hud__progress-fill"
                  style={{ width: `${subModule.progress * 100}%` }}
                />
              </div>
              <div className="sub-module-hud__progress-value">
                {Math.round(subModule.progress * 100)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-module controls */}
      {showControls && (
        <div className="sub-module-hud__controls">
          {subModule.isActive ? (
            <button
              className="sub-module-hud__button sub-module-hud__button--deactivate"
              onClick={handleDeactivate}
              disabled={subModule.status !== 'active'}
            >
              Deactivate
            </button>
          ) : (
            <button
              className="sub-module-hud__button sub-module-hud__button--activate"
              onClick={handleActivate}
              disabled={subModule.status !== 'inactive' || !parentModule?.isActive}
            >
              Activate
            </button>
          )}

          <button
            className="sub-module-hud__button sub-module-hud__button--upgrade"
            onClick={handleUpgrade}
            disabled={subModule.status !== 'active'}
          >
            Upgrade
          </button>
        </div>
      )}
    </div>
  );
};

interface SubModuleListProps {
  parentModuleId: string;
  showDetails?: boolean;
  showControls?: boolean;
}

/**
 * Component for displaying and managing sub-modules for a parent module
 */
export const SubModuleList: React.FC<SubModuleListProps> = ({
  parentModuleId,
  showDetails = true,
  showControls = true,
}) => {
  const { subModules, isLoading, error, activateSubModule, deactivateSubModule, upgradeSubModule } =
    useSubModules(parentModuleId);

  // Handle sub-module activation
  const handleActivate = (subModuleId: string) => {
    activateSubModule(subModuleId);
  };

  // Handle sub-module deactivation
  const handleDeactivate = (subModuleId: string) => {
    deactivateSubModule(subModuleId);
  };

  // Handle sub-module upgrade
  const handleUpgrade = (subModuleId: string) => {
    upgradeSubModule(subModuleId);
  };

  // Render loading state
  if (isLoading) {
    return <div className="sub-module-list sub-module-list--loading">Loading sub-modules...</div>;
  }

  // Render error state
  if (error) {
    return <div className="sub-module-list sub-module-list--error">{error}</div>;
  }

  // Render empty state
  if (subModules.length === 0) {
    return <div className="sub-module-list sub-module-list--empty">No sub-modules installed</div>;
  }

  return (
    <div className="sub-module-list">
      <h3 className="sub-module-list__title">Sub-Modules</h3>
      <div className="sub-module-list__items">
        {subModules.map(subModule => (
          <SubModuleHUD
            key={subModule.id}
            subModuleId={subModule.id}
            showDetails={showDetails}
            showControls={showControls}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onUpgrade={handleUpgrade}
          />
        ))}
      </div>
    </div>
  );
};

interface SubModuleCreatorProps {
  parentModuleId: string;
  availableTypes: SubModuleType[];
  onSubModuleCreated?: (subModule: SubModule) => void;
}

/**
 * Component for creating new sub-modules
 */
export const SubModuleCreator: React.FC<SubModuleCreatorProps> = ({
  parentModuleId,
  availableTypes,
  onSubModuleCreated,
}) => {
  const [selectedType, setSelectedType] = useState<SubModuleType | ''>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { createSubModule } = useSubModules();

  // Handle type selection
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value as SubModuleType | '');
    setError(null);
  };

  // Handle sub-module creation
  const handleCreate = () => {
    if (!selectedType) {
      setError('Please select a sub-module type');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const subModule = createSubModule(selectedType, parentModuleId);
      if (subModule) {
        if (onSubModuleCreated) {
          onSubModuleCreated(subModule);
        }
        setSelectedType('');
      } else {
        setError('Failed to create sub-module');
      }
    } catch (err) {
      setError(`Error creating sub-module: ${err}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="sub-module-creator">
      <h3 className="sub-module-creator__title">Add Sub-Module</h3>

      {error && <div className="sub-module-creator__error">{error}</div>}

      <div className="sub-module-creator__form">
        <div className="sub-module-creator__field">
          <label className="sub-module-creator__label" htmlFor="sub-module-type">
            Type:
          </label>
          <select
            id="sub-module-type"
            className="sub-module-creator__select"
            value={selectedType}
            onChange={handleTypeChange}
            disabled={isCreating}
          >
            <option value="">Select a type</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <button
          className="sub-module-creator__button"
          onClick={handleCreate}
          disabled={!selectedType || isCreating}
        >
          {isCreating ? 'Creating...' : 'Create Sub-Module'}
        </button>
      </div>
    </div>
  );
};
