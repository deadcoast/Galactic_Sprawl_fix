import { ResourceType } from "./../../types/resources/ResourceTypes";
import { EventEmitter } from 'events';
import { thresholdEvents } from '../../contexts/ThresholdTypes';
import { shipBehaviorManager } from '../../lib/ai/shipBehavior';
import { shipMovementManager } from '../../lib/ai/shipMovement';
import { Position } from '../../types/core/GameTypes';

interface MiningShip {
  id: string;
  name: string;
  type: 'rockBreaker' | 'voidDredger';
  status: 'idle' | 'mining' | 'returning' | 'maintenance';
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}

interface MiningTask {
  id: string;
  shipId: string;
  nodeId: string;
  resourceType: ResourceType;
  priority: number;
  status: 'queued' | 'in-progress' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
}

/**
 * Manages automated mining operations
 */
class MiningShipManagerImpl extends EventEmitter {
  private ships: Map<string, MiningShip>;
  private tasks: Map<string, MiningTask>;
  private nodeAssignments: Map<string, string>; // nodeId -> shipId

  constructor() {
    super();
    this.ships = new Map();
    this.tasks = new Map();
    this.nodeAssignments = new Map();

    // Listen for threshold events
    thresholdEvents.subscribe(event => {
      if (event.type === 'THRESHOLD_VIOLATED') {
        this.handleThresholdViolation(event.resourceId, event.details);
      }
    });
  }

  /**
   * Registers a mining ship
   */
  registerShip(ship: MiningShip): void {
    this.ships.set(ship.id, ship);

    // Register with behavior system
    shipBehaviorManager.registerShip({
      id: ship.id,
      type: ship.type,
      category: 'mining',
      capabilities: {
        canMine: true,
        canSalvage: false,
        canScan: false,
        canJump: false,
      },
      position: { x: 0, y: 0 }, // Initial position
      stats: {
        health: 100,
        shield: 100,
        speed: 100,
        maneuverability: 1,
        cargo: ship.capacity,
      },
    });
  }

  /**
   * Unregisters a mining ship
   */
  unregisterShip(shipId: string): void {
    this.ships.delete(shipId);
    shipBehaviorManager.unregisterShip(shipId);

    // Clean up any tasks
    Array.from(this.tasks.values())
      .filter(task => task.shipId === shipId)
      .forEach(task => this.tasks.delete(task.id));

    // Clean up node assignments
    Array.from(this.nodeAssignments.entries())
      .filter(([_, assignedShipId]) => assignedShipId === shipId)
      .forEach(([nodeId]) => this.nodeAssignments.delete(nodeId));
  }

  /**
   * Handles threshold violations by dispatching mining ships
   */
  private handleThresholdViolation(
    resourceId: string,
    details: { type: 'below_minimum' | 'above_maximum'; current: number }
  ): void {
    if (details.type === 'below_minimum') {
      // Find available mining ship
      const availableShip = Array.from(this.ships.values()).find(
        ship => ship.status === 'idle' && ship.currentLoad === 0
      );

      if (availableShip) {
        this.dispatchShipToResource(availableShip.id, resourceId);
      }
    } else if (details.type === 'above_maximum') {
      // Recall any ships mining this resource
      const assignedShipId = this.nodeAssignments.get(resourceId);
      if (assignedShipId) {
        this.recallShip(assignedShipId);
      }
    }
  }

  /**
   * Dispatches a ship to mine a resource
   */
  private dispatchShipToResource(shipId: string, resourceId: string): void {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return;
    }

    // Create mining task
    const task: MiningTask = {
      id: `mining-${Date.now()}`,
      shipId,
      nodeId: resourceId,
      resourceType: resourceId.split('-')[0], // e.g., "iron" from "iron-belt-1"
      priority: 1,
      status: 'queued',
    };

    this.tasks.set(task.id, task);
    this.nodeAssignments.set(resourceId, shipId);

    // Update ship status
    ship.status = 'mining';
    ship.targetNode = resourceId;

    // Assign task to behavior system
    shipBehaviorManager.assignTask({
      id: task.id,
      type: 'mine',
      target: {
        id: resourceId,
        position: this.getResourcePosition(resourceId),
      },
      priority: task.priority,
      assignedAt: Date.now(),
    });
  }

  /**
   * Recalls a ship from its current task
   */
  private recallShip(shipId: string): void {
    const ship = this.ships.get(shipId);
    if (!ship) {
      return;
    }

    // Clear current task
    Array.from(this.tasks.values())
      .filter(task => task.shipId === shipId && task.status === 'in-progress')
      .forEach(task => {
        task.status = 'completed';
        task.endTime = Date.now();
        this.nodeAssignments.delete(task.nodeId);
      });

    // Update ship status
    ship.status = 'returning';
    ship.targetNode = undefined;

    // Move ship back to base
    shipMovementManager.moveToPosition(shipId, { x: 0, y: 0 }); // Base position
  }

  /**
   * Gets the position of a resource node
   */
  private getResourcePosition(resourceId: string): Position {
    // Use resourceId to seed the random position for consistency
    const seed = parseInt(resourceId.split('-').pop() || '0', 10);
    return {
      x: (seed * 17) % 1000,
      y: (seed * 23) % 1000,
    };
  }

  /**
   * Updates mining progress
   */
  update(deltaTime: number): void {
    this.ships.forEach(ship => {
      if (ship.status === 'mining' && ship.targetNode) {
        // Update mining progress
        const task = Array.from(this.tasks.values()).find(
          t => t.shipId === ship.id && t.status === 'in-progress'
        );

        if (task) {
          // Simulate resource collection
          ship.currentLoad += ship.efficiency * deltaTime;

          // Check if cargo is full
          if (ship.currentLoad >= ship.capacity) {
            this.recallShip(ship.id);
          }
        }
      }
    });
  }
}

// Export singleton instance
export const miningShipManager = new MiningShipManagerImpl();
