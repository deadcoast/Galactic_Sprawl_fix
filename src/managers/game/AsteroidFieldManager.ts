import { EventEmitter } from '../../lib/utils/EventEmitter';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { ResourceType } from '../../types/resources/ResourceTypes';
import { miningShipManager } from '../mining/MiningShipManager';
import { shipMovementManager } from '../../lib/ai/shipMovement';
import { shipBehaviorManager } from '../../lib/ai/shipBehavior';

interface Hazard {
  id: string;
  type: 'asteroids' | 'debris' | 'radiation' | 'anomaly';
  position: Position;
  radius: number;
  severity: 'low' | 'medium' | 'high';
  effect: {
    type: 'damage' | 'slow' | 'shield' | 'weapon';
    value: number;
  };
  movement?: {
    speed: number;
    direction: number;
  };
  particles?: number;
}

interface AsteroidField {
  id: string;
  position: Position;
  radius: number;
  density: number;
  resources: Map<ResourceType, number>;
  hazards: Array<Hazard>;
  status: 'active' | 'depleted';
  createdAt: number;
  lastUpdated: number;
}

interface AsteroidFieldState {
  fields: Map<string, AsteroidField>;
  activeHazards: Set<string>;
  resourceNodes: Map<string, { fieldId: string; type: ResourceType; amount: number }>;
}

interface AsteroidFieldEvents {
  fieldGenerated: { fieldId: string; position: Position };
  fieldDepleted: { fieldId: string };
  resourceDiscovered: { fieldId: string; resourceType: ResourceType; amount: number };
  hazardCreated: { fieldId: string; hazard: Hazard };
  hazardRemoved: { fieldId: string; hazardId: string };
  resourceNodeRegistered: {
    nodeId: string;
    fieldId: string;
    type: ResourceType;
    position: Position;
  };
  resourceExtracted: { nodeId: string; type: ResourceType; amount: number; remaining: number };
  shipHazardCollision: { shipId: string; hazardId: string; effect: Hazard['effect'] };
  shipPositionUpdated: { shipId: string; position: Position; inField: boolean };
}

export class AsteroidFieldManager extends EventEmitter<AsteroidFieldEvents> {
  private state: AsteroidFieldState = {
    fields: new Map(),
    activeHazards: new Set(),
    resourceNodes: new Map(),
  };
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setupEventListeners();
    this.startUpdateLoop();

    // Debug logging
    console.debug('[AsteroidFieldManager] Initialized');
  }

  private setupEventListeners(): void {
    moduleEventBus.subscribe(
      'MODULE_ACTIVATED',
      (event: { moduleType: string; moduleId: string }) => {
        if (event.moduleType === 'asteroidField') {
          this.handleModuleActivation(event.moduleId);
        }
      }
    );

    moduleEventBus.subscribe(
      'MODULE_DEACTIVATED',
      (event: { moduleType: string; moduleId: string }) => {
        if (event.moduleType === 'asteroidField') {
          this.handleModuleDeactivation(event.moduleId);
        }
      }
    );
  }

  private startUpdateLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.updateFields();
    }, 1000); // Update every second
  }

  private updateFields(): void {
    const now = Date.now();
    this.state.fields.forEach((field, fieldId) => {
      if (field.status === 'depleted') return;

      // Update hazards
      field.hazards = field.hazards.filter(hazard => {
        const isActive = this.state.activeHazards.has(hazard.id);
        if (!isActive) {
          this.emit('hazardRemoved', { fieldId, hazardId: hazard.id });
        }
        return isActive;
      });

      // Generate new hazards if needed
      if (field.hazards.length < Math.ceil(field.density * 5)) {
        const hazard = this.generateHazard(field);
        field.hazards.push(hazard);
        this.state.activeHazards.add(hazard.id);
        this.emit('hazardCreated', { fieldId, hazard });
      }

      // Update resources
      let totalResources = 0;
      field.resources.forEach((amount, type) => {
        totalResources += amount;
      });

      if (totalResources <= 0) {
        field.status = 'depleted';
        this.emit('fieldDepleted', { fieldId });
      }

      field.lastUpdated = now;
    });
  }

  private generateHazard(field: AsteroidField): Hazard {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * field.radius;
    const position = {
      x: field.position.x + Math.cos(angle) * distance,
      y: field.position.y + Math.sin(angle) * distance,
    };

    return {
      id: `hazard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'asteroids',
      position,
      radius: 20 + Math.random() * 30,
      severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      effect: {
        type: 'damage',
        value: 10 + Math.random() * 20,
      },
      movement: {
        speed: 0.5 + Math.random(),
        direction: Math.random() * Math.PI * 2,
      },
    };
  }

  public generateField(position: Position, radius: number, density: number): string {
    const fieldId = `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const field: AsteroidField = {
      id: fieldId,
      position,
      radius,
      density: Math.max(0.1, Math.min(1, density)),
      resources: new Map(),
      hazards: [],
      status: 'active',
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };

    // Generate initial resources
    const resourceTypes: ResourceType[] = ['minerals', 'gas', 'exotic'];
    resourceTypes.forEach(type => {
      const amount = Math.floor(1000 + Math.random() * 4000 * density);
      field.resources.set(type, amount);

      const nodeId = `node-${fieldId}-${type}`;
      this.state.resourceNodes.set(nodeId, {
        fieldId,
        type,
        amount,
      });

      this.emit('resourceDiscovered', {
        fieldId,
        resourceType: type,
        amount,
      });
    });

    // Generate initial hazards
    for (let i = 0; i < Math.ceil(density * 5); i++) {
      const hazard = this.generateHazard(field);
      field.hazards.push(hazard);
      this.state.activeHazards.add(hazard.id);
      this.emit('hazardCreated', { fieldId, hazard });
    }

    this.state.fields.set(fieldId, field);
    this.emit('fieldGenerated', { fieldId, position });

    // Debug logging
    console.debug(
      `[AsteroidFieldManager] Generated field ${fieldId} at (${position.x}, ${position.y}) with density ${density}`
    );

    return fieldId;
  }

  public getField(fieldId: string): AsteroidField | undefined {
    return this.state.fields.get(fieldId);
  }

  public getAllFields(): AsteroidField[] {
    return Array.from(this.state.fields.values());
  }

  public getActiveFields(): AsteroidField[] {
    return Array.from(this.state.fields.values()).filter(field => field.status === 'active');
  }

  public getResourceNodes(): Map<string, { fieldId: string; type: ResourceType; amount: number }> {
    return new Map(this.state.resourceNodes);
  }

  public extractResource(nodeId: string, amount: number): boolean {
    const node = this.state.resourceNodes.get(nodeId);
    if (!node || amount <= 0) return false;

    const field = this.state.fields.get(node.fieldId);
    if (!field || field.status === 'depleted') return false;

    const currentAmount = field.resources.get(node.type) || 0;
    if (currentAmount < amount) return false;

    field.resources.set(node.type, currentAmount - amount);
    node.amount = currentAmount - amount;

    // Debug logging
    console.debug(`[AsteroidFieldManager] Extracted ${amount} ${node.type} from node ${nodeId}`);

    return true;
  }

  private handleModuleActivation(moduleId: string): void {
    console.debug(`[AsteroidFieldManager] Module ${moduleId} activated`);
  }

  private handleModuleDeactivation(moduleId: string): void {
    console.debug(`[AsteroidFieldManager] Module ${moduleId} deactivated`);
  }

  public cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.state.fields.clear();
    this.state.activeHazards.clear();
    this.state.resourceNodes.clear();

    // Debug logging
    console.debug('[AsteroidFieldManager] Cleanup completed');
  }

  public registerResourceNode(fieldId: string, type: ResourceType): string {
    const field = this.state.fields.get(fieldId);
    if (!field) return '';

    const nodeId = `node-${fieldId}-${type}-${Date.now()}`;
    const amount = field.resources.get(type) || 0;

    this.state.resourceNodes.set(nodeId, {
      fieldId,
      type,
      amount,
    });

    // Register with mining system
    moduleEventBus.emit({
      type: 'MODULE_ACTIVATED',
      moduleId: nodeId,
      moduleType: 'mineral' as ModuleType,
      timestamp: Date.now(),
      data: {
        id: nodeId,
        type,
        position: field.position,
        amount,
        thresholds: {
          min: Math.floor(amount * 0.2),
          max: amount,
        },
      },
    });

    this.emit('resourceNodeRegistered', {
      nodeId,
      fieldId,
      type,
      position: field.position,
    });

    console.debug(
      `[AsteroidFieldManager] Registered resource node ${nodeId} of type ${type} in field ${fieldId}`
    );
    return nodeId;
  }

  public handleMiningTask(nodeId: string, shipId: string, amount: number): boolean {
    const node = this.state.resourceNodes.get(nodeId);
    if (!node) {
      console.debug(`[AsteroidFieldManager] Mining task failed: Node ${nodeId} not found`);
      return false;
    }

    const field = this.state.fields.get(node.fieldId);
    if (!field || field.status === 'depleted') {
      console.debug(
        `[AsteroidFieldManager] Mining task failed: Field ${node.fieldId} not found or depleted`
      );
      return false;
    }

    const extracted = this.extractResource(nodeId, amount);
    if (!extracted) {
      console.debug(
        `[AsteroidFieldManager] Mining task failed: Could not extract ${amount} resources from node ${nodeId}`
      );
      return false;
    }

    const remaining = field.resources.get(node.type) || 0;
    this.emit('resourceExtracted', {
      nodeId,
      type: node.type,
      amount,
      remaining,
    });

    // Update mining system
    moduleEventBus.emit({
      type: 'RESOURCE_TRANSFERRED',
      moduleId: nodeId,
      moduleType: 'mineral' as ModuleType,
      timestamp: Date.now(),
      data: {
        shipId,
        amount,
        remaining,
        resourceType: node.type,
      },
    });

    console.debug(
      `[AsteroidFieldManager] Mining task completed: Extracted ${amount} ${node.type} from node ${nodeId}, ${remaining} remaining`
    );
    return true;
  }

  public getNodeThresholds(nodeId: string): { min: number; max: number } | null {
    const node = this.state.resourceNodes.get(nodeId);
    if (!node) return null;

    const field = this.state.fields.get(node.fieldId);
    if (!field) return null;

    const amount = field.resources.get(node.type) || 0;
    return {
      min: Math.floor(amount * 0.2),
      max: amount,
    };
  }

  public handleShipMovement(shipId: string, position: Position): void {
    let inField = false;
    let nearestHazard: Hazard | null = null;
    let nearestDistance = Infinity;

    for (const field of this.state.fields.values()) {
      // Calculate distance to field center
      const distanceToField = Math.sqrt(
        Math.pow(position.x - field.position.x, 2) + Math.pow(position.y - field.position.y, 2)
      );

      if (distanceToField <= field.radius) {
        inField = true;

        // Find nearest hazard in field
        for (const hazard of field.hazards) {
          const distanceToHazard = Math.sqrt(
            Math.pow(position.x - hazard.position.x, 2) +
              Math.pow(position.y - hazard.position.y, 2)
          );

          if (distanceToHazard < nearestDistance) {
            nearestDistance = distanceToHazard;
            nearestHazard = hazard;
          }
        }
      }
    }

    // Emit position update
    this.emit('shipPositionUpdated', { shipId, position, inField });

    // Handle hazard collision if ship is near a hazard
    if (nearestHazard && nearestDistance <= nearestHazard.radius) {
      this.handleHazardCollision(shipId, nearestHazard);
    }

    console.debug(
      `[AsteroidFieldManager] Ship ${shipId} position updated: (${position.x}, ${position.y}), in field: ${inField}`
    );
  }

  public calculateAvoidanceVector(shipId: string, position: Position): Position | null {
    let nearestHazard: Hazard | null = null;
    let nearestDistance = Infinity;

    // Find nearest hazard across all fields
    for (const field of this.state.fields.values()) {
      for (const hazard of field.hazards) {
        const distance = Math.sqrt(
          Math.pow(position.x - hazard.position.x, 2) + Math.pow(position.y - hazard.position.y, 2)
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestHazard = hazard;
        }
      }
    }

    // If no hazard is nearby or distance is safe, return null
    if (!nearestHazard || nearestDistance > nearestHazard.radius * 1.5) {
      return null;
    }

    // Calculate avoidance vector
    const dx = position.x - nearestHazard.position.x;
    const dy = position.y - nearestHazard.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Return position that moves away from hazard
    return {
      x: position.x + (dx / distance) * 50, // Move 50 units away
      y: position.y + (dy / distance) * 50,
    };
  }

  private handleHazardCollision(shipId: string, hazard: Hazard): void {
    this.emit('shipHazardCollision', {
      shipId,
      hazardId: hazard.id,
      effect: hazard.effect,
    });

    // Update hazard state if needed
    if (hazard.type === 'asteroids') {
      // Asteroids might break apart or move after collision
      const newPosition = {
        x: hazard.position.x + (Math.random() - 0.5) * 20,
        y: hazard.position.y + (Math.random() - 0.5) * 20,
      };

      hazard.position = newPosition;

      // Sometimes create smaller hazards after collision
      if (Math.random() < 0.3 && hazard.radius > 20) {
        const newHazard: Hazard = {
          id: `${hazard.id}_fragment_${Date.now()}`,
          type: hazard.type,
          severity: hazard.severity,
          radius: hazard.radius * 0.5,
          position: newPosition,
          effect: hazard.effect,
          movement: hazard.movement,
          particles: hazard.particles,
        };

        // Add to parent field
        for (const [fieldId, field] of this.state.fields.entries()) {
          if (field.hazards.some(h => h.id === hazard.id)) {
            field.hazards.push(newHazard);
            this.state.activeHazards.add(newHazard.id);
            this.emit('hazardCreated', { fieldId, hazard: newHazard });
            break;
          }
        }
      }
    }

    console.debug(
      `[AsteroidFieldManager] Ship ${shipId} collided with hazard ${hazard.id} of type ${hazard.type}`
    );
  }

  public getShipBonuses(
    shipId: string,
    position: Position
  ): {
    speedMultiplier: number;
    hazardResistance: number;
    miningEfficiency: number;
  } {
    const bonuses = {
      speedMultiplier: 1.0,
      hazardResistance: 1.0,
      miningEfficiency: 1.0,
    };

    // Check if ship is in any asteroid field
    for (const field of this.state.fields.values()) {
      const distanceToField = Math.sqrt(
        Math.pow(position.x - field.position.x, 2) + Math.pow(position.y - field.position.y, 2)
      );

      if (distanceToField <= field.radius) {
        // Apply field density effects
        bonuses.speedMultiplier *= Math.max(0.5, 1 - field.density * 0.5);
        bonuses.hazardResistance *= Math.max(0.6, 1 - field.density * 0.4);
        bonuses.miningEfficiency *= 1 + field.density * 0.3;

        // Log the bonuses
        console.debug(`[AsteroidFieldManager] Ship ${shipId} field bonuses:
          Speed: ${bonuses.speedMultiplier.toFixed(2)}x
          Hazard Resistance: ${bonuses.hazardResistance.toFixed(2)}x
          Mining Efficiency: ${bonuses.miningEfficiency.toFixed(2)}x`);

        break; // Only apply bonuses from one field
      }
    }

    return bonuses;
  }
}
