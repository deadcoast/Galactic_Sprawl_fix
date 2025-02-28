import { ModuleEvent, moduleEventBus } from '../../lib/modules/ModuleEvents';
import { EventEmitter } from '../../lib/utils/EventEmitter';
import { combatManager } from '../../managers/combat/combatManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { Position } from '../../types/core/GameTypes';
import { CommonShipCapabilities } from '../../types/ships/CommonShipTypes';
import { WeaponConfig, WeaponState } from '../../types/weapons/WeaponTypes';

interface WarShip {
  id: string;
  name: string;
  type:
    | 'spitflare'
    | 'starSchooner'
    | 'orionFrigate'
    | 'harbringerGalleon'
    | 'midwayCarrier'
    | 'motherEarthRevenge';
  tier: 1 | 2 | 3;
  status: 'idle' | 'patrolling' | 'engaging' | 'returning' | 'damaged' | 'retreating' | 'disabled';
  position: Position;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  capabilities: CommonShipCapabilities;
  weapons: {
    id: string;
    config: WeaponConfig;
    state: WeaponState;
  }[];
  specialAbilities?: {
    name: string;
    description: string;
    cooldown: number;
    active: boolean;
    effectiveness?: number;
  }[];
  techBonuses?: {
    weaponEfficiency: number;
    shieldRegeneration: number;
    energyEfficiency: number;
  };
  combatStats: {
    damageDealt: number;
    damageReceived: number;
    killCount: number;
    assistCount: number;
  };
}

interface CombatTask {
  id: string;
  type: 'combat';
  target: {
    id: string;
    position: Position;
  };
  priority: number;
  assignedAt: number;
  status: 'queued' | 'in-progress' | 'completed' | 'failed';
  formation?: {
    type: 'offensive' | 'defensive' | 'balanced';
    spacing: number;
    facing: number;
  };
}

export class WarShipManagerImpl extends EventEmitter {
  private ships: Map<string, WarShip> = new Map();
  private tasks: Map<string, CombatTask> = new Map();
  private formations: Map<
    string,
    {
      type: 'offensive' | 'defensive' | 'balanced';
      ships: string[];
      leader?: string;
      spacing: number;
      facing: number;
    }
  > = new Map();

  constructor() {
    super();
    this.initializeAutomationHandlers();
  }

  private initializeAutomationHandlers(): void {
    moduleEventBus.subscribe('AUTOMATION_STARTED', (event: ModuleEvent) => {
      if (event.moduleType === 'hangar' && event.data?.type) {
        const ship = this.ships.get(event.moduleId);
        if (ship) {
          switch (event.data.type) {
            case 'formation':
              this.handleFormationChange(ship, event.data);
              break;
            case 'engagement':
              this.handleEngagement(ship, event.data);
              break;
            case 'repair':
              this.handleRepair(ship);
              break;
            case 'shield':
              this.handleShieldBoost(ship);
              break;
            case 'attack':
              this.handleAttack(ship, event.data);
              break;
            case 'retreat':
              this.handleRetreat(ship);
              break;
          }
        }
      }
    });
  }

  private handleFormationChange(ship: WarShip, data: any): void {
    const { formation } = data;
    if (formation) {
      const formationId = `formation-${Date.now()}`;
      this.formations.set(formationId, {
        type: formation.type,
        ships: [ship.id],
        spacing: formation.spacing,
        facing: formation.facing,
      });
    }
  }

  private handleEngagement(ship: WarShip, data: any): void {
    const { targetId } = data;
    if (targetId) {
      const task: CombatTask = {
        id: `combat-${targetId}`,
        type: 'combat',
        target: {
          id: targetId,
          position: { x: 0, y: 0 }, // Position will be updated in the update loop
        },
        priority: this.getPriorityForShipType(ship.type),
        assignedAt: Date.now(),
        status: 'in-progress',
      };
      this.tasks.set(ship.id, task);
      this.updateShipStatus(ship.id, 'engaging');
    }
  }

  private handleRepair(ship: WarShip): void {
    if (ship.health < ship.maxHealth) {
      ship.health = Math.min(ship.maxHealth, ship.health + ship.maxHealth * 0.2);
      if (ship.health > ship.maxHealth * 0.3) {
        this.updateShipStatus(ship.id, 'idle');
      }
    }
  }

  private handleShieldBoost(ship: WarShip): void {
    if (ship.shield < ship.maxShield) {
      ship.shield = Math.min(ship.maxShield, ship.shield + ship.maxShield * 0.3);
    }
  }

  private handleAttack(ship: WarShip, data: any): void {
    const { targetId } = data;
    if (targetId) {
      const readyWeapon = ship.weapons.find(w => w.state.status === 'ready');
      if (readyWeapon) {
        readyWeapon.state.status = 'cooling';
        readyWeapon.state.currentStats.cooldown = Date.now();
        ship.energy -=
          readyWeapon.config.baseStats.energyCost * (ship.techBonuses?.energyEfficiency || 1);

        // Update combat stats
        ship.combatStats.damageDealt +=
          readyWeapon.config.baseStats.damage * (ship.techBonuses?.weaponEfficiency || 1);
      }
    }
  }

  private handleRetreat(ship: WarShip): void {
    this.updateShipStatus(ship.id, 'retreating');
    const task = this.tasks.get(ship.id);
    if (task) {
      task.status = 'failed';
      this.tasks.delete(ship.id);
    }
  }

  public registerShip(ship: WarShip): void {
    if (ship.capabilities.canJump) {
      this.ships.set(ship.id, ship);

      // Emit events
      this.emit('shipRegistered', { shipId: ship.id });
      moduleEventBus.emit({
        type: 'MODULE_ACTIVATED',
        moduleId: ship.id,
        moduleType: 'war' as ModuleType,
        timestamp: Date.now(),
        data: { ship },
      });
    }
  }

  public unregisterShip(shipId: string): void {
    if (this.ships.has(shipId)) {
      // Remove from formations
      this.formations.forEach(formation => {
        const index = formation.ships.indexOf(shipId);
        if (index !== -1) {
          formation.ships.splice(index, 1);
          if (formation.leader === shipId) {
            formation.leader = formation.ships[0];
          }
        }
      });

      this.ships.delete(shipId);
      this.tasks.delete(shipId);

      // Emit events
      this.emit('shipUnregistered', { shipId });
      moduleEventBus.emit({
        type: 'MODULE_DEACTIVATED',
        moduleId: shipId,
        moduleType: 'war' as ModuleType,
        timestamp: Date.now(),
      });
    }
  }

  public assignCombatTask(
    shipId: string,
    targetId: string,
    position: Position,
    formation?: {
      type: 'offensive' | 'defensive' | 'balanced';
      spacing: number;
      facing: number;
    }
  ): void {
    const ship = this.ships.get(shipId);
    if (!ship || ship.status === 'disabled') {
      return;
    }

    const task: CombatTask = {
      id: `combat-${targetId}`,
      type: 'combat',
      target: {
        id: targetId,
        position,
      },
      priority: this.getPriorityForShipType(ship.type),
      assignedAt: Date.now(),
      status: 'queued',
      formation,
    };

    this.tasks.set(shipId, task);
    this.updateShipStatus(shipId, 'engaging');

    // Emit events
    this.emit('taskAssigned', { shipId, task });
    moduleEventBus.emit({
      type: 'AUTOMATION_STARTED',
      moduleId: shipId,
      moduleType: 'war' as ModuleType,
      timestamp: Date.now(),
      data: { task },
    });
  }

  public completeTask(shipId: string): void {
    const task = this.tasks.get(shipId);
    const ship = this.ships.get(shipId);

    if (task && ship) {
      this.tasks.delete(shipId);
      this.updateShipStatus(shipId, 'returning');

      // Emit events
      this.emit('taskCompleted', { shipId, task });
      moduleEventBus.emit({
        type: 'AUTOMATION_CYCLE_COMPLETE',
        moduleId: shipId,
        moduleType: 'war' as ModuleType,
        timestamp: Date.now(),
        data: { task, combatStats: ship.combatStats },
      });
    }
  }

  public updateShipTechBonuses(
    shipId: string,
    bonuses: { weaponEfficiency: number; shieldRegeneration: number; energyEfficiency: number }
  ): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      ship.techBonuses = bonuses;
      this.emit('techBonusesUpdated', { shipId, bonuses });
    }
  }

  public createFormation(
    type: 'offensive' | 'defensive' | 'balanced',
    shipIds: string[],
    spacing: number = 100
  ): string {
    const formationId = `formation-${Date.now()}`;
    const validShips = shipIds.filter(id => this.ships.has(id));

    if (validShips.length > 0) {
      this.formations.set(formationId, {
        type,
        ships: validShips,
        leader: validShips[0],
        spacing,
        facing: 0,
      });

      // Update tasks with formation info
      validShips.forEach(shipId => {
        const task = this.tasks.get(shipId);
        if (task) {
          task.formation = {
            type,
            spacing,
            facing: 0,
          };
        }
      });

      this.emit('formationCreated', { formationId, type, ships: validShips });
    }

    return formationId;
  }

  private updateShipStatus(shipId: string, status: WarShip['status']): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      ship.status = status;

      // Emit events
      this.emit('shipStatusUpdated', { shipId, status });
      moduleEventBus.emit({
        type: 'STATUS_CHANGED',
        moduleId: shipId,
        moduleType: 'war' as ModuleType,
        timestamp: Date.now(),
        data: { status },
      });
    }
  }

  private getPriorityForShipType(type: WarShip['type']): number {
    switch (type) {
      case 'motherEarthRevenge':
        return 5;
      case 'midwayCarrier':
        return 4;
      case 'harbringerGalleon':
        return 3;
      case 'orionFrigate':
        return 2;
      case 'starSchooner':
      case 'spitflare':
        return 1;
      default:
        return 0;
    }
  }

  // Update method for periodic tasks
  public update(deltaTime: number): void {
    // Update formations
    this.formations.forEach(formation => {
      if (formation.ships.length > 0) {
        const leader = this.ships.get(formation.leader!);
        if (leader) {
          // Update formation facing based on leader's target
          const task = this.tasks.get(leader.id);
          if (task?.target) {
            const dx = task.target.position.x - leader.position.x;
            const dy = task.target.position.y - leader.position.y;
            formation.facing = Math.atan2(dy, dx);
          }

          // Update formation positions
          formation.ships.forEach((shipId, index) => {
            if (shipId !== formation.leader) {
              const ship = this.ships.get(shipId);
              if (ship) {
                // Calculate formation position
                const angle = formation.facing + index * (Math.PI / 4);
                const targetPos = {
                  x: leader.position.x + Math.cos(angle) * formation.spacing,
                  y: leader.position.y + Math.sin(angle) * formation.spacing,
                };

                // Move ship towards formation position
                combatManager.moveUnit(shipId, targetPos);
              }
            }
          });
        }
      }
    });

    // Update ships
    this.ships.forEach(ship => {
      // Update weapon cooldowns
      ship.weapons.forEach(weapon => {
        if (weapon.state.status === 'cooling') {
          const timeSinceFired = Date.now() - (weapon.state.currentStats.cooldown || 0);
          if (timeSinceFired >= weapon.config.baseStats.cooldown) {
            weapon.state.status = 'ready';
          }
        }
      });

      // Handle combat tasks
      const task = this.tasks.get(ship.id);
      if (task?.status === 'in-progress') {
        const target = combatManager
          .getUnitsInRange(ship.position, ship.weapons[0].config.baseStats.range)
          .find(unit => unit.id === task.target.id);

        if (target) {
          // Find ready weapon in range
          const readyWeapon = ship.weapons.find(weapon => {
            const distance = Math.sqrt(
              Math.pow(target.position.x - ship.position.x, 2) +
                Math.pow(target.position.y - ship.position.y, 2)
            );
            return weapon.state.status === 'ready' && distance <= weapon.config.baseStats.range;
          });

          if (readyWeapon) {
            // Fire weapon
            readyWeapon.state.status = 'cooling';
            readyWeapon.state.currentStats.cooldown = Date.now();
            ship.energy -=
              readyWeapon.config.baseStats.energyCost * (ship.techBonuses?.energyEfficiency || 1);

            // Update combat stats
            ship.combatStats.damageDealt +=
              readyWeapon.config.baseStats.damage * (ship.techBonuses?.weaponEfficiency || 1);
          }
        }
      }

      // Regenerate shields
      if (ship.shield < ship.maxShield) {
        ship.shield = Math.min(
          ship.maxShield,
          ship.shield + deltaTime * 0.1 * (ship.techBonuses?.shieldRegeneration || 1)
        );
      }

      // Check for critical damage
      if (ship.health < ship.maxHealth * 0.3 && ship.status !== 'retreating') {
        this.updateShipStatus(ship.id, 'retreating');
      }
    });
  }
}
