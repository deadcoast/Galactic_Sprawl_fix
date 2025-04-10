import * as React from 'react';
import { Component, ReactNode } from 'react';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';
import { recoveryService } from '../../services/RecoveryService';

// Simple FallbackProps interface for our error boundary
interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

interface IntegrationErrorHandlerProps {
  children: ReactNode;
  componentName: string;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  FallbackComponent?: React.ComponentType<FallbackProps>;
}

interface IntegrationErrorHandlerState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Default fallback component to display when an error occurs
 */
function DefaultFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="relative my-2 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
      <div className="mb-1 font-bold">System Integration Error</div>
      <p className="mb-2 text-sm">{error.message}</p>
      <button
        className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        onClick={resetErrorBoundary}
      >
        Try to recover
      </button>
    </div>
  );
}

/**
 * IntegrationErrorHandler component
 *
 * This component wraps system integration components to catch and handle errors.
 * It logs errors to the error service, provides a fallback UI, and attempts
 * to recover from errors when possible.
 */
export class IntegrationErrorHandler extends Component<
  IntegrationErrorHandlerProps,
  IntegrationErrorHandlerState
> {
  private errorCount = 0;
  private resetTimeout: NodeJS.Timeout | null = null;

  constructor(props: IntegrationErrorHandlerProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static defaultProps = {
    FallbackComponent: DefaultFallback,
  };

  // Catch and set error state when a child component throws
  static getDerivedStateFromError(error: Error): IntegrationErrorHandlerState {
    return { hasError: true, error };
  }

  // Handle the error and log it
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const { componentName, onError } = this.props;

    const now = Date.now();
    this.errorCount += 1;

    // Determine error severity based on frequency
    let severity = ErrorSeverity.LOW;
    if (this.errorCount > 10) {
      severity = ErrorSeverity.HIGH;
    } else if (this.errorCount > 5) {
      severity = ErrorSeverity.MEDIUM;
    }

    // Log the error to our service
    errorLoggingService.logError(error, ErrorType.INTEGRATION, severity, {
      componentName,
      errorInfo: info,
      errorCount: this.errorCount,
    });

    // Create a recovery snapshot if errors are frequent
    if (this.errorCount > 3) {
      recoveryService.createSnapshot(
        {
          component: componentName,
          error: error.message,
          timestamp: now,
        },
        {
          recoveryReason: 'frequent_errors',
          componentName,
          errorCount: this.errorCount,
        }
      );
    }

    // Call the provided error handler if available
    if (onError) {
      onError(error, info);
    }

    // Set up a timeout to reset the error count after a period of stability
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }

    this.resetTimeout = setTimeout(() => {
      this.errorCount = 0;
    }, 60000);
  }

  // Clean up timeouts
  componentWillUnmount() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  // Reset the error state
  resetErrorBoundary = () => {
    const { componentName } = this.props;

    console.warn(`Recovering ${componentName} from error state`);

    // Log the recovery attempt
    errorLoggingService.logError(
      new Error(`Recovery attempt for ${componentName}`),
      ErrorType.INTEGRATION,
      ErrorSeverity.MEDIUM,
      {
        componentName,
        action: 'recovery',
        additionalData: {
          errorCount: this.errorCount,
          recoverySource: 'user-action',
        },
      }
    );

    this.setState({ hasError: false, error: null });
  };

  render() {
    const { children, FallbackComponent = DefaultFallback } = this.props;
    const { hasError, error } = this.state;

    if (hasError && error) {
      return <FallbackComponent error={error} resetErrorBoundary={this.resetErrorBoundary} />;
    }

    return children;
  }
}
