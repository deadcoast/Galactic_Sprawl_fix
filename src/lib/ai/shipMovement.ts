import { EventEmitter } from '../../lib/events/EventEmitter';
import { shipBehaviorManager } from './shipBehavior';

interface Position {
  x: number;
  y: number;
}

interface MovementState {
  targetPosition?: Position;
  currentSpeed: number;
  acceleration: number;
  maxSpeed: number;
  rotationSpeed: number;
  currentRotation: number;
  lastPosition: Position;
}

interface ShipMovementEvents {
  type: string;
  data: {
    movementStarted?: { shipId: string; targetPosition: Position };
    movementUpdated?: { shipId: string; position: Position; rotation: number };
    movementCompleted?: { shipId: string; finalPosition: Position };
    movementStopped?: { shipId: string };
  };
}

class ShipMovementManagerImpl extends EventEmitter<ShipMovementEvents> {
  private movementStates: Map<string, MovementState> = new Map();

  constructor() {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('taskAssigned', ((event: CustomEvent) => {
      const { shipId, task } = event.detail;
      if (task.type === 'salvage' && task.target) {
        this.moveToPosition(shipId, task.target.position);
      }
    }) as EventListener);
  }

  public registerShip(
    shipId: string,
    initialPosition: Position,
    stats: {
      maxSpeed: number;
      acceleration: number;
      rotationSpeed: number;
    }
  ): void {
    // Log initial position for debugging
    console.warn(
      `[ShipMovementSystem] Ship ${shipId} initial position: (${initialPosition.x}, ${initialPosition.y})`
    );

    this.movementStates.set(shipId, {
      currentSpeed: 0,
      acceleration: stats.acceleration,
      maxSpeed: stats.maxSpeed,
      rotationSpeed: stats.rotationSpeed,
      currentRotation: 0,
      // Store the initial position as the last known position
      lastPosition: initialPosition,
    });

    // Emit an event to notify that the ship has been registered with its initial position
    this.emit({
      type: 'movementUpdated',
      data: {
        movementUpdated: {
          shipId,
          position: initialPosition,
          rotation: 0,
        },
      },
    });
  }

  public unregisterShip(shipId: string): void {
    this.movementStates.delete(shipId);
  }

  public moveToPosition(shipId: string, targetPosition: Position): void {
    const state = this.movementStates.get(shipId);
    if (!state) {
      return;
    }

    state.targetPosition = targetPosition;
    this.emit({
      type: 'movementStarted',
      data: {
        movementStarted: {
          shipId,
          targetPosition,
        },
      },
    });
  }

  public update(deltaTime: number, shipPositions: Map<string, Position>): void {
    this.movementStates.forEach((state, shipId) => {
      if (!state.targetPosition) {
        return;
      }

      const currentPosition = shipPositions.get(shipId);
      if (!currentPosition) {
        return;
      }

      // Calculate direction to target
      const dx = state.targetPosition.x - currentPosition.x;
      const dy = state.targetPosition.y - currentPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If we're close enough to target, stop and complete the task
      if (distance < 5) {
        // 5 units threshold
        state.currentSpeed = 0;
        state.targetPosition = undefined;
        const task = shipBehaviorManager.getShipTask(shipId);
        if (task?.type === 'salvage') {
          shipBehaviorManager.completeTask(shipId);
        }
        this.emit({
          type: 'movementCompleted',
          data: {
            movementCompleted: {
              shipId,
              finalPosition: shipPositions.get(shipId) || { x: 0, y: 0 },
            },
          },
        });
        return;
      }

      // Calculate target rotation (in radians)
      const targetRotation = Math.atan2(dy, dx);

      // Smoothly rotate towards target
      let rotationDiff = targetRotation - state.currentRotation;
      if (rotationDiff > Math.PI) {
        rotationDiff -= Math.PI * 2;
      }
      if (rotationDiff < -Math.PI) {
        rotationDiff += Math.PI * 2;
      }

      state.currentRotation +=
        Math.sign(rotationDiff) * Math.min(Math.abs(rotationDiff), state.rotationSpeed * deltaTime);

      // Accelerate if pointing roughly towards target
      if (Math.abs(rotationDiff) < Math.PI / 4) {
        state.currentSpeed = Math.min(
          state.maxSpeed,
          state.currentSpeed + state.acceleration * deltaTime
        );
      } else {
        state.currentSpeed = Math.max(0, state.currentSpeed - state.acceleration * deltaTime);
      }

      // Update position
      const newPosition: Position = {
        x: currentPosition.x + Math.cos(state.currentRotation) * state.currentSpeed * deltaTime,
        y: currentPosition.y + Math.sin(state.currentRotation) * state.currentSpeed * deltaTime,
      };

      // Emit position update
      this.emit({
        type: 'movementUpdated',
        data: {
          movementUpdated: {
            shipId,
            position: newPosition,
            rotation: state.currentRotation,
          },
        },
      });
    });
  }

  public stopMovement(shipId: string): void {
    const state = this.movementStates.get(shipId);
    if (state) {
      state.targetPosition = undefined;
      state.currentSpeed = 0;
      this.emit({
        type: 'movementStopped',
        data: {
          movementStopped: {
            shipId,
          },
        },
      });
    }
  }
}

export const shipMovementManager = new ShipMovementManagerImpl();
