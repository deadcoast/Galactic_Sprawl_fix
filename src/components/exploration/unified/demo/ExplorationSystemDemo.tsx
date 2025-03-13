/**
 * ExplorationSystemDemo Component
 *
 * A demo component showcasing the unified exploration system.
 * This component provides sample data and configuration for the GalaxyExplorationSystem.
 */

import * as React from 'react';
import { useState } from 'react';
import { GalaxyExplorationSystem } from '../';
import {
  Anomaly,
  AnomalyType,
  DangerLevel,
  DetailLevel,
  ExplorationStatus,
  InvestigationStage,
  MapTheme,
  Sector,
  StarSystem,
  StarType,
  TradeRoute,
} from '../../../../types/exploration/unified/ExplorationTypes';
import { ResourceType as ResourceTypeString } from '../../../../types/resources/ResourceTypes';

/**
 * Generate sample exploration data
 */
function generateSampleData() {
  // Generate sectors
  const sectors: Sector[] = [];
  for (let i = 0; i < 10; i++) {
    sectors.push({
      id: `sector-${i}`,
      name: `Sector ${String.fromCharCode(65 + i)}`,
      type: 'sector',
      discoveredAt: Date.now() - Math.random() * 1000000,
      coordinates: {
        id: `coord-sector-${i}`,
        x: (Math.random() - 0.5) * 1000,
        y: (Math.random() - 0.5) * 1000,
        z: (Math.random() - 0.5) * 100,
        sector: `sector-${i}`,
      },
      explorationStatus: [
        ExplorationStatus.UNDISCOVERED,
        ExplorationStatus.DETECTED,
        ExplorationStatus.SCANNED,
        ExplorationStatus.ANALYZED,
        ExplorationStatus.FULLY_EXPLORED,
      ][Math.floor(Math.random() * 5)],
      systems: [],
      resources: [],
      anomalies: [],
      tradeRoutes: [],
      dangerLevel: [
        DangerLevel.NONE,
        DangerLevel.LOW,
        DangerLevel.MODERATE,
        DangerLevel.HIGH,
        DangerLevel.EXTREME,
      ][Math.floor(Math.random() * 5)],
      environmentalConditions: [],
      accessibility: Math.floor(Math.random() * 100), // 0-100 scale
    });
  }

  // Generate systems
  const systems: (StarSystem & { tradeRoutes: TradeRoute[] })[] = [];
  for (let i = 0; i < 30; i++) {
    const sectorIndex = Math.floor(Math.random() * sectors.length);
    const sector = sectors[sectorIndex];

    // Position relative to sector
    const offsetX = (Math.random() - 0.5) * 300;
    const offsetY = (Math.random() - 0.5) * 300;

    systems.push({
      id: `system-${i}`,
      name: `System ${i + 1}`,
      type: 'system',
      starType: Object.values(StarType)[Math.floor(Math.random() * Object.values(StarType).length)],
      discoveredAt: Date.now() - Math.random() * 1000000,
      coordinates: {
        id: `coord-system-${i}`,
        x: sector.coordinates.x + offsetX,
        y: sector.coordinates.y + offsetY,
        z: (Math.random() - 0.5) * 50,
        sector: sector.id,
      },
      explorationStatus: [
        ExplorationStatus.UNDISCOVERED,
        ExplorationStatus.DETECTED,
        ExplorationStatus.SCANNED,
        ExplorationStatus.ANALYZED,
        ExplorationStatus.FULLY_EXPLORED,
      ][Math.floor(Math.random() * 5)],
      planets: [],
      sectorId: sector.id,
      asteroidBelts: [],
      jumpPoints: [],
      specialFeatures: [],
      tradeRoutes: [],
    });

    // Add system to sector
    sector.systems.push(systems[i]);
  }

  // Generate anomalies
  const anomalies: Anomaly[] = [];
  for (let i = 0; i < 20; i++) {
    const sectorIndex = Math.floor(Math.random() * sectors.length);
    const sector = sectors[sectorIndex];

    // Position relative to sector
    const offsetX = (Math.random() - 0.5) * 300;
    const offsetY = (Math.random() - 0.5) * 300;

    anomalies.push({
      id: `anomaly-${i}`,
      name: `Anomaly ${i + 1}`,
      type: 'anomaly',
      anomalyType:
        Object.values(AnomalyType)[Math.floor(Math.random() * Object.values(AnomalyType).length)],
      intensity: Math.floor(Math.random() * 100),
      stability: Math.floor(Math.random() * 100),
      discoveredAt: Date.now() - Math.random() * 1000000,
      coordinates: {
        id: `coord-anomaly-${i}`,
        x: sector.coordinates.x + offsetX,
        y: sector.coordinates.y + offsetY,
        z: (Math.random() - 0.5) * 50,
        sector: sector.id,
      },
      explorationStatus: [
        ExplorationStatus.UNDISCOVERED,
        ExplorationStatus.DETECTED,
        ExplorationStatus.SCANNED,
        ExplorationStatus.ANALYZED,
        ExplorationStatus.FULLY_EXPLORED,
      ][Math.floor(Math.random() * 5)],
      composition: [],
      effects: [],
      investigation: {
        status: InvestigationStage.NOT_STARTED,
        progress: 0,
        findings: [],
        requiredEquipment: [],
        recommendedActions: [],
      },
      potentialUses: [],
      dangerLevel: [
        DangerLevel.NONE,
        DangerLevel.LOW,
        DangerLevel.MODERATE,
        DangerLevel.HIGH,
        DangerLevel.EXTREME,
      ][Math.floor(Math.random() * 5)],
    });

    // Add anomaly to sector
    sector.anomalies.push(anomalies[i]);
  }

  // Generate trade routes
  const tradeRoutes: TradeRoute[] = [];
  for (let i = 0; i < 15; i++) {
    // Select two random systems
    const sourceIndex = Math.floor(Math.random() * systems.length);
    let targetIndex = Math.floor(Math.random() * systems.length);
    while (targetIndex === sourceIndex) {
      targetIndex = Math.floor(Math.random() * systems.length);
    }

    const source = systems[sourceIndex];
    const target = systems[targetIndex];

    tradeRoutes.push({
      id: `route-${i}`,
      name: `Route ${i + 1}`,
      sourceId: source.id,
      targetId: target.id,
      resourceTypes: ['minerals', 'energy'] as ResourceTypeString[],
      volume: Math.floor(Math.random() * 100),
      security: Math.floor(Math.random() * 100),
      distance: Math.floor(Math.random() * 1000),
      travelTime: Math.floor(Math.random() * 1000),
    });

    // Add route to sectors
    source.tradeRoutes.push(tradeRoutes[i]);
    target.tradeRoutes.push(tradeRoutes[i]);
  }

  return {
    sectors,
    systems,
    anomalies,
    tradeRoutes,
  };
}

/**
 * Props for ExplorationSystemDemo
 */
export interface ExplorationSystemDemoProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

/**
 * ExplorationSystemDemo Component
 */
export const ExplorationSystemDemo: React.FC<ExplorationSystemDemoProps> = ({
  width = '100%',
  height = 800,
  className,
}) => {
  // Generate sample data
  const sampleData = React.useMemo(() => generateSampleData(), []);

  // Data fetcher (simulates API call)
  const dataFetcher = React.useCallback(async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return sample data
    return sampleData;
  }, [sampleData]);

  // Quality settings
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(DetailLevel.MEDIUM);
  const [theme, setTheme] = useState<MapTheme>(MapTheme.STANDARD);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center gap-4 rounded-md bg-gray-100 p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Detail Level:</label>
          <select
            value={detailLevel}
            onChange={e => setDetailLevel(e.target.value as DetailLevel)}
            className="rounded-md border border-gray-300 p-1 text-sm"
          >
            <option value={DetailLevel.LOW}>Low</option>
            <option value={DetailLevel.MEDIUM}>Medium</option>
            <option value={DetailLevel.HIGH}>High</option>
            <option value={DetailLevel.ULTRA}>Ultra</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Theme:</label>
          <select
            value={theme}
            onChange={e => setTheme(e.target.value as MapTheme)}
            className="rounded-md border border-gray-300 p-1 text-sm"
          >
            <option value={MapTheme.STANDARD}>Standard</option>
            <option value={MapTheme.DARK}>Dark</option>
            <option value={MapTheme.LIGHT}>Light</option>
            <option value={MapTheme.TACTICAL}>Tactical</option>
          </select>
        </div>

        <div className="flex-grow"></div>

        <p className="text-sm text-gray-500">
          Click on entities to select them. Use the Analysis button to analyze selected entities.
        </p>
      </div>

      {/* Main component */}
      <GalaxyExplorationSystem
        width={width}
        height={height}
        className={className}
        initialViewMode="split-view"
        initialDataTableView="sectors"
        initialLayoutMode="horizontal"
        initialVisualSettings={{
          detailLevel,
          theme,
          showGrid: true,
          showLabels: true,
          showResourceIcons: true,
          showAnomalyIcons: true,
          showTradeRoutes: true,
        }}
        allowVisualSettingsChange={true}
        allowLayoutChange={true}
        showToolbar={true}
        showStatusBar={true}
        initialData={sampleData}
        dataFetcher={dataFetcher}
      />
    </div>
  );
};

export default ExplorationSystemDemo;
