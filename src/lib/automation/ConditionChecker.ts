import { AutomationCondition } from "./AutomationManager";
import { MiningShipManagerImpl } from "./MiningShipManagerImpl";

export class ConditionChecker {
  private lastCheckedTimes: Map<string, number> = new Map();
  private miningManager: MiningShipManagerImpl;

  constructor(miningManager: MiningShipManagerImpl) {
    this.miningManager = miningManager;
  }

  private getConditionKey(condition: AutomationCondition): string {
    return `${condition.type}-${condition.target}-${condition.value}-${condition.operator}`;
  }

  public checkCondition(condition: AutomationCondition): boolean {
    const now = Date.now();
    const key = this.getConditionKey(condition);
    const lastChecked = this.lastCheckedTimes.get(key) || 0;

    // Update last checked time
    this.lastCheckedTimes.set(key, now);

    // Time-based conditions
    if (condition.type === "TIME_ELAPSED") {
      const elapsed = now - lastChecked;
      return condition.operator === "greater" 
        ? elapsed > condition.value 
        : elapsed < condition.value;
    }

    // Resource-based conditions
    if (condition.type === "RESOURCE_ABOVE" || condition.type === "RESOURCE_BELOW") {
      // These conditions are now handled by the ThresholdContext
      // This just acts as a pass-through to maintain compatibility
      return true;
    }

    return false;
  }

  public resetCondition(condition: AutomationCondition): void {
    const key = this.getConditionKey(condition);
    this.lastCheckedTimes.delete(key);
  }
} 