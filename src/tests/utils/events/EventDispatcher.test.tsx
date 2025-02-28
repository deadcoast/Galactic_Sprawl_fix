import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { EventDispatcherProvider, useEventDispatcher, useEventSubscription, useLatestEvent, useFilteredEvents } from '../../../utils/events/EventDispatcher';
import { ModuleEvent, ModuleEventType, moduleEventBus } from '../../../lib/modules/ModuleEvents';
import React, { useEffect } from 'react';

// Mock the moduleEventBus
vi.mock('../../../lib/modules/ModuleEvents', () => ({
  moduleEventBus: {
    emit: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
    getHistory: vi.fn().mockReturnValue([]),
    getModuleHistory: vi.fn().mockReturnValue([]),
    getEventTypeHistory: vi.fn().mockReturnValue([]),
    clearHistory: vi.fn(),
  },
  ModuleEventType: {
    MODULE_CREATED: 'MODULE_CREATED',
    MODULE_ATTACHED: 'MODULE_ATTACHED',
    MODULE_DETACHED: 'MODULE_DETACHED',
    MODULE_UPGRADED: 'MODULE_UPGRADED',
    MODULE_ACTIVATED: 'MODULE_ACTIVATED',
    MODULE_DEACTIVATED: 'MODULE_DEACTIVATED',
  }
}));

describe('EventDispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should render children', () => {
    render(
      <EventDispatcherProvider>
        <div data-testid="test-child">Test Child</div>
      </EventDispatcherProvider>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });
  
  it('should subscribe to events', () => {
    // Create a test component that uses the useEventSubscription hook
    const TestComponent = () => {
      const handleEvent = vi.fn();
      useEventSubscription('MODULE_CREATED' as ModuleEventType, handleEvent);
      
      return <div>Test Component</div>;
    };
    
    render(
      <EventDispatcherProvider>
        <TestComponent />
      </EventDispatcherProvider>
    );
    
    // Verify that the moduleEventBus.subscribe was called
    expect(moduleEventBus.subscribe).toHaveBeenCalledWith('MODULE_CREATED', expect.any(Function));
  });
  
  it('should emit events', () => {
    // Create a test component that uses the useEventDispatcher hook
    const TestComponent = () => {
      const { emit } = useEventDispatcher();
      
      useEffect(() => {
        // Emit a test event
        const testEvent: ModuleEvent = {
          type: 'MODULE_CREATED' as ModuleEventType,
          moduleId: 'test-module',
          moduleType: 'radar',
          timestamp: Date.now(),
          data: { test: true }
        };
        
        emit(testEvent);
      }, [emit]);
      
      return <div>Test Component</div>;
    };
    
    render(
      <EventDispatcherProvider>
        <TestComponent />
      </EventDispatcherProvider>
    );
    
    // Verify that the moduleEventBus.emit was called
    expect(moduleEventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
      type: 'MODULE_CREATED',
      moduleId: 'test-module',
      moduleType: 'radar',
      data: { test: true }
    }));
  });
  
  it('should get event history', () => {
    // Mock the event history
    const mockHistory: ModuleEvent[] = [
      {
        type: 'MODULE_CREATED' as ModuleEventType,
        moduleId: 'test-module-1',
        moduleType: 'radar',
        timestamp: 1000,
        data: { test: 1 }
      },
      {
        type: 'MODULE_ATTACHED' as ModuleEventType,
        moduleId: 'test-module-2',
        moduleType: 'hangar',
        timestamp: 2000,
        data: { test: 2 }
      }
    ];
    
    // Update the mock implementation
    vi.mocked(moduleEventBus.getHistory).mockReturnValue(mockHistory);
    
    // Create a test component that uses the useEventDispatcher hook
    const TestComponent = () => {
      const { getHistory } = useEventDispatcher();
      const history = getHistory();
      
      return (
        <div>
          <div data-testid="history-length">{history.length}</div>
          <div data-testid="history-item-1">{history[0]?.moduleId}</div>
          <div data-testid="history-item-2">{history[1]?.moduleId}</div>
        </div>
      );
    };
    
    render(
      <EventDispatcherProvider>
        <TestComponent />
      </EventDispatcherProvider>
    );
    
    // Verify that the history was retrieved
    expect(moduleEventBus.getHistory).toHaveBeenCalled();
    expect(screen.getByTestId('history-length').textContent).toBe('2');
    expect(screen.getByTestId('history-item-1').textContent).toBe('test-module-1');
    expect(screen.getByTestId('history-item-2').textContent).toBe('test-module-2');
  });
  
  it('should get module history', () => {
    // Mock the module history
    const mockModuleHistory: ModuleEvent[] = [
      {
        type: 'MODULE_CREATED' as ModuleEventType,
        moduleId: 'test-module',
        moduleType: 'radar',
        timestamp: 1000,
        data: { test: 1 }
      },
      {
        type: 'MODULE_UPGRADED' as ModuleEventType,
        moduleId: 'test-module',
        moduleType: 'radar',
        timestamp: 2000,
        data: { test: 2 }
      }
    ];
    
    // Update the mock implementation
    vi.mocked(moduleEventBus.getModuleHistory).mockReturnValue(mockModuleHistory);
    
    // Create a test component that uses the useEventDispatcher hook
    const TestComponent = () => {
      const { getModuleHistory } = useEventDispatcher();
      const history = getModuleHistory('test-module');
      
      return (
        <div>
          <div data-testid="history-length">{history.length}</div>
          <div data-testid="history-item-1">{history[0]?.type}</div>
          <div data-testid="history-item-2">{history[1]?.type}</div>
        </div>
      );
    };
    
    render(
      <EventDispatcherProvider>
        <TestComponent />
      </EventDispatcherProvider>
    );
    
    // Verify that the module history was retrieved
    expect(moduleEventBus.getModuleHistory).toHaveBeenCalledWith('test-module');
    expect(screen.getByTestId('history-length').textContent).toBe('2');
    expect(screen.getByTestId('history-item-1').textContent).toBe('MODULE_CREATED');
    expect(screen.getByTestId('history-item-2').textContent).toBe('MODULE_UPGRADED');
  });
  
  it('should get event type history', () => {
    // Mock the event type history
    const mockEventTypeHistory: ModuleEvent[] = [
      {
        type: 'MODULE_CREATED' as ModuleEventType,
        moduleId: 'test-module-1',
        moduleType: 'radar',
        timestamp: 1000,
        data: { test: 1 }
      },
      {
        type: 'MODULE_CREATED' as ModuleEventType,
        moduleId: 'test-module-2',
        moduleType: 'hangar',
        timestamp: 2000,
        data: { test: 2 }
      }
    ];
    
    // Update the mock implementation
    vi.mocked(moduleEventBus.getEventTypeHistory).mockReturnValue(mockEventTypeHistory);
    
    // Create a test component that uses the useEventDispatcher hook
    const TestComponent = () => {
      const { getEventTypeHistory } = useEventDispatcher();
      const history = getEventTypeHistory('MODULE_CREATED' as ModuleEventType);
      
      return (
        <div>
          <div data-testid="history-length">{history.length}</div>
          <div data-testid="history-item-1">{history[0]?.moduleId}</div>
          <div data-testid="history-item-2">{history[1]?.moduleId}</div>
        </div>
      );
    };
    
    render(
      <EventDispatcherProvider>
        <TestComponent />
      </EventDispatcherProvider>
    );
    
    // Verify that the event type history was retrieved
    expect(moduleEventBus.getEventTypeHistory).toHaveBeenCalledWith('MODULE_CREATED');
    expect(screen.getByTestId('history-length').textContent).toBe('2');
    expect(screen.getByTestId('history-item-1').textContent).toBe('test-module-1');
    expect(screen.getByTestId('history-item-2').textContent).toBe('test-module-2');
  });
  
  it('should clear history', () => {
    // Create a test component that uses the useEventDispatcher hook
    const TestComponent = () => {
      const { clearHistory } = useEventDispatcher();
      
      useEffect(() => {
        clearHistory();
      }, [clearHistory]);
      
      return <div>Test Component</div>;
    };
    
    render(
      <EventDispatcherProvider>
        <TestComponent />
      </EventDispatcherProvider>
    );
    
    // Verify that the history was cleared
    expect(moduleEventBus.clearHistory).toHaveBeenCalled();
  });
  
  it('should get filtered events', () => {
    // Mock the event history
    const mockHistory: ModuleEvent[] = [
      {
        type: 'MODULE_CREATED' as ModuleEventType,
        moduleId: 'test-module-1',
        moduleType: 'radar',
        timestamp: 1000,
        data: { test: 1 }
      },
      {
        type: 'MODULE_ATTACHED' as ModuleEventType,
        moduleId: 'test-module-2',
        moduleType: 'hangar',
        timestamp: 2000,
        data: { test: 2 }
      },
      {
        type: 'MODULE_CREATED' as ModuleEventType,
        moduleId: 'test-module-3',
        moduleType: 'academy',
        timestamp: 3000,
        data: { test: 3 }
      }
    ];
    
    // Update the mock implementation
    vi.mocked(moduleEventBus.getHistory).mockReturnValue(mockHistory);
    
    // Create a test component that uses the useFilteredEvents hook
    const TestComponent = () => {
      const filteredEvents = useFilteredEvents(
        event => event.type === 'MODULE_CREATED',
        []
      );
      
      return (
        <div>
          <div data-testid="filtered-length">{filteredEvents.length}</div>
          <div data-testid="filtered-item-1">{filteredEvents[0]?.moduleId}</div>
          <div data-testid="filtered-item-2">{filteredEvents[1]?.moduleId}</div>
        </div>
      );
    };
    
    render(
      <EventDispatcherProvider>
        <TestComponent />
      </EventDispatcherProvider>
    );
    
    // Verify that the filtered events were retrieved
    expect(screen.getByTestId('filtered-length').textContent).toBe('2');
    expect(screen.getByTestId('filtered-item-1').textContent).toBe('test-module-1');
    expect(screen.getByTestId('filtered-item-2').textContent).toBe('test-module-3');
  });
  
  it('should get latest event', () => {
    // Create a test component that uses the useLatestEvent hook
    const TestComponent = () => {
      // Set up the latest events map
      const { latestEvents } = useEventDispatcher();
      
      // Manually set a latest event for testing
      act(() => {
        latestEvents.set('MODULE_CREATED' as ModuleEventType, {
          type: 'MODULE_CREATED' as ModuleEventType,
          moduleId: 'test-module',
          moduleType: 'radar',
          timestamp: 1000,
          data: { test: true }
        });
      });
      
      // Use the hook to get the latest event
      const latestEvent = useLatestEvent('MODULE_CREATED' as ModuleEventType);
      
      return (
        <div>
          {latestEvent && (
            <div data-testid="latest-event">{latestEvent.moduleId}</div>
          )}
        </div>
      );
    };
    
    render(
      <EventDispatcherProvider>
        <TestComponent />
      </EventDispatcherProvider>
    );
    
    // Verify that the latest event was retrieved
    expect(screen.getByTestId('latest-event').textContent).toBe('test-module');
  });
  
  it('should throw an error when used outside of provider', () => {
    // Create a test component that uses the useEventDispatcher hook
    const TestComponent = () => {
      try {
        useEventDispatcher();
        return <div>No error</div>;
      } catch (error) {
        return <div data-testid="error-message">{(error as Error).message}</div>;
      }
    };
    
    // Render without the provider
    render(<TestComponent />);
    
    // Verify that an error was thrown
    expect(screen.getByTestId('error-message').textContent).toBe(
      'useEventDispatcher must be used within an EventDispatcherProvider'
    );
  });
}); 