import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EventSystem, BaseEvent, useEventSubscription, useLastEvent, publishEvent } from '../../../lib/events/UnifiedEventSystem';

// Sample event types for testing
interface TestEvent extends BaseEvent {
  type: 'TEST_EVENT';
  data: string;
}

interface PriorityEvent extends BaseEvent {
  type: 'PRIORITY_EVENT';
  value: number;
}

describe('UnifiedEventSystem', () => {
  let eventSystem: EventSystem;

  beforeEach(() => {
    // Reset the singleton instance between tests
    EventSystem['resetInstance']('EventSystem');
    eventSystem = EventSystem.getInstance();
  });

  it('should subscribe and publish events', () => {
    const handler = vi.fn();
    const unsubscribe = eventSystem.subscribe<TestEvent>('TEST_EVENT', handler);

    const event: TestEvent = { type: 'TEST_EVENT', data: 'test-data' };
    eventSystem.publish(event);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      type: 'TEST_EVENT',
      data: 'test-data',
      timestamp: expect.any(Number),
    }));

    // Unsubscribe and verify handler is not called
    unsubscribe();
    eventSystem.publish(event);
    expect(handler).toHaveBeenCalledTimes(1); // Still just one call
  });

  it('should handle priority-based event handling', () => {
    const calls: number[] = [];

    // Register handlers with different priorities
    eventSystem.subscribe<PriorityEvent>('PRIORITY_EVENT', () => {
      calls.push(2);
    }, { priority: 2 });

    eventSystem.subscribe<PriorityEvent>('PRIORITY_EVENT', () => {
      calls.push(1);
    }, { priority: 1 });

    eventSystem.subscribe<PriorityEvent>('PRIORITY_EVENT', () => {
      calls.push(3);
    }, { priority: 3 });

    const event: PriorityEvent = { type: 'PRIORITY_EVENT', value: 42 };
    eventSystem.publish(event);

    // Handlers should be called in order of priority (highest first)
    expect(calls).toEqual([3, 2, 1]);
  });

  it('should support filtering events', () => {
    const handler = vi.fn();
    eventSystem.subscribe<TestEvent>('TEST_EVENT', handler, {
      filter: (event) => event.data === 'pass',
    });

    // This event should be filtered out
    eventSystem.publish({ type: 'TEST_EVENT', data: 'fail' });
    expect(handler).not.toHaveBeenCalled();

    // This event should pass the filter
    eventSystem.publish({ type: 'TEST_EVENT', data: 'pass' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support once option', () => {
    const handler = vi.fn();
    eventSystem.subscribe<TestEvent>('TEST_EVENT', handler, { once: true });

    // First event should trigger the handler
    eventSystem.publish({ type: 'TEST_EVENT', data: 'first' });
    expect(handler).toHaveBeenCalledTimes(1);

    // Second event should not trigger the handler (it was removed after first call)
    eventSystem.publish({ type: 'TEST_EVENT', data: 'second' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support batched event publishing', async () => {
    const handler = vi.fn();
    eventSystem.subscribe<TestEvent>('TEST_EVENT', handler);

    // Start a batch
    eventSystem.startBatch();

    // Publish multiple events in the batch
    eventSystem.publish({ type: 'TEST_EVENT', data: 'batch1' });
    eventSystem.publish({ type: 'TEST_EVENT', data: 'batch2' });
    eventSystem.publish({ type: 'TEST_EVENT', data: 'batch3' });

    // Handler should not be called yet
    expect(handler).not.toHaveBeenCalled();

    // End the batch
    await eventSystem.endBatch();

    // Handler should be called for each event in the batch
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('should clear subscriptions correctly', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    eventSystem.subscribe<TestEvent>('TEST_EVENT', handler1, {}, 'scope1');
    eventSystem.subscribe<TestEvent>('TEST_EVENT', handler2, {}, 'scope2');
    eventSystem.subscribe<PriorityEvent>('PRIORITY_EVENT', handler3, {}, 'scope1');

    // Clear by event type
    eventSystem.clearSubscriptions('TEST_EVENT');
    
    // TEST_EVENT handlers should be removed
    eventSystem.publish({ type: 'TEST_EVENT', data: 'data' });
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
    
    // PRIORITY_EVENT handler should still work
    eventSystem.publish({ type: 'PRIORITY_EVENT', value: 42 });
    expect(handler3).toHaveBeenCalledTimes(1);

    // Reset for next test
    eventSystem.clearSubscriptions();
    handler1.mockClear();
    handler2.mockClear();
    handler3.mockClear();

    // Set up again
    eventSystem.subscribe<TestEvent>('TEST_EVENT', handler1, {}, 'scope1');
    eventSystem.subscribe<TestEvent>('TEST_EVENT', handler2, {}, 'scope2');
    eventSystem.subscribe<PriorityEvent>('PRIORITY_EVENT', handler3, {}, 'scope1');

    // Clear by scope
    eventSystem.clearSubscriptions(undefined, 'scope1');

    // scope1 handlers should be removed
    eventSystem.publish({ type: 'TEST_EVENT', data: 'data' });
    eventSystem.publish({ type: 'PRIORITY_EVENT', value: 42 });
    
    expect(handler1).not.toHaveBeenCalled();
    expect(handler3).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should handle async event publishing', async () => {
    const handler = vi.fn();
    eventSystem.subscribe<TestEvent>('TEST_EVENT', handler);

    const event: TestEvent = { type: 'TEST_EVENT', data: 'async-data' };
    await eventSystem.publishAsync(event);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      type: 'TEST_EVENT',
      data: 'async-data',
    }));
  });
});

describe('Event Hooks', () => {
  beforeEach(() => {
    // Reset the singleton instance between tests
    EventSystem['resetInstance']('EventSystem');
  });

  it('should subscribe to events with useEventSubscription', () => {
    const handler = vi.fn();
    
    const { unmount } = renderHook(() => 
      useEventSubscription<TestEvent>('TEST_EVENT', handler)
    );

    // Publish an event
    act(() => {
      publishEvent<TestEvent>({ type: 'TEST_EVENT', data: 'hook-test' });
    });

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      type: 'TEST_EVENT',
      data: 'hook-test',
    }));

    // Unsubscribe by unmounting
    unmount();

    // Publish again - should not trigger handler
    act(() => {
      publishEvent<TestEvent>({ type: 'TEST_EVENT', data: 'after-unmount' });
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should track last event with useLastEvent', () => {
    const { result } = renderHook(() => 
      useLastEvent<TestEvent>('TEST_EVENT')
    );

    // Initially should be null
    expect(result.current).toBeNull();

    // Publish an event
    act(() => {
      publishEvent<TestEvent>({ type: 'TEST_EVENT', data: 'first-event' });
    });

    // Should update to the published event
    expect(result.current).toEqual(expect.objectContaining({
      type: 'TEST_EVENT',
      data: 'first-event',
    }));

    // Publish another event
    act(() => {
      publishEvent<TestEvent>({ type: 'TEST_EVENT', data: 'second-event' });
    });

    // Should update to the latest event
    expect(result.current).toEqual(expect.objectContaining({
      type: 'TEST_EVENT',
      data: 'second-event',
    }));
  });
});