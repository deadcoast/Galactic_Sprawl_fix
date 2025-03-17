# Unused Variables Error Fixes Template

This template provides guidance for fixing unused variable errors in the Galactic Sprawl codebase. Unused variable errors occur when variables are declared but never referenced in the code.

## Common Error Patterns

### Pattern 1: Unused Function Parameters

```typescript
// ERROR: Unused function parameter
function processResources(resourceType, amount, sourceSystem) {
  // Only uses resourceType and amount, sourceSystem is never used
  return { type: resourceType, quantity: amount };
}
```

**Fix Options**:

1. **Prefix with underscore** (indicates intention to ignore):

```typescript
// FIXED: Underscore prefix for unused parameter
function processResources(resourceType, amount, _sourceSystem) {
  return { type: resourceType, quantity: amount };
}
```

2. **Remove the parameter** (if it's not needed at all):

```typescript
// FIXED: Remove unused parameter
function processResources(resourceType, amount) {
  return { type: resourceType, quantity: amount };
}
```

3. **Use parameter** (if it should be used):

```typescript
// FIXED: Actually use the parameter
function processResources(resourceType, amount, sourceSystem) {
  return {
    type: resourceType,
    quantity: amount,
    source: sourceSystem,
  };
}
```

### Pattern 2: Unused Variables in Destructuring

```typescript
// ERROR: Unused variable in destructuring
const { name, type, quantity, location } = resource;
// Only uses name, type, and quantity
console.log(`Resource: ${name}, Type: ${type}, Quantity: ${quantity}`);
```

**Fix Options**:

1. **Prefix with underscore**:

```typescript
// FIXED: Underscore prefix for unused destructured variable
const { name, type, quantity, _location } = resource;
console.log(`Resource: ${name}, Type: ${type}, Quantity: ${quantity}`);
```

2. **Omit from destructuring**:

```typescript
// FIXED: Omit unused variable from destructuring
const { name, type, quantity } = resource;
console.log(`Resource: ${name}, Type: ${type}, Quantity: ${quantity}`);
```

### Pattern 3: Unused Imports

```typescript
// ERROR: Unused imports
import { ResourceType, ResourceCategory, ResourceManager } from '../../types/resources';
// Only uses ResourceType
function getResourceValue(type: ResourceType) {
  return 100;
}
```

**Fix Options**:

1. **Remove unused imports**:

```typescript
// FIXED: Only import what's used
import { ResourceType } from '../../types/resources';
function getResourceValue(type: ResourceType) {
  return 100;
}
```

### Pattern 4: Unused Variables in Event Handlers

```typescript
// ERROR: Unused event parameter
handleClick = event => {
  this.setState({ clicked: true });
  // event is never used
};
```

**Fix Options**:

1. **Prefix with underscore**:

```typescript
// FIXED: Underscore prefix for unused event parameter
handleClick = _event => {
  this.setState({ clicked: true });
};
```

2. **Omit parameter completely** (if not needed at all):

```typescript
// FIXED: Omit unused parameter
handleClick = () => {
  this.setState({ clicked: true });
};
```

## Fix Implementation Steps

1. **Identify Unused Variables**

   - Run ESLint to identify unused variables
   - Look for variables that are declared but not referenced

2. **Determine the Appropriate Fix**

   - For each unused variable, determine if it should be:
     - Removed completely (if not needed)
     - Prefixed with underscore (if needed for documentation)
     - Actually used (if it was omitted by mistake)

3. **Apply the Fix**

   - For function parameters: Either prefix with underscore or remove
   - For imports: Remove unused imports
   - For destructuring: Remove or prefix unused variables
   - For event handlers: Either prefix with underscore or remove parameter

4. **Verify the Fix**
   - Run ESLint again to verify the unused variable warning is gone
   - Ensure the code functions correctly after the change

## Automated Fixes

For bulk fixes of unused variables, you can use the `fix_unused_vars.sh` script:

```bash
./Scripts/fix_unused_vars.sh
```

This script will automatically:

1. Find all unused variables using ESLint
2. Prefix them with underscores
3. Generate a report of changes made

## Testing After Fixes

After applying the fixes, test thoroughly:

1. Run ESLint to verify the warnings are gone
2. Make sure the affected functionality still works correctly
3. Verify that any dependent code isn't broken by the changes

## Special Cases

### React Component Props

For React components, unused props can indicate a design issue:

```typescript
// ERROR: Unused prop
interface ResourceDisplayProps {
  name: string;
  type: ResourceType;
  quantity: number;
  location: string; // Never used in the component
}

function ResourceDisplay({ name, type, quantity }: ResourceDisplayProps) {
  return <div>{name}: {quantity} {type}</div>;
}
```

**Fix Options**:

1. **Remove from interface** (if truly not needed):

```typescript
// FIXED: Remove unused prop from interface
interface ResourceDisplayProps {
  name: string;
  type: ResourceType;
  quantity: number;
}

function ResourceDisplay({ name, type, quantity }: ResourceDisplayProps) {
  return <div>{name}: {quantity} {type}</div>;
}
```

2. **Actually use the prop** (if it should be displayed):

```typescript
// FIXED: Use the previously unused prop
function ResourceDisplay({ name, type, quantity, location }: ResourceDisplayProps) {
  return <div>{name}: {quantity} {type} (at {location})</div>;
}
```

### Variables Used for Type Inference

Sometimes variables appear unused but are actually providing type information:

```typescript
// WARNING: Variable appears unused but provides type information
const resource: ResourceType = ResourceType.MINERALS;
someFunction<typeof resource>();
```

In these cases, keep the variable but add a comment explaining its purpose:

```typescript
// FIXED: Add comment explaining type-only usage
// Used for type inference only
const resource: ResourceType = ResourceType.MINERALS;
someFunction<typeof resource>();
```

## Prevention Strategies

To prevent unused variable errors in the future:

1. **Configure ESLint** to warn about unused variables during development
2. **Use TypeScript's `noUnusedLocals` and `noUnusedParameters` options**
3. **Include ESLint checks in your pre-commit hooks**
4. **Regularly run automated fixes** to keep the codebase clean
