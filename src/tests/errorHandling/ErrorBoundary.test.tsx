import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  ErrorBoundary, 
  ErrorFallback, 
  VisualizationErrorBoundary, 
  DataFetchingErrorBoundary, 
  GlobalErrorBoundary,
  createTypedErrorBoundary,
  withErrorBoundary
} from '../../errorHandling';
import { errorLoggingService } from '../../services/ErrorLoggingService';

// Mock error logging service
jest.mock('../../services/ErrorLoggingService', () => ({
  errorLoggingService: {
    logError: jest.fn(),
  },
  ErrorType: {
    RUNTIME: 'runtime',
  },
}));

// Component that throws an error
const ErrorThrowingComponent: React.FC<{ shouldThrow?: boolean; message?: string }> = ({ 
  shouldThrow = true, 
  message = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>Success</div>;
};

describe('Error Boundary System', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Core ErrorBoundary', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should log errors to error service', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent message="Logged error" />
        </ErrorBoundary>
      );
      
      expect(errorLoggingService.logError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Logged error' }),
        'runtime',
        undefined,
        expect.objectContaining({ context: 'ErrorBoundary' })
      );
    });

    it('should use custom fallback if provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });

    it('should reset when the reset button is clicked', () => {
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);
        
        return (
          <ErrorBoundary
            fallback={(error, reset) => (
              <button onClick={() => {
                setShouldThrow(false);
                reset();
              }}>
                Reset
              </button>
            )}
          >
            <ErrorThrowingComponent shouldThrow={shouldThrow} />
          </ErrorBoundary>
        );
      };
      
      render(<TestComponent />);
      
      fireEvent.click(screen.getByText('Reset'));
      
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('should support reset keys for automatic recovery', () => {
      const TestComponent: React.FC<{ resetKey: number }> = ({ resetKey }) => {
        return (
          <ErrorBoundary resetKeys={[resetKey]}>
            {resetKey > 0 ? <div>Reset success</div> : <ErrorThrowingComponent />}
          </ErrorBoundary>
        );
      };
      
      const { rerender } = render(<TestComponent resetKey={0} />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Change the reset key to trigger recovery
      rerender(<TestComponent resetKey={1} />);
      
      expect(screen.getByText('Reset success')).toBeInTheDocument();
    });
  });

  describe('ErrorFallback', () => {
    it('should render with error details', () => {
      const error = new Error('Test error details');
      const resetErrorBoundary = jest.fn();
      
      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          title="Custom Title"
        />
      );
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Test error details')).toBeInTheDocument();
    });

    it('should call reset function when try again button is clicked', () => {
      const error = new Error('Test error');
      const resetErrorBoundary = jest.fn();
      
      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      );
      
      fireEvent.click(screen.getByText('Try again'));
      
      expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
    });

    it('should support additional action when action text and handler provided', () => {
      const error = new Error('Test error');
      const resetErrorBoundary = jest.fn();
      const onAction = jest.fn();
      
      render(
        <ErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          actionText="Additional Action"
          onAction={onAction}
        />
      );
      
      fireEvent.click(screen.getByText('Additional Action'));
      
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Specialized Error Boundaries', () => {
    describe('VisualizationErrorBoundary', () => {
      it('should include visualization metadata in error logs', () => {
        render(
          <VisualizationErrorBoundary
            visualizationType="chart"
            dataSize={1000}
          >
            <ErrorThrowingComponent />
          </VisualizationErrorBoundary>
        );
        
        expect(errorLoggingService.logError).toHaveBeenCalledWith(
          expect.any(Error),
          'runtime',
          undefined,
          expect.objectContaining({
            context: 'Visualization',
            visualizationType: 'chart',
            dataSize: 1000
          })
        );
      });

      it('should display compact error UI when compact prop is true', () => {
        render(
          <VisualizationErrorBoundary compact>
            <ErrorThrowingComponent />
          </VisualizationErrorBoundary>
        );
        
        // Check for compact error UI
        expect(screen.getByText('Visualization Error')).toBeInTheDocument();
        expect(screen.getByText('Reset')).toBeInTheDocument();
      });
    });

    describe('DataFetchingErrorBoundary', () => {
      it('should show specialized error message for network errors', () => {
        render(
          <DataFetchingErrorBoundary>
            <ErrorThrowingComponent message="Failed to fetch data from network" />
          </DataFetchingErrorBoundary>
        );
        
        expect(screen.getByText('Network Error')).toBeInTheDocument();
      });

      it('should show API error message for API errors', () => {
        render(
          <DataFetchingErrorBoundary>
            <ErrorThrowingComponent message="API returned status code 500" />
          </DataFetchingErrorBoundary>
        );
        
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      it('should track retry attempts', async () => {
        const fetchData = jest.fn().mockResolvedValue(undefined);
        
        // We need to mock the implementation of setTimeout
        jest.useFakeTimers();
        
        render(
          <DataFetchingErrorBoundary
            fetchData={fetchData}
            retryOnError={true}
            maxRetries={2}
          >
            <ErrorThrowingComponent message="API error" />
          </DataFetchingErrorBoundary>
        );
        
        // Verify initial error logging
        expect(errorLoggingService.logError).toHaveBeenCalledTimes(1);
        
        // Fast-forward timers to trigger retries
        jest.runAllTimers();
        
        // Should have called fetchData for the retry
        expect(fetchData).toHaveBeenCalledTimes(1);
        
        // Clean up timers
        jest.useRealTimers();
      });
    });

    describe('GlobalErrorBoundary', () => {
      it('should render a specialized UI for application-level errors', () => {
        render(
          <GlobalErrorBoundary>
            <ErrorThrowingComponent message="Critical application error" />
          </GlobalErrorBoundary>
        );
        
        // Check for global error boundary specific UI elements
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
        expect(screen.getByText(/Return to Home/i)).toBeInTheDocument();
      });

      it('should provide different button text for root vs non-root errors', () => {
        render(
          <GlobalErrorBoundary isRoot>
            <ErrorThrowingComponent message="Root error" />
          </GlobalErrorBoundary>
        );
        
        expect(screen.getByText('Reload Application')).toBeInTheDocument();
        
        // Clean up and render with isRoot=false
        cleanup();
        
        render(
          <GlobalErrorBoundary isRoot={false}>
            <ErrorThrowingComponent message="Non-root error" />
          </GlobalErrorBoundary>
        );
        
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('Higher-Order Components', () => {
    it('should create a typed error boundary with createTypedErrorBoundary', () => {
      const TestComponent: React.FC<{ name: string }> = ({ name }) => {
        if (name === 'error') {
          throw new Error('Component error');
        }
        return <div>Hello, {name}</div>;
      };
      
      const WrappedComponent = createTypedErrorBoundary(
        TestComponent,
        'TestComponent'
      );
      
      render(<WrappedComponent name="error" />);
      
      expect(screen.getByText(/error occurred while rendering the TestComponent/i)).toBeInTheDocument();
    });

    it('should wrap a component with an error boundary using withErrorBoundary', () => {
      const TestComponent: React.FC = () => {
        throw new Error('Component error');
      };
      
      const WrappedComponent = withErrorBoundary(TestComponent, {
        fallback: <div>Custom error UI</div>,
        context: 'TestContext'
      });
      
      render(<WrappedComponent />);
      
      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    });
  });
});