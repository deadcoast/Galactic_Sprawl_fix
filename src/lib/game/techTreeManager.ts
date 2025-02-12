import { EventEmitter } from "../utils/EventEmitter";

interface TechNode {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3 | 4;
  requirements: string[];
  unlocked: boolean;
  category:
    | "infrastructure"
    | "warFleet"
    | "reconFleet"
    | "miningFleet"
    | "weapons"
    | "defense"
    | "special"
    | "synergy";
}

class TechTreeManagerImpl extends EventEmitter {
  private unlockedNodes: Set<string> = new Set();
  private techNodes: Map<string, TechNode> = new Map();

  constructor() {
    super();
  }

  public registerNode(node: TechNode): void {
    this.techNodes.set(node.id, node);
    if (node.unlocked) {
      this.unlockedNodes.add(node.id);
    }
  }

  public unlockNode(nodeId: string): boolean {
    const node = this.techNodes.get(nodeId);
    if (!node) return false;

    // Check requirements
    if (!this.canUnlock(nodeId)) return false;

    this.unlockedNodes.add(nodeId);
    node.unlocked = true;

    this.emit("nodeUnlocked", { nodeId, node });
    return true;
  }

  public isUnlocked(nodeId: string): boolean {
    return this.unlockedNodes.has(nodeId);
  }

  public canUnlock(nodeId: string): boolean {
    const node = this.techNodes.get(nodeId);
    if (!node) return false;

    // Check if all requirements are met
    return node.requirements.every((reqId) => this.isUnlocked(reqId));
  }

  public getUnlockedNodes(): Set<string> {
    return new Set(this.unlockedNodes);
  }

  public getNode(nodeId: string): TechNode | undefined {
    return this.techNodes.get(nodeId);
  }

  public getAvailableNodes(): TechNode[] {
    return Array.from(this.techNodes.values()).filter(
      (node) => !node.unlocked && this.canUnlock(node.id),
    );
  }

  // Special checks for specific tech capabilities
  public hasWarShipSalvage(): boolean {
    return this.isUnlocked("cutting-laser");
  }
}

export const techTreeManager = new TechTreeManagerImpl();
