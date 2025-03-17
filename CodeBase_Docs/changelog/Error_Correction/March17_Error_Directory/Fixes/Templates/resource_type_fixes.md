# ResourceType Error Fixes Template

This template provides guidance for fixing ResourceType errors in the Galactic Sprawl codebase. ResourceType errors occur when string literals are used instead of the ResourceType enum.

## Common Error Patterns

### Pattern 1: String Literals in Function Parameters

```typescript
// ERROR: String literals used for resource types
function processResource(resourceType: string, amount: number) {
  if (resourceType === 'minerals') {
    // Process minerals
  }
}
```

**Fix**:

```typescript
import { ResourceType } from '../../types/resources/ResourceTypes';

// FIXED: Use ResourceType enum
function processResource(resourceType: ResourceType, amount: number) {
  if (resourceType === ResourceType.MINERALS) {
    // Process minerals
  }
}
```

### Pattern 2: String Literals in Object Properties

```typescript
// ERROR: String literals in object properties
const resources = [
  { type: 'minerals', amount: 100 },
  { type: 'energy', amount: 50 },
];
```

**Fix**:

```typescript
import { ResourceType } from '../../types/resources/ResourceTypes';

// FIXED: Use ResourceType enum in object properties
const resources = [
  { type: ResourceType.MINERALS, amount: 100 },
  { type: ResourceType.ENERGY, amount: 50 },
];
```

### Pattern 3: String Literals in Component Props

```typescript
// ERROR: String literals in component props
<ResourceDisplay resourceType="minerals" amount={100} />
```

**Fix**:

```typescript
import { ResourceType } from '../../types/resources/ResourceTypes';

// FIXED: Use ResourceType enum in component props
<ResourceDisplay resourceType={ResourceType.MINERALS} amount={100} />
```

### Pattern 4: String Literals in JSON Data

```typescript
// ERROR: String literals in JSON data
const resourceData = JSON.parse('{"type":"minerals","amount":100}');
```

**Fix**:

```typescript
import { ResourceType } from '../../types/resources/ResourceTypes';

// FIXED: Convert string to enum after parsing
const resourceData = JSON.parse('{"type":"minerals","amount":100}');
resourceData.type =
  resourceData.type === 'minerals'
    ? ResourceType.MINERALS
    : resourceData.type === 'energy'
      ? ResourceType.ENERGY
      : resourceData.type; // Handle other cases
```

## Fix Implementation Steps

1. **Identify ResourceType Imports**

   - Check if the file already imports ResourceType
   - If not, add import from the correct path
   - Example: `import { ResourceType } from '../../types/resources/ResourceTypes';`

2. **Update Function Signatures**

   - Change parameter types from `string` to `ResourceType`
   - Update return types if functions return resource types

3. **Replace String Literals with Enum Values**

   - Replace 'minerals' with `ResourceType.MINERALS`
   - Replace 'energy' with `ResourceType.ENERGY`
   - Replace other resource strings with their enum counterparts

4. **Update Comparisons**

   - Change `resourceType === 'minerals'` to `resourceType === ResourceType.MINERALS`
   - Change string-based switch statements to enum-based

5. **Handle External Data**
   - For data coming from APIs or JSON, add conversion from string to enum

## Common Issues and Solutions

### Issue 1: Import Path Errors

**Problem**:

```
TS2307: Cannot find module '../../types/resources/ResourceTypes'.
```

**Solution**:
Find the correct import path based on the file location:

```
// For files in src/components/
import { ResourceType } from '../types/resources/ResourceTypes';

// For files in src/utils/
import { ResourceType } from '../types/resources/ResourceTypes';

// For files in src/
import { ResourceType } from './types/resources/ResourceTypes';
```

### Issue 2: Type Incompatibility in API Calls

**Problem**:

```
TS2345: Argument of type 'ResourceType' is not assignable to parameter of type 'string'.
```

**Solution**:
Convert the enum to string when needed:

```typescript
// Before
api.getResource(ResourceType.MINERALS);

// After
api.getResource(ResourceType.MINERALS.toString());
// OR: Update the API function signature to accept ResourceType
```

### Issue 3: Third-Party Library Compatibility

**Problem**:

```
TS2345: Argument of type 'ResourceType' is not assignable to parameter of type '{ id: string; }'.
```

**Solution**:
Create a mapping function:

```typescript
function mapResourceTypeToExternalFormat(type: ResourceType): { id: string } {
  return { id: type.toString() };
}

// Usage
thirdPartyLib.processResource(mapResourceTypeToExternalFormat(ResourceType.MINERALS));
```

## Testing After Fixes

After applying the fixes, test thoroughly:

1. Verify that the code compiles without TypeScript errors
2. Run unit tests for affected components
3. Test UI interactions that involve resource types
4. Verify that data from external sources is properly converted

## Adding New Resource Types

When adding new resource types:

1. Add the new type to the ResourceType enum
2. Update any switch statements or if-else chains that handle all resource types
3. Update any mappings or conversion functions
