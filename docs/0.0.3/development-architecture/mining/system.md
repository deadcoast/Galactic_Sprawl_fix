# MINING SYSTEM (#mining_system)

## 6.3 Mining Ships

/Users/deadcoast/CursorProjects/Galactic_Sprawl/src/components/buildings/modules/MiningHub/MiningWindow.tsx

```typescript
interface MiningShip {
  id: string;
  name: string;
  type: "rockBreaker" | "voidDredger";
  status: "idle" | "mining" | "returning" | "maintenance";
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}
```

/Users/deadcoast/CursorProjects/Galactic_Sprawl/src/types/events/EventTypes.ts

```typescript
interface MiningShipInfo {
  id: string;
  name: string;
  type: string; // 'rockBreaker' | 'voidDredger'
  status: string; // Consider enum
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}
```

/Users/deadcoast/CursorProjects/Galactic_Sprawl/src/types/mining/MiningTypes.ts

```typescript
/**
 * Mining ship interface
 */
export interface MiningShip {
  id: string;
  name: string;
  type: "rockBreaker" | "voidDredger";
  status: "idle" | "mining" | "returning" | "maintenance";
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}
```

- **Progression Impact:**
  - As progression advances, mining ships extract resources more efficiently and refine materials onboard.
  - **Examples:**
    - **MS-RB12G “Rock Breaker”:** Initially extracts common ores, with upgrades unlocking the ability to mine rarer materials.
    - **MVVD “Void Dredger”:** Represents advanced progression by mining high-value resources and deploying automated mining drones for enhanced efficiency.

### Core Architecture

The Mining System provides a comprehensive framework for resource extraction operations, including ship management, resource handling, and integration with the resource flow system.

```typescript
// src/managers/mining/MiningShipManagerImpl.ts

export class MiningShipManagerImpl extends TypedEventEmitter<MiningEvents> {
  private ships: Map<string, MiningShip> = new Map();
  private tasks: Map<string, MiningTask> = new Map();
  private nodeAssignments: Map<string, string> = new Map(); // nodeId -> shipId

  public registerShip(ship: MiningShip): void {
    // Implementation...
  }

  public unregisterShip(shipId: string): void {
    // Implementation...
  }

  private dispatchShipToResource(shipId: string, resourceId: string): void {
    // Implementation...
  }

  private recallShip(shipId: string): void {
    // Implementation...
  }

  public getResourceNodes(): Array<{
    id: string;
    type: ResourceType;
    position: Position;
    thresholds: { min: number; max: number };
  }> {
    // Implementation...
  }

  update(deltaTime: number): void {
    // Implementation...
  }
}
```

### Type Definitions

The Mining System includes comprehensive type definitions for mining operations.

```typescript
// src/types/mining/MiningTypes.ts

export interface MiningShip {
  id: string;
  name: string;
  type: "rockBreaker" | "voidDredger";
  status: "idle" | "mining" | "returning" | "maintenance";
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}

export interface MiningResource {
  id: string;
  name: string;
  type: ResourceType;
  abundance: number;
  distance: number;
  extractionRate: number;
  depletion: number;
  priority: number;
  thresholds: {
    min: number;
    max: number;
  };
}

export interface MiningExperience {
  baseAmount: number;
  bonusFactors: {
    resourceRarity: number; // Exotic > Gas > Mineral
    extractionEfficiency: number;
    resourceQuality: number; // Based on abundance
    distanceModifier: number; // Further = more XP
    techBonus: number; // Bonus from tech tree upgrades
  };
  totalXP: number;
  unlockedTech: string[];
}

export interface MiningTechBonuses {
  extractionRate: number;
  efficiency: number;
  storageCapacity?: number;
}
```

### Resource Integration

The Mining System integrates with the resource system to manage resource flow between mining operations and storage.

```typescript
// src/managers/mining/MiningResourceIntegration.ts

export class MiningResourceIntegration {
  private miningManager: MiningShipManagerImpl & EventEmitter<MiningEvents>;
  private thresholdManager: ResourceThresholdManager;
  private flowManager: ResourceFlowManager;
  private initialized: boolean = false;
  private miningNodes: Map<
    string,
    {
      id: string;
      type: ResourceType;
      position: Position;
      efficiency: number;
    }
  > = new Map();
  private transferHistory: ResourceTransfer[] = [];

  public initialize(): void {
    // Implementation...
  }

  public registerMiningNode(
    id: string,
    type: ResourceType,
    position: Position,
    efficiency: number = 1.0,
  ): void {
    // Implementation...
  }

  private subscribeToMiningEvents(): void {
    // Implementation...
  }

  private createMiningThresholds(): void {
    // Implementation...
  }
}

interface ResourceTransfer {
  type: ResourceType;
  source: string;
  target: string;
  amount: number;
  timestamp: number;
}
```

### Event System

The Mining System uses a typed event system for communication with other systems.

```typescript
// src/managers/mining/MiningShipManagerImpl.ts

interface MiningEventMap {
  shipRegistered: { ship: MiningShip };
  shipUnregistered: { shipId: string };
  taskAssigned: { task: MiningTask };
  taskCompleted: { task: MiningTask };
  taskFailed: { task: MiningTask; reason: string };
  shipStatusChanged: {
    shipId: string;
    oldStatus: ShipStatus;
    newStatus: ShipStatus;
  };
  resourceCollected: {
    shipId: string;
    resourceType: ResourceType;
    amount: number;
  };
}

type MiningEvents = {
  [K in keyof MiningEventMap]: MiningEventMap[K];
};
```

### Task Management

The Mining System includes a task management system for assigning and tracking mining operations.

```typescript
// src/managers/mining/MiningShipManagerImpl.ts

enum TaskStatus {
  QUEUED = "queued",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

interface MiningTask {
  id: string;
  shipId: string;
  nodeId: string;
  resourceType: ResourceType;
  priority: number;
  status: TaskStatus;
  startTime?: number;
  endTime?: number;
}
```

### Integration Patterns

The Mining System integrates with several other systems:

1. **Resource System**: Mining operations feed resources into the resource flow system
2. **Threshold System**: Mining operations are triggered by resource threshold violations
3. **Ship Behavior System**: Mining ships use behavior trees for movement and task execution
4. **Experience System**: Mining operations generate experience that unlocks tech upgrades
5. **Event System**: Mining operations emit events that other systems can respond to

Key integration patterns include:

- Flow node registration for connecting mining operations to the resource flow system
- Threshold-based automation for triggering mining operations when resources are low
- Task-based assignment for managing mining ship operations
- Event-based communication for notifying other systems of mining activities
