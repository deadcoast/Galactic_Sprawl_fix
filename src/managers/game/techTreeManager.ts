/**
 * @context: tech-system, manager-registry
 * Tech tree manager handles technology research, unlocking, and synergy calculations
 */

import { BaseTypedEventEmitter } from '../../lib/events/BaseTypedEventEmitter';

/**
 * Tech tree node interface
 */
export interface TechNode {
  id: string;
  name: string;
  description: string;
  type: string;
  tier: 1 | 2 | 3 | 4;
  requirements: string[];
  unlocked: boolean;
  category:
    | 'infrastructure'
    | 'warFleet'
    | 'reconFleet'
    | 'miningFleet'
    | 'weapons'
    | 'defense'
    | 'special'
    | 'synergy';
  researchProgress?: number;
  researchTime?: number;
  synergyModifiers?: Record<string, number>;
}

/**
 * Tech path interface for planning research paths
 */
export interface TechPath {
  nodes: string[];
  totalResearchTime: number;
  synergyBonus: number;
  benefits: string[];
}

// Define event types
type TechTreeEventMap = {
  nodeUnlocked: { nodeId: string; node: TechNode };
  researchStarted: { nodeId: string; node: TechNode; startTime: number };
  researchProgress: { nodeId: string; progress: number; remainingTime: number };
  researchCompleted: { nodeId: string; node: TechNode };
  synergyActivated: { nodeIds: string[]; synergyBonus: number };
};

type TechTreeEvents = {
  [K in keyof TechTreeEventMap]: TechTreeEventMap[K];
};

/**
 * @context: tech-system.manager, manager-registry
 * Manager for the tech tree system
 */
export class TechTreeManager extends BaseTypedEventEmitter<TechTreeEvents> {
  private static instance: TechTreeManager | null = null;
  private unlockedNodes: Set<string> = new Set();
  private techNodes: Map<string, TechNode> = new Map();
  private activeResearch: Map<
    string,
    {
      startTime: number;
      endTime: number;
      intervalId?: NodeJS.Timeout;
    }
  > = new Map();
  private synergies: Map<string, Set<string>> = new Map();
  private activeSynergies: Set<string> = new Set();

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    super();
  }

  /**
   * Get the singleton instance of TechTreeManager
   */
  public static getInstance(): TechTreeManager {
    if (!TechTreeManager.instance) {
      TechTreeManager.instance = new TechTreeManager();
    }
    return TechTreeManager.instance;
  }

  /**
   * Register a node in the tech tree
   */
  public registerNode(node: TechNode): void {
    // Update synergy tracking if applicable
    if (node.synergyModifiers) {
      Object.keys(node.synergyModifiers).forEach(targetNodeId => {
        if (!this.synergies.has(targetNodeId)) {
          this.synergies.set(targetNodeId, new Set());
        }
        this.synergies.get(targetNodeId)?.add(node.id);
      });
    }

    this.techNodes.set(node.id, node);

    // Update the unlocked nodes set if the node is already unlocked
    if (node.unlocked) {
      this.unlockedNodes.add(node.id);
    }
  }

  /**
   * Unlock a node in the tech tree immediately
   */
  public unlockNode(nodeId: string): boolean {
    const node = this.techNodes.get(nodeId);
    if (!node) {
      console.warn(`[TechTreeManager] Node ${nodeId} not found`);
      return false;
    }

    // Check if node can be unlocked
    if (!this.canUnlock(nodeId)) {
      console.warn(
        `[TechTreeManager] Cannot unlock node ${nodeId} because requirements are not met`
      );
      return false;
    }

    // Mark as unlocked
    node.unlocked = true;
    this.unlockedNodes.add(nodeId);

    // Update node in the map
    this.techNodes.set(nodeId, node);

    // Cancel unknown ongoing research
    this.cancelResearch(nodeId);

    // Emit unlocked event
    this.emit('nodeUnlocked', { nodeId, node });

    // Check and activate synergies
    this.checkAndActivateSynergies(nodeId);

    return true;
  }

  /**
   * Start researching a tech node
   * @param nodeId The ID of the node to research
   * @returns True if research started successfully
   */
  public startResearch(nodeId: string): boolean {
    const node = this.techNodes.get(nodeId);
    if (!node) {
      console.warn(`[TechTreeManager] Node ${nodeId} not found`);
      return false;
    }

    // Check if node can be researched
    if (!this.canUnlock(nodeId)) {
      console.warn(
        `[TechTreeManager] Cannot research node ${nodeId} because requirements are not met`
      );
      return false;
    }

    // Check if node is already unlocked
    if (node.unlocked) {
      console.warn(`[TechTreeManager] Node ${nodeId} is already unlocked`);
      return false;
    }

    // Check if node is already being researched
    if (this.activeResearch.has(nodeId)) {
      console.warn(`[TechTreeManager] Node ${nodeId} is already being researched`);
      return false;
    }

    // Default research time if not specified
    if (!node.researchTime) {
      node.researchTime = 60 * (node.tier || 1); // Default to 60 seconds * tier
    }

    // Initialize progress
    node.researchProgress = 0;

    // Start tracking research
    const startTime = Date.now();
    const endTime = startTime + node.researchTime * 1000;

    // Set up interval to update progress
    const intervalId = setInterval(() => {
      this.updateResearchProgress(nodeId);
    }, 1000); // Update every second

    this.activeResearch.set(nodeId, {
      startTime,
      endTime,
      intervalId,
    });

    // Update node in the map
    this.techNodes.set(nodeId, node);

    // Emit research started event
    this.emit('researchStarted', { nodeId, node, startTime });

    return true;
  }

  /**
   * Cancel ongoing research
   * @param nodeId The ID of the node to cancel research for
   * @returns True if research was cancelled successfully
   */
  public cancelResearch(nodeId: string): boolean {
    const researchData = this.activeResearch.get(nodeId);
    if (!researchData) {
      return false;
    }

    // Clear interval
    if (researchData.intervalId) {
      clearInterval(researchData.intervalId);
    }

    // Remove from active research
    this.activeResearch.delete(nodeId);

    // Reset progress
    const node = this.techNodes.get(nodeId);
    if (node) {
      node.researchProgress = 0;
      this.techNodes.set(nodeId, node);
    }

    return true;
  }

  /**
   * Update research progress for a node
   * @param nodeId The ID of the node to update progress for
   * @private
   */
  private updateResearchProgress(nodeId: string): void {
    const node = this.techNodes.get(nodeId);
    const researchData = this.activeResearch.get(nodeId);

    if (!node || !researchData || !node.researchTime) {
      return;
    }

    const now = Date.now();
    const elapsed = now - researchData.startTime;
    const total = node.researchTime * 1000;

    // Calculate progress (0-1)
    const progress = Math.min(1, elapsed / total);
    node.researchProgress = progress;

    // Update node in map
    this.techNodes.set(nodeId, node);

    // Emit progress event
    const remainingTime = Math.max(0, (researchData.endTime - now) / 1000);
    this.emit('researchProgress', {
      nodeId,
      progress,
      remainingTime,
    });

    // Check if research is complete
    if (progress >= 1) {
      // Clear interval
      if (researchData.intervalId) {
        clearInterval(researchData.intervalId);
      }

      // Remove from active research
      this.activeResearch.delete(nodeId);

      // Mark as unlocked
      node.unlocked = true;
      this.unlockedNodes.add(nodeId);

      // Emit completed event
      this.emit('researchCompleted', { nodeId, node });

      // Check and activate synergies
      this.checkAndActivateSynergies(nodeId);
    }
  }

  /**
   * Check for and activate synergies when a node is unlocked
   * @param nodeId The ID of the newly unlocked node
   * @private
   */
  private checkAndActivateSynergies(nodeId: string): void {
    // Get all nodes that have synergy with this node
    const synergyNodes = this.synergies.get(nodeId);
    if (!synergyNodes) {
      return;
    }

    // Check each synergy node
    const activatedSynergies = [...synergyNodes].filter(synergyNodeId => {
      const synergyNode = this.techNodes.get(synergyNodeId);
      return synergyNode?.unlocked === true;
    });

    if (activatedSynergies.length > 0) {
      // Calculate total synergy bonus
      let totalBonus = 0;
      activatedSynergies.forEach(synergyNodeId => {
        const synergyNode = this.techNodes.get(synergyNodeId);
        if (synergyNode?.synergyModifiers?.[nodeId]) {
          totalBonus += synergyNode.synergyModifiers[nodeId];
        }
      });

      // Mark synergy as active
      activatedSynergies.forEach(synergyNodeId => {
        this.activeSynergies.add(`${nodeId}-${synergyNodeId}`);
      });

      // Emit synergy activated event
      this.emit('synergyActivated', {
        nodeIds: [nodeId, ...activatedSynergies],
        synergyBonus: totalBonus,
      });
    }
  }

  /**
   * Check if a tech node is unlocked
   */
  public isUnlocked(nodeId: string): boolean {
    return this.unlockedNodes.has(nodeId);
  }

  /**
   * Check if a tech node can be unlocked
   */
  public canUnlock(nodeId: string): boolean {
    const node = this.techNodes.get(nodeId);
    if (!node) {
      return false;
    }

    // If already unlocked, it can't be unlocked again
    if (node.unlocked) {
      return false;
    }

    // Check if all requirements are met
    return node.requirements.every(reqId => this.isUnlocked(reqId));
  }

  /**
   * Get the set of unlocked node IDs
   */
  public getUnlockedNodes(): Set<string> {
    return new Set(this.unlockedNodes);
  }

  /**
   * Get a tech node by ID
   */
  public getNode(nodeId: string): TechNode | undefined {
    return this.techNodes.get(nodeId);
  }

  /**
   * Get all available nodes that can be unlocked
   */
  public getAvailableNodes(): TechNode[] {
    return Array.from(this.techNodes.values()).filter(
      node => !node.unlocked && this.canUnlock(node.id)
    );
  }

  /**
   * Get active research nodes with progress
   */
  public getActiveResearch(): Map<
    string,
    {
      progress: number;
      remainingTime: number;
      startTime: number;
      endTime: number;
    }
  > {
    const result = new Map();

    for (const [nodeId, researchData] of this.activeResearch.entries()) {
      const node = this.techNodes.get(nodeId);
      if (node && node.researchProgress !== undefined) {
        const now = Date.now();
        const remainingTime = Math.max(0, (researchData.endTime - now) / 1000);

        result.set(nodeId, {
          progress: node.researchProgress,
          remainingTime,
          startTime: researchData.startTime,
          endTime: researchData.endTime,
        });
      }
    }

    return result;
  }

  /**
   * Get all active synergies
   */
  public getActiveSynergies(): Map<string, number> {
    const result = new Map();

    for (const synergyPair of this.activeSynergies) {
      const [nodeId, synergyNodeId] = synergyPair.split('-');
      const synergyNode = this.techNodes.get(synergyNodeId);

      if (synergyNode?.synergyModifiers?.[nodeId]) {
        result.set(synergyPair, synergyNode.synergyModifiers[nodeId]);
      }
    }

    return result;
  }

  /**
   * Find the optimal tech path to a target node
   * @param targetNodeId The ID of the target tech node
   * @returns The optimal path to unlock the target node
   */
  public findOptimalPath(targetNodeId: string): TechPath | null {
    const targetNode = this.techNodes.get(targetNodeId);
    if (!targetNode) {
      return null;
    }

    // If already unlocked, return empty path
    if (targetNode.unlocked) {
      return {
        nodes: [],
        totalResearchTime: 0,
        synergyBonus: 0,
        benefits: [],
      };
    }

    // Get all nodes that need to be unlocked
    const nodesToUnlock = new Set<string>();
    const collectRequirements = (nodeId: string) => {
      const node = this.techNodes.get(nodeId);
      if (!node) {
        return;
      }

      if (!node.unlocked) {
        nodesToUnlock.add(nodeId);
      }

      for (const reqId of node.requirements) {
        const reqNode = this.techNodes.get(reqId);
        if (reqNode && !reqNode.unlocked) {
          nodesToUnlock.add(reqId);
          collectRequirements(reqId);
        }
      }
    };

    collectRequirements(targetNodeId);

    // Calculate optimal order based on research time and synergies
    const nodeArray = Array.from(nodesToUnlock);

    // Sort by tier level first, then by synergy potential
    nodeArray.sort((a, b) => {
      const nodeA = this.techNodes.get(a);
      const nodeB = this.techNodes.get(b);

      if (!nodeA || !nodeB) {
        return 0;
      }

      // Sort by tier first
      if (nodeA.tier !== nodeB.tier) {
        return nodeA.tier - nodeB.tier;
      }

      // Then sort by synergy potential
      const synergiesA = this.synergies.get(a)?.size || 0;
      const synergiesB = this.synergies.get(b)?.size || 0;

      return synergiesB - synergiesA;
    });

    // Calculate total research time and synergy bonus
    let totalResearchTime = 0;
    let synergyBonus = 0;

    nodeArray.forEach(nodeId => {
      const node = this.techNodes.get(nodeId);
      if (node) {
        totalResearchTime += node.researchTime || 60 * (node.tier || 1);

        // Check for potential synergies
        const nodeSynergies = this.synergies.get(nodeId);
        if (nodeSynergies) {
          for (const synergyNodeId of nodeSynergies) {
            const synergyNode = this.techNodes.get(synergyNodeId);
            if (synergyNode?.unlocked && synergyNode.synergyModifiers?.[nodeId]) {
              synergyBonus += synergyNode.synergyModifiers[nodeId];
            }
          }
        }
      }
    });

    // Collect benefits of the path
    const benefits: string[] = [];
    nodeArray.forEach(nodeId => {
      const node = this.techNodes.get(nodeId);
      if (node) {
        benefits.push(`${node.name}: ${node.description}`);
      }
    });

    return {
      nodes: nodeArray,
      totalResearchTime,
      synergyBonus,
      benefits,
    };
  }

  /**
   * Check if the player has unlocked unknown war ship salvage technologies
   * @returns True if unknown war ship salvage tech is unlocked
   */
  public hasWarShipSalvage(): boolean {
    return Array.from(this.unlockedNodes.values()).some(
      id => id.includes('salvage') && id.includes('warship')
    );
  }
}

export default TechTreeManager;
