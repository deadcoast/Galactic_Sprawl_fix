---
DEVELOPMENT TOOLS REFERENCES
---

# Development Tools

## Linting and Code Quality [~80% Complete]

- ESLint configuration: eslint.config.js
- Prettier configuration: .prettierrc.json
- Linting setup: tools/setup-linting.js
  - Purpose: Initializes and configures ESLint and Prettier (STEP 1)
  - Features:
    - Verifies ESLint and Prettier are installed
    - Creates/updates .prettierrc.json with optimal settings
    - Checks for conflicting ESLint configurations
    - Sets up VS Code integration via .vscode/settings.json
    - Tests the configuration to ensure everything works
  - Output files: .prettierrc.json, tools/.eslintrc.json, .vscode/settings.json
  - Usage: `node tools/setup-linting.js`
  - Tests: tools/tests/setup-linting.test.js
- Linting analysis: tools/analyze-lint-errors.js
  - Purpose: Analyzes ESLint output to categorize and prioritize errors (STEP 2)
  - Features:
    - Comprehensive analysis of linting issues with progress bar
    - Outputs: Top issues by rule, file, and directory
    - Generates: lint-analysis-report.json with detailed statistics
    - Enhanced with:
      - Batch processing to prevent hanging with large inputs
      - Debug logging with `--debug` flag
      - Option to disable progress bar with `--no-progress` flag
      - Configurable timeout with `--timeout=<ms>` option
      - Comprehensive error handling
      - Memory-efficient processing
  - Output files: lint-analysis-report.json
  - Usage: `npx eslint src/ --format json | node tools/analyze-lint-errors.js [options]`
  - Tests: tools/tests/analyze-lint-errors.test.js
- Rule-specific fixing: tools/fix-eslint-by-rule.js
  - Purpose: Fixes ESLint and Prettier issues by rule name or automatically (STEP 3)
  - Features:
    - Interactive menu of top issues
    - Targeted fixing by rule name and directory
    - Batch processing to avoid overwhelming changes
    - Dry run mode to preview changes
    - Progress tracking and reporting
    - Automatic fixing of top issues
    - Color-coded output with spinner for better UX
  - Output files: Updates eslint-progress.log with fix information
  - Usage: `node tools/fix-eslint-by-rule.js [rule-name] [directory] [options]`
  - Tests: tools/tests/fix-eslint-by-rule.test.js
- Linting progress tracking: tools/track-eslint-progress.js
  - Purpose: Records linting status to track progress over time (STEP 4)
  - Features:
    - Automatically runs ESLint and counts errors/warnings
    - Records timestamped entries with issue counts
    - Option to include detailed breakdown of top issues
    - Integrates with chart-lint-progress.js for visualization
  - Output files: eslint-progress.log
  - Usage: `node tools/track-eslint-progress.js [--details]`
- Linting progress visualization: tools/chart-lint-progress.js
  - Purpose: Generates ASCII chart showing progress over time (STEP 5)
  - Features:
    - Visualizes error/warning reduction over time
    - Calculates fix rates and estimates completion timeline
    - Detailed trend analysis in verbose mode
    - Color-coded output for better readability
  - Input files: Reads from eslint-progress.log
  - Usage: `node tools/chart-lint-progress.js [--verbose]`
- TypeScript any finder: tools/fix-typescript-any.js
  - Purpose: Specialized tool for finding and fixing TypeScript 'any' types
  - Features:
    - Finds files with '@typescript-eslint/no-explicit-any' errors
    - Analyzes code context to suggest proper type replacements
    - Interactive mode for reviewing and fixing issues
    - Batch processing for efficient handling of large codebases
    - Progress indicators and color-coded output
  - Output files: typescript-any-errors.json
  - Usage: `node tools/fix-typescript-any.js [options]`
  - Tests: tools/tests/fix-typescript-any.test.js
- Unified linting workflow: tools/run-lint-workflow.js
  - Purpose: Runs all linting tools in the correct order (STEP 0)
  - Features:
    - Executes all linting tools in sequence
    - Provides options to skip specific steps
    - Shows progress and summary of execution
    - Handles errors gracefully
  - Usage: `node tools/run-lint-workflow.js [options]`
  - Tests: tools/tests/run-lint-workflow.test.js
- Test suite for linting tools: tools/tests/
  - Purpose: Ensures linting tools work correctly
  - Features:
    - Comprehensive tests for all linting tools
    - Mocks file system and command execution
    - Tests various scenarios and edge cases
    - Verifies correct behavior with different options
  - Files:
    - tools/tests/setup-linting.test.js
    - tools/tests/analyze-lint-errors.test.js
    - tools/tests/fix-eslint-by-rule.test.js
    - tools/tests/fix-typescript-any.test.js
    - tools/tests/run-lint-workflow.test.js
  - Usage: `npx vitest run tools/tests/`

## Current Linting Status

Total issues: 22 (7 errors, 15 warnings)

Main issue types:

- @typescript-eslint/no-explicit-any: 7 errors
- @typescript-eslint/no-unused-vars: 9 warnings
- no-console: 6 warnings

Files with most issues:

- modules/ExplorationHub/ExplorationHub.tsx (1 issue)
- ships/base/BaseShip.tsx (1 issue)
- variants/warships/OrionFrigate.tsx (1 issue)
- variants/warships/Spitflare.tsx (1 issue)
- variants/warships/StarSchooner.tsx (1 issue)
- components/ui/ResourceVisualization.tsx (1 issue)
- components/ui/SprawlView.tsx (1 issue)

Directories with highest counts:

- variants/warships: 0 errors, 3 warnings
- components/ui: 0 errors, 2 warnings
- managers/game: 0 errors, 2 warnings
- managers/resource: 1 errors, 1 warnings
- modules/ExplorationHub: 0 errors, 1 warnings

## Progress Tracking

- Initial issues: 153 (59 errors, 94 warnings)
- Current issues: 22 (7 errors, 15 warnings)
- Issues fixed: 131 (52 errors, 79 warnings)
- Progress: 85.6% of issues fixed

## Type Safety Improvements

Recent improvements:

1. **tests/managers/resource/ResourceFlowManager.test.ts**

   - Fixed direct access to private properties by using proper API methods
   - Created a ResourceFlow object to indirectly set the resource state
   - Improved test assertions to verify flow optimization results

2. **types/resources/ResourcePoolTypes.ts**

   - Replaced 'any' with 'unknown' in type guard functions
   - Updated type guard logic to handle unknown types safely
   - Improved type safety in isPoolDistributionRule and isPoolAllocationResult functions

3. **utils/events/EventFiltering.ts**

   - Added underscore prefix to unused 'priority' variables in for loops
   - Improved code readability and linting compliance

4. **workers/combatWorker.ts**

   - Replaced 'any' with 'unknown' in isHazard function
   - Added underscore prefix to unused isHazard function
   - Updated type guard logic to handle unknown types safely
   - Improved null checking for unknown type

5. **hooks/modules/useModuleStatus.ts**

   - Replaced 'any' with ModuleEvent interface for event parameters
   - Improved type safety in event handling functions

6. **hooks/modules/useModuleUpgrade.ts**

   - Added underscore prefix to unused variables
   - Improved type safety in event handling

7. **src/initialization/moduleUpgradeInit.ts**

   - Replaced console.log with console.warn for better logging practices

8. **lib/optimization/EntityPool.ts**

   - Replaced console.debug with console.warn
   - Added type assertion for entity parameter

9. **lib/utils/EventEmitter.ts**

   - Replaced Record<string, any> with Record<string, unknown>
   - Improved type safety in event handling

10. **managers/exploration/ReconShipManagerImpl.ts**
    - Created SectorData interface for sector parameter
    - Added underscore prefix to unused variable
    - Made ReconShipEvents extend Record<string, unknown>
