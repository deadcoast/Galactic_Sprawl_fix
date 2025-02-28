import React, { useState, useEffect } from 'react';
import { useModuleUpgrade } from '../../../hooks/modules/useModuleUpgrade';
import { ModuleVisualChange } from '../../../managers/module/ModuleUpgradeManager';

interface ModuleUpgradeVisualizationProps {
  moduleId: string;
  quality?: 'low' | 'medium' | 'high';
  onComplete?: () => void;
}

/**
 * Component for visualizing module upgrades with animations and effects
 */
export const ModuleUpgradeVisualization: React.FC<ModuleUpgradeVisualizationProps> = ({
  moduleId,
  quality = 'medium',
  onComplete
}) => {
  const { upgradeStatus, upgradeProgress } = useModuleUpgrade(moduleId);
  const [visualChanges, setVisualChanges] = useState<ModuleVisualChange[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  // Get particle count based on quality
  const getParticleCount = () => {
    switch (quality) {
      case 'low':
        return 10;
      case 'medium':
        return 25;
      case 'high':
        return 50;
      default:
        return 25;
    }
  };

  // Get animation duration based on quality
  const getAnimationDuration = () => {
    switch (quality) {
      case 'low':
        return 1500;
      case 'medium':
        return 2000;
      case 'high':
        return 3000;
      default:
        return 2000;
    }
  };

  // Update visual changes when upgrade status changes
  useEffect(() => {
    if (upgradeStatus?.nextLevel?.visualChanges) {
      setVisualChanges(upgradeStatus.nextLevel.visualChanges);
    }
  }, [upgradeStatus]);

  // Handle completion
  useEffect(() => {
    if (upgradeProgress === 1 && !isComplete) {
      setIsComplete(true);
      
      // Call onComplete after animation finishes
      const timeout = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, getAnimationDuration() + 500);
      
      return () => clearTimeout(timeout);
    }
  }, [upgradeProgress, isComplete, onComplete]);

  // If no upgrade in progress, don't render anything
  if (upgradeProgress === undefined) {
    return null;
  }

  // Get module type color
  const getModuleTypeColor = () => {
    if (!upgradeStatus) {
      return 'blue';
    }
    
    switch (upgradeStatus.moduleType) {
      case 'radar':
        return 'cyan';
      case 'hangar':
        return 'violet';
      case 'academy':
        return 'amber';
      case 'exploration':
        return 'green';
      case 'mineral':
        return 'orange';
      case 'trading':
        return 'yellow';
      case 'population':
        return 'pink';
      case 'infrastructure':
        return 'gray';
      case 'research':
        return 'indigo';
      case 'food':
        return 'lime';
      case 'defense':
        return 'red';
      default:
        return 'blue';
    }
  };

  const color = getModuleTypeColor();
  const particleCount = getParticleCount();
  const animationDuration = getAnimationDuration();

  return (
    <div className="module-upgrade-visualization">
      {/* Background overlay */}
      <div 
        className="module-upgrade-visualization__overlay"
        style={{
          opacity: upgradeProgress * 0.5
        }}
      />

      {/* Energy field */}
      <div
        className={`module-upgrade-visualization__energy-field module-upgrade-visualization__energy-field--${color}`}
        style={{
          opacity: upgradeProgress,
          transform: `scale(${1 + upgradeProgress * 0.5})`
        }}
      />

      {/* Expansion rings */}
      <div className="module-upgrade-visualization__expansion-rings">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`module-upgrade-visualization__expansion-ring module-upgrade-visualization__expansion-ring--${color}`}
            style={{
              transform: `scale(${1 + upgradeProgress * 0.3 * (i + 1)}) rotate(${upgradeProgress * 90}deg)`,
              opacity: 1 - upgradeProgress * 0.7
            }}
          />
        ))}
      </div>

      {/* Upgrade particles */}
      <div className="module-upgrade-visualization__particles">
        {Array.from({ length: Math.ceil(particleCount * upgradeProgress) }).map((_, i) => (
          <div
            key={i}
            className={`module-upgrade-visualization__particle module-upgrade-visualization__particle--${color}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg) scale(${1 + upgradeProgress})`,
              opacity: 0.5 + upgradeProgress * 0.5,
              animationDuration: `${Math.random() * 2 + 1}s`
            }}
          />
        ))}
      </div>

      {/* Progress ring */}
      <svg className="module-upgrade-visualization__progress-ring" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          className={`module-upgrade-visualization__progress-circle module-upgrade-visualization__progress-circle--${color}`}
          strokeDasharray={`${upgradeProgress * 283} 283`}
          transform="rotate(-90 50 50)"
        />
      </svg>

      {/* Level indicator */}
      {upgradeStatus && (
        <div className="module-upgrade-visualization__level-indicator">
          <div className="module-upgrade-visualization__current-level">
            Level {upgradeStatus.currentLevel}
          </div>
          <div className="module-upgrade-visualization__level-arrow">→</div>
          <div className="module-upgrade-visualization__next-level">
            Level {upgradeStatus.currentLevel + 1}
          </div>
        </div>
      )}

      {/* Visual changes */}
      {visualChanges.length > 0 && (
        <div className="module-upgrade-visualization__visual-changes">
          {visualChanges.map((change, index) => (
            <div 
              key={index}
              className={`module-upgrade-visualization__visual-change module-upgrade-visualization__visual-change--${change.type}`}
              style={{
                opacity: upgradeProgress,
                transform: `scale(${upgradeProgress})`
              }}
            >
              <div className="module-upgrade-visualization__visual-change-label">
                {change.type}
              </div>
              <div className="module-upgrade-visualization__visual-change-value">
                {change.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completion flash */}
      {isComplete && (
        <div 
          className={`module-upgrade-visualization__completion-flash module-upgrade-visualization__completion-flash--${color}`}
          style={{
            animationDuration: `${animationDuration}ms`
          }}
        />
      )}
    </div>
  );
}; 