import * as React from "react";
import { act, render, screen, waitFor } from '@testing-library/react';
import { ServiceProvider } from '../../components/providers/ServiceProvider';
import { useService } from '../../hooks/services/useService';
import { componentRegistryService } from '../../services/ComponentRegistryService';
import { errorLoggingService, ErrorType } from '../../services/ErrorLoggingService';
import { eventPropagationService } from '../../services/EventPropagationService';
import { recoveryService } from '../../services/RecoveryService';

// Test component that uses services
function TestComponent() {
  const { service: errorLogging, isLoading: errorLoggingLoading } =
    useService<typeof errorLoggingService>('errorLogging');
  const { service: recovery, isLoading: recoveryLoading } =
    useService<typeof recoveryService>('recovery');
  const { service: componentRegistry, isLoading: componentRegistryLoading } =
    useService<typeof componentRegistryService>('componentRegistry');
  const { service: eventPropagation, isLoading: eventPropagationLoading } =
    useService<typeof eventPropagationService>('eventPropagation');

  if (
    errorLoggingLoading ||
    recoveryLoading ||
    componentRegistryLoading ||
    eventPropagationLoading
  ) {
    return <div>Loading services...</div>;
  }

  return (
    <div>
      <div data-testid="error-logging-status">
        ErrorLogging: {errorLogging?.isReady() ? 'Ready' : 'Not Ready'}
      </div>
      <div data-testid="recovery-status">
        Recovery: {recovery?.isReady() ? 'Ready' : 'Not Ready'}
      </div>
      <div data-testid="component-registry-status">
        ComponentRegistry: {componentRegistry?.isReady() ? 'Ready' : 'Not Ready'}
      </div>
      <div data-testid="event-propagation-status">
        EventPropagation: {eventPropagation?.isReady() ? 'Ready' : 'Not Ready'}
      </div>
    </div>
  );
}

describe('Service Integration', () => {
  beforeEach(() => {
    // Clear any existing service state
    jest.clearAllMocks();
  });

  it('should initialize all services through ServiceProvider', async () => {
    render(
      <ServiceProvider>
        <TestComponent />
      </ServiceProvider>
    );

    // Initially shows loading
    expect(screen.getByText('Loading services...')).toBeInTheDocument();

    // Wait for services to initialize
    await waitFor(() => {
      expect(screen.getByTestId('error-logging-status')).toHaveTextContent('Ready');
      expect(screen.getByTestId('recovery-status')).toHaveTextContent('Ready');
      expect(screen.getByTestId('component-registry-status')).toHaveTextContent('Ready');
      expect(screen.getByTestId('event-propagation-status')).toHaveTextContent('Ready');
    });
  });

  it('should handle errors through ErrorLoggingService', async () => {
    render(
      <ServiceProvider>
        <TestComponent />
      </ServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-logging-status')).toHaveTextContent('Ready');
    });

    // Test error logging
    const testError = new Error('Test error');
    act(() => {
      errorLoggingService.logError(testError, ErrorType.UNKNOWN);
    });

    // Verify error was logged
    const errors = errorLoggingService.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Test error');
  });

  it('should handle state snapshots through RecoveryService', async () => {
    render(
      <ServiceProvider>
        <TestComponent />
      </ServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('recovery-status')).toHaveTextContent('Ready');
    });

    // Test state snapshot creation and restoration
    const testState = { key: 'value' };
    const snapshotId = recoveryService.createSnapshot(testState);
    const restoredState = recoveryService.restoreSnapshot(snapshotId);

    expect(restoredState).toEqual(testState);
  });

  it('should handle component registration and event propagation', async () => {
    render(
      <ServiceProvider>
        <TestComponent />
      </ServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('component-registry-status')).toHaveTextContent('Ready');
      expect(screen.getByTestId('event-propagation-status')).toHaveTextContent('Ready');
    });

    // Test component registration
    const componentId = componentRegistryService.registerComponent({
      type: 'test',
      eventSubscriptions: ['test-event'],
      updatePriority: 'high',
    });

    // Test event propagation
    const mockCallback = jest.fn();
    const unsubscribe = eventPropagationService.subscribe({
      eventType: 'test-event',
      priority: 1,
      callback: mockCallback,
    });

    act(() => {
      eventPropagationService.emit('test-event', { data: 'test' });
    });

    // Wait for event to be processed
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
    });

    // Cleanup
    unsubscribe();
    componentRegistryService.unregisterComponent(componentId);
  });
});
