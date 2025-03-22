/**
 * @context: ui-system, ui-error-handling, ui-hook-system
 * 
 * Error handling hooks exports
 */

export { 
  useErrorHandler,
  useApiErrorHandler,
  useResourceErrorHandler
} from './useErrorHandler';

export type { 
  ErrorHandlerConfig,
  ErrorHandlerState
} from './useErrorHandler';

// Default export for convenience
export { default } from './useErrorHandler'; 