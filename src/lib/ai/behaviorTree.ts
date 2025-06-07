/**
 * Represents the possible outcomes of a behavior tree node tick.
 */
export enum Status {
  SUCCESS = 'success',
  FAILURE = 'failure',
  RUNNING = 'running',
}

/**
 * Basic representation of an entity in the game world.
 * This should be replaced or extended based on the actual entity system.
 */
export interface BaseEntity {
  id: string;
  position?: { x: number; y: number; z?: number }; // Assuming Position exists
  // Add other common properties like health, energy, type, etc.
}

/**
 * Represents the context or blackboard for the behavior tree.
 * Contains shared state information needed by nodes.
 */
export interface Blackboard {
  [key: string]: unknown; // Allow flexible extension
  targetEntity?: BaseEntity | null; // The current target
  selfEntity?: BaseEntity; // The entity running the tree
  deltaTime?: number; // Time since last tick
  // Add other common blackboard data: game state, nearby entities, etc.
}

/**
 * Base class for all behavior tree nodes.
 */
export abstract class Node {
  public id: string;

  constructor(id?: string) {
    this.id = id || Math.random().toString(36).substring(2, 9); // Simple unique ID
  }

  /**
   * Executes the node's logic.
   * Must be implemented by subclasses.
   * @param blackboard - The shared context for the tree.
   * @returns The status of the node after execution (SUCCESS, FAILURE, RUNNING).
   */
  abstract tick(blackboard: Blackboard): Status;

  // Optional methods for initialization or cleanup
  // enter(blackboard: Blackboard): void {}
  // leave(blackboard: Blackboard): void {}
}

/**
 * Base class for composite nodes (nodes with children).
 */
export abstract class CompositeNode extends Node {
  protected children: Node[];

  constructor(children: Node[], id?: string) {
    super(id);
    this.children = children;
  }

  addChild(child: Node): void {
    this.children.push(child);
  }

  removeChild(child: Node): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }
}

/**
 * Sequence node: Executes children in order until one fails or all succeed.
 */
export class Sequence extends CompositeNode {
  tick(blackboard: Blackboard): Status {
    for (const child of this.children) {
      const status = child.tick(blackboard);
      if (status === Status.FAILURE) {
        return Status.FAILURE;
      }
      if (status === Status.RUNNING) {
        return Status.RUNNING;
      }
    }
    return Status.SUCCESS;
  }
}

/**
 * Selector node (Fallback): Executes children in order until one succeeds or is running.
 */
export class Selector extends CompositeNode {
  tick(blackboard: Blackboard): Status {
    for (const child of this.children) {
      const status = child.tick(blackboard);
      if (status === Status.SUCCESS) {
        return Status.SUCCESS;
      }
      if (status === Status.RUNNING) {
        return Status.RUNNING;
      }
    }
    return Status.FAILURE;
  }
}

/**
 * Base class for leaf nodes (nodes without children, representing actions or conditions).
 */
export abstract class LeafNode extends Node {}

// --- Placeholder Leaf Nodes --- //

/**
 * Placeholder Action Node: Represents a specific action to be performed.
 */
export class ActionNode extends LeafNode {
  private action: (bb: Blackboard) => Status;

  constructor(action: (bb: Blackboard) => Status, id?: string) {
    super(id);
    this.action = action;
  }

  tick(blackboard: Blackboard): Status {
    // In a real implementation, this would call the action
    console.log(`Executing action: ${this.id}`);
    try {
      return this.action(blackboard);
    } catch (e) {
      console.error(`Error in action ${this.id}:`, e);
      return Status.FAILURE;
    }
  }
}

/**
 * Placeholder Condition Node: Represents a condition to be checked.
 */
export class ConditionNode extends LeafNode {
  private condition: (bb: Blackboard) => boolean;

  constructor(condition: (bb: Blackboard) => boolean, id?: string) {
    super(id);
    this.condition = condition;
  }

  tick(blackboard: Blackboard): Status {
    // In a real implementation, this would evaluate the condition
    console.log(`Checking condition: ${this.id}`);
    try {
      return this.condition(blackboard) ? Status.SUCCESS : Status.FAILURE;
    } catch (e) {
      console.error(`Error in condition ${this.id}:`, e);
      return Status.FAILURE;
    }
  }
}

/**
 * Decorator Node: Modifies the behavior of a single child node.
 * Example: Inverter, Succeeder, Repeater
 */
export abstract class DecoratorNode extends Node {
  protected child: Node;

  constructor(child: Node, id?: string) {
    super(id);
    this.child = child;
  }
}

/**
 * Inverter Decorator: Inverts the result of its child.
 * SUCCESS becomes FAILURE, FAILURE becomes SUCCESS. RUNNING remains RUNNING.
 */
export class Inverter extends DecoratorNode {
  tick(blackboard: Blackboard): Status {
    const status = this.child.tick(blackboard);
    if (status === Status.SUCCESS) {
      return Status.FAILURE;
    }
    if (status === Status.FAILURE) {
      return Status.SUCCESS;
    }
    return Status.RUNNING;
  }
}

/**
 * Succeeder Decorator: Always returns SUCCESS, regardless of the child's result.
 * Useful for optional branches.
 */
export class Succeeder extends DecoratorNode {
  tick(blackboard: Blackboard): Status {
    this.child.tick(blackboard); // Run the child
    return Status.SUCCESS; // Always succeed
  }
}

/**
 * Failer Decorator: Always returns FAILURE, regardless of the child's result.
 */
export class Failer extends DecoratorNode {
  tick(blackboard: Blackboard): Status {
    this.child.tick(blackboard); // Run the child
    return Status.FAILURE; // Always fail
  }
}

/**
 * Repeater Decorator: Repeats the child node a specified number of times
 * or indefinitely until it returns FAILURE.
 */
export class Repeater extends DecoratorNode {
  private repeatCount: number;
  private currentCount = 0;

  /**
   * @param child The node to repeat.
   * @param repeatCount The number of times to repeat. Set to -1 for infinite repetitions.
   * @param id Optional node ID.
   */
  constructor(child: Node, repeatCount = -1, id?: string) {
    super(child, id);
    this.repeatCount = repeatCount;
  }

  tick(blackboard: Blackboard): Status {
    while (this.repeatCount === -1 || this.currentCount < this.repeatCount) {
      const status = this.child.tick(blackboard);

      if (status === Status.FAILURE) {
        this.currentCount = 0; // Reset count on failure
        return Status.FAILURE;
      }

      if (status === Status.RUNNING) {
        return Status.RUNNING; // Propagate running status
      }

      // If SUCCESS, increment count (if finite)
      if (this.repeatCount !== -1) {
        this.currentCount++;
      }

      // If reached target count (and not infinite), return SUCCESS
      if (this.repeatCount !== -1 && this.currentCount >= this.repeatCount) {
        this.currentCount = 0; // Reset for next time
        return Status.SUCCESS;
      }

      // If infinite or not yet finished, continue loop (will eventually yield if child is RUNNING)
    }

    // Should only be reached if repeatCount was 0 initially
    return Status.SUCCESS;
  }

  // Reset count when the node is re-entered (if needed by tree structure)
  // enter(blackboard: Blackboard): void {
  //     this.currentCount = 0;
  // }
}

/**
 * Basic Behavior Tree class to manage the root node.
 */
export class BehaviorTree {
  private root: Node;

  constructor(root: Node) {
    this.root = root;
  }

  tick(blackboard: Blackboard): Status {
    return this.root.tick(blackboard);
  }
}
