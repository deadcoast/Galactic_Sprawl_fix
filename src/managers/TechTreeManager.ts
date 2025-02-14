import EventEmitter from 'events';

/**
 * Tech tree node interface
 */
export interface TechNode {
  id: string;
  type: string;
  tier: number;
  unlocked: boolean;
}

/**
 * Tech tree manager for handling tech unlocks and progression
 */
class TechTreeManager extends EventEmitter {
  private nodes: Map<string, TechNode> = new Map();

  constructor() {
    super();
  }

  /**
   * Unlock a tech tree node
   */
  unlockNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node && !node.unlocked) {
      node.unlocked = true;
      this.emit('nodeUnlocked', { nodeId, node });
    }
  }

  /**
   * Add a node to the tech tree
   */
  addNode(node: TechNode): void {
    this.nodes.set(node.id, node);
  }

  /**
   * Get a node from the tech tree
   */
  getNode(nodeId: string): TechNode | undefined {
    return this.nodes.get(nodeId);
  }
}

export const techTreeManager = new TechTreeManager();
