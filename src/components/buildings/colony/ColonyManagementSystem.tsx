import {
  BarChart,
  Building2,
  ChevronDown,
  ChevronUp,
  Leaf,
  Map,
  Package,
  Settings,
  Smile,
  Truck,
  Users,
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useModuleEvents } from '../../../hooks/events/useModuleEvents';
import { ModuleEvent } from '../../../lib/events/ModuleEventBus';
import { EventType } from '../../../types/events/EventTypes';
import { PopulationProjectionChart } from '../../exploration/visualizations/PopulationProjectionChart';
import { ResourceType } from './../../../types/resources/ResourceTypes';
import { AutomatedPopulationManager } from './AutomatedPopulationManager';
import { ColonyMap } from './ColonyMap';
import { GrowthRateModifiers } from './GrowthRateModifiers';
import { PopulationGrowthModule } from './PopulationGrowthModule';
import { ResourceDashboard } from './ResourceDashboard';
import { SatisfactionMeter } from './SatisfactionMeter';
import { TradeRouteVisualization } from './TradeRouteVisualization';

// Types from existing components
interface GrowthModifier {
  id: string;
  name: string;
  description: string;
  effect: number; // Percentage modifier (e.g., 1.1 = +10%)
  type: ResourceType.FOOD | 'housing' | 'healthcare' | 'environment' | ResourceType.ENERGY;
  active: boolean;
}

interface TradePartner {
  id: string;
  name: string;
  distance: number; // Distance in light years or other unit
  position: { x: number; y: number }; // Relative position for visualization
}

interface TradeResource {
  id: string;
  name: string;
  type: 'import' | 'export';
  amount: number;
  value: number;
}

interface TradeRoute {
  id: string;
  partnerId: string;
  status: 'active' | 'pending' | 'disrupted';
  resources: TradeResource[];
  efficiency: number; // 0-1 efficiency factor
  lastTradeTime: number; // Timestamp of last trade
}

interface PopulationEvent {
  id: string;
  timestamp: number;
  type: 'growth' | 'decline' | 'migration' | 'disaster' | 'policy';
  amount: number;
  reason: string;
}

// New types for additional components
interface BuildingData {
  id: string;
  type:
    | 'housing'
    | 'industry'
    | 'agriculture'
    | ResourceType.ENERGY
    | ResourceType.RESEARCH
    | 'infrastructure';
  name: string;
  level: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  status: 'operational' | 'constructing' | 'upgrading' | 'damaged' | 'inactive';
}

interface ResourceData {
  type:
    | ResourceType.ENERGY
    | 'materials'
    | ResourceType.FOOD
    | ResourceType.RESEARCH
    | 'technology'
    | ResourceType.POPULATION;
  name: string;
  production: number;
  consumption: number;
  storage: number;
  capacity: number;
}

interface SatisfactionFactor {
  type: 'housing' | ResourceType.FOOD | 'healthcare' | ResourceType.ENERGY | 'security';
  name: string;
  value: number; // 0-100
  weight: number; // 0-1, sum of all weights should be 1
}

interface ColonyManagementSystemProps {
  colonyId: string;
  colonyName: string;
  initialPopulation?: number;
  maxPopulation?: number;
  baseGrowthRate?: number;
  initialGrowthModifiers?: GrowthModifier[];
  initialTradePartners?: TradePartner[];
  initialTradeRoutes?: TradeRoute[];
  initialPopulationEvents?: PopulationEvent[];
  initialBuildings?: BuildingData[];
  initialResources?: ResourceData[];
  initialSatisfactionFactors?: SatisfactionFactor[];
  quality?: 'low' | 'medium' | 'high';
  onPopulationChange?: (newPopulation: number) => void;
  onTradeRouteChange?: (routes: TradeRoute[]) => void;
  onGrowthModifierChange?: (modifiers: GrowthModifier[]) => void;
  onBuildingClick?: (buildingId: string) => void;
  onResourceClick?: (resourceType: ResourceData['type']) => void;
}

// Type guards
function isColonyStatsEvent(
  event: ModuleEvent
): event is ModuleEvent & { data: { stats: { [ResourceType.POPULATION]: number } } } {
  return (
    event?.data !== undefined &&
    typeof event.data === 'object' &&
    event.data !== null &&
    'stats' in event.data &&
    typeof event.data.stats === 'object' &&
    event.data.stats !== null &&
    ResourceType.POPULATION in event.data.stats &&
    typeof event.data.stats[ResourceType.POPULATION] === 'number'
  );
}

function isResourceUpdateEvent(event: ModuleEvent): event is ModuleEvent & {
  data: { resourceAmounts: Record<ResourceData['type'], number> };
} {
  return (
    event?.data !== undefined &&
    typeof event.data === 'object' &&
    event.data !== null &&
    'resourceAmounts' in event.data &&
    typeof event.data.resourceAmounts === 'object' &&
    event.data.resourceAmounts !== null
  );
}

function isTradeRouteEvent(event: ModuleEvent): event is ModuleEvent & {
  data: { partnerId: string; tradeResources: ResourceData['type'][] };
} {
  return (
    event?.data !== undefined &&
    typeof event.data === 'object' &&
    event.data !== null &&
    'partnerId' in event.data &&
    'tradeResources' in event.data &&
    Array.isArray(event.data.tradeResources)
  );
}

/**
 * ColonyManagementSystem component
 *
 * Main component for managing a colony, integrating population growth,
 * trade routes, and growth modifiers.
 */
export function ColonyManagementSystem({
  colonyId,
  colonyName,
  initialPopulation = 1000,
  maxPopulation = 10000,
  baseGrowthRate = 0.05,
  initialGrowthModifiers = [],
  initialTradePartners = [],
  initialTradeRoutes = [],
  initialPopulationEvents = [],
  initialBuildings = [],
  initialResources = [],
  initialSatisfactionFactors = [],
  quality = 'medium',
  onPopulationChange,
  onTradeRouteChange,
  onGrowthModifierChange,
  onBuildingClick,
  onResourceClick,
}: ColonyManagementSystemProps) {
  // State
  const [population, setPopulation] = useState(initialPopulation);
  const [growthModifiers, setGrowthModifiers] = useState(initialGrowthModifiers);
  const [tradePartners] = useState(initialTradePartners);
  const [tradeRoutes, setTradeRoutes] = useState(initialTradeRoutes);
  const [populationEvents, setPopulationEvents] = useState(initialPopulationEvents);
  const [buildings] = useState(initialBuildings);
  const [resources, _setResources] = useState(initialResources);
  const [satisfactionFactors] = useState(initialSatisfactionFactors);
  const [autoGrowthEnabled, setAutoGrowthEnabled] = useState(false);
  const [cycleLength, setCycleLength] = useState(60000); // 1 minute default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    population: true,
    trade: false,
    modifiers: false,
    automation: false,
    map: false,
    resources: false,
    satisfaction: false,
    projection: false,
  });

  // Subscribe to colony events using the new hook
  const { subscribe } = useModuleEvents();

  // Event handlers
  const handleModuleUpdate = useCallback(
    (event: ModuleEvent) => {
      if (event?.moduleId === colonyId && isColonyStatsEvent(event)) {
        handlePopulationChange(event?.data?.stats[ResourceType.POPULATION]);
      }
    },
    [colonyId]
  );

  const handleResourceUpdate = useCallback(
    (event: ModuleEvent) => {
      if (event?.moduleId === colonyId && isResourceUpdateEvent(event)) {
        const updatedResources = resources.map(resource => ({
          ...resource,
          storage: event?.data?.resourceAmounts[resource.type] ?? resource.storage,
        }));
        _setResources(updatedResources);
      }
    },
    [colonyId, resources]
  );

  const handleTradeRouteUpdate = useCallback(
    (event: ModuleEvent) => {
      if (event?.moduleId === colonyId && isTradeRouteEvent(event)) {
        const updatedRoutes = tradeRoutes.map(route => ({
          ...route,
          resources: event?.data?.tradeResources.map(resource => ({
            id: `${resource}-${Date.now()}`,
            name: String(resource),
            type: 'import' as const,
            amount: 0,
            value: 0,
          })),
        }));
        setTradeRoutes(updatedRoutes);
        onTradeRouteChange?.(updatedRoutes);
      }
    },
    [colonyId, tradeRoutes, onTradeRouteChange]
  );

  // Subscribe to events
  useEffect(() => {
    const unsubModuleUpdate = subscribe(EventType.MODULE_UPDATED, handleModuleUpdate);
    const unsubResourceUpdate = subscribe(EventType.RESOURCE_UPDATED, handleResourceUpdate);
    const unsubTradeRouteUpdate = subscribe(EventType.RESOURCE_TRANSFERRED, handleTradeRouteUpdate);

    return () => {
      unsubModuleUpdate();
      unsubResourceUpdate();
      unsubTradeRouteUpdate();
    };
  }, [subscribe, handleModuleUpdate, handleResourceUpdate, handleTradeRouteUpdate]);

  // Calculate effective growth rate based on active modifiers
  const calculateEffectiveGrowthRate = useCallback(() => {
    const activeModifiers = growthModifiers.filter(m => m.active);

    if (activeModifiers.length === 0) {
      return baseGrowthRate;
    }

    const totalEffect = activeModifiers.reduce((total, modifier) => {
      return total * modifier.effect;
    }, 1);

    return baseGrowthRate * totalEffect;
  }, [baseGrowthRate, growthModifiers]);

  // Handle population change
  const handlePopulationChange = useCallback(
    (newPopulation: number) => {
      setPopulation(newPopulation);

      // Add population event and emit event
      const growthAmount = newPopulation - population;
      if (growthAmount !== 0) {
        const newEvent: PopulationEvent = {
          id: `event-${Date.now()}`,
          timestamp: Date.now(),
          type: growthAmount > 0 ? 'growth' : 'decline',
          amount: growthAmount,
          reason: growthAmount > 0 ? 'Natural population growth' : 'Natural population decline',
        };

        setPopulationEvents(prev => [newEvent, ...prev]);

        // Create and emit population change event
        const event: ModuleEvent = {
          type: EventType.MODULE_UPDATED,
          moduleId: colonyId,
          moduleType: ResourceType.POPULATION,
          timestamp: Date.now(),
          data: {
            stats: {
              [ResourceType.POPULATION]: newPopulation,
            },
          },
        };

        // Emit the event to all subscribers
        handleModuleUpdate(event);
      }

      // Call external handler
      onPopulationChange?.(newPopulation);
    },
    [colonyId, population, onPopulationChange, handleModuleUpdate]
  );

  // Handle modifier toggle
  const handleModifierToggle = (modifierId: string, active: boolean) => {
    setGrowthModifiers(prev => prev.map(mod => (mod.id === modifierId ? { ...mod, active } : mod)));
  };

  // Handle modifier add
  const handleModifierAdd = (type: GrowthModifier['type']) => {
    // Generate a new modifier based on type
    const newModifier: GrowthModifier = {
      id: `modifier-${Date.now()}`,
      name: getDefaultModifierName(type),
      description: getDefaultModifierDescription(type),
      effect: getDefaultModifierEffect(type),
      type,
      active: true,
    };

    setGrowthModifiers(prev => [...prev, newModifier]);

    // Call external handler
    onGrowthModifierChange?.([...growthModifiers, newModifier]);
  };

  // Handle modifier remove
  const handleModifierRemove = (modifierId: string) => {
    setGrowthModifiers(prev => prev.filter(mod => mod.id !== modifierId));

    // Call external handler
    onGrowthModifierChange?.(growthModifiers.filter(mod => mod.id !== modifierId));
  };

  // Handle trade route click
  const handleRouteClick = (routeId: string) => {
    // Toggle route status on click
    setTradeRoutes(prev =>
      prev.map(route =>
        route.id === routeId
          ? {
              ...route,
              status: getNextRouteStatus(route.status),
            }
          : route
      )
    );

    // Call external handler
    onTradeRouteChange?.(
      tradeRoutes.map(route =>
        route.id === routeId
          ? {
              ...route,
              status: getNextRouteStatus(route.status),
            }
          : route
      )
    );
  };

  // Handle partner click
  const handlePartnerClick = (partnerId: string) => {
    // Find if there's a route with this partner
    const existingRoute = tradeRoutes.find(r => r.partnerId === partnerId);

    if (existingRoute) {
      // If route exists, toggle its status
      handleRouteClick(existingRoute.id);
    } else {
      // If no route exists, create a new one
      const newRoute: TradeRoute = {
        id: `route-${Date.now()}`,
        partnerId,
        status: 'pending',
        resources: generateRandomResources(partnerId),
        efficiency: 0.8 + Math.random() * 0.2, // 0.8-1.0
        lastTradeTime: Date.now(),
      };

      setTradeRoutes(prev => [...prev, newRoute]);

      // Call external handler
      onTradeRouteChange?.([...tradeRoutes, newRoute]);
    }
  };

  // Handle auto growth toggle
  const handleAutoGrowthToggle = (enabled: boolean) => {
    setAutoGrowthEnabled(enabled);
  };

  // Handle cycle settings change
  const handleCycleSettingsChange = (settings: { cycleLength: number }) => {
    setCycleLength(settings.cycleLength);
  };

  // Handle building click
  const handleBuildingClick = (buildingId: string) => {
    // Call external handler
    onBuildingClick?.(buildingId);
  };

  // Handle resource click
  const handleResourceClick = (resourceType: ResourceData['type']) => {
    // Call external handler
    onResourceClick?.(resourceType);
  };

  // Handle satisfaction factor click
  const handleSatisfactionFactorClick = (factorType: SatisfactionFactor['type']) => {
    // Toggle the corresponding section based on factor type
    switch (factorType) {
      case 'housing':
      case ResourceType.FOOD:
      case 'healthcare':
      case ResourceType.ENERGY:
        // These factors correspond to modifiers, so expand the modifiers section
        setExpandedSections(prev => ({
          ...prev,
          modifiers: true,
        }));
        break;
      case 'security':
        // Security might be related to buildings, so expand the map section
        setExpandedSections(prev => ({
          ...prev,
          map: true,
        }));
        break;
      default:
        break;
    }
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper functions
  const getNextRouteStatus = (status: TradeRoute['status']): TradeRoute['status'] => {
    switch (status) {
      case 'active':
        return 'disrupted';
      case 'disrupted':
        return 'pending';
      case 'pending':
        return 'active';
      default:
        return 'pending';
    }
  };

  const getDefaultModifierName = (type: GrowthModifier['type']): string => {
    switch (type) {
      case ResourceType.FOOD:
        return 'Improved Agriculture';
      case 'housing':
        return 'Expanded Housing';
      case 'healthcare':
        return 'Advanced Medical Facilities';
      case 'environment':
        return 'Environmental Adaptation';
      case ResourceType.ENERGY:
        return 'Energy Grid Optimization';
      default:
        return 'New Modifier';
    }
  };

  const getDefaultModifierDescription = (type: GrowthModifier['type']): string => {
    switch (type) {
      case ResourceType.FOOD:
        return 'Improved agricultural techniques increase food production and population growth.';
      case 'housing':
        return 'Expanded housing capacity allows for more population growth.';
      case 'healthcare':
        return 'Advanced medical facilities improve population health and growth.';
      case 'environment':
        return 'Environmental adaptations make the colony more habitable.';
      case ResourceType.ENERGY:
        return 'Optimized energy grid supports more population infrastructure.';
      default:
        return 'A new modifier affecting population growth.';
    }
  };

  const getDefaultModifierEffect = (type: GrowthModifier['type']): number => {
    switch (type) {
      case ResourceType.FOOD:
        return 1.15; // +15%
      case 'housing':
        return 1.1; // +10%
      case 'healthcare':
        return 1.08; // +8%
      case 'environment':
        return 1.12; // +12%
      case ResourceType.ENERGY:
        return 1.05; // +5%
      default:
        return 1.1; // +10%
    }
  };

  const generateRandomResources = (partnerId: string): TradeResource[] => {
    const resourceTypes = [
      ResourceType.MINERALS,
      ResourceType.FOOD,
      'technology',
      'luxury',
      'medicine',
      ResourceType.ENERGY,
    ];
    const resourceCount = 1 + Math.floor(Math.random() * 3); // 1-3 resources
    const resources: TradeResource[] = [];

    for (let i = 0; i < resourceCount; i++) {
      const isImport = Math.random() > 0.5;
      resources.push({
        id: `resource-${partnerId}-${i}`,
        name: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
        type: isImport ? 'import' : 'export',
        amount: 10 + Math.floor(Math.random() * 90), // 10-100
        value: 5 + Math.floor(Math.random() * 20), // 5-25
      });
    }

    return resources;
  };

  // Section header component
  const SectionHeader = ({
    title,
    icon,
    isExpanded,
    onToggle,
  }: {
    title: string;
    icon: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
  }) => (
    <div
      className="flex cursor-pointer items-center justify-between rounded-t-lg border border-gray-700 bg-gray-800 p-3"
      onClick={onToggle}
    >
      <div className="flex items-center space-x-2">
        {icon}
        <h3 className="text-lg font-medium text-white">{title}</h3>
      </div>
      {isExpanded ? (
        <ChevronUp className="h-5 w-5 text-gray-400" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-400" />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{colonyName}</h2>
            <p className="text-sm text-gray-400">Colony ID: {colonyId}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-lg font-medium text-white">{population.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-amber-400" />
              <span className="text-lg font-medium text-white">{buildings.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-green-400" />
              <span className="text-lg font-medium text-white">
                {tradeRoutes.filter(r => r.status === 'active').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Population Growth Section */}
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <SectionHeader
          title="Population Growth"
          icon={<Users className="h-5 w-5 text-blue-400" />}
          isExpanded={expandedSections.population}
          onToggle={() => toggleSection(ResourceType.POPULATION)}
        />

        {expandedSections.population && (
          <div className="border-t border-gray-700 bg-gray-900 p-4">
            <PopulationGrowthModule
              colonyId={colonyId}
              currentPopulation={population}
              maxPopulation={maxPopulation}
              baseGrowthRate={baseGrowthRate}
              growthModifiers={growthModifiers}
              cycleLength={cycleLength}
              quality={quality}
              onPopulationChange={handlePopulationChange}
              onModifierToggle={handleModifierToggle}
            />
          </div>
        )}
      </div>

      {/* Population Projection Section */}
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <SectionHeader
          title="Population Projection"
          icon={<BarChart className="h-5 w-5 text-blue-400" />}
          isExpanded={expandedSections.projection}
          onToggle={() => toggleSection('projection')}
        />

        {expandedSections.projection && (
          <div className="border-t border-gray-700 bg-gray-900 p-4">
            <PopulationProjectionChart
              currentPopulation={population}
              maxPopulation={maxPopulation}
              growthRate={calculateEffectiveGrowthRate()}
              cycleLength={cycleLength}
              projectionCycles={10}
            />
          </div>
        )}
      </div>

      {/* Trade Routes Section */}
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <SectionHeader
          title="Trade Routes"
          icon={<Truck className="h-5 w-5 text-green-400" />}
          isExpanded={expandedSections.trade}
          onToggle={() => toggleSection('trade')}
        />

        {expandedSections.trade && (
          <div className="border-t border-gray-700 bg-gray-900 p-4">
            <TradeRouteVisualization
              colonyName={colonyName}
              tradePartners={tradePartners}
              tradeRoutes={tradeRoutes}
              quality={quality}
              onRouteClick={handleRouteClick}
              onPartnerClick={handlePartnerClick}
            />
          </div>
        )}
      </div>

      {/* Growth Modifiers Section */}
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <SectionHeader
          title="Growth Modifiers"
          icon={<Leaf className="h-5 w-5 text-green-400" />}
          isExpanded={expandedSections.modifiers}
          onToggle={() => toggleSection('modifiers')}
        />

        {expandedSections.modifiers && (
          <div className="border-t border-gray-700 bg-gray-900 p-4">
            <GrowthRateModifiers
              colonyId={colonyId}
              baseGrowthRate={baseGrowthRate}
              modifiers={growthModifiers}
              onModifierToggle={handleModifierToggle}
              onModifierAdd={handleModifierAdd}
              onModifierRemove={handleModifierRemove}
            />
          </div>
        )}
      </div>

      {/* Colony Map Section */}
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <SectionHeader
          title="Colony Map"
          icon={<Map className="h-5 w-5 text-amber-400" />}
          isExpanded={expandedSections.map}
          onToggle={() => toggleSection('map')}
        />

        {expandedSections.map && (
          <div className="border-t border-gray-700 bg-gray-900 p-4">
            <ColonyMap
              colonyId={colonyId}
              buildings={buildings}
              population={population}
              maxPopulation={maxPopulation}
              quality={quality}
              onBuildingClick={handleBuildingClick}
            />
          </div>
        )}
      </div>

      {/* Resources Section */}
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <SectionHeader
          title="Resources"
          icon={<Package className="h-5 w-5 text-amber-400" />}
          isExpanded={expandedSections.resources}
          onToggle={() => toggleSection('resources')}
        />

        {expandedSections.resources && (
          <div className="border-t border-gray-700 bg-gray-900 p-4">
            <ResourceDashboard
              colonyId={colonyId}
              resources={resources}
              onResourceClick={handleResourceClick}
            />
          </div>
        )}
      </div>

      {/* Satisfaction Section */}
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <SectionHeader
          title="Colony Satisfaction"
          icon={<Smile className="h-5 w-5 text-green-400" />}
          isExpanded={expandedSections.satisfaction}
          onToggle={() => toggleSection('satisfaction')}
        />

        {expandedSections.satisfaction && (
          <div className="border-t border-gray-700 bg-gray-900 p-4">
            <SatisfactionMeter
              colonyId={colonyId}
              factors={satisfactionFactors}
              onFactorClick={handleSatisfactionFactorClick}
            />
          </div>
        )}
      </div>

      {/* Automation Section */}
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <SectionHeader
          title="Automation"
          icon={<Settings className="h-5 w-5 text-blue-400" />}
          isExpanded={expandedSections.automation}
          onToggle={() => toggleSection('automation')}
        />

        {expandedSections.automation && (
          <div className="border-t border-gray-700 bg-gray-900 p-4">
            <AutomatedPopulationManager
              colonyId={colonyId}
              currentPopulation={population}
              maxPopulation={maxPopulation}
              growthRate={calculateEffectiveGrowthRate()}
              cycleLength={cycleLength}
              autoGrowthEnabled={autoGrowthEnabled}
              events={populationEvents}
              onPopulationChange={handlePopulationChange}
              onAutoGrowthToggle={handleAutoGrowthToggle}
              onSettingsChange={handleCycleSettingsChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
