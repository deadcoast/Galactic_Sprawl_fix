# ResourceFlowManager TypeScript Error Fix

## Issue

TypeScript errors occur in `MiningResourceIntegration.ts` when using the `getNode()` method of `ResourceFlowManager`:

```
Property 'getNode' does not exist on type 'ResourceFlowManager'. Did you mean 'getNodes'?
```

The issue is that the `getNode()` method exists in the `ResourceFlowManager` class, but it's defined at the end of the file (line 2395), while it's being used earlier in the code.

This ordering issue causes TypeScript to not recognize the method when it's used in `MiningResourceIntegration.ts`.

## Solution

There are two possible solutions:

### Solution 1: Move the `getNode()` method

Move the `getNode()` method from the end of the file to be defined earlier in the class, before it's used. Specifically, it should be placed before the `getNodes()` method around line 2305.

1. Delete this code from the end of the file (around line 2395):

```typescript
  /**
   * Get node by ID
   *
   * @param id The ID of the node to retrieve
   * @returns The flow node with the specified ID, or undefined if not found
   */
  public getNode(id: string): FlowNode | undefined {
    return this.network.nodes.get(id);
  }
```

2. Add it before the `getNodes()` method around line 2300:

```typescript
  /**
   * Get node by ID
   *
   * @param id The ID of the node to retrieve
   * @returns The flow node with the specified ID, or undefined if not found
   */
  public getNode(id: string): FlowNode | undefined {
    return this.network.nodes.get(id);
  }

  /**
   * Get all nodes in the network
   * ...
```

### Solution 2: Use the workaround with `getNodes().find()`

Continue using the workaround in `MiningResourceIntegration.ts` by replacing calls to `getNode()` with `getNodes().find()`:

```typescript
// Instead of:
const node = this.flowManager.getNode(`mining-ship-${ship.id}`);

// Use:
const node = this.flowManager.getNodes().find(n => n.id === `mining-ship-${ship.id}`);
```

## Recommendation

Solution 1 (moving the method) is better for performance and clarity:

- It's more efficient (O(1) lookup instead of O(n))
- It maintains the original intent of the code
- It follows the pattern used elsewhere in the class (e.g., `getConnection()`)

If direct file editing is difficult, Solution 2 (using `getNodes().find()`) is an acceptable temporary workaround that is already implemented in the file.
