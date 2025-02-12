import { ChevronRight, Database, Pickaxe, Settings, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface Resource {
  id: string;
  name: string;
  type: "mineral" | "gas" | "exotic";
  abundance: number;
  distance: number;
  extractionRate: number;
  depletion: number;
  priority: number;
  thresholds: {
    min: number;
    max: number;
  };
}

interface TechBonuses {
  extractionRate: number;
  storageCapacity: number;
  efficiency: number;
}

interface MiningExperience {
  baseAmount: number;
  bonusFactors: {
    resourceRarity: number; // Exotic > Gas > Mineral
    extractionEfficiency: number;
    resourceQuality: number; // Based on abundance
    distanceModifier: number; // Further = more XP
    techBonus: number; // Bonus from tech tree upgrades
  };
  totalXP: number; // Calculated total XP
  unlockedTech: string[]; // Tech tree nodes that can be unlocked - removed optional
}

interface MiningControlsProps {
  resource: Resource;
  techBonuses: TechBonuses;
  onExperienceGained: (experience: MiningExperience) => void;
}

export function MiningControls({
  resource,
  techBonuses,
  onExperienceGained,
}: MiningControlsProps) {
  const [autoMine, setAutoMine] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [totalResourcesMined, setTotalResourcesMined] = useState(0);

  // Calculate mining efficiency with tech bonuses
  const effectiveExtractionRate =
    resource.extractionRate * techBonuses.extractionRate;
  const effectiveEfficiency = Math.min(1, techBonuses.efficiency);

  // Calculate experience gains
  useEffect(() => {
    if (!autoMine) {
      return;
    }

    const miningInterval = setInterval(() => {
      // Update mining progress
      setMiningProgress((prev) => {
        const newProgress =
          prev + effectiveExtractionRate * effectiveEfficiency;
        if (newProgress >= 100) {
          // Resource batch completed
          setTotalResourcesMined((total) => total + 1);

          // Calculate and award experience
          const experience: MiningExperience = {
            baseAmount: 10,
            bonusFactors: {
              resourceRarity:
                resource.type === "exotic"
                  ? 3
                  : resource.type === "gas"
                    ? 2
                    : 1,
              extractionEfficiency: effectiveEfficiency,
              resourceQuality: resource.abundance,
              distanceModifier: Math.min(2, resource.distance / 500),
              techBonus:
                (techBonuses.extractionRate + techBonuses.efficiency) / 2,
            },
            totalXP: 0,
            unlockedTech: [], // Initialize as empty array
          };

          // Calculate total XP with all bonuses
          experience.totalXP =
            experience.baseAmount *
            Object.values(experience.bonusFactors).reduce(
              (acc, factor) => acc * factor,
              1,
            );

          // Check for tech tree unlocks based on total XP
          if (experience.totalXP >= 100) {
            experience.unlockedTech = ["improved-extraction"];
          }
          if (experience.totalXP >= 250) {
            experience.unlockedTech.push("processing-algorithms");
          }
          if (experience.totalXP >= 500) {
            experience.unlockedTech.push("exotic-mining");
          }

          onExperienceGained(experience);
          return 0;
        }
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(miningInterval);
  }, [
    autoMine,
    resource,
    effectiveExtractionRate,
    effectiveEfficiency,
    onExperienceGained,
    techBonuses,
  ]);

  return (
    <div className="space-y-6">
      {/* Resource Info */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${
                resource.type === "mineral"
                  ? "bg-cyan-500/20"
                  : resource.type === "gas"
                    ? "bg-purple-500/20"
                    : "bg-amber-500/20"
              }`}
            >
              {resource.type === "mineral" ? (
                <Pickaxe className="w-5 h-5 text-cyan-400" />
              ) : resource.type === "gas" ? (
                <Database className="w-5 h-5 text-purple-400" />
              ) : (
                <Star className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-white">{resource.name}</h3>
              <div className="text-sm text-gray-400">
                {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}{" "}
                • {resource.distance}ly
              </div>
            </div>
          </div>
          <Settings className="w-5 h-5 text-gray-400" />
        </div>

        {/* Mining Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Mining Progress</span>
            <span className="text-gray-300">{Math.round(miningProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                resource.type === "mineral"
                  ? "bg-cyan-500"
                  : resource.type === "gas"
                    ? "bg-purple-500"
                    : "bg-amber-500"
              }`}
              style={{ width: `${miningProgress}%` }}
            />
          </div>
        </div>

        {/* Tech Bonuses */}
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-400">Tech Bonuses</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-gray-800 rounded">
              <div className="text-xs text-gray-400">Extraction Rate</div>
              <div className="text-sm text-green-400">
                +{Math.round((techBonuses.extractionRate - 1) * 100)}%
              </div>
            </div>
            <div className="p-2 bg-gray-800 rounded">
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
          className={`mt-4 w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2 ${
            autoMine
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <span>{autoMine ? "Stop Mining" : "Start Mining"}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mining Stats */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">
          Mining Statistics
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400">Resources Mined</div>
            <div className="text-lg font-medium text-white">
              {totalResourcesMined}
            </div>
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
