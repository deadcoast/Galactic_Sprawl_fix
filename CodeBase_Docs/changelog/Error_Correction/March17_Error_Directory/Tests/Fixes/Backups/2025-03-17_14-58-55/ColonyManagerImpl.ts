import { colonyRules } from '../../config/automation/colonyRules';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { automationManager } from '../game/AutomationManager';
import { ResourceManager } from '../game/ResourceManager';
import { ResourceType } from './../../types/resources/ResourceTypes';

// Create an instance of ResourceManager
const resourceManager = new ResourceManager();

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

/**
 * Colony event interface extending BaseEvent
 */
export interface ColonyEvent extends BaseEvent {
  type: EventType;
  moduleId: string;
  moduleType: ModuleType;
  data: ColonyEventData;
}

/**
 * Colony event data interface
 */
export interface ColonyEventData extends Record<string, unknown> {
  colonyId?: string;
  stats?: ColonyStats;
  resourceAmounts?: Record<string, number>;
  type?: string;
  level?: number;
  amount?: number;
  partnerId?: string;
  tradeResources?: string[];
  threatLevel?: number;
  project?: string;
  benefits?: ResearchBenefits;
  protocol?: string;
}

/**
 * Type guard for ColonyEvent
 */
export function isColonyEvent(event: unknown): event is ColonyEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as ColonyEvent;
  return (
    'type' in e &&
    'moduleId' in e &&
    'moduleType' in e &&
    'data' in e &&
    typeof e.type === 'string' &&
    typeof e.moduleId === 'string' &&
    typeof e.moduleType === 'string' &&
    typeof e.data === 'object'
  );
}

export class ColonyManagerImpl extends AbstractBaseManager<ColonyEvent> {
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

  constructor() {
    super('ColonyManager');
    this.initializeEventHandlers();
    this.initializeAutomationRules();
  }

  /**
   * Initialize event handlers for colony-related events
   */
  private initializeEventHandlers(): void {
    // Subscribe to relevant events
    this.unsubscribeFunctions.push(
      this.subscribe(EventType.RESOURCE_UPDATED, this.handleResourceUpdate.bind(this)),
      this.subscribe(EventType.RESOURCE_SHORTAGE, this.handleResourceShortage.bind(this)),
      this.subscribe(EventType.TECH_UNLOCKED, this.handleTechUnlock.bind(this))
    );
  }

  private handleResourceUpdate(event: ColonyEvent): void {
    if (!isColonyEvent(event)) return;
    // Handle resource updates
    const { colonyId, resourceAmounts } = event.data;
    if (colonyId && resourceAmounts) {
      this.updateColonyResources(colonyId, resourceAmounts);
    }
  }

  private handleResourceShortage(event: ColonyEvent): void {
    if (!isColonyEvent(event)) return;
    // Handle resource shortages
    const { colonyId } = event.data;
    if (colonyId) {
      this.activateEmergencyProtocol(colonyId, 'resource_shortage');
    }
  }

  private handleTechUnlock(event: ColonyEvent): void {
    if (!isColonyEvent(event)) return;
    // Handle tech unlocks
    const { colonyId, project } = event.data;
    if (colonyId && project) {
      this.applyTechBenefits(colonyId, project as string);
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
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: {
        project,
        colonyId,
        stats: colony.stats,
      },
    });
  }

  private initializeAutomationRules(): void {
    colonyRules.forEach(rule => {
      automationManager.registerRule(rule);
    });
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
        case 'food':
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

  public establishTradeRoute(colonyId: string, partnerId: string, resources: string[]): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    colony.tradeRoutes.add(partnerId);
    this.publish({
      type: EventType.AUTOMATION_STARTED,
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
    return Array.from(this.colonies.get(colonyId)?.activeResearch || []);
  }

  public getTradeRoutes(colonyId: string): string[] {
    return Array.from(this.colonies.get(colonyId)?.tradeRoutes || []);
  }

  public getActiveEmergencyProtocols(colonyId: string): string[] {
    return Array.from(this.colonies.get(colonyId)?.emergencyProtocols || []);
  }

  /**
   * @inheritdoc
   */
  protected async onInitialize(_dependencies?: unknown): Promise<void> {
    console.warn('ColonyManager initialized');
  }

  /**
   * @inheritdoc
   */
  protected onUpdate(_deltaTime: number): void {
    // Update colony stats and check for events
    this.colonies.forEach((colony, id) => {
      this.updateColonyState(id);
    });
  }

  /**
   * @inheritdoc
   */
  protected async onDispose(): Promise<void> {
    // Clear all colonies and their data
    this.colonies.clear();
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
        resource === 'food'
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

// Export singleton instance
export const colonyManager = new ColonyManagerImpl();
