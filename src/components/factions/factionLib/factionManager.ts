import { factionConfigs } from '../config/factions';

interface FactionState {
  activeShips: number;
  territory: {
    center: { x: number; y: number };
    radius: number;
  };
  fleetStrength: number;
  relationshipWithPlayer: number;  // -1 to 1
  lastActivity: number;
  isActive: boolean;
}

export type { FactionState };

class FactionManager {
  private factionStates: Map<string, FactionState> = new Map();
  private playerTier: number = 1;
  private playerPower: number = 0;

  constructor() {
    // Initialize faction states
    Object.values(factionConfigs).forEach(config => {
      this.factionStates.set(config.id, {
        activeShips: 0,
        territory: {
          center: { x: 0, y: 0 },
          radius: config.spawnConditions.territorySize
        },
        fleetStrength: 1,
        relationshipWithPlayer: config.specialRules.alwaysHostile ? -1 : 0,
        lastActivity: Date.now(),
        isActive: false
      });
    });
  }

  public updatePlayerStatus(tier: number, power: number) {
    this.playerTier = tier;
    this.playerPower = power;
    this.checkFactionActivation();
  }

  private checkFactionActivation() {
    Object.values(factionConfigs).forEach(config => {
      const state = this.factionStates.get(config.id);
      if (!state) {
        return;
      }

      // Check activation conditions
      const shouldActivate = 
        this.playerTier >= config.spawnConditions.minTier &&
        (!config.specialRules.powerThreshold || this.playerPower >= config.specialRules.powerThreshold);

      if (shouldActivate && !state.isActive) {
        this.activateFaction(config.id);
      } else if (!shouldActivate && state.isActive) {
        this.deactivateFaction(config.id);
      }
    });
  }

  private activateFaction(factionId: string) {
    const state = this.factionStates.get(factionId);
    if (!state) {
      return;
    }

    state.isActive = true;
    state.lastActivity = Date.now();

    // Initialize starting position away from player
    const angle = Math.random() * Math.PI * 2;
    const distance = 200 + Math.random() * 100;
    state.territory.center = {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  }

  private deactivateFaction(factionId: string) {
    const state = this.factionStates.get(factionId);
    if (!state) {
      return;
    }

    state.isActive = false;
    state.activeShips = 0;
    state.fleetStrength = 1;
  }

  public getFactionState(factionId: string): FactionState | undefined {
    return this.factionStates.get(factionId);
  }

  public getFactionBehavior(factionId: string) {
    const config = factionConfigs[factionId];
    const state = this.factionStates.get(factionId);
    if (!config || !state) {
      return null;
    }

    return {
      isHostile: this.isHostileToPlayer(factionId),
      willAttack: this.willInitiateAttack(factionId),
      expansionPriority: this.calculateExpansionPriority(factionId),
      reinforcementNeeded: state.fleetStrength < config.behavior.reinforcementThreshold
    };
  }

  private isHostileToPlayer(factionId: string): boolean {
    const config = factionConfigs[factionId];
    const state = this.factionStates.get(factionId);
    if (!config || !state) {
      return false;
    }

    if (config.specialRules.alwaysHostile) {
      return true;
    }
    if (config.specialRules.requiresProvocation) {
      return state.relationshipWithPlayer < -0.5;
    }
    return state.relationshipWithPlayer < 0;
  }

  private willInitiateAttack(factionId: string): boolean {
    const config = factionConfigs[factionId];
    const state = this.factionStates.get(factionId);
    if (!config || !state) {
      return false;
    }

    const aggressionCheck = Math.random() < config.behavior.baseAggression;
    const strengthCheck = state.fleetStrength > config.behavior.retreatThreshold;
    
    return aggressionCheck && strengthCheck && this.isHostileToPlayer(factionId);
  }

  private calculateExpansionPriority(factionId: string): number {
    const config = factionConfigs[factionId];
    const state = this.factionStates.get(factionId);
    if (!config || !state) {
      return 0;
    }

    const territoryFactor = state.activeShips / config.spawnConditions.maxShips;
    const timeFactor = (Date.now() - state.lastActivity) / 60000; // minutes since last activity

    return config.behavior.expansionRate * (1 - territoryFactor) * Math.min(timeFactor, 1);
  }

  public update() {
    this.factionStates.forEach((state, factionId) => {
      if (!state.isActive) {
        return;
      }

      const config = factionConfigs[factionId];
      if (!config) {
        return;
      }

      // Update fleet strength based on active ships
      state.fleetStrength = state.activeShips / config.spawnConditions.maxShips;

      // Check for new ship spawns
      if (state.activeShips < config.spawnConditions.maxShips && Math.random() < config.spawnConditions.spawnRate) {
            state.activeShips++;
            state.lastActivity = Date.now();
      }

      // Update territory
      if (this.calculateExpansionPriority(factionId) > 0.7) {
        state.territory.radius += 5;
      }
    });
  }
}

export const factionManager = new FactionManager();