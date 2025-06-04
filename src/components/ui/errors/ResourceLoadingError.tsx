/**
 * @context: ui-system, ui-error-handling, component-library, resource-system
 *
 * ResourceLoadingError - A specialized error component for resource loading failures
 */

import { Box, Database, RefreshCw } from 'lucide-react';
import React from 'react';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../services/logging/ErrorLoggingService';
import { ResourceType } from '../../../types/resources/ResourceTypes';
import { ComponentErrorState } from './ComponentErrorState';

export interface ResourceLoadingErrorProps {
  /** Resource type that failed to load */
  resourceType?: ResourceType;

  /** Error message or object */
  error?: Error | string;

  /** Function to retry loading the resource */
  onRetry?: () => void;

  /** Additional CSS class */
  className?: string;

  /** Custom message to display (defaults to a message based on resourceType) */
  message?: string;

  /** Show compact version */
  compact?: boolean;

  /** Additional metadata for error logging */
  metadata?: Record<string, unknown>;
}

/**
 * Component for displaying resource loading errors with appropriate styling and retry option
 */
export function ResourceLoadingError({
  resourceType,
  error,
  onRetry,
  className = '',
  message,
  compact = false,
  metadata = {},
}: ResourceLoadingErrorProps) {
  // Generate appropriate message based on resource type
  const errorMessage =
    message ||
    (resourceType
      ? `Failed to load ${resourceType.toLowerCase()} resources`
      : 'Failed to load resources');

  // Log error when component mounts
  React.useEffect(() => {
    if (error) {
      const errorObj = typeof error === 'string' ? new Error(error) : error;

      errorLoggingService.logError(errorObj, ErrorType.RESOURCE, ErrorSeverity.MEDIUM, {
        component: 'ResourceLoadingError',
        resourceType,
        ...metadata,
      });
    }
  }, [error, resourceType, metadata]);

  return (
    <ComponentErrorState
      message={errorMessage}
      error={error}
      level="medium"
      onRetry={onRetry}
      componentName="ResourceLoading"
      errorType={ErrorType.RESOURCE}
      logError={false} // Already logged in useEffect
      compact={compact}
      className={`resource-loading-error ${className}`}
      icon={<Database size={18} className="resource-error-icon" />}
      metadata={{
        resourceType,
        ...metadata,
      }}
    />
  );
}

/**
 * Component for displaying resource loading errors in a minimal inline style
 */
export function InlineResourceLoadingError({
  resourceType,
  onRetry,
  message,
}: Pick<ResourceLoadingErrorProps, 'resourceType' | 'onRetry' | 'message'>) {
  // Generate appropriate message based on resource type
  const errorMessage =
    message ||
    (resourceType ? `Failed to load ${resourceType.toLowerCase()}` : 'Resource unavailable');

  return (
    <div className="inline-resource-error">
      <div className="inline-resource-error__content">
        <Box size={14} className="inline-resource-error__icon" />
        <span className="inline-resource-error__message">{errorMessage}</span>

        {onRetry && (
          <button
            className="inline-resource-error__retry"
            onClick={onRetry}
            type="button"
            aria-label="Retry loading resource"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export default ResourceLoadingError;
