# Multi-Step Production Chains

## Overview

The multi-step production chain system extends the ResourceFlowManager to support complex manufacturing processes that involve multiple conversion steps. This document provides detailed information about the implementation, usage, and integration of this feature.

## Key Components

### ChainProcessor

The `ChainProcessor` class is responsible for orchestrating multi-step production chains:

```typescript
class ChainProcessor {
  private chains: Map<string, ChainStatus>;
  private resourceManager: ResourceFlowManager;

  constructor(resourceManager: ResourceFlowManager) {
    this.chains = new Map();
    this.resourceManager = resourceManager;
  }

  public startChain(steps: ChainStep[]): ChainStatus {
    /* ... */
  }
  public processChainStep(chainId: string, stepIndex: number): StepResult {
    /* ... */
  }
  public getChainStatus(chainId: string): ChainStatus | undefined {
    /* ... */
  }
  public cancelChain(chainId: string): boolean {
    /* ... */
  }
}
```

### ChainStatus Interface

The `ChainStatus` interface tracks the progress of chain execution:

```typescript
interface ChainStatus {
  chainId: string;
  currentStep: number;
  totalSteps: number;
  startTime: number;
  status: "pending" | "in-progress" | "completed" | "failed";
  stepResults: StepResult[];
  error?: string;
}
```

### ChainStep Interface

The `ChainStep` interface defines a single step in a production chain:

```typescript
interface ChainStep {
  converterId: string;
  recipeId: string;
  inputOverrides?: ResourceQuantity[];
  outputDestinations?: {
    resourceId: string;
    nodeId: string;
  }[];
}
```

## Implementation Details

### Chain Initialization

The `startChain` method begins processing a conversion chain:

1. Validates all steps in the chain before starting
2. Creates a unique chainId for tracking
3. Initializes the chain status object
4. Emits a 'chain-started' event

```typescript
public startChain(steps: ChainStep[]): ChainStatus {
  // Validate steps
  if (!this.validateChainSteps(steps)) {
    throw new Error('Invalid chain steps');
  }

  // Create chain ID
  const chainId = `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Initialize chain status
  const chainStatus: ChainStatus = {
    chainId,
    currentStep: 0,
    totalSteps: steps.length,
    startTime: Date.now(),
    status: 'pending',
    stepResults: []
  };

  // Store chain status
  this.chains.set(chainId, chainStatus);

  // Emit event
  this.resourceManager.eventEmitter.emit('chain-started', {
    chainId,
    totalSteps: steps.length,
    timestamp: Date.now()
  });

  return chainStatus;
}
```

### Step Processing

The `processChainStep` method handles individual steps in the chain:

1. Retrieves the current chain status
2. Processes the current step using the ResourceFlowManager
3. Updates the chain status with the step result
4. Emits appropriate events based on the step result
5. Returns the step result

```typescript
public processChainStep(chainId: string, stepIndex: number): StepResult {
  const chainStatus = this.chains.get(chainId);
  if (!chainStatus) {
    throw new Error(`Chain with ID ${chainId} not found`);
  }

  // Update chain status
  chainStatus.status = 'in-progress';
  chainStatus.currentStep = stepIndex;

  // Get step details
  const step = chainStatus.steps[stepIndex];

  try {
    // Process step using ResourceFlowManager
    const result = this.resourceManager.startConversionProcess(
      step.converterId,
      step.recipeId,
      step.inputOverrides
    );

    // Create step result
    const stepResult: StepResult = {
      stepIndex,
      success: result.success,
      processId: result.processId,
      outputsProduced: result.outputsProduced,
      byproductsProduced: result.byproductsProduced,
      efficiency: result.appliedEfficiency,
      timestamp: Date.now()
    };

    // Update chain status
    chainStatus.stepResults[stepIndex] = stepResult;

    // Check if chain is complete
    if (stepIndex === chainStatus.totalSteps - 1) {
      chainStatus.status = 'completed';

      // Emit chain completed event
      this.resourceManager.eventEmitter.emit('chain-completed', {
        chainId,
        success: true,
        stepResults: chainStatus.stepResults,
        timestamp: Date.now()
      });
    } else {
      // Emit step completed event
      this.resourceManager.eventEmitter.emit('chain-step-completed', {
        chainId,
        stepIndex,
        success: true,
        result: stepResult,
        timestamp: Date.now()
      });
    }

    return stepResult;
  } catch (error) {
    // Handle error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Create failed step result
    const stepResult: StepResult = {
      stepIndex,
      success: false,
      error: errorMessage,
      timestamp: Date.now()
    };

    // Update chain status
    chainStatus.stepResults[stepIndex] = stepResult;
    chainStatus.status = 'failed';
    chainStatus.error = errorMessage;

    // Emit chain failed event
    this.resourceManager.eventEmitter.emit('chain-failed', {
      chainId,
      stepIndex,
      error: errorMessage,
      timestamp: Date.now()
    });

    return stepResult;
  }
}
```

## Chain Optimization

The chain processor implements several optimizations for resource movement between steps:

1. **Direct Transfer**: When possible, outputs from one step are directly transferred to the inputs of the next step, reducing resource loss.

2. **Batch Size Optimization**: The processor calculates optimal batch sizes based on converter capacities and recipe requirements.

3. **Parallel Processing**: When steps are independent, they can be processed in parallel to improve throughput.

4. **Resource Reservation**: Resources are reserved for the entire chain to prevent conflicts with other operations.

## Integration with Existing Systems

### Event System Integration

Chain status changes emit events through the ModuleEvents system:

- `chain-started`: Emitted when a chain is initialized
- `chain-step-completed`: Emitted when a step in the chain is completed
- `chain-completed`: Emitted when all steps in a chain are completed
- `chain-failed`: Emitted when a chain fails

### Resource Network Integration

Chains operate within the existing resource network:

- Chain steps can span multiple converters in the network
- Resource flow optimization applies to chain transfers
- Network constraints (capacity, distance) affect chain execution

### Automation System Integration

Chains can be triggered by automation rules:

- Chain completion can trigger subsequent automation actions
- Conditional logic can be applied based on chain results
- Automation rules can monitor chain status and react accordingly

## Usage Examples

### Basic Chain Creation

```typescript
// Create a chain with two steps
const chainStatus = chainProcessor.startChain([
  {
    converterId: "smelter-1",
    recipeId: "iron-ore-to-iron-ingot",
  },
  {
    converterId: "forge-1",
    recipeId: "iron-ingot-to-iron-plate",
  },
]);

// Process the first step
chainProcessor.processChainStep(chainStatus.chainId, 0);

// Process the second step
chainProcessor.processChainStep(chainStatus.chainId, 1);
```

### Advanced Chain with Output Routing

```typescript
// Create a chain with custom output routing
const chainStatus = chainProcessor.startChain([
  {
    converterId: "refinery-1",
    recipeId: "crude-oil-processing",
    outputDestinations: [
      { resourceId: "petroleum-gas", nodeId: "storage-tank-1" },
      { resourceId: "heavy-oil", nodeId: "storage-tank-2" },
    ],
  },
  {
    converterId: "chemical-plant-1",
    recipeId: "plastic-bar",
    inputOverrides: [{ resourceId: "petroleum-gas", quantity: 20 }],
  },
]);
```

## Performance Considerations

1. **Memory Usage**: Chain status objects are stored in memory, so long-running chains with many steps can consume significant memory.

2. **Computation Overhead**: Complex chains with many interdependencies require more computation for optimization.

3. **Event Emission**: Frequent event emissions for large chains can impact performance.

4. **Optimization Strategies**:
   - Limit the maximum number of steps in a chain
   - Implement chain cleanup for completed chains
   - Use batch processing for chain steps when appropriate
   - Implement caching for frequently used chain configurations

## Future Enhancements

1. **Chain Templates**: Predefined chain templates for common production patterns

2. **Visual Chain Editor**: UI component for visually designing production chains

3. **Chain Analytics**: Performance metrics and optimization suggestions for chains

4. **Dynamic Chain Adaptation**: Chains that can adapt to changing resource availability

5. **Chain Scheduling**: Time-based scheduling of chain execution
