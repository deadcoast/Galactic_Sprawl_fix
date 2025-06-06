import { BaseEvent } from '../../lib/events/UnifiedEventSystem';
import { AbstractBaseManager } from '../../lib/managers/BaseManager';
import { Position } from '../../types/core/GameTypes';
import { EventType } from '../../types/events/EventTypes';
import { FactionShipClass } from '../../types/ships/FactionShipTypes';
import { CombatShip, isCombatShip, UnifiedShipStatus } from '../../types/ships/ShipTypes';
import { gameLoopManager, UpdatePriority } from '../game/GameLoopManager';
import { getCombatManager } from '../ManagerRegistry';

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

interface FormationChangeData {
  formation?: {
    type: 'offensive' | 'defensive' | 'balanced';
    spacing: number;
    facing: number;
  };
}

interface EngagementData {
  targetId?: string;
}

interface AttackData {
  targetId?: string;
}

function isFormationChangeData(data: unknown): data is FormationChangeData {
  return typeof data === 'object' && data !== null && 'formation' in data;
}
function isEngagementData(data: unknown): data is EngagementData {
  return typeof data === 'object' && data !== null && 'targetId' in data;
}
function isAttackData(data: unknown): data is AttackData {
  return typeof data === 'object' && data !== null && 'targetId' in data;
}

export class CombatShipManagerImpl extends AbstractBaseManager<BaseEvent> {
  private ships: Map<string, CombatShip> = new Map<string, CombatShip>();
  private tasks: Map<string, CombatTask> = new Map<string, CombatTask>();
  private formations: Map<
    string,
    {
      type: 'offensive' | 'defensive' | 'balanced';
      ships: string[];
      leader?: string;
      spacing: number;
      facing: number;
    }
  > = new Map<string, {
    type: 'offensive' | 'defensive' | 'balanced';
    ships: string[];
    leader?: string;
    spacing: number;
    facing: number;
  }>();

  protected constructor() {
    super('CombatShipManager');
  }

  protected async onInitialize(): Promise<void> {
    this.initializeAutomationHandlers();
    gameLoopManager.registerUpdate(
      this.managerName,
      this.onUpdate.bind(this),
      UpdatePriority.NORMAL
    );
    await Promise.resolve();
  }

  protected async onDispose(): Promise<void> {
    gameLoopManager.unregisterUpdate(this.managerName);
    this.ships.clear();
    this.tasks.clear();
    this.formations.clear();
    await Promise.resolve();
  }

  protected onUpdate(deltaTime: number): void {
    this.formations.forEach(formation => {
      if (formation.ships.length > 0) {
        const leader = this.ships.get(formation.leader!);
        if (leader) {
          const task = this.tasks.get(leader.id);
          if (task?.target) {
            const dx = task.target.position.x - leader.position.x;
            const dy = task.target.position.y - leader.position.y;
            formation.facing = Math.atan2(dy, dx);
          }

          formation.ships.forEach((shipId, index) => {
            if (shipId !== formation.leader) {
              const ship = this.ships.get(shipId);
              if (ship) {
                const angle = formation.facing + index * (Math.PI / 4);
                const targetPos = {
                  x: leader.position.x + Math.cos(angle) * formation.spacing,
                  y: leader.position.y + Math.sin(angle) * formation.spacing,
                };
                getCombatManager().moveUnit(shipId, targetPos);
              }
            }
          });
        }
      }
    });

    this.ships.forEach(ship => {
      ship.stats.weapons.forEach(mount => {
        if (mount.currentWeapon?.state.status === 'cooling') {
          const cooldownDuration = mount.currentWeapon?.config.baseStats.cooldown ?? 0;
          const lastFiredTime = mount.currentWeapon?.state.lastFiredTime ?? 0;
          if (Date.now() - lastFiredTime >= cooldownDuration * 1000) {
            if (mount.currentWeapon?.state) {
              mount.currentWeapon.state.status = 'ready';
            }
          }
        }
      });

      const task = this.tasks.get(ship.id);
      if (task?.status === 'in-progress' && ship.stats.weapons.length > 0) {
        const firstWeaponRange = ship.stats.weapons[0]?.currentWeapon?.config.baseStats.range ?? 0;
        const targetUnit = getCombatManager()
          .getUnitsInRange(ship.position, firstWeaponRange)
          .find(unit => unit.id === task.target.id);

        if (targetUnit) {
          const target = targetUnit as unknown as CombatShip;
          const readyWeaponMount = ship.stats.weapons.find(mount => {
            if (!mount.currentWeapon) return false;
            const distance = Math.sqrt(
              Math.pow(target.position.x - ship.position.x, 2) +
                Math.pow(target.position.y - ship.position.y, 2)
            );
            return (
              mount.currentWeapon.state.status === 'ready' &&
              distance <= mount.currentWeapon.config.baseStats.range
            );
          });

          if (readyWeaponMount?.currentWeapon) {
            const weaponInstance = readyWeaponMount.currentWeapon;
            if (weaponInstance.state) {
              weaponInstance.state.status = 'cooling';
              weaponInstance.state.lastFiredTime = Date.now();
            }
            const energyCost = weaponInstance.config.baseStats.energyCost ?? 0;
            const energyEfficiency = ship.techBonuses?.energyEfficiency ?? 1;
            ship.stats.energy = Math.max(0, ship.stats.energy - energyCost * energyEfficiency);

            if (!ship.combatStats) {
              ship.combatStats = {
                damageDealt: 0,
                damageReceived: 0,
                killCount: 0,
                assistCount: 0,
              } as Required<NonNullable<CombatShip['combatStats']>>;
            }
            const damageDealt = weaponInstance.config.baseStats.damage ?? 0;
            const weaponEfficiency = ship.techBonuses?.weaponEfficiency ?? 1;
            ship.combatStats.damageDealt += damageDealt * weaponEfficiency;
          }
        }
      }

      if (ship.stats.shield < ship.stats.maxShield) {
        const shieldRegen = ship.techBonuses?.shieldRegeneration ?? 1;
        ship.stats.shield = Math.min(
          ship.stats.maxShield,
          ship.stats.shield + deltaTime * 0.1 * shieldRegen
        );
      }

      if (
        ship.stats.health < ship.stats.maxHealth * 0.3 &&
        ship.status !== UnifiedShipStatus.RETREATING
      ) {
        this.updateShipStatus(ship.id, UnifiedShipStatus.RETREATING);
      }
    });
  }

  private initializeAutomationHandlers(): void {
    this.subscribe(EventType.AUTOMATION_STARTED, (event: BaseEvent) => {
      if (
        event.moduleId &&
        typeof event.moduleId === 'string' &&
        event.data &&
        typeof event.data === 'object' &&
        'type' in event.data
      ) {
        const ship = this.ships.get(event.moduleId);
        if (ship) {
          const automationType = event.data.type as string;
          switch (automationType) {
            case 'formation':
              if (isFormationChangeData(event.data)) {
                this.handleFormationChange(ship, event.data);
              }
              break;
            case 'engagement':
              if (isEngagementData(event.data)) {
                this.handleEngagement(ship, event.data);
              }
              break;
            case 'repair':
              this.handleRepair(ship);
              break;
            case 'shield':
              this.handleShieldBoost(ship);
              break;
            case 'attack':
              if (isAttackData(event.data)) {
                this.handleAttack(ship, event.data);
              }
              break;
            case 'retreat':
              this.handleRetreat(ship);
              break;
          }
        }
      }
    });
  }

  private handleFormationChange(ship: CombatShip, data: FormationChangeData): void {
    const { formation } = data;
    if (formation) {
      const formationId = `formation-${Date.now()}`;
      this.formations.set(formationId, {
        type: formation.type,
        ships: [ship.id],
        spacing: formation.spacing,
        facing: formation.facing,
        leader: ship.id,
      });
      ship.formation = { ...formation, position: 0 };
    }
  }

  private handleEngagement(ship: CombatShip, data: EngagementData): void {
    const { targetId } = data;
    if (targetId) {
      const targetPosition = { x: 0, y: 0 };
      const task: CombatTask = {
        id: `combat-${targetId}`,
        type: 'combat',
        target: {
          id: targetId,
          position: targetPosition,
        },
        priority: this.getPriorityForShipType(ship.class as FactionShipClass),
        assignedAt: Date.now(),
        status: 'in-progress',
      };
      this.tasks.set(ship.id, task);
      this.updateShipStatus(ship.id, UnifiedShipStatus.ENGAGING);
    }
  }

  private handleRepair(ship: CombatShip): void {
    if (ship.stats.health < ship.stats.maxHealth) {
      ship.stats.health = Math.min(
        ship.stats.maxHealth,
        ship.stats.health + ship.stats.maxHealth * 0.2
      );
      if (ship.stats.health > ship.stats.maxHealth * 0.3) {
        this.updateShipStatus(ship.id, UnifiedShipStatus.IDLE);
      }
    }
  }

  private handleShieldBoost(ship: CombatShip): void {
    if (ship.stats.shield < ship.stats.maxShield) {
      ship.stats.shield = Math.min(
        ship.stats.maxShield,
        ship.stats.shield + ship.stats.maxShield * 0.3
      );
    }
  }

  private handleAttack(ship: CombatShip, data: AttackData): void {
    const { targetId } = data;
    if (targetId && ship.stats.weapons) {
      const readyWeaponMount = ship.stats.weapons.find(
        mount => mount.currentWeapon?.state.status === 'ready'
      );
      if (readyWeaponMount?.currentWeapon) {
        const weaponInstance = readyWeaponMount.currentWeapon;
        if (weaponInstance.state) {
          weaponInstance.state.status = 'cooling';
          weaponInstance.state.lastFiredTime = Date.now();
        }
        const energyCost = weaponInstance.config.baseStats.energyCost ?? 0;
        const energyEfficiency = ship.techBonuses?.energyEfficiency ?? 1;
        ship.stats.energy = Math.max(0, ship.stats.energy - energyCost * energyEfficiency);

        if (!ship.combatStats) {
          ship.combatStats = {
            damageDealt: 0,
            damageReceived: 0,
            killCount: 0,
            assistCount: 0,
          } as Required<NonNullable<CombatShip['combatStats']>>;
        }
        const damageDealt = weaponInstance.config.baseStats.damage ?? 0;
        const weaponEfficiency = ship.techBonuses?.weaponEfficiency ?? 1;
        ship.combatStats.damageDealt += damageDealt * weaponEfficiency;
      }
    }
  }

  private handleRetreat(ship: CombatShip): void {
    this.updateShipStatus(ship.id, UnifiedShipStatus.RETREATING);
    const task = this.tasks.get(ship.id);
    if (task) {
      task.status = 'failed';
      this.tasks.delete(ship.id);
    }
  }

  public registerShip(ship: CombatShip): void {
    if (!isCombatShip(ship)) {
      console.warn('[CombatShipManager] Attempted to register non-combat ship', ship);
      return;
    }
    this.ships.set(ship.id, ship);
    this.publish({
      type: EventType.MODULE_ACTIVATED,
      managerId: this.managerName,
      moduleId: ship.id,
      timestamp: Date.now(),
      data: { ship: ship, moduleType: 'combat' },
    });
  }

  public unregisterShip(shipId: string): void {
    const ship = this.ships.get(shipId);
    if (ship) {
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

      this.publish({
        type: EventType.MODULE_DEACTIVATED,
        managerId: this.managerName,
        moduleId: shipId,
        timestamp: Date.now(),
        data: { moduleType: 'combat' },
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
    if (!ship || ship.status === UnifiedShipStatus.DISABLED) {
      return;
    }

    const task: CombatTask = {
      id: `combat-${targetId}`,
      type: 'combat',
      target: {
        id: targetId,
        position,
      },
      priority: this.getPriorityForShipType(ship.class as FactionShipClass | undefined),
      assignedAt: Date.now(),
      status: 'queued',
      formation,
    };

    this.tasks.set(shipId, task);
    this.updateShipStatus(shipId, UnifiedShipStatus.ENGAGING);

    this.publish({
      type: EventType.AUTOMATION_STARTED,
      managerId: this.managerName,
      moduleId: shipId,
      timestamp: Date.now(),
      data: { task, moduleType: 'combat' },
    });
  }

  public completeTask(shipId: string): void {
    const task = this.tasks.get(shipId);
    const ship = this.ships.get(shipId);

    if (task && ship) {
      this.tasks.delete(shipId);
      this.updateShipStatus(shipId, UnifiedShipStatus.RETURNING);

      this.publish({
        type: EventType.AUTOMATION_CYCLE_COMPLETE,
        managerId: this.managerName,
        moduleId: shipId,
        timestamp: Date.now(),
        data: { task, combatStats: ship.combatStats ?? {}, moduleType: 'combat' },
      });
    }
  }

  public updateShipTechBonuses(
    shipId: string,
    bonuses: { weaponEfficiency: number; shieldRegeneration: number; energyEfficiency: number }
  ): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      if (!ship.techBonuses) {
        ship.techBonuses = { weaponEfficiency: 1, shieldRegeneration: 1, energyEfficiency: 1 };
      }
      ship.techBonuses = bonuses;
    }
  }

  public createFormation(
    type: 'offensive' | 'defensive' | 'balanced',
    shipIds: string[],
    spacing = 100
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

      validShips.forEach(shipId => {
        const task = this.tasks.get(shipId);
        if (task) {
          task.formation = {
            type,
            spacing,
            facing: 0,
          };
        }
        const ship = this.ships.get(shipId);
        if (ship) {
          if (!ship.formation) {
            ship.formation = { type, spacing, facing: 0, position: validShips.indexOf(shipId) };
          } else {
            ship.formation.type = type;
            ship.formation.spacing = spacing;
            ship.formation.facing = 0;
            ship.formation.position = validShips.indexOf(shipId);
          }
        }
      });
    }

    return formationId;
  }

  private updateShipStatus(shipId: string, status: UnifiedShipStatus): void {
    const ship = this.ships.get(shipId);
    if (ship) {
      const previousStatus = ship.status;

      let previousSimpleStatus: UnifiedShipStatus;
      if (typeof previousStatus === 'object' && 'main' in previousStatus) {
        previousSimpleStatus = (previousStatus as { main: UnifiedShipStatus }).main;
      } else {
        previousSimpleStatus = previousStatus;
      }

      if (previousSimpleStatus !== status) {
        ship.status = status;
        this.publish({
          type: EventType.STATUS_CHANGED,
          managerId: this.managerName,
          moduleId: shipId,
          timestamp: Date.now(),
          data: { status: ship.status, previousStatus: previousSimpleStatus, moduleType: 'combat' },
        });
      }
    }
  }

  private getPriorityForShipType(type: FactionShipClass | undefined): number {
    if (!type) return 0;
    const typeString = type as string;
    switch (typeString) {
      case 'motherEarthRevenge':
        return 5;
      case 'midwayCarrier':
        return 4;
      case 'harbringerGalleon':
        return 3;
      case 'orionFrigate':
        return 2;
      case 'starSchooner':
        return 1;
      case 'spitflare':
        return 1;
      default:
        return 0;
    }
  }
}
