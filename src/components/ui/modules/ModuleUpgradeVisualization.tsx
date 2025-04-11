import { useCallback, useEffect, useMemo, useState } from 'react';
import { useModuleStatus } from '../../../hooks/modules/useModuleStatus';
import { moduleManager } from '../../../managers/module/ModuleManager';
import { BaseEvent, EventType } from '../../../types/events/EventTypes';
import { ResourceType } from './../../../types/resources/ResourceTypes';
import './ModuleUpgradeVisualization.css';

// Progress tracker for the upgrade process
const MODULE_UPGRADE_PROGRESS = 'MODULE_UPGRADE_PROGRESS';

interface ModuleUpgradeVisualizationProps {
  moduleId: string;
  onUpgradeComplete?: () => void;
  className?: string;
  showDetails?: boolean;
}

interface UpgradeStage {
  name: string;
  description: string;
  duration: number; // in seconds
  startPercentage: number;
  endPercentage: number;
}

/**
 * ModuleUpgradeVisualization component
 *
 * Provides a visual representation of the module upgrade process with multiple stages
 * and real-time progress updates.
 */
export function ModuleUpgradeVisualization({
  moduleId,
  onUpgradeComplete,
  className = '',
  showDetails = true,
}: ModuleUpgradeVisualizationProps) {
  const { module, currentStatus, updateStatus } = useModuleStatus(moduleId);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Define upgrade stages based on module type
  const upgradeStages = useMemo((): UpgradeStage[] => {
    if (!module) {
      return [];
    }

    // Default stages
    const stages: UpgradeStage[] = [
      {
        name: 'Preparation',
        description: 'Preparing module for upgrade',
        duration: 5,
        startPercentage: 0,
        endPercentage: 15,
      },
      {
        name: 'Core Upgrade',
        description: 'Upgrading core systems',
        duration: 15,
        startPercentage: 15,
        endPercentage: 60,
      },
      {
        name: 'Integration',
        description: 'Integrating new systems',
        duration: 10,
        startPercentage: 60,
        endPercentage: 85,
      },
      {
        name: 'Testing',
        description: 'Testing upgraded systems',
        duration: 5,
        startPercentage: 85,
        endPercentage: 95,
      },
      {
        name: 'Finalization',
        description: 'Finalizing upgrades',
        duration: 2,
        startPercentage: 95,
        endPercentage: 100,
      },
    ];

    // Customize stages based on module type
    switch (module.type as string) {
      case 'mining':
        stages[1].description = 'Upgrading extraction systems';
        stages[2].description = 'Calibrating resource filters';
        break;
      case ResourceType.ENERGY:
        stages[1].description = 'Upgrading power converters';
        stages[2].description = 'Stabilizing energy flow';
        break;
      case ResourceType.RESEARCH:
        stages[1].description = 'Upgrading processing units';
        stages[2].description = 'Loading new research algorithms';
        break;
      default:
        // Keep default descriptions
        break;
    }

    return stages;
  }, [module]);

  // Calculate total upgrade duration
  const totalDuration = useMemo(() => {
    return upgradeStages.reduce((sum, stage) => sum + stage.duration, 0);
  }, [upgradeStages]);

  // Subscribe to upgrade progress events
  useEffect(() => {
    const handleUpgradeProgress = (event: BaseEvent) => {
      // First, check if the event exists
      if (!event) return;

      // Check moduleId match
      if (event.moduleId !== moduleId) return;

      // Validate data exists and is an object
      if (!event.data || typeof event.data !== 'object') return;

      // Check if data has progress property of type number
      const data = event.data;
      if (!('progress' in data) || typeof data.progress !== 'number') return;

      // Now it's safe to use the progress value
      const newProgress = data.progress;
      setProgress(newProgress);

      // Determine current stage
      const stageIndex = upgradeStages.findIndex(
        stage => newProgress >= stage.startPercentage && newProgress < stage.endPercentage
      );

      if (stageIndex !== -1) {
        setCurrentStage(stageIndex);
      }

      // Update time remaining if upgrade is in progress
      if (newProgress > 0 && newProgress < 100 && startTime) {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const estimatedTotalSeconds = (elapsedSeconds * 100) / newProgress;
        const remainingSeconds = estimatedTotalSeconds - elapsedSeconds;
        setEstimatedTimeRemaining(remainingSeconds);
      }

      // Handle upgrade completion
      if (newProgress >= 100) {
        setIsUpgrading(false);
        setEstimatedTimeRemaining(null);

        // Call onUpgradeComplete callback if provided
        if (onUpgradeComplete) {
          onUpgradeComplete();
        }
      }
    };

    // Start monitoring for upgrade progress
    const unsubscribe = moduleManager.subscribeToEvent(
      MODULE_UPGRADE_PROGRESS as EventType,
      handleUpgradeProgress
    );

    // Check if module is already upgrading
    if (currentStatus === 'upgrading' && !isUpgrading) {
      setIsUpgrading(true);
      setStartTime(Date.now());
    } else if (currentStatus !== 'upgrading' && isUpgrading) {
      setIsUpgrading(false);
      setProgress(0);
      setCurrentStage(0);
      setEstimatedTimeRemaining(null);
    }

    return () => {
      unsubscribe();
    };
  }, [moduleId, upgradeStages, currentStatus, isUpgrading, onUpgradeComplete, startTime]);

  // Format time remaining
  const formatTimeRemaining = useCallback((seconds: number) => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }, []);

  // Cancel upgrade
  const handleCancelUpgrade = useCallback(() => {
    if (isUpgrading && module) {
      // Return to previous status
      updateStatus('active', 'Upgrade cancelled by user');
      setIsUpgrading(false);
      setProgress(0);
      setEstimatedTimeRemaining(null);
    }
  }, [isUpgrading, module, updateStatus]);

  // Start upgrade simulation
  const handleStartUpgrade = useCallback(() => {
    if (!isUpgrading && module) {
      // Start the upgrade process
      moduleManager.upgradeModule(moduleId);
      setIsUpgrading(true);
      setProgress(0);
      setCurrentStage(0);
      setStartTime(Date.now());

      // Simulate sending upgrade progress events
      const simulateProgress = () => {
        let currentProgress = 0;
        let lastUpdate = Date.now();

        // Simulate progress for each stage
        upgradeStages.forEach((stage, index) => {
          const stageDuration = stage.duration * 1000; // Convert to ms
          const stageProgress = stage.endPercentage - stage.startPercentage;
          const updatesPerStage = Math.max(5, Math.floor(stageDuration / 500)); // Update every 500ms
          const progressPerUpdate = stageProgress / updatesPerStage;

          // Simulate each update in this stage
          for (let i = 0; i < updatesPerStage; i++) {
            const delay = lastUpdate - Date.now() + stageDuration / updatesPerStage;
            lastUpdate += stageDuration / updatesPerStage;

            setTimeout(() => {
              // Only update if still upgrading
              if (!isUpgrading) {
                return;
              }

              currentProgress += progressPerUpdate;

              // Emit the progress event
              moduleManager.publishEvent({
                type: MODULE_UPGRADE_PROGRESS as EventType,
                moduleId,
                moduleType: module.type,
                timestamp: Date.now(),
                data: {
                  progress: Math.min(Math.round(currentProgress * 10) / 10, 100),
                  stage: index,
                  stageName: stage.name,
                },
              });

              // Handle completion
              if (currentProgress >= 100) {
                // Complete the upgrade after a short delay
                setTimeout(() => {
                  // Update module level and status
                  moduleManager.publishEvent({
                    type: EventType.MODULE_UPGRADED,
                    moduleId,
                    moduleType: module.type,
                    timestamp: Date.now(),
                    data: {
                      oldLevel: module.level,
                      newLevel: module.level + 1,
                    },
                  });

                  updateStatus('active', 'Upgrade completed successfully');
                }, 500);
              }
            }, delay);
          }
        });
      };

      // Start the simulation
      simulateProgress();
    }
  }, [isUpgrading, module, moduleId, upgradeStages, updateStatus]);

  // No module to upgrade
  if (!module) {
    return (
      <div
        className={`module-upgrade-visualization module-upgrade-visualization--error ${className}`}
      >
        <div className="module-upgrade-visualization__error">Module not found</div>
      </div>
    );
  }

  return (
    <div
      className={`module-upgrade-visualization ${isUpgrading ? 'module-upgrade-visualization--active' : ''} ${className}`}
    >
      <div className="module-upgrade-visualization__header">
        <h3 className="module-upgrade-visualization__title">
          {isUpgrading ? `Upgrading ${module.name}` : `Upgrade ${module.name}`}
        </h3>
        {isUpgrading && (
          <div className="module-upgrade-visualization__level">
            Level {module.level} → {module.level + 1}
          </div>
        )}
      </div>

      {showDetails && !isUpgrading && (
        <div className="module-upgrade-visualization__details">
          <div className="module-upgrade-visualization__detail">
            <span className="module-upgrade-visualization__detail-label">Current Level:</span>
            <span className="module-upgrade-visualization__detail-value">{module.level}</span>
          </div>
          <div className="module-upgrade-visualization__detail">
            <span className="module-upgrade-visualization__detail-label">Upgrade Time:</span>
            <span className="module-upgrade-visualization__detail-value">
              {formatTimeRemaining(totalDuration)}
            </span>
          </div>
          <div className="module-upgrade-visualization__detail">
            <span className="module-upgrade-visualization__detail-label">Status:</span>
            <span className="module-upgrade-visualization__detail-value">{currentStatus}</span>
          </div>
        </div>
      )}

      {isUpgrading && (
        <div className="module-upgrade-visualization__progress-container">
          <div className="module-upgrade-visualization__progress-info">
            <div className="module-upgrade-visualization__stage">
              {upgradeStages[currentStage]?.name || 'Upgrading'}
            </div>
            <div className="module-upgrade-visualization__percentage">{progress}%</div>
          </div>

          <div className="module-upgrade-visualization__progress-bar">
            <div
              className="module-upgrade-visualization__progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {showDetails && (
            <div className="module-upgrade-visualization__stage-description">
              {upgradeStages[currentStage]?.description || 'Upgrading module'}
            </div>
          )}

          {estimatedTimeRemaining !== null && (
            <div className="module-upgrade-visualization__time-remaining">
              Estimated time remaining: {formatTimeRemaining(estimatedTimeRemaining)}
            </div>
          )}

          <div className="module-upgrade-visualization__stages">
            {upgradeStages.map((stage, index) => (
              <div
                key={index}
                className={`module-upgrade-visualization__stage-marker ${index === currentStage ? 'module-upgrade-visualization__stage-marker--active' : ''} ${index < currentStage ? 'module-upgrade-visualization__stage-marker--completed' : ''} `}
                style={{ left: `${stage.startPercentage}%` }}
                title={stage.name}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="module-upgrade-visualization__controls">
        {!isUpgrading ? (
          <button
            className="module-upgrade-visualization__start-btn"
            onClick={handleStartUpgrade}
            disabled={currentStatus === 'upgrading'}
          >
            Start Upgrade
          </button>
        ) : (
          <button
            className="module-upgrade-visualization__cancel-btn"
            onClick={handleCancelUpgrade}
          >
            Cancel Upgrade
          </button>
        )}
      </div>
    </div>
  );
}

const styles = `
.module-upgrade-visualization {
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid #6c757d;
}

.module-upgrade-visualization--active {
  border-left-color: #007bff;
  background-color: #f0f7ff;
}

.module-upgrade-visualization--error {
  border-left-color: #dc3545;
}

.module-upgrade-visualization__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.module-upgrade-visualization__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.module-upgrade-visualization__level {
  font-weight: 600;
  color: #007bff;
}

.module-upgrade-visualization__details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.module-upgrade-visualization__detail {
  display: flex;
  flex-direction: column;
}

.module-upgrade-visualization__detail-label {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}

.module-upgrade-visualization__detail-value {
  font-weight: 500;
}

.module-upgrade-visualization__progress-container {
  margin-bottom: 20px;
  position: relative;
}

.module-upgrade-visualization__progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.module-upgrade-visualization__stage {
  font-weight: 500;
}

.module-upgrade-visualization__percentage {
  font-weight: 600;
  color: #007bff;
}

.module-upgrade-visualization__progress-bar {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.module-upgrade-visualization__progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.5s ease-in-out;
}

.module-upgrade-visualization__stage-description {
  font-size: 14px;
  color: #495057;
  margin-bottom: 10px;
}

.module-upgrade-visualization__time-remaining {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 15px;
  text-align: right;
}

.module-upgrade-visualization__stages {
  position: relative;
  height: 30px;
  margin-bottom: 10px;
}

.module-upgrade-visualization__stage-marker {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e9ecef;
  border: 2px solid #adb5bd;
  color: #495057;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transform: translateX(-50%);
  transition: all 0.3s ease;
}

.module-upgrade-visualization__stage-marker--active {
  background-color: #007bff;
  border-color: #0056b3;
  color: white;
  transform: translateX(-50%) scale(1.15);
}

.module-upgrade-visualization__stage-marker--completed {
  background-color: #28a745;
  border-color: #1e7e34;
  color: white;
}

.module-upgrade-visualization__controls {
  display: flex;
  justify-content: center;
}

.module-upgrade-visualization__start-btn,
.module-upgrade-visualization__cancel-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.module-upgrade-visualization__start-btn {
  background-color: #007bff;
  color: white;
}

.module-upgrade-visualization__start-btn:hover {
  background-color: #0056b3;
}

.module-upgrade-visualization__start-btn:disabled {
  background-color: #b6d4fe;
  cursor: not-allowed;
}

.module-upgrade-visualization__cancel-btn {
  background-color: #dc3545;
  color: white;
}

.module-upgrade-visualization__cancel-btn:hover {
  background-color: #c82333;
}

.module-upgrade-visualization__error {
  color: #dc3545;
  text-align: center;
  padding: 20px;
}
`;

// Add the styles to the document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
