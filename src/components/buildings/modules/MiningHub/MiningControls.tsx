/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { ChevronRight, Database, Pickaxe, Settings, Star } from 'lucide-react';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  MiningExperience,
  MiningResource,
  MiningTechBonuses,
} from '../../../../types/mining/MiningTypes';
import { ResourceType } from '../../../../types/resources/StandardizedResourceTypes';

interface MiningControlsProps {
  resource: MiningResource;
  techBonuses: MiningTechBonuses;
  onExperienceGained: (experience: MiningExperience) => void;
}

export function MiningControls({ resource, techBonuses, onExperienceGained }: MiningControlsProps) {
  const [autoMine, setAutoMine] = React.useState(false);
  const [miningProgress, setMiningProgress] = React.useState(0);
  const [totalResourcesMined, setTotalResourcesMined] = React.useState(0);

  // Memoize mining efficiency calculations
  const { effectiveExtractionRate, effectiveEfficiency } = useMemo(
    () => ({
      effectiveExtractionRate: resource.extractionRate * techBonuses.extractionRate,
      effectiveEfficiency: Math.min(1, techBonuses.efficiency),
    }),
    [resource.extractionRate, techBonuses.extractionRate, techBonuses.efficiency]
  );

  // Memoize experience calculation function
  const calculateExperience = useCallback(() => {
    const experience: MiningExperience = {
      baseAmount: 10,
      bonusFactors: {
        resourceRarity: resource.type === 'exotic' ? 3 : resource.type === 'gas' ? 2 : 1,
        extractionEfficiency: effectiveEfficiency,
        resourceQuality: resource.abundance,
        distanceModifier: Math.min(2, resource.distance / 500),
        techBonus: (techBonuses.extractionRate + techBonuses.efficiency) / 2,
      },
      totalXP: 0,
      unlockedTech: [], // Initialize as empty array
    };

    // Calculate total XP with all bonuses
    experience.totalXP =
      experience.baseAmount *
      Object.values(experience.bonusFactors).reduce<number>((acc, factor) => {
        // Ensure factor is a number
        const numericFactor = typeof factor === 'number' ? factor : 0;
        return acc * numericFactor;
      }, 1);

    // Check for tech tree unlocks based on total XP
    if (experience.totalXP >= 100) {
      experience.unlockedTech = ['improved-extraction'];
    }
    if (experience.totalXP >= 250) {
      experience.unlockedTech.push('processing-algorithms');
    }
    if (experience.totalXP >= 500) {
      experience.unlockedTech.push('exotic-mining');
    }

    return experience;
  }, [resource.type, resource.abundance, resource.distance, effectiveEfficiency, techBonuses]);

  // Effect for mining progress
  useEffect(() => {
    if (!autoMine) {
      return;
    }

    const miningInterval = setInterval(() => {
      // Update mining progress
      setMiningProgress(prev => {
        const newProgress = prev + effectiveExtractionRate * effectiveEfficiency;
        if (newProgress >= 100) {
          // Resource batch completed
          setTotalResourcesMined(total => total + 1);

          // Calculate and award experience
          const experience = calculateExperience();
          onExperienceGained(experience);
          return 0;
        }
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(miningInterval);
  }, [
    autoMine,
    effectiveExtractionRate,
    effectiveEfficiency,
    calculateExperience,
    onExperienceGained,
  ]);

  return (
    <div className="space-y-6">
      {/* Resource Info */}
      <div className="rounded-lg bg-gray-800/50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`rounded-lg p-2 ${
                resource.type === ResourceType.MINERALS
                  ? 'bg-cyan-500/20'
                  : resource.type === ResourceType.GAS
                    ? 'bg-purple-500/20'
                    : 'bg-amber-500/20'
              }`}
            >
              {resource.type === ResourceType.MINERALS ? (
                <Pickaxe className="h-5 w-5 text-cyan-400" />
              ) : resource.type === ResourceType.GAS ? (
                <Database className="h-5 w-5 text-purple-400" />
              ) : (
                <Star className="h-5 w-5 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-white">{resource.name}</h3>
              <div className="text-sm text-gray-400">
                {resource.type.toString().charAt(0).toUpperCase() +
                  resource.type.toString().slice(1)}{' '}
                • {resource.distance}ly
              </div>
            </div>
          </div>
          <Settings className="h-5 w-5 text-gray-400" />
        </div>

        {/* Mining Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Mining Progress</span>
            <span className="text-gray-300">{Math.round(miningProgress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${
                resource.type === ResourceType.MINERALS
                  ? 'bg-cyan-500'
                  : resource.type === ResourceType.GAS
                    ? 'bg-purple-500'
                    : 'bg-amber-500'
              }`}
              style={{ width: `${miningProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Tech Bonuses */}
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-400">Tech Bonuses</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-gray-800 p-2">
              <div className="text-xs text-gray-400">Extraction Rate</div>
              <div className="text-sm text-green-400">
                +{Math.round((techBonuses.extractionRate - 1) * 100)}%
              </div>
            </div>
            <div className="rounded bg-gray-800 p-2">
              <div className="text-xs text-gray-400">Efficiency</div>
              <div className="text-sm text-green-400">
                +{Math.round((techBonuses.efficiency - 1) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Mine Toggle */}
        <button
          onClick={() => setAutoMine(!autoMine)}
          className={`mt-4 flex w-full items-center justify-center space-x-2 rounded-lg px-4 py-2 ${
            autoMine ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <span>{autoMine ? 'Stop Mining' : 'Start Mining'}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Mining Stats */}
      <div className="rounded-lg bg-gray-800/50 p-4">
        <h4 className="mb-3 text-sm font-medium text-gray-300">Mining Statistics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400">Resources Mined</div>
            <div className="text-lg font-medium text-white">{totalResourcesMined}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Efficiency</div>
            <div className="text-lg font-medium text-white">
              {Math.round(effectiveEfficiency * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
