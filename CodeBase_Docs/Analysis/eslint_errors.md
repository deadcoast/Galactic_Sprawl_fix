ESLint: 9.21.0

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/deadcoast/CursorProjects/Galactic_Sprawl/src/eslint-rules/no-string-resource-types.js' imported from /Users/deadcoast/CursorProjects/Galactic_Sprawl/eslint.config.js
at finalizeResolution (node:internal/modules/esm/resolve:275:11)
at moduleResolve (node:internal/modules/esm/resolve:860:10)
at defaultResolve (node:internal/modules/esm/resolve:984:11)
at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:688:12)
at #cachedDefaultResolve (node:internal/modules/esm/loader:612:25)
at ModuleLoader.resolve (node:internal/modules/esm/loader:595:38)
at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:248:38)
at ModuleJob.\_link (node:internal/modules/esm/module_job:136:49)

# ESLint Error Analysis

## Current ESLint Output

Running ESLint on the codebase shows primarily warnings related to the custom rule `galactic-sprawl/no-string-resource-types` and some standard TypeScript ESLint rules:

```
/Users/deadcoast/CursorProjects/Galactic_Sprawl/src/App.tsx
  358:9  warning  'profiler' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/Users/deadcoast/CursorProjects/Galactic_Sprawl/src/components/buildings/colony/ColonyManagementSystem.tsx
   30:61  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
   69:50  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
   69:61  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
   78:9   warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
   78:43  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
   78:71  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
   87:45  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
  312:12  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
  363:12  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
  380:12  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
  397:12  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
  405:28  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
  405:84  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
  484:41  warning  Use ResourceType enum instead of string literal for resource types  galactic-sprawl/no-string-resource-types
```

## ESLint Rule Analysis

Based on the output, the following ESLint rules are generating warnings:

1. **galactic-sprawl/no-string-resource-types**

   - This is a custom rule that detects string literals used for resource types
   - It suggests using the enum-based ResourceType instead (e.g., ResourceType.MINERALS instead of 'minerals')
   - This rule appears to be working correctly and is helping with the migration to enum-based resource types

2. **@typescript-eslint/no-unused-vars**
   - Standard rule that detects unused variables
   - The configuration appears to require unused variables to be prefixed with underscore (\_)

## ESLint Configuration

The ESLint configuration appears to be working correctly for detecting resource type issues. The custom rule `galactic-sprawl/no-string-resource-types` is properly configured and detecting string literals used for resource types.

## Recommended Actions

1. **Fix Resource Type String Literals**

   - Use the `--fix` option to automatically convert string literals to enum values:
     ```bash
     npx eslint --ext .ts,.tsx src/ --fix
     ```
   - This will convert strings like 'minerals' to ResourceType.MINERALS

2. **Fix Unused Variables**

   - Either use the variables or prefix them with underscore (\_)
   - For example, change `const profiler = ...` to `const _profiler = ...`

3. **Add ESLint to CI/CD Pipeline**

   - Add ESLint checks to the CI/CD pipeline to prevent new issues
   - Configure pre-commit hooks to run ESLint before committing changes

4. **Update ESLint Configuration**
   - Consider adding more rules to catch other common issues
   - Add rules for detecting 'any' type usage
   - Add rules for detecting console.log statements

## Integration with TypeScript Errors

Many of the ESLint warnings for string resource types correspond to TypeScript errors like:

```
Type '"minerals"' is not assignable to type 'ResourceType'. Did you mean 'ResourceType.MINERALS'?
```

Fixing the ESLint warnings will also fix many of the TypeScript errors, making this a high-priority task.
