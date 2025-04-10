import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import { CombatUnit } from '../../types/combat/CombatTypes';
import { Position } from '../../types/core/GameTypes';
import {
    BehaviorActionStartedEventData,
    BehaviorNodeExecutedEventData,
    EventType
} from '../../types/events/EventTypes';
import { FactionId } from '../../types/ships/FactionTypes';

interface BehaviorNode {
  id: string;
  type: 'sequence' | 'selector' | 'condition' | 'action';
  children?: BehaviorNode[];
  evaluate?: (context: BehaviorContext) => boolean;
  execute?: (context: BehaviorContext) => void;
}

interface BehaviorContext {
  unit: CombatUnit & { target?: string };
  factionId: FactionId;
  fleetStrength: number;
  threatLevel: number;
  nearbyEnemies: CombatUnit[];
  nearbyAllies: CombatUnit[];
  currentFormation: {
    type: 'offensive' | 'defensive' | 'balanced';
    spacing: number;
    facing: number;
  };
  lastAction?: string;
  cooldowns: Record<string, number>;
}

export class BehaviorTreeManager {
  private static instance: BehaviorTreeManager;
  private trees: Map<string, BehaviorNode> = new Map();
  private contexts: Map<string, BehaviorContext> = new Map();

  private constructor() {
    this.initializeDefaultTrees();
  }

  public static getInstance(): BehaviorTreeManager {
    if (!BehaviorTreeManager.instance) {
      BehaviorTreeManager.instance = new BehaviorTreeManager();
    }
    return BehaviorTreeManager.instance;
  }

  private initializeDefaultTrees(): void {
    // Space Rats - Aggressive behavior tree
    this.trees.set('space-rats-combat', {
      id: 'space-rats-root',
      type: 'sequence',
      children: [
        {
          id: 'check-health',
          type: 'condition',
          evaluate: context => context.unit.stats.health / context.unit.stats.maxHealth > 0.3,
        },
        {
          id: 'select-target',
          type: 'selector',
          children: [
            {
              id: 'engage-existing',
              type: 'condition',
              evaluate: context => Boolean(context.unit.target),
            },
            {
              id: 'find-new-target',
              type: 'action',
              execute: context => this.findNearestTarget(context),
            },
          ],
        },
        {
          id: 'combat-sequence',
          type: 'sequence',
          children: [
            {
              id: 'approach-target',
              type: 'action',
              execute: context => this.moveTowardsTarget(context),
            },
            {
              id: 'attack-target',
              type: 'action',
              execute: context => this.attackTarget(context),
            },
          ],
        },
      ],
    });

    // Lost Nova - Stealth behavior tree
    this.trees.set('lost-nova-combat', {
      id: 'lost-nova-root',
      type: 'sequence',
      children: [
        {
          id: 'assess-threat',
          type: 'selector',
          children: [
            {
              id: 'check-overwhelming-force',
              type: 'condition',
              evaluate: context => context.fleetStrength > context.threatLevel * 1.5,
            },
            {
              id: 'maintain-stealth',
              type: 'action',
              execute: context => this.activateStealth(context),
            },
          ],
        },
        {
          id: 'combat-decision',
          type: 'selector',
          children: [
            {
              id: 'retreat-if-needed',
              type: 'condition',
              evaluate: context => context.unit.stats.health / context.unit.stats.maxHealth < 0.4,
            },
            {
              id: 'opportunistic-attack',
              type: 'sequence',
              children: [
                {
                  id: 'find-isolated-target',
                  type: 'action',
                  execute: context => this.findIsolatedTarget(context),
                },
                {
                  id: 'surprise-attack',
                  type: 'action',
                  execute: context => this.performSurpriseAttack(context),
                },
              ],
            },
          ],
        },
      ],
    });

    // Equator Horizon - Balanced behavior tree
    this.trees.set('equator-horizon-combat', {
      id: 'equator-horizon-root',
      type: 'sequence',
      children: [
        {
          id: 'assess-situation',
          type: 'selector',
          children: [
            {
              id: 'check-fleet-balance',
              type: 'condition',
              evaluate: context => Math.abs(context.fleetStrength - context.threatLevel) < 0.2,
            },
            {
              id: 'adjust-formation',
              type: 'action',
              execute: context => this.adjustFormation(context),
            },
          ],
        },
        {
          id: 'tactical-response',
          type: 'selector',
          children: [
            {
              id: 'coordinate-attack',
              type: 'sequence',
              children: [
                {
                  id: 'form-attack-pattern',
                  type: 'action',
                  execute: context => this.formAttackPattern(context),
                },
                {
                  id: 'execute-coordinated-strike',
                  type: 'action',
                  execute: context => this.executeCoordinatedStrike(context),
                },
              ],
            },
            {
              id: 'defensive-maneuver',
              type: 'sequence',
              children: [
                {
                  id: 'form-defensive-pattern',
                  type: 'action',
                  execute: context => this.formDefensivePattern(context),
                },
                {
                  id: 'coordinate-shield-boost',
                  type: 'action',
                  execute: context => this.coordinateShieldBoost(context),
                },
              ],
            },
          ],
        },
      ],
    });
  }

  public evaluateTree(unitId: string, treeId: string): boolean {
    const tree = this.trees.get(treeId);
    const context = this.contexts.get(unitId);

    if (!tree || !context) {
      return false;
    }

    return this.evaluateNode(tree, context);
  }

  private evaluateNode(node: BehaviorNode, context: BehaviorContext): boolean {
    switch (node.type) {
      case 'sequence':
        return this.evaluateSequence(node, context);
      case 'selector':
        return this.evaluateSelector(node, context);
      case 'condition':
        return node.evaluate?.(context) || false;
      case 'action':
        if (node.execute) {
          node.execute(context);
          const eventData: BehaviorNodeExecutedEventData = { nodeId: node.id, success: true, unitId: context.unit.id };
          eventSystem.publish({
              type: EventType.BEHAVIOR_NODE_EXECUTED,
              managerId: 'BehaviorTreeManager',
              timestamp: Date.now(),
              data: eventData
          });
          return true;
        }
        return false;
      default:
        return false;
    }
  }

  private evaluateSequence(node: BehaviorNode, context: BehaviorContext): boolean {
    if (!node.children) {
      return true;
    }

    for (const child of node.children) {
      if (!this.evaluateNode(child, context)) {
        return false;
      }
    }
    return true;
  }

  private evaluateSelector(node: BehaviorNode, context: BehaviorContext): boolean {
    if (!node.children) {
      return false;
    }

    for (const child of node.children) {
      if (this.evaluateNode(child, context)) {
        return true;
      }
    }
    return false;
  }

  public updateContext(unitId: string, context: Partial<BehaviorContext>): void {
    const existing = this.contexts.get(unitId);
    if (existing) {
      this.contexts.set(unitId, { ...existing, ...context });
    } else {
      this.contexts.set(unitId, context as BehaviorContext);
    }
  }

  private findNearestTarget(context: BehaviorContext): void {
    if (context.nearbyEnemies.length === 0) {
      return;
    }

    const nearest = context.nearbyEnemies.reduce((closest, current) => {
      const closestDist = this.getDistance(context.unit.position, closest.position);
      const currentDist = this.getDistance(context.unit.position, current.position);
      return currentDist < closestDist ? current : closest;
    });

    context.unit.target = nearest.id;
  }

  private findIsolatedTarget(context: BehaviorContext): void {
    const isolated = context.nearbyEnemies.find(enemy => {
      const nearbyAllies = context.nearbyEnemies.filter(
        other => other.id !== enemy.id && this.getDistance(enemy.position, other.position) > 200
      );
      return nearbyAllies.length === 0;
    });

    if (isolated) {
      context.unit.target = isolated.id;
    }
  }

  private moveTowardsTarget(context: BehaviorContext): void {
    const target = context.nearbyEnemies.find(e => e.id === context.unit.target);
    if (!target) {
      return;
    }

    const distance = this.getDistance(context.unit.position, target.position);
    if (distance > 100) {
      const dx = target.position.x - context.unit.position.x;
      const dy = target.position.y - context.unit.position.y;
      const angle = Math.atan2(dy, dx);

      context.unit.position = {
        x: context.unit.position.x + Math.cos(angle) * 5,
        y: context.unit.position.y + Math.sin(angle) * 5,
      };
    }
  }

  private attackTarget(context: BehaviorContext): void {
    const target = context.nearbyEnemies.find(e => e.id === context.unit.target);
    if (!target) {
      return;
    }

    const readyWeapon = context.unit.weapons.find(w => w.status === 'ready');
    if (readyWeapon) {
      const eventData: BehaviorActionStartedEventData = { unitId: context.unit.id, actionType: 'attack' };
      eventSystem.publish({
          type: EventType.BEHAVIOR_ACTION_STARTED,
          managerId: 'BehaviorTreeManager',
          timestamp: Date.now(),
          data: eventData
      });
      // Weapon firing logic handled by combat manager
    }
  }

  private activateStealth(context: BehaviorContext): void {
    if (!context.cooldowns['stealth']) {
      const eventData: BehaviorActionStartedEventData = { unitId: context.unit.id, actionType: 'stealth' };
      eventSystem.publish({
          type: EventType.BEHAVIOR_ACTION_STARTED,
          managerId: 'BehaviorTreeManager',
          timestamp: Date.now(),
          data: eventData
      });
      context.cooldowns['stealth'] = Date.now() + 10000; // 10 second cooldown
    }
  }

  private performSurpriseAttack(context: BehaviorContext): void {
    if (context.unit.target) {
      const eventData: BehaviorActionStartedEventData = { unitId: context.unit.id, actionType: 'surprise_attack' };
      eventSystem.publish({
          type: EventType.BEHAVIOR_ACTION_STARTED,
          managerId: 'BehaviorTreeManager',
          timestamp: Date.now(),
          data: eventData
      });
      // Surprise attack bonus handled by combat manager
    }
  }

  private adjustFormation(context: BehaviorContext): void {
    const newFormation =
      context.fleetStrength > context.threatLevel
        ? 'offensive'
        : context.fleetStrength < context.threatLevel
          ? 'defensive'
          : 'balanced';

    if (newFormation !== context.currentFormation.type) {
      context.currentFormation.type = newFormation;
      const eventData: BehaviorActionStartedEventData = { unitId: context.unit.id, actionType: 'formation_change' };
      eventSystem.publish({
          type: EventType.BEHAVIOR_ACTION_STARTED,
          managerId: 'BehaviorTreeManager',
          timestamp: Date.now(),
          data: eventData
      });
    }
  }

  private formAttackPattern(context: BehaviorContext): void {
    if (context.nearbyAllies.length >= 3) {
      const eventData: BehaviorActionStartedEventData = { unitId: context.unit.id, actionType: 'form_attack_pattern' };
      eventSystem.publish({
          type: EventType.BEHAVIOR_ACTION_STARTED,
          managerId: 'BehaviorTreeManager',
          timestamp: Date.now(),
          data: eventData
      });
      // Formation pattern handled by fleet manager
    }
  }

  private executeCoordinatedStrike(context: BehaviorContext): void {
    if (context.unit.target && context.nearbyAllies.length >= 2) {
      const eventData: BehaviorActionStartedEventData = { unitId: context.unit.id, actionType: 'coordinated_strike' };
      eventSystem.publish({
          type: EventType.BEHAVIOR_ACTION_STARTED,
          managerId: 'BehaviorTreeManager',
          timestamp: Date.now(),
          data: eventData
      });
      // Coordinated attack handled by combat manager
    }
  }

  private formDefensivePattern(context: BehaviorContext): void {
    if (context.nearbyAllies.length >= 2) {
      const eventData: BehaviorActionStartedEventData = { unitId: context.unit.id, actionType: 'form_defensive_pattern' };
      eventSystem.publish({
          type: EventType.BEHAVIOR_ACTION_STARTED,
          managerId: 'BehaviorTreeManager',
          timestamp: Date.now(),
          data: eventData
      });
      // Defensive formation handled by fleet manager
    }
  }

  private coordinateShieldBoost(context: BehaviorContext): void {
    const lowShieldAllies = context.nearbyAllies.filter(
      ally => ally.stats.shield / ally.stats.maxShield < 0.5
    );

    if (lowShieldAllies.length > 0) {
      const eventData: BehaviorActionStartedEventData = { unitId: context.unit.id, actionType: 'shield_boost' };
      eventSystem.publish({
          type: EventType.BEHAVIOR_ACTION_STARTED,
          managerId: 'BehaviorTreeManager',
          timestamp: Date.now(),
          data: eventData
      });
      // Shield boost handled by combat manager
    }
  }

  private getDistance(pos1: Position, pos2: Position): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }
}

// Export singleton instance
export const behaviorTreeManager = BehaviorTreeManager.getInstance();
