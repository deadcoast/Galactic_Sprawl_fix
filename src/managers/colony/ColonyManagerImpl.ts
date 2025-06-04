import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../services/logging/ErrorLoggingService';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { getResourceManager } from '../ManagerRegistry';
import { ResourceType } from './../../types/resources/ResourceTypes';

// Create an instance of ResourceManager
const resourceManager = getResourceManager();

interface ColonyStats {
  population: number;
  happiness: number;
  infrastructure: number;
  research: number;
  foodProduction: number;
  energyProduction: number;
}

// Add a ResearchBenefits interface
export interface ResearchBenefits {
  resourceBonus?: Record<ResourceType, number>;
  infrastructureBonus?: number;
  populationBonus?: number;
  happinessBonus?: number;
  unlocks?: string[];
  [key: string]: unknown;
}

// Remove ColonyEvent interface
// export interface ColonyEvent extends BaseEvent {
//   type: EventType;
//   moduleId: string;
//   moduleType: ModuleType;
//   data: ColonyEventData;
// }

// Remove ColonyEventData interface
// export interface ColonyEventData extends Record<string, unknown> {
//   colonyId?: string;
//   stats?: ColonyStats;
//   resourceAmounts?: Record<string, number>;
//   type?: string;
//   level?: number;
//   amount?: number;
//   partnerId?: string;
//   tradeResources?: ResourceType[];
//   threatLevel?: number;
//   project?: string;
//   benefits?: ResearchBenefits;
//   protocol?: string;
// }

// Remove isColonyEvent type guard
// export function isColonyEvent(event: unknown): event is ColonyEvent {
//   if (!event || typeof event !== 'object') return false;
//   const e = event as ColonyEvent;
//   return (
//     'type' in e &&
//     'moduleId' in e &&
//     'moduleType' in e &&
//     'data' in e &&
//     typeof e.type === 'string' &&
//     typeof e.moduleId === 'string' &&
//     typeof e.moduleType === 'string' &&
//     typeof e.data === 'object'
//   );
// }

// Type guards for specific data structures within BaseEvent.data
function isResourceUpdateData(
  data: unknown
): data is { colonyId: string; resourceAmounts: Record<string, number> } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'colonyId' in data &&
    typeof data.colonyId === 'string' &&
    'resourceAmounts' in data &&
    typeof data.resourceAmounts === 'object' &&
    data.resourceAmounts !== null
  );
}

function isResourceShortageData(data: unknown): data is { colonyId: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'colonyId' in data &&
    typeof data.colonyId === 'string'
  );
}

function isTechUnlockData(data: unknown): data is { colonyId: string; project: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'colonyId' in data &&
    typeof data.colonyId === 'string' &&
    'project' in data &&
    typeof data.project === 'string'
  );
}

// Change generic type to BaseEvent
export class ColonyManagerImpl extends AbstractBaseManager<BaseEvent> {
  private colonies: Map<
    string,
    {
      id: string;
      name: string;
      level: number;
      stats: ColonyStats;
      tradeRoutes: Set<string>;
      activeResearch: Set<string>;
      emergencyProtocols: Set<string>;
    }
  > = new Map();

  // Use protected constructor (Implicit from AbstractBaseManager)
  // constructor() {
  //   super('ColonyManager');
  //   // Initialization moved to onInitialize
  // }

  /**
   * Initialize event handlers for colony-related events
   */
  private initializeEventHandlers(): void {
    // Subscribe to relevant events - handlers now expect BaseEvent
    this.unsubscribeFunctions.push(
      this.subscribe(EventType.RESOURCE_UPDATED, this.handleResourceUpdate.bind(this)),
      this.subscribe(EventType.RESOURCE_SHORTAGE, this.handleResourceShortage.bind(this)),
      this.subscribe(EventType.TECH_UNLOCKED, this.handleTechUnlock.bind(this))
    );
  }

  // Update handler signature to accept BaseEvent
  private handleResourceUpdate(event: BaseEvent): void {
    // Use type guard to check event.data
    if (event.data && isResourceUpdateData(event.data)) {
      const { colonyId, resourceAmounts } = event.data;
      this.updateColonyResources(colonyId, resourceAmounts);
    }
  }

  // Update handler signature to accept BaseEvent
  private handleResourceShortage(event: BaseEvent): void {
    // Use type guard to check event.data
    if (event.data && isResourceShortageData(event.data)) {
      const { colonyId } = event.data;
      this.activateEmergencyProtocol(colonyId, 'resource_shortage');
    }
  }

  // Update handler signature to accept BaseEvent
  private handleTechUnlock(event: BaseEvent): void {
    // Use type guard to check event.data
    if (event.data && isTechUnlockData(event.data)) {
      const { colonyId, project } = event.data;
      this.applyTechBenefits(colonyId, project);
    }
  }

  private updateColonyResources(colonyId: string, resources: Record<string, number>): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) return;

    // Update colony stats based on resources
    this.updateStats(colonyId, {
      foodProduction: resources.food || colony.stats.foodProduction,
      energyProduction: resources.energy || colony.stats.energyProduction,
    });
  }

  private applyTechBenefits(colonyId: string, project: string): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) return;

    // Apply tech benefits
    this.publish({
      type: EventType.TECH_UPDATED,
      managerId: this.managerName, // Ensure managerId is present
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType, // Ensure moduleType is present
      timestamp: Date.now(),
      data: {
        project,
        colonyId,
        stats: colony.stats,
      },
    });
  }

  private initializeAutomationRules(): void {
    // TODO: Ensure automationManager is available (e.g., retrieved from registry in onInitialize)
    // This might need to run in onInitialize after getting the manager instance.
    // For now, comment out the direct usage.
    // colonyRules.forEach(rule => {
    //   automationManager.registerRule(rule);
    // });
  }

  public registerColony(id: string, name: string, initialStats: Partial<ColonyStats> = {}): void {
    const defaultStats: ColonyStats = {
      population: 100,
      happiness: 100,
      infrastructure: 1,
      research: 0,
      foodProduction: 10,
      energyProduction: 10,
    };

    this.colonies.set(id, {
      id,
      name,
      level: 1,
      stats: { ...defaultStats, ...initialStats },
      tradeRoutes: new Set(),
      activeResearch: new Set(),
      emergencyProtocols: new Set(),
    });

    // Emit initialization event
    this.publish({
      type: EventType.MODULE_ACTIVATED,
      managerId: this.managerName,
      moduleId: id,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { name, stats: defaultStats },
    });
  }

  public updateStats(colonyId: string, updates: Partial<ColonyStats>): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    colony.stats = { ...colony.stats, ...updates };
    this.publish({
      type: EventType.MODULE_UPDATED,
      managerId: this.managerName,
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { colonyId, stats: colony.stats },
    });

    // Check for level up
    this.checkForLevelUp(colonyId);
  }

  private checkForLevelUp(colonyId: string): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    const { population, infrastructure } = colony.stats;
    const newLevel = Math.floor(Math.sqrt(population * infrastructure) / 100);

    if (newLevel > colony.level) {
      colony.level = newLevel;
      this.publish({
        type: EventType.MODULE_UPGRADED,
        managerId: this.managerName,
        moduleId: colonyId,
        moduleType: 'colony' as ModuleType,
        timestamp: Date.now(),
        data: { level: newLevel },
      });
    }
  }

  public distributeResources(colonyId: string): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    // Calculate resource needs based on population and infrastructure
    const resourceNeeds = this.calculateResourceNeeds(colony);

    // Distribute resources
    Object.entries(resourceNeeds).forEach(([resource, amount]) => {
      // Convert string resource to ResourceType enum
      let resourceType: ResourceType;
      switch (resource) {
        case ResourceType.FOOD:
          resourceType = ResourceType.POPULATION; // Using POPULATION as a proxy for food
          break;
        case ResourceType.ENERGY:
          resourceType = ResourceType.ENERGY;
          break;
        case ResourceType.MINERALS:
          resourceType = ResourceType.MINERALS;
          break;
        default:
          resourceType = ResourceType.MINERALS; // Default case
      }
      resourceManager.transferResources(resourceType, amount, 'storage', colonyId);
    });

    this.publish({
      type: EventType.RESOURCE_TRANSFERRED,
      managerId: this.managerName,
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { colonyId, resourceAmounts: resourceNeeds },
    });
  }

  private calculateResourceNeeds(
    colony: NonNullable<ReturnType<typeof this.colonies.get>>
  ): Record<string, number> {
    const { population, infrastructure } = colony.stats;

    return {
      food: Math.ceil(population * 0.5),
      energy: Math.ceil(population * 0.3 + infrastructure * 10),
      minerals: Math.ceil(infrastructure * 5),
    };
  }

  public buildInfrastructure(colonyId: string, type: string): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    // Check resource requirements
    const requirements = this.getInfrastructureRequirements(type, colony.level);
    if (!this.hasRequiredResources(requirements)) {
      return;
    }

    // Consume resources
    Object.entries(requirements).forEach(([resource, amount]) => {
      // Convert string resource to ResourceType enum
      let resourceType: ResourceType;
      switch (resource) {
        case ResourceType.MINERALS:
          resourceType = ResourceType.MINERALS;
          break;
        case ResourceType.ENERGY:
          resourceType = ResourceType.ENERGY;
          break;
        default:
          resourceType = ResourceType.MINERALS; // Default case
      }
      resourceManager.removeResource(resourceType, amount);
    });

    // Update infrastructure
    colony.stats.infrastructure += 1;
    this.publish({
      type: EventType.MODULE_UPDATED,
      managerId: this.managerName,
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: {
        colonyId,
        type,
        level: colony.stats.infrastructure,
      },
    });
  }

  private getInfrastructureRequirements(_type: string, level: number): Record<string, number> {
    const baseRequirements = {
      minerals: 100,
      energy: 50,
    };

    // Scale requirements with level
    return Object.entries(baseRequirements).reduce(
      (acc, [resource, amount]) => ({
        ...acc,
        [resource]: Math.ceil(amount * Math.pow(1.5, level - 1)),
      }),
      {}
    );
  }

  private hasRequiredResources(requirements: Record<string, number>): boolean {
    return Object.entries(requirements).every(([resource, amount]) => {
      // Convert string resource to ResourceType enum
      let resourceType: ResourceType;
      switch (resource) {
        case ResourceType.MINERALS:
          resourceType = ResourceType.MINERALS;
          break;
        case ResourceType.ENERGY:
          resourceType = ResourceType.ENERGY;
          break;
        default:
          resourceType = ResourceType.MINERALS; // Default case
      }
      return resourceManager.getResourceAmount(resourceType) >= amount;
    });
  }

  public establishTradeRoute(colonyId: string, partnerId: string, resources: ResourceType[]): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    colony.tradeRoutes.add(partnerId);
    this.publish({
      type: EventType.AUTOMATION_STARTED,
      managerId: this.managerName,
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { type: 'trade', partnerId, tradeResources: resources },
    });
  }

  public activateDefense(colonyId: string, threatLevel: number): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    this.publish({
      type: EventType.AUTOMATION_STARTED,
      managerId: this.managerName,
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { type: 'defense', threatLevel },
    });
  }

  public startResearch(colonyId: string, project: string): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    colony.activeResearch.add(project);
    this.publish({
      type: EventType.AUTOMATION_STARTED,
      managerId: this.managerName,
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { type: ResourceType.RESEARCH, project },
    });
  }

  public completeResearch(colonyId: string, project: string, benefits: ResearchBenefits): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    colony.activeResearch.delete(project);
    this.publish({
      type: EventType.AUTOMATION_CYCLE_COMPLETE,
      managerId: this.managerName,
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { type: ResourceType.RESEARCH, project, benefits },
    });
  }

  public activateEmergencyProtocol(colonyId: string, type: string): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    colony.emergencyProtocols.add(type);
    this.publish({
      type: EventType.AUTOMATION_STARTED,
      managerId: this.managerName,
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { type: 'emergency', protocol: type },
    });
  }

  public deactivateEmergencyProtocol(colonyId: string, type: string): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    colony.emergencyProtocols.delete(type);
    this.publish({
      type: EventType.AUTOMATION_STOPPED,
      managerId: this.managerName,
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { type: 'emergency', protocol: type },
    });
  }

  public getColonyStats(colonyId: string): ColonyStats | undefined {
    return this.colonies.get(colonyId)?.stats;
  }

  public getActiveResearch(colonyId: string): string[] {
    return Array.from(this.colonies.get(colonyId)?.activeResearch ?? []);
  }

  public getTradeRoutes(colonyId: string): string[] {
    return Array.from(this.colonies.get(colonyId)?.tradeRoutes ?? []);
  }

  public getActiveEmergencyProtocols(colonyId: string): string[] {
    return Array.from(this.colonies.get(colonyId)?.emergencyProtocols ?? []);
  }

  /**
   * @inheritdoc
   */
  protected async onInitialize(_dependencies?: unknown): Promise<void> {
    // Initialize event handlers first
    this.initializeEventHandlers();

    errorLoggingService.logInfo('ColonyManager initialized', { manager: this.managerName });

    // TODO: Retrieve automationManager here if needed
    // const automationManager = getAutomationManager();
    // if (automationManager) {
    //   colonyRules.forEach(rule => {
    //     automationManager.registerRule(rule);
    //   });
    // }
    await Promise.resolve(); // Placeholder
  }

  /**
   * @inheritdoc
   */
  protected onUpdate(_deltaTime: number): void {
    // Update colony stats and check for events
    this.colonies.forEach((_colony, id) => {
      this.updateColonyState(id);
    });
  }

  /**
   * @inheritdoc
   */
  protected async onDispose(): Promise<void> {
    // Base class handles unsubscribing
    // Clear all colonies and their data
    this.colonies.clear();
    await Promise.resolve(); // Placeholder for potential async cleanup
  }

  /**
   * @inheritdoc
   */
  protected getVersion(): string {
    return '1.0.0';
  }

  /**
   * @inheritdoc
   */
  protected getStats(): Record<string, number | string> {
    return {
      colonyCount: this.colonies.size,
      totalPopulation: Array.from(this.colonies.values()).reduce(
        (sum, c) => sum + c.stats.population,
        0
      ),
      totalInfrastructure: Array.from(this.colonies.values()).reduce(
        (sum, c) => sum + c.stats.infrastructure,
        0
      ),
      activeResearch: Array.from(this.colonies.values()).reduce(
        (sum, c) => sum + c.activeResearch.size,
        0
      ),
      activeTradeRoutes: Array.from(this.colonies.values()).reduce(
        (sum, c) => sum + c.tradeRoutes.size,
        0
      ),
    };
  }

  private updateColonyState(colonyId: string): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) return;

    // Update population based on food production
    const populationGrowth = Math.floor(colony.stats.foodProduction * 0.1);
    if (populationGrowth > 0) {
      this.updateStats(colonyId, {
        population: colony.stats.population + populationGrowth,
      });
    }

    // Update happiness based on resource availability
    const resourceNeeds = this.calculateResourceNeeds(colony);
    const resourceAvailability = Object.entries(resourceNeeds).every(([resource, amount]) => {
      const resourceType =
        resource === ResourceType.FOOD
          ? ResourceType.POPULATION
          : ResourceType[resource.toUpperCase() as keyof typeof ResourceType];
      return resourceManager.getResourceAmount(resourceType) >= amount;
    });

    if (!resourceAvailability) {
      this.updateStats(colonyId, {
        happiness: Math.max(0, colony.stats.happiness - 5),
      });
    }
  }
}
