import { CentralMothership } from "../../effects/component_effects/CentralMothership";
import { ColonyStarStation } from "../../effects/component_effects/ColonyStarStation";
import { ExplorationHub } from "../../effects/component_effects/ExplorationHub";
import { HabitableWorld } from "../../effects/component_effects/HabitableWorld";
import { MineralProcessing } from "../../effects/component_effects/MineralProcessing";
import { ModuleUpgradeTransition } from "../../effects/component_effects/ModuleUpgradeTransition";
import { PopulationIndicator } from "../../effects/component_effects/PopulationIndicator";
import { StarSystemBackdrop } from "../../effects/component_effects/StarSystemBackdrop";
import { useScalingSystem } from "../../hooks/game/useScalingSystem";
import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface VPRStarSystemViewProps {
  empireName: string;
  onModuleSelect?: (moduleId: string) => void;
}

export function VPRStarSystemView({
  empireName,
  onModuleSelect,
}: VPRStarSystemViewProps) {
  const [dayNightCycle, setDayNightCycle] = useState(0);
  const [alerts, setAlerts] = useState<{ moduleId: string; message: string }[]>(
    [],
  );
  const [upgrading, setUpgrading] = useState<{
    moduleId: string;
    fromTier: 1 | 2;
    toTier: 2 | 3;
    moduleType: "radar" | "dockingBay" | "processor";
  } | null>(null);

  // Performance scaling
  const scaling = useScalingSystem();
  const quality =
    scaling.performance.fps > 45
      ? "high"
      : scaling.performance.fps > 30
        ? "medium"
        : "low";

  // Mock data for demonstration
  const systemData = useMemo(
    () => ({
      mothership: {
        tier: 2 as 1 | 2 | 3,
        health: 850,
        maxHealth: 1000,
        shield: 400,
        maxShield: 500,
        power: 750,
        maxPower: 1000,
      },
      colony: {
        name: "Alpha Station",
        tier: 2 as 1 | 2 | 3,
        modules: [
          {
            id: "residential-1",
            type: "residential" as const,
            population: 500,
            efficiency: 0.8,
            status: "active" as const,
          },
          {
            id: "commercial-1",
            type: "commercial" as const,
            population: 300,
            efficiency: 0.9,
            status: "active" as const,
          },
        ],
        population: 800,
        maxPopulation: 1000,
        resourceOutput: 150,
      },
      habitableWorld: {
        name: "Terra Nova",
        type: "terran" as const,
        population: 5000,
        maxPopulation: 10000,
        resources: ["Iron", "Titanium"],
        developmentLevel: 0.6,
        cityLightIntensity: 0.7,
        anomalies: [
          { type: "warning" as const, message: "Unstable tectonic activity" },
        ],
      },
      exploration: {
        tier: 2 as 1 | 2 | 3,
        ships: [
          {
            id: "recon-1",
            name: "Scout Alpha",
            position: { x: 30, y: 40 },
            status: "scanning" as const,
            discoveredAnomalies: 3,
          },
        ],
        mappedArea: 6000,
        totalArea: 10000,
        anomalies: [
          {
            id: "anomaly-1",
            position: { x: 60, y: 70 },
            type: "artifact" as const,
            severity: "high" as const,
            investigated: false,
          },
        ],
      },
      mineralProcessing: {
        tier: 2 as 1 | 2 | 3,
        nodes: [
          {
            id: "iron-1",
            type: "Iron",
            amount: 800,
            maxAmount: 1000,
            extractionRate: 10,
            priority: 1,
            status: "active" as const,
          },
        ],
        totalOutput: 100,
        efficiency: 0.85,
      },
    }),
    [],
  );

  // Monitor system conditions
  useEffect(() => {
    const checkSystemConditions = () => {
      const newAlerts: { moduleId: string; message: string }[] = [];

      if (
        systemData.mothership.health <
        systemData.mothership.maxHealth * 0.3
      ) {
        newAlerts.push({
          moduleId: "mothership",
          message: "Critical hull damage detected",
        });
      }

      if (
        systemData.colony.population >
        systemData.colony.maxPopulation * 0.9
      ) {
        newAlerts.push({
          moduleId: "colony",
          message: "Colony approaching maximum capacity",
        });
      }

      setAlerts(newAlerts);
    };

    const interval = setInterval(checkSystemConditions, 5000);
    return () => clearInterval(interval);
  }, [systemData]);

  // Day/Night cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setDayNightCycle((prev) => (prev + 0.001) % 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleUpgradeComplete = () => {
    setUpgrading(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      {/* Empire Title */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl font-bold text-white">
          {empireName} Star System
        </h1>
      </div>

      {/* Dynamic Background */}
      <StarSystemBackdrop quality={quality} dayNightCycle={dayNightCycle} />

      {/* Central Mothership */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <CentralMothership
          {...systemData.mothership}
          quality={quality}
          onHover={() => {}}
          onClick={() => onModuleSelect?.("mothership")}
        />
      </div>

      {/* Colony Star Station */}
      <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <ColonyStarStation
          {...systemData.colony}
          quality={quality}
          onClick={() => onModuleSelect?.("colony")}
        />
      </div>

      {/* Habitable World */}
      <div className="absolute right-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <HabitableWorld
          {...systemData.habitableWorld}
          quality={quality}
          onClick={() => onModuleSelect?.("planet")}
        />
      </div>

      {/* Exploration Hub */}
      <div className="absolute left-1/3 bottom-1/4 -translate-x-1/2">
        <ExplorationHub
          {...systemData.exploration}
          quality={quality}
          onShipSelect={(shipId) => onModuleSelect?.(`ship-${shipId}`)}
          onAnomalyClick={(anomalyId) =>
            onModuleSelect?.(`anomaly-${anomalyId}`)
          }
        />
      </div>

      {/* Mineral Processing */}
      <div className="absolute right-1/3 bottom-1/4 -translate-x-1/2">
        <MineralProcessing
          {...systemData.mineralProcessing}
          quality={quality}
          onNodeClick={(nodeId) => onModuleSelect?.(`node-${nodeId}`)}
        />
      </div>

      {/* Population Indicators */}
      <div className="absolute left-1/4 top-1/4 -translate-x-1/2 -translate-y-1/2">
        <PopulationIndicator
          population={systemData.colony.population}
          maxPopulation={systemData.colony.maxPopulation}
          growthRate={0.05}
          quality={quality}
        />
      </div>

      {/* Alert Overlay */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {alerts.map((alert) => (
          <div
            key={`${alert.moduleId}-${alert.message}`}
            className="px-4 py-2 bg-red-900/80 text-red-200 rounded-lg backdrop-blur-sm flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{alert.message}</span>
          </div>
        ))}
      </div>

      {upgrading && (
        <ModuleUpgradeTransition
          fromTier={upgrading.fromTier}
          toTier={upgrading.toTier}
          moduleType={upgrading.moduleType}
          quality={quality}
          onComplete={handleUpgradeComplete}
        />
      )}
    </div>
  );
}
