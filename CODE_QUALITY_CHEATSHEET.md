# Code Quality Tools Cheat Sheet

## Quick Commands

```bash
# Format code
npm run format        # Format specific file types
npm run format:all    # Format everything + fix lint issues

# Type checking
npm run type-check    # Check TypeScript types

# Linting
npm run lint         # Check for issues
npm run lint:fix     # Fix auto-fixable issues

# Testing
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run coverage     # Generate test coverage
```

## 🔍 What Each Tool Does

### Prettier (`prettier`)

- **Purpose**: Code formatting
- **What it fixes**:
  - Consistent spacing and indentation
  - Quote style (single vs double)
  - Comma usage
  - Line length
  - Import sorting
- **Config file**: `.prettierrc`

### ESLint (`eslint`)

- **Purpose**: Code quality and style checking
- **What it catches**:
  - Unused variables
  - Missing dependencies in React hooks
  - Accessibility issues
  - Import problems
  - Type safety issues
- **Config file**: `.eslintrc.json`

### TypeScript (`typescript`)

- **Purpose**: Static type checking
- **What it checks**:
  - Type safety
  - Interface compliance
  - Import validation
  - Type definitions
- **Config files**: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`

### Husky & lint-staged

- **Purpose**: Automated pre-commit checks
- **What it does**:
  - Runs Prettier and ESLint before each commit
  - Only checks files that are being committed
  - Prevents bad code from being committed

## 🛠️ Common Tasks

### Adding New Files

- TypeScript files should use `.ts` or `.tsx` extensions
- Files are automatically formatted on save
- Imports are automatically sorted
- Types are checked in real-time

### Fixing Common Issues

#### Import Issues

```bash
# Fix import sorting
npm run format

# Fix import paths
npm run fix-imports
```

#### Type Errors

```bash
# Check for type errors
npm run type-check
```

#### Code Style Issues

```bash
# Fix all style issues
npm run format:all
```

## 🚨 Error Messages and Solutions

### ESLint Errors

1. **Missing dependencies in useEffect**

   ```typescript
   // ❌ Bad
   useEffect(() => {
     setValue(prop);
   }, []);

   // ✅ Good
   useEffect(() => {
     setValue(prop);
   }, [prop]);
   ```

2. **Unused variables**

   ```typescript
   // ❌ Bad
   const unused = 'value';

   // ✅ Good
   // Remove unused variable or prefix with _ if intentional
   const _unused = 'value';
   ```

### TypeScript Errors

1. **Type 'any' is not assignable**

   ```typescript
   // ❌ Bad
   const data: any = fetchData();

   // ✅ Good
   interface Data {
     id: string;
     value: number;
   }
   const data: Data = fetchData();
   ```

2. **Missing properties**

   ```typescript
   // ❌ Bad
   interface Props {
     name: string;
     age: number;
   }
   const Component = (props: Props) => {...}
   <Component name="John" />

   // ✅ Good
   <Component name="John" age={25} />
   ```

## 🔧 VS Code Integration

### Recommended Extensions

1. ESLint
2. Prettier
3. TypeScript + JavaScript Language Features

### Settings Already Configured

- Format on Save
- Default formatter set to Prettier
- ESLint auto-fix on save disabled (handled by format:all)

## 📝 Best Practices

1. **Always run before committing**:

   ```bash
   npm run format:all
   npm run type-check
   ```

2. **When adding new dependencies**:

   - Add types with `@types/{package}`
   - Update ESLint/Prettier if needed

3. **For new components**:

   - Use TypeScript interfaces
   - Add proper prop types
   - Follow existing file structure

4. **For debugging**:
   - Check TypeScript errors first
   - Then ESLint errors
   - Finally, Prettier formatting

## 🎯 Tips for Clean Code

1. **Type Safety**

   ```typescript
   // ✅ Use specific types
   interface UserData {
     id: string;
     name: string;
   }

   // ❌ Avoid any
   const data: any;
   ```

2. **Import Organization**

   ```typescript
   // External imports first
   import React from 'react';
   import { useEffect } from 'react';

   // Then internal imports
   import { MyComponent } from '@/components';

   // Then relative imports
   import { utils } from './utils';
   ```

3. **Component Structure**

   ```typescript
   // Props interface at the top
   interface Props {
     title: string;
   }

   // Component with explicit type
   export const Component: React.FC<Props> = ({ title }) => {
     return <div>{title}</div>;
   };
   ```

Remember: The tools are here to help, not hinder. If you're fighting with a tool, there might be a better way to solve the problem!
