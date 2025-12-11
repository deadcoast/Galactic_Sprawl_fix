/**
 * @file index.ts
 *
 * Main exports for dependency mapping utilities
 */

export {
  DependencyMapper,
  type DependencyMap,
  type FileReference,
} from "./DependencyMapper";
export {
  BaselineValidator,
  type BaselineReport,
  type BaselineResult,
} from "./BaselineValidator";
export {
  ReorganizationValidator,
  type ReorganizationPlan,
} from "./ReorganizationValidator";
export { main as runAnalysis } from "./cli";
