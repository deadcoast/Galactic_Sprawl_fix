import * as React from "react";
import { useEffect, useState } from 'react';
import {
  useModuleUpgrade,
  useModulesWithAvailableUpgrades,
} from '../../../hooks/modules/useModuleUpgrade';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { BaseModule } from '../../../types/buildings/ModuleTypes';

interface ModuleUpgradeDisplayProps {
  moduleId: string;
  showDetails?: boolean;
  showRequirements?: boolean;
  showEffects?: boolean;
  showControls?: boolean;
  onUpgradeStart?: (moduleId: string) => void;
  onUpgradeCancel?: (moduleId: string) => void;
  onUpgradeComplete?: (moduleId: string) => void;
}

/**
 * Component for displaying module upgrade information and controls
 */
export const ModuleUpgradeDisplay: React.FC<ModuleUpgradeDisplayProps> = ({
  moduleId,
  showDetails = true,
  showRequirements = true,
  showEffects = true,
  showControls = true,
  onUpgradeStart,
  onUpgradeCancel,
  onUpgradeComplete,
}) => {
  const {
    upgradeStatus,
    isLoading,
    error,
    currentLevel,
    maxLevel,
    nextLevel,
    upgradeAvailable,
    requirementsMet,
    missingRequirements,
    upgradeProgress,
    estimatedTimeRemaining,
    effects,
    startUpgrade,
    cancelUpgrade,
    formatTimeRemaining,
    getEffectDescription,
  } = useModuleUpgrade(moduleId);

  const [module, setModule] = useState<BaseModule | null>(null);

  // Load module data
  useEffect(() => {
    const moduleData = moduleManager.getModule(moduleId);
    setModule(moduleData || null);
  }, [moduleId]);

  // Handle upgrade start
  const handleUpgradeStart = () => {
    const success = startUpgrade();
    if (success && onUpgradeStart) {
      onUpgradeStart(moduleId);
    }
  };

  // Handle upgrade cancel
  const handleUpgradeCancel = () => {
    const success = cancelUpgrade();
    if (success && onUpgradeCancel) {
      onUpgradeCancel(moduleId);
    }
  };

  // Handle upgrade complete
  useEffect(() => {
    if (upgradeProgress === 1 && onUpgradeComplete) {
      onUpgradeComplete(moduleId);
    }
  }, [upgradeProgress, moduleId, onUpgradeComplete]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="module-upgrade-display module-upgrade-display--loading">
        Loading upgrade data?...
      </div>
    );
  }

  // Render error state
  if (error) {
    return <div className="module-upgrade-display module-upgrade-display--error">{error}</div>;
  }

  // Render empty state
  if (!upgradeStatus || !module) {
    return (
      <div className="module-upgrade-display module-upgrade-display--empty">
        No upgrade data available
      </div>
    );
  }

  return (
    <div className="module-upgrade-display">
      {/* Upgrade header */}
      <div className="module-upgrade-display__header">
        <h4 className="module-upgrade-display__title">{module.name} Upgrades</h4>
        <div className="module-upgrade-display__level">
          Level {currentLevel}/{maxLevel}
        </div>
      </div>

      {/* Upgrade progress */}
      {upgradeProgress !== undefined && (
        <div className="module-upgrade-display__progress">
          <div className="module-upgrade-display__progress-bar">
            <div
              className="module-upgrade-display__progress-fill"
              style={{ width: `${upgradeProgress * 100}%` }}
            />
          </div>
          <div className="module-upgrade-display__progress-text">
            {Math.round(upgradeProgress * 100)}% -
            {estimatedTimeRemaining !== undefined && (
              <span> {formatTimeRemaining(estimatedTimeRemaining)} remaining</span>
            )}
          </div>
        </div>
      )}

      {/* Upgrade details */}
      {showDetails && nextLevel && (
        <div className="module-upgrade-display__details">
          <h5 className="module-upgrade-display__section-title">Next Upgrade</h5>
          <div className="module-upgrade-display__next-level">
            <div className="module-upgrade-display__next-level-name">{nextLevel.name}</div>
            <div className="module-upgrade-display__next-level-description">
              {nextLevel.description}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade effects */}
      {showEffects && effects && effects.length > 0 && (
        <div className="module-upgrade-display__effects">
          <h5 className="module-upgrade-display__section-title">Effects</h5>
          <ul className="module-upgrade-display__effect-list">
            {effects.map((effect, index) => (
              <li
                key={index}
                className={`module-upgrade-display__effect module-upgrade-display__effect--${effect.type}`}
              >
                {getEffectDescription(effect)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upgrade requirements */}
      {showRequirements && nextLevel && (
        <div className="module-upgrade-display__requirements">
          <h5 className="module-upgrade-display__section-title">Requirements</h5>
          {requirementsMet ? (
            <div className="module-upgrade-display__requirements-met">All requirements met</div>
          ) : (
            <ul className="module-upgrade-display__requirement-list">
              {missingRequirements &&
                missingRequirements.map((requirement, index) => (
                  <li
                    key={index}
                    className="module-upgrade-display__requirement module-upgrade-display__requirement--missing"
                  >
                    {requirement}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {/* Upgrade controls */}
      {showControls && (
        <div className="module-upgrade-display__controls">
          {upgradeProgress !== undefined ? (
            <button
              className="module-upgrade-display__button module-upgrade-display__button--cancel"
              onClick={handleUpgradeCancel}
            >
              Cancel Upgrade
            </button>
          ) : (
            <button
              className="module-upgrade-display__button module-upgrade-display__button--upgrade"
              onClick={handleUpgradeStart}
              disabled={!upgradeAvailable || !requirementsMet}
            >
              {upgradeAvailable
                ? requirementsMet
                  ? 'Upgrade'
                  : 'Missing Requirements'
                : 'Max Level'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Component for displaying a list of modules with available upgrades
 */
export const ModulesWithUpgradesDisplay: React.FC<{
  onSelectModule?: (moduleId: string) => void;
  onUpgradeStart?: (moduleId: string) => void;
}> = ({ onSelectModule, onUpgradeStart }) => {
  const { moduleIds, isLoading, error } = useModulesWithAvailableUpgrades();

  // Render loading state
  if (isLoading) {
    return (
      <div className="modules-with-upgrades-display modules-with-upgrades-display--loading">
        Loading available upgrades...
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="modules-with-upgrades-display modules-with-upgrades-display--error">
        {error}
      </div>
    );
  }

  // Render empty state
  if (moduleIds.length === 0) {
    return (
      <div className="modules-with-upgrades-display modules-with-upgrades-display--empty">
        No modules available for upgrade
      </div>
    );
  }

  return (
    <div className="modules-with-upgrades-display">
      <h4 className="modules-with-upgrades-display__title">Available Upgrades</h4>
      <div className="modules-with-upgrades-display__list">
        {moduleIds.map(moduleId => (
          <ModuleUpgradeSummaryItem
            key={moduleId}
            moduleId={moduleId}
            onClick={() => onSelectModule?.(moduleId)}
            onUpgradeStart={() => onUpgradeStart?.(moduleId)}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Component for displaying a summary of a module's upgrade status
 */
const ModuleUpgradeSummaryItem: React.FC<{
  moduleId: string;
  onClick?: () => void;
  onUpgradeStart?: () => void;
}> = ({ moduleId, onClick, onUpgradeStart }) => {
  const { currentLevel, maxLevel, nextLevel, effects, startUpgrade, getEffectDescription } =
    useModuleUpgrade(moduleId);

  const [module, setModule] = useState<BaseModule | null>(null);

  // Load module data
  useEffect(() => {
    const moduleData = moduleManager.getModule(moduleId);
    setModule(moduleData || null);
  }, [moduleId]);

  // Handle upgrade start
  const handleUpgradeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = startUpgrade();
    if (success && onUpgradeStart) {
      onUpgradeStart();
    }
  };

  if (!module || !nextLevel) {
    return null;
  }

  return (
    <div className="module-upgrade-summary-item" onClick={onClick}>
      <div className="module-upgrade-summary-item__header">
        <div className="module-upgrade-summary-item__name">{module.name}</div>
        <div className="module-upgrade-summary-item__level">
          Level {currentLevel}/{maxLevel}
        </div>
      </div>

      <div className="module-upgrade-summary-item__next-level">{nextLevel.name}</div>

      {effects && effects.length > 0 && (
        <div className="module-upgrade-summary-item__effects">
          {effects.slice(0, 2).map((effect, index) => (
            <div
              key={index}
              className={`module-upgrade-summary-item__effect module-upgrade-summary-item__effect--${effect.type}`}
            >
              {getEffectDescription(effect)}
            </div>
          ))}
          {effects.length > 2 && (
            <div className="module-upgrade-summary-item__more-effects">
              +{effects.length - 2} more effects
            </div>
          )}
        </div>
      )}

      <button className="module-upgrade-summary-item__button" onClick={handleUpgradeStart}>
        Upgrade
      </button>
    </div>
  );
};
