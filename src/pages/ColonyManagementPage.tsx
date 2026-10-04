import * as React from 'react';
import { useState } from 'react';
import { ColonyManagementSystem } from '../components/buildings/colony/ColonyManagementSystem';
import { ResourceType } from './../types/resources/ResourceTypes';

// Sample data for demo
const sampleGrowthModifiers = [
  {
    id: 'mod-1',
    name: 'Advanced Hydroponics',
    description: 'Efficient food production using advanced hydroponics technology.',
    effect: 1.12, // +12%
    type: ResourceType.FOOD as const,
    active: true,
  },
  {
    id: 'mod-2',
    name: 'Modular Housing Units',
    description: 'Expandable housing units that can be quickly deployed.',
    effect: 1.08, // +8%
    type: 'housing' as const,
    active: true,
  },
  {
    id: 'mod-3',
    name: 'Medical Nanites',
    description: 'Nanoscale medical robots that improve health and longevity.',
    effect: 1.15, // +15%
    type: 'healthcare' as const,
    active: false,
  },
  {
    id: 'mod-4',
    name: 'Atmospheric Processors',
    description: 'Advanced systems that improve air quality and climate control.',
    effect: 1.1, // +10%
    type: 'environment' as const,
    active: true,
  },
  {
    id: 'mod-5',
    name: 'Fusion Reactors',
    description: 'Clean and efficient energy production.',
    effect: 1.05, // +5%
    type: ResourceType.ENERGY as const,
    active: true,
  },
];

const sampleTradePartners = [
  {
    id: 'partner-1',
    name: 'New Terra',
    distance: 3.2,
    position: { x: 0.5, y: -0.3 },
  },
  {
    id: 'partner-2',
    name: 'Proxima Station',
    distance: 1.8,
    position: { x: -0.7, y: 0.2 },
  },
  {
    id: 'partner-3',
    name: 'Helios Mining Outpost',
    distance: 5.4,
    position: { x: 0.2, y: 0.8 },
  },
  {
    id: 'partner-4',
    name: 'Centauri Research Base',
    distance: 4.1,
    position: { x: -0.4, y: -0.6 },
  },
  {
    id: 'partner-5',
    name: 'Vega Trading Hub',
    distance: 7.3,
    position: { x: 0.9, y: 0.1 },
  },
];

const sampleTradeRoutes = [
  {
    id: 'route-1',
    partnerId: 'partner-1',
    status: 'active' as const,
    resources: [
      {
        id: 'resource-1-1',
        name: ResourceType.FOOD,
        type: 'import' as const,
        amount: 75,
        value: 15,
      },
      {
        id: 'resource-1-2',
        name: 'technology',
        type: 'export' as const,
        amount: 45,
        value: 22,
      },
    ],
    efficiency: 0.92,
    lastTradeTime: Date.now() - 3600000, // 1 hour ago
  },
  {
    id: 'route-2',
    partnerId: 'partner-2',
    status: 'active' as const,
    resources: [
      {
        id: 'resource-2-1',
        name: ResourceType.MINERALS,
        type: 'import' as const,
        amount: 120,
        value: 18,
      },
      {
        id: 'resource-2-2',
        name: 'medicine',
        type: 'export' as const,
        amount: 30,
        value: 25,
      },
    ],
    efficiency: 0.88,
    lastTradeTime: Date.now() - 7200000, // 2 hours ago
  },
  {
    id: 'route-3',
    partnerId: 'partner-3',
    status: 'disrupted' as const,
    resources: [
      {
        id: 'resource-3-1',
        name: ResourceType.MINERALS,
        type: 'import' as const,
        amount: 200,
        value: 20,
      },
    ],
    efficiency: 0.75,
    lastTradeTime: Date.now() - 86400000, // 1 day ago
  },
  {
    id: 'route-4',
    partnerId: 'partner-4',
    status: 'pending' as const,
    resources: [
      {
        id: 'resource-4-1',
        name: 'technology',
        type: 'import' as const,
        amount: 50,
        value: 30,
      },
      {
        id: 'resource-4-2',
        name: 'luxury',
        type: 'export' as const,
        amount: 25,
        value: 40,
      },
    ],
    efficiency: 0.85,
    lastTradeTime: Date.now() - 43200000, // 12 hours ago
  },
];

const samplePopulationEvents = [
  {
    id: 'event-1',
    timestamp: Date.now() - 86400000 * 7, // 7 days ago
    type: 'growth' as const,
    amount: 150,
    reason: 'Natural population growth',
  },
  {
    id: 'event-2',
    timestamp: Date.now() - 86400000 * 5, // 5 days ago
    type: 'migration' as const,
    amount: 300,
    reason: 'New settlers arrived from Earth',
  },
  {
    id: 'event-3',
    timestamp: Date.now() - 86400000 * 3, // 3 days ago
    type: 'decline' as const,
    amount: -75,
    reason: 'Resource shortage caused emigration',
  },
  {
    id: 'event-4',
    timestamp: Date.now() - 86400000 * 1, // 1 day ago
    type: 'policy' as const,
    amount: 200,
    reason: 'New family incentive policy implemented',
  },
  {
    id: 'event-5',
    timestamp: Date.now() - 3600000 * 12, // 12 hours ago
    type: 'growth' as const,
    amount: 50,
    reason: 'Natural population growth',
  },
];

// Sample buildings for colony map
const sampleBuildings = [
  {
    id: 'building-1',
    type: 'housing' as const,
    name: 'Residential Complex A',
    level: 2,
    position: { x: 60, y: 80 },
    size: { width: 60, height: 40 },
    status: 'operational' as const,
  },
  {
    id: 'building-2',
    type: 'industry' as const,
    name: 'Manufacturing Plant',
    level: 1,
    position: { x: 140, y: 60 },
    size: { width: 80, height: 60 },
    status: 'operational' as const,
  },
  {
    id: 'building-3',
    type: 'agriculture' as const,
    name: 'Hydroponics Bay',
    level: 3,
    position: { x: 240, y: 100 },
    size: { width: 100, height: 80 },
    status: 'operational' as const,
  },
  {
    id: 'building-4',
    type: ResourceType.ENERGY as const,
    name: 'Fusion Reactor',
    level: 2,
    position: { x: 180, y: 200 },
    size: { width: 50, height: 50 },
    status: 'operational' as const,
  },
  {
    id: 'building-5',
    type: ResourceType.RESEARCH as const,
    name: 'Research Laboratory',
    level: 1,
    position: { x: 100, y: 180 },
    size: { width: 60, height: 40 },
    status: 'upgrading' as const,
  },
  {
    id: 'building-6',
    type: 'infrastructure' as const,
    name: 'Water Reclamation',
    level: 1,
    position: { x: 280, y: 220 },
    size: { width: 40, height: 40 },
    status: 'constructing' as const,
  },
];

// Sample resources for resource dashboard
const sampleResources = [
  {
    type: ResourceType.ENERGY as const,
    name: 'Energy',
    production: 1200,
    consumption: 950,
    storage: 5000,
    capacity: 10000,
  },
  {
    type: 'materials' as const,
    name: 'Materials',
    production: 800,
    consumption: 750,
    storage: 3500,
    capacity: 5000,
  },
  {
    type: ResourceType.FOOD as const,
    name: 'Food',
    production: 600,
    consumption: 550,
    storage: 2800,
    capacity: 4000,
  },
  {
    type: ResourceType.RESEARCH as const,
    name: 'Research',
    production: 300,
    consumption: 300,
    storage: 1500,
    capacity: 2000,
  },
  {
    type: 'technology' as const,
    name: 'Technology',
    production: 150,
    consumption: 120,
    storage: 800,
    capacity: 1000,
  },
];

// Sample satisfaction factors
const sampleSatisfactionFactors = [
  {
    type: 'housing' as const,
    name: 'Housing',
    value: 85,
    weight: 0.25,
  },
  {
    type: ResourceType.FOOD as const,
    name: 'Food Supply',
    value: 92,
    weight: 0.2,
  },
  {
    type: 'healthcare' as const,
    name: 'Healthcare',
    value: 78,
    weight: 0.2,
  },
  {
    type: ResourceType.ENERGY as const,
    name: 'Energy Supply',
    value: 95,
    weight: 0.15,
  },
  {
    type: 'security' as const,
    name: 'Security',
    value: 70,
    weight: 0.2,
  },
];

/**
 * ColonyManagementPage component
 *
 * Demo page for the Colony Management System
 */
export function ColonyManagementPage() {
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Handle quality change
  const handleQualityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setQuality(event?.target.value as 'low' | 'medium' | 'high');
  };

  // Handle building click
  const handleBuildingClick = (buildingId: string) => {
    console.warn(`Building clicked: ${buildingId}`);
  };

  // Handle resource click
  const handleResourceClick = (resourceType: ResourceType | 'technology' | 'materials') => {
    console.warn(`Resource clicked: ${resourceType}`);
  };

  return (
    <div className="gs-route-shell">
      <div className="gs-route-container p-1 sm:p-2">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="gs-page-title">Colony Management</h1>
          <div className="flex items-center space-x-2">
            <label htmlFor="quality" className="text-sm text-slate-300">
              Visual Quality:
            </label>
            <select
              id="quality"
              value={quality}
              onChange={handleQualityChange}
              className="gs-control text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ColonyManagementSystem
            colonyId="alpha-centauri-1"
            colonyName="Alpha Centauri Outpost"
            initialPopulation={5000}
            maxPopulation={15000}
            baseGrowthRate={0.05}
            initialGrowthModifiers={sampleGrowthModifiers}
            initialTradePartners={sampleTradePartners}
            initialTradeRoutes={sampleTradeRoutes}
            initialPopulationEvents={samplePopulationEvents}
            initialBuildings={sampleBuildings}
            initialResources={sampleResources}
            initialSatisfactionFactors={sampleSatisfactionFactors}
            quality={quality}
            onPopulationChange={newPopulation => {
              console.warn(`Population changed to ${newPopulation}`);
            }}
            onTradeRouteChange={routes => {
              console.warn(
                `Trade routes updated, active routes: ${routes.filter(r => r.status === 'active').length}`
              );
            }}
            onGrowthModifierChange={modifiers => {
              console.warn(
                `Growth modifiers updated, active modifiers: ${modifiers.filter(m => m.active).length}`
              );
            }}
            onBuildingClick={handleBuildingClick}
            onResourceClick={handleResourceClick}
          />

          <ColonyManagementSystem
            colonyId="tau-ceti-2"
            colonyName="Tau Ceti Mining Colony"
            initialPopulation={2500}
            maxPopulation={8000}
            baseGrowthRate={0.03}
            initialGrowthModifiers={sampleGrowthModifiers.slice(0, 3)}
            initialTradePartners={sampleTradePartners.slice(1, 4)}
            initialTradeRoutes={sampleTradeRoutes.slice(0, 2)}
            initialPopulationEvents={samplePopulationEvents.slice(2, 5)}
            initialBuildings={sampleBuildings.slice(1, 4)}
            initialResources={sampleResources.slice(0, 3)}
            initialSatisfactionFactors={sampleSatisfactionFactors.slice(0, 4)}
            quality={quality}
          />
        </div>
      </div>
    </div>
  );
}

export default ColonyManagementPage;
