import * as React from "react";
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ResourceRatesProvider, useResourceRate } from '../../contexts/ResourceRatesContext';
import { EventBus } from '../../lib/events/EventBus';
import { ResourceManager } from '../../managers/game/ResourceManager';
import { EventType } from '../../types/events/EventTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";

// Mock ResourceManager
vi.mock('../../managers/game/ResourceManager');

describe('ResourceRatesContext', () => {
  let mockResourceManager: ResourceManager;
  let mockEventBus: EventBus<any>;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a mock EventBus
    mockEventBus = new EventBus();

    // Create a mock ResourceManager with required methods
    mockResourceManager = {
      getAllResourceRates: vi.fn().mockReturnValue({
        [ResourceType.MINERALS]: { production: 10, consumption: 5, net: 5 },
        [ResourceType.ENERGY]: { production: 20, consumption: 10, net: 10 },
        [ResourceType.POPULATION]: { production: 5, consumption: 2, net: 3 },
        [ResourceType.RESEARCH]: { production: 15, consumption: 5, net: 10 },
        [ResourceType.PLASMA]: { production: 3, consumption: 1, net: 2 },
        [ResourceType.GAS]: { production: 8, consumption: 3, net: 5 },
        [ResourceType.EXOTIC]: { production: 2, consumption: 1, net: 1 },
      }),
      subscribeToEvent: vi.fn().mockImplementation(() => {
        return vi.fn(); // Return a cleanup function
      }),
    } as unknown as ResourceManager;
  });

  // Test component that uses the context
  const TestComponent = () => {
    const mineralRate = useResourceRate(ResourceType.MINERALS);
    return (
      <div>
        <div data-testid="production">{mineralRate.production}</div>
        <div data-testid="consumption">{mineralRate.consumption}</div>
        <div data-testid="net">{mineralRate.net}</div>
      </div>
    );
  };

  test('should initialize with default rates when no manager is provided', () => {
    render(
      <ResourceRatesProvider>
        <TestComponent />
      </ResourceRatesProvider>
    );

    // Default values should be 0
    expect(screen.getByTestId('production')).toHaveTextContent('0');
    expect(screen.getByTestId('consumption')).toHaveTextContent('0');
    expect(screen.getByTestId('net')).toHaveTextContent('0');
  });

  test('should initialize with rates from ResourceManager', () => {
    render(
      <ResourceRatesProvider manager={mockResourceManager}>
        <TestComponent />
      </ResourceRatesProvider>
    );

    // Values from mock getAllResourceRates
    expect(screen.getByTestId('production')).toHaveTextContent('10');
    expect(screen.getByTestId('consumption')).toHaveTextContent('5');
    expect(screen.getByTestId('net')).toHaveTextContent('5');
  });

  test('should subscribe to resource events', () => {
    render(
      <ResourceRatesProvider manager={mockResourceManager}>
        <TestComponent />
      </ResourceRatesProvider>
    );

    // Should subscribe to all three event types
    expect(mockResourceManager.subscribeToEvent).toHaveBeenCalledTimes(3);
    expect(mockResourceManager.subscribeToEvent).toHaveBeenCalledWith(
      EventType.RESOURCE_UPDATED,
      expect.any(Function)
    );
    expect(mockResourceManager.subscribeToEvent).toHaveBeenCalledWith(
      EventType.RESOURCE_PRODUCED,
      expect.any(Function)
    );
    expect(mockResourceManager.subscribeToEvent).toHaveBeenCalledWith(
      EventType.RESOURCE_CONSUMED,
      expect.any(Function)
    );
  });

  test('should update rates when resource events are emitted', () => {
    // Store the event handlers that will be passed to subscribeToEvent
    const eventHandlers: Record<string, (event: any) => void> = {};

    mockResourceManager.subscribeToEvent = vi.fn().mockImplementation((eventType, handler) => {
      eventHandlers[eventType] = handler;
      return vi.fn(); // Return a cleanup function
    });

    render(
      <ResourceRatesProvider manager={mockResourceManager}>
        <TestComponent />
      </ResourceRatesProvider>
    );

    // Simulate a resource update event
    act(() => {
      const updateHandler = eventHandlers[EventType.RESOURCE_UPDATED];
      updateHandler({
        type: EventType.RESOURCE_UPDATED,
        data: {
          resourceType: ResourceType.MINERALS,
          production: 15,
          consumption: 7,
        },
        timestamp: Date.now(),
        moduleId: 'test-module',
        moduleType: 'resource-manager', // Valid ModuleType
      });
    });

    // Values should be updated
    expect(screen.getByTestId('production')).toHaveTextContent('15');
    expect(screen.getByTestId('consumption')).toHaveTextContent('7');
    expect(screen.getByTestId('net')).toHaveTextContent('8'); // 15 - 7 = 8
  });

  test('should clean up subscriptions on unmount', () => {
    const unsubscribeMock1 = vi.fn();
    const unsubscribeMock2 = vi.fn();
    const unsubscribeMock3 = vi.fn();

    // Setup the unsubscribe functions
    mockResourceManager.subscribeToEvent = vi
      .fn()
      .mockImplementationOnce(() => unsubscribeMock1)
      .mockImplementationOnce(() => unsubscribeMock2)
      .mockImplementationOnce(() => unsubscribeMock3);

    const { unmount } = render(
      <ResourceRatesProvider manager={mockResourceManager}>
        <TestComponent />
      </ResourceRatesProvider>
    );

    // Unmount the component
    unmount();

    // All unsubscribe functions should be called
    expect(unsubscribeMock1).toHaveBeenCalled();
    expect(unsubscribeMock2).toHaveBeenCalled();
    expect(unsubscribeMock3).toHaveBeenCalled();
  });
});
