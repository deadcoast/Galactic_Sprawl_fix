import { EventEmitter } from '../utils/EventEmitter';
import { FactionId, FactionBehaviorType } from '../../types/ships/FactionTypes';
import { moduleEventBus, ModuleEventType } from '../modules/ModuleEvents';
import { factionConfigs } from '../../config/factions/factions';
import { ModuleType } from '../../types/buildings/ModuleTypes';

interface RelationshipState {
  value: number; // -1 to 1
  lastUpdate: number;
  tradeCount: number;
  conflictCount: number;
  treatyStatus: 'none' | 'ceasefire' | 'trade' | 'alliance';
}

interface RelationshipEvents {
  relationshipChanged: {
    factionId: FactionId;
    targetFactionId: FactionId;
    oldValue: number;
    newValue: number;
    reason: string;
  };
  treatyStatusChanged: {
    factionId: FactionId;
    targetFactionId: FactionId;
    oldStatus: RelationshipState['treatyStatus'];
    newStatus: RelationshipState['treatyStatus'];
  };
  tradeEstablished: {
    factionId: FactionId;
    targetFactionId: FactionId;
    resourceType: string;
    amount: number;
  };
  conflictRecorded: {
    factionId: FactionId;
    targetFactionId: FactionId;
    type: 'attack' | 'territory' | 'trade';
    severity: number;
  };
}

export class FactionRelationshipManager extends EventEmitter<RelationshipEvents> {
  private relationships: Map<string, RelationshipState> = new Map();

  constructor() {
    super();
    this.initializeRelationships();
    this.setupEventListeners();
  }

  private initializeRelationships(): void {
    // Initialize relationships between all factions
    const factionIds = Object.keys(factionConfigs);

    factionIds.forEach(factionId => {
      factionIds.forEach(targetId => {
        if (factionId !== targetId) {
          const key = this.getRelationshipKey(factionId as FactionId, targetId as FactionId);
          this.relationships.set(key, {
            value: this.getInitialRelationshipValue(factionId as FactionId, targetId as FactionId),
            lastUpdate: Date.now(),
            tradeCount: 0,
            conflictCount: 0,
            treatyStatus: 'none',
          });
        }
      });
    });
  }

  private setupEventListeners(): void {
    moduleEventBus.subscribe('RESOURCE_TRANSFERRED' as ModuleEventType, event => {
      if (event.data.sourceFaction && event.data.targetFaction) {
        this.recordTrade(
          event.data.sourceFaction as FactionId,
          event.data.targetFaction as FactionId,
          event.data.resourceType,
          event.data.amount
        );
      }
    });

    moduleEventBus.subscribe('STATUS_CHANGED' as ModuleEventType, event => {
      if (
        event.data.type === 'combat' &&
        event.data.attackerFaction &&
        event.data.defenderFaction
      ) {
        this.recordConflict(
          event.data.attackerFaction as FactionId,
          event.data.defenderFaction as FactionId,
          'attack',
          event.data.damage || 1
        );
      }
    });
  }

  private getRelationshipKey(factionId: FactionId, targetId: FactionId): string {
    return [factionId, targetId].sort().join('-');
  }

  private getInitialRelationshipValue(factionId: FactionId, targetId: FactionId): number {
    const faction = factionConfigs[factionId];
    const target = factionConfigs[targetId];

    if (faction.specialRules.alwaysHostile || target.specialRules.alwaysHostile) {
      return -0.5; // Start hostile
    }

    // Calculate initial relationship based on behavior compatibility
    const aggressionDiff = Math.abs(
      faction.behavior.baseAggression - target.behavior.baseAggression
    );
    const tradingDiff = Math.abs(
      faction.behavior.tradingPreference - target.behavior.tradingPreference
    );

    return 0.5 - (aggressionDiff + tradingDiff) / 4; // Results in range -0.5 to 0.5
  }

  public getRelationship(factionId: FactionId, targetId: FactionId): number {
    const key = this.getRelationshipKey(factionId, targetId);
    return this.relationships.get(key)?.value || 0;
  }

  public getTreatyStatus(
    factionId: FactionId,
    targetId: FactionId
  ): RelationshipState['treatyStatus'] {
    const key = this.getRelationshipKey(factionId, targetId);
    return this.relationships.get(key)?.treatyStatus || 'none';
  }

  public modifyRelationship(
    factionId: FactionId,
    targetId: FactionId,
    change: number,
    reason: string
  ): void {
    const key = this.getRelationshipKey(factionId, targetId);
    const state = this.relationships.get(key);

    if (state) {
      const oldValue = state.value;
      state.value = Math.max(-1, Math.min(1, state.value + change));
      state.lastUpdate = Date.now();

      this.emit('relationshipChanged', {
        factionId,
        targetFactionId: targetId,
        oldValue,
        newValue: state.value,
        reason,
      });

      // Update treaty status based on new relationship value
      this.updateTreatyStatus(factionId, targetId);

      // Emit module event for status change
      moduleEventBus.emit({
        type: 'STATUS_CHANGED' as ModuleEventType,
        moduleId: `faction-${factionId}`,
        moduleType: 'trading' as ModuleType,
        timestamp: Date.now(),
        data: {
          type: 'relationship',
          targetFaction: targetId,
          oldValue,
          newValue: state.value,
          reason,
        },
      });
    }
  }

  private updateTreatyStatus(factionId: FactionId, targetId: FactionId): void {
    const key = this.getRelationshipKey(factionId, targetId);
    const state = this.relationships.get(key);

    if (!state) {
      return;
    }

    const oldStatus = state.treatyStatus;
    let newStatus: RelationshipState['treatyStatus'] = 'none';

    // Determine new status based on relationship value
    if (state.value >= 0.8) {
      newStatus = 'alliance';
    } else if (state.value >= 0.5) {
      newStatus = 'trade';
    } else if (state.value >= 0) {
      newStatus = 'ceasefire';
    }

    if (newStatus !== oldStatus) {
      state.treatyStatus = newStatus;
      this.emit('treatyStatusChanged', {
        factionId,
        targetFactionId: targetId,
        oldStatus,
        newStatus,
      });

      // Emit module event for treaty change
      moduleEventBus.emit({
        type: 'STATUS_CHANGED' as ModuleEventType,
        moduleId: `faction-${factionId}`,
        moduleType: 'trading' as ModuleType,
        timestamp: Date.now(),
        data: {
          type: 'treaty',
          targetFaction: targetId,
          oldStatus,
          newStatus,
        },
      });
    }
  }

  public recordTrade(
    factionId: FactionId,
    targetId: FactionId,
    resourceType: string,
    amount: number
  ): void {
    const key = this.getRelationshipKey(factionId, targetId);
    const state = this.relationships.get(key);

    if (state) {
      state.tradeCount++;

      // Improve relationship based on trade
      const relationshipChange =
        (Math.min(0.1, amount / 1000) *
          (factionConfigs[factionId].behavior.tradingPreference +
            factionConfigs[targetId].behavior.tradingPreference)) /
        2;

      this.modifyRelationship(factionId, targetId, relationshipChange, 'trade');

      this.emit('tradeEstablished', {
        factionId,
        targetFactionId: targetId,
        resourceType,
        amount,
      });
    }
  }

  public recordConflict(
    factionId: FactionId,
    targetId: FactionId,
    type: 'attack' | 'territory' | 'trade',
    severity: number
  ): void {
    const key = this.getRelationshipKey(factionId, targetId);
    const state = this.relationships.get(key);

    if (state) {
      state.conflictCount++;

      // Worsen relationship based on conflict
      const relationshipChange =
        (-Math.min(0.2, severity / 100) *
          (factionConfigs[factionId].behavior.baseAggression +
            factionConfigs[targetId].behavior.baseAggression)) /
        2;

      this.modifyRelationship(factionId, targetId, relationshipChange, `conflict_${type}`);

      this.emit('conflictRecorded', {
        factionId,
        targetFactionId: targetId,
        type,
        severity,
      });
    }
  }

  public canEstablishTreaty(
    factionId: FactionId,
    targetId: FactionId,
    type: RelationshipState['treatyStatus']
  ): boolean {
    const relationship = this.getRelationship(factionId, targetId);
    const faction = factionConfigs[factionId];
    const target = factionConfigs[targetId];

    // Check for special rules that prevent treaties
    if (faction.specialRules.alwaysHostile || target.specialRules.alwaysHostile) {
      return false;
    }

    // Check relationship requirements for different treaty types
    switch (type) {
      case 'alliance':
        return relationship >= 0.8;
      case 'trade':
        return relationship >= 0.5;
      case 'ceasefire':
        return relationship >= 0;
      default:
        return true;
    }
  }

  public cleanup(): void {
    this.relationships.clear();
  }

  /**
   * Handle diplomatic action
   */
  public handleDiplomaticAction(
    factionId: FactionId,
    targetId: FactionId,
    action: 'ceasefire' | 'tradeRoute' | 'alliance' | 'tribute',
    resources?: { type: string; amount: number }[]
  ): boolean {
    const key = this.getRelationshipKey(factionId, targetId);
    const state = this.relationships.get(key);

    if (!state) {
      return false;
    }

    const faction = factionConfigs[factionId];
    const target = factionConfigs[targetId];

    // Check if action is allowed based on special rules
    if (
      (faction.specialRules.alwaysHostile || target.specialRules.alwaysHostile) &&
      action !== 'tribute'
    ) {
      return false;
    }

    let success = false;
    let relationshipChange = 0;

    switch (action) {
      case 'ceasefire':
        if (state.value < 0 && !state.treatyStatus) {
          success = true;
          relationshipChange = 0.2;
          state.treatyStatus = 'ceasefire';
        }
        break;

      case 'tradeRoute':
        if (state.value >= 0 && state.treatyStatus !== 'alliance') {
          success = true;
          relationshipChange = 0.3;
          state.treatyStatus = 'trade';
        }
        break;

      case 'alliance':
        if (state.value >= 0.5 && state.treatyStatus === 'trade') {
          success = true;
          relationshipChange = 0.4;
          state.treatyStatus = 'alliance';
        }
        break;

      case 'tribute':
        if (resources && resources.length > 0) {
          success = true;
          // Calculate relationship improvement based on tribute value
          relationshipChange = Math.min(
            0.2,
            resources.reduce((total, r) => total + r.amount, 0) / 5000
          );
        }
        break;
    }

    if (success) {
      this.modifyRelationship(factionId, targetId, relationshipChange, `diplomatic_${action}`);

      // Emit module event for diplomatic action
      moduleEventBus.emit({
        type: 'STATUS_CHANGED' as ModuleEventType,
        moduleId: `faction-${factionId}`,
        moduleType: 'trading' as ModuleType,
        timestamp: Date.now(),
        data: {
          type: 'diplomatic_action',
          action,
          targetFaction: targetId,
          success: true,
          resources,
        },
      });
    }

    return success;
  }

  /**
   * Get available diplomatic actions
   */
  public getAvailableDiplomaticActions(
    factionId: FactionId,
    targetId: FactionId
  ): {
    type: 'ceasefire' | 'tradeRoute' | 'alliance' | 'tribute';
    name: string;
    description: string;
    requirements: { type: string; value: number }[];
    available: boolean;
  }[] {
    const relationship = this.getRelationship(factionId, targetId);
    const treatyStatus = this.getTreatyStatus(factionId, targetId);
    const faction = factionConfigs[factionId];
    const target = factionConfigs[targetId];

    const actions: {
      type: 'ceasefire' | 'tradeRoute' | 'alliance' | 'tribute';
      name: string;
      description: string;
      requirements: { type: string; value: number }[];
      available: boolean;
    }[] = [];

    // Always allow tribute
    actions.push({
      type: 'tribute',
      name: 'Offer Tribute',
      description: 'Improve relations through resource offerings',
      requirements: [
        { type: 'Credits', value: 2500 },
        { type: 'Resources', value: 1000 },
      ],
      available: true,
    });

    // Don't allow other diplomatic actions with always hostile factions
    if (faction.specialRules.alwaysHostile || target.specialRules.alwaysHostile) {
      return actions;
    }

    // Ceasefire
    if (relationship < 0 && treatyStatus === 'none') {
      actions.push({
        type: 'ceasefire',
        name: 'Negotiate Ceasefire',
        description: 'Attempt to establish temporary peace',
        requirements: [
          { type: 'Credits', value: 5000 },
          { type: 'Reputation', value: -50 },
        ],
        available: true,
      });
    }

    // Trade Route
    if (relationship >= 0 && treatyStatus !== 'alliance') {
      actions.push({
        type: 'tradeRoute',
        name: 'Establish Trade Route',
        description: 'Create a trade route for resource exchange',
        requirements: [
          { type: 'Credits', value: 10000 },
          { type: 'Reputation', value: 0 },
        ],
        available: relationship >= 0,
      });
    }

    // Alliance
    if (relationship >= 0.5 && treatyStatus === 'trade') {
      actions.push({
        type: 'alliance',
        name: 'Form Alliance',
        description: 'Establish a formal alliance for mutual benefit',
        requirements: [
          { type: 'Credits', value: 25000 },
          { type: 'Reputation', value: 50 },
        ],
        available: relationship >= 0.5,
      });
    }

    return actions;
  }
}

// Export singleton instance
export const factionRelationshipManager = new FactionRelationshipManager();
