import { colonyRules } from '../../config/automation/colonyRules';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { EventEmitter } from '../../utils/EventEmitter';
import { automationManager } from '../game/AutomationManager';
import { ResourceManager } from '../game/ResourceManager';

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

interface ColonyEvents extends Record<string, unknown> {
  statsUpdated: { colonyId: string; stats: ColonyStats };
  resourcesDistributed: { colonyId: string; resources: Record<string, number> };
  infrastructureBuilt: { colonyId: string; type: string; level: number };
  populationGrew: { colonyId: string; amount: number };
  tradeRouteEstablished: { colonyId: string; partnerId: string; resources: string[] };
  defenseActivated: { colonyId: string; threatLevel: number };
  researchCompleted: { colonyId: string; project: string; benefits: ResearchBenefits };
  emergencyProtocolActivated: { colonyId: string; type: string };
}

export class ColonyManagerImpl extends EventEmitter<ColonyEvents> {
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
    super();
    this.initializeAutomationRules();
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
    moduleEventBus.emit({
      type: 'MODULE_ACTIVATED',
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
    this.emit('statsUpdated', { colonyId, stats: colony.stats });

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
      moduleEventBus.emit({
        type: 'MODULE_UPGRADED',
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
      resourceManager.transferResources(resource as ResourceType, amount, 'storage', colonyId);
    });

    this.emit('resourcesDistributed', { colonyId, resources: resourceNeeds });
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
      resourceManager.removeResource(resource as ResourceType, amount);
    });

    // Update infrastructure
    colony.stats.infrastructure += 1;
    this.emit('infrastructureBuilt', {
      colonyId,
      type,
      level: colony.stats.infrastructure,
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
    return Object.entries(requirements).every(
      ([resource, amount]) => resourceManager.getResourceAmount(resource as ResourceType) >= amount
    );
  }

  public establishTradeRoute(colonyId: string, partnerId: string, resources: string[]): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    colony.tradeRoutes.add(partnerId);
    this.emit('tradeRouteEstablished', { colonyId, partnerId, resources });

    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED',
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { type: 'trade', partnerId, resources },
    });
  }

  public activateDefense(colonyId: string, threatLevel: number): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    this.emit('defenseActivated', { colonyId, threatLevel });

    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED',
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
    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED',
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { type: 'research', project },
    });
  }

  public completeResearch(colonyId: string, project: string, benefits: ResearchBenefits): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    colony.activeResearch.delete(project);
    this.emit('researchCompleted', { colonyId, project, benefits });

    moduleEventBus.emit({
      type: 'AUTOMATION_CYCLE_COMPLETE',
      moduleId: colonyId,
      moduleType: 'colony' as ModuleType,
      timestamp: Date.now(),
      data: { type: 'research', project, benefits },
    });
  }

  public activateEmergencyProtocol(colonyId: string, type: string): void {
    const colony = this.colonies.get(colonyId);
    if (!colony) {
      return;
    }

    colony.emergencyProtocols.add(type);
    this.emit('emergencyProtocolActivated', { colonyId, type });

    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED',
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
    moduleEventBus.emit({
      type: 'AUTOMATION_STOPPED',
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
}

// Export singleton instance
export const colonyManager = new ColonyManagerImpl();
