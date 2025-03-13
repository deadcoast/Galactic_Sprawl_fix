# CLAUDE.md - Galactic Sprawl Development Guidelines

## Build & Test Commands
- Build: `npm run build`
- Dev server: `npm run dev`
- Lint: `npm run lint` (Fix: `npm run lint:fix`)
- Type check: `npm run type-check`
- Run all tests: `npm run test`
- Run specific test file: `npm run test -- src/tests/path/to/file.test.ts`
- Run E2E tests: `npm run test:e2e`
- Performance tests: `npm run test:perf`

## Code Style Guidelines
- Use TypeScript with strict type checking; avoid `any` types
- React component files use `.tsx` extension; utility files use `.ts`
- Use functional components with hooks; avoid class components
- Use named exports rather than default exports
- Follow existing file structure patterns for new components and utilities
- Error handling: Use typed error responses, avoid generic catches
- Imports: Group by external/internal/relative and sort alphabetically
- Naming: PascalCase for components/types, camelCase for functions/variables
- Always follow tests with real implementations rather than mocks
- Document functions with JSDoc comments for complex logic
- Use tailwind classes with the `cn()` utility for component styling

## Cursorrules Requirements
- Review `System_Integration.md` before making changes
- Document decisions and implementation details in system docs
- Track tasks in `System_Scratchpad.md` with completion markers