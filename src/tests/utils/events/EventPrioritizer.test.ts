import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseEvent } from '../../../types/events/EventTypes';
import { EventPrioritizer, EventPriority } from '../../../utils/events/EventPrioritizer';

// Test event interface
interface TestEvent extends BaseEvent {
  type: string;
  value: number;
  timestamp: number;
}

// Mock event
const createTestEvent = (type: string, value: number, timestamp = Date.now()): TestEvent => ({
  type,
  value,
  timestamp,
  moduleId: 'test-module',
  moduleType: 'test-type',
});

describe('EventPrioritizer', () => {
  // Mock processor
  let processedEvents: TestEvent[] = [];
  const processor = vi.fn((event: TestEvent) => {
    processedEvents.push(event);
  });

  // Priortizer instance
  let prioritizer: EventPrioritizer<TestEvent>;

  // Setup
  beforeEach(() => {
    processedEvents = [];
    processor.mockClear();

    // Create prioritizer with test configuration
    prioritizer = new EventPrioritizer<TestEvent>(processor, {
      defaultPriority: EventPriority.NORMAL,
      priorityMap: new Map([
        ['critical-event', EventPriority.CRITICAL],
        ['high-event', EventPriority.HIGH],
        ['normal-event', EventPriority.NORMAL],
        ['low-event', EventPriority.LOW],
        ['background-event', EventPriority.BACKGROUND],
      ]),
      coalesceableEventTypes: new Set(['coalesceable-event']),
    });
  });

  afterEach(() => {
    prioritizer.dispose();
  });

  it('should process events with appropriate priority', async () => {
    // Add events with different priorities
    prioritizer.addEvent(createTestEvent('critical-event', 1));
    prioritizer.addEvent(createTestEvent('high-event', 2));
    prioritizer.addEvent(createTestEvent('normal-event', 3));
    prioritizer.addEvent(createTestEvent('low-event', 4));
    prioritizer.addEvent(createTestEvent('background-event', 5));

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 600));

    // Verify that events were processed
    expect(processedEvents.length).toBe(5);

    // Critical events should be processed first due to their priority
    expect(processedEvents[0].type).toBe('critical-event');
  });

  it('should coalesce events of specified types', async () => {
    // Add multiple events of the same coalesceable type
    prioritizer.addEvent(createTestEvent('coalesceable-event', 1));
    prioritizer.addEvent(createTestEvent('coalesceable-event', 2));
    prioritizer.addEvent(createTestEvent('coalesceable-event', 3));

    // Add non-coalesceable event
    prioritizer.addEvent(createTestEvent('normal-event', 4));

    // Verify that normal event is immediately processed
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(processedEvents.length).toBe(1);
    expect(processedEvents[0].type).toBe('normal-event');

    // Flush coalesced events
    prioritizer.flushCoalescedEvents();

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify that only the last coalesceable event was processed
    expect(processedEvents.length).toBe(2);
    expect(processedEvents[1].type).toBe('coalesceable-event');
    expect(processedEvents[1].value).toBe(3);
  });

  it('should track event metrics', async () => {
    // Add events
    prioritizer.addEvent(createTestEvent('critical-event', 1));
    prioritizer.addEvent(createTestEvent('high-event', 2));
    prioritizer.addEvent(createTestEvent('normal-event', 3));

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get metrics
    const metrics = prioritizer.getMetrics();

    // Verify metrics
    expect(metrics.totalEventsReceived).toBe(3);
    expect(metrics.eventsByPriority[EventPriority.CRITICAL]).toBe(1);
    expect(metrics.eventsByPriority[EventPriority.HIGH]).toBe(1);
    expect(metrics.eventsByPriority[EventPriority.NORMAL]).toBe(1);
  });

  it('should allow dynamically updating priorities', async () => {
    // Initially set as normal priority
    prioritizer.addEvent(createTestEvent('dynamic-event', 1));

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 300));

    // Change the priority to critical
    prioritizer.setPriority('dynamic-event', EventPriority.CRITICAL);

    // Add another event
    prioritizer.addEvent(createTestEvent('dynamic-event', 2));

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify that the second event was processed immediately due to critical priority
    expect(processedEvents.length).toBe(2);
    expect(processedEvents[1].value).toBe(2);
  });

  it('should batch events by priority level', async () => {
    // Record timestamps of processed events
    const processingTimes: Record<string, number> = {};
    processor.mockImplementation((event: TestEvent) => {
      processingTimes[event.type] = Date.now();
      processedEvents.push(event);
    });

    // Add events
    prioritizer.addEvent(createTestEvent('critical-event', 1));
    prioritizer.addEvent(createTestEvent('high-event', 2));
    prioritizer.addEvent(createTestEvent('normal-event', 3));
    prioritizer.addEvent(createTestEvent('low-event', 4));
    prioritizer.addEvent(createTestEvent('background-event', 5));

    // Wait for all events to be processed
    await new Promise(resolve => setTimeout(resolve, 600));

    // Verify processing order based on priority
    if (processingTimes['critical-event'] && processingTimes['high-event']) {
      expect(processingTimes['critical-event']).toBeLessThan(processingTimes['high-event']);
    }

    if (processingTimes['high-event'] && processingTimes['normal-event']) {
      expect(processingTimes['high-event']).toBeLessThanOrEqual(processingTimes['normal-event']);
    }
  });

  it('should handle errors in event processors', async () => {
    // Create a new prioritizer with a failing processor
    const errorProcessor = vi.fn((event: TestEvent) => {
      if (event.type === 'error-event') {
        throw new Error('Test error');
      }
      processedEvents.push(event);
    });

    const errorPrioritizer = new EventPrioritizer<TestEvent>(errorProcessor);

    // Add both normal and error-generating events
    errorPrioritizer.addEvent(createTestEvent('normal-event', 1));
    errorPrioritizer.addEvent(createTestEvent('error-event', 2));
    errorPrioritizer.addEvent(createTestEvent('normal-event', 3));

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify that normal events were processed despite the error
    expect(processedEvents.length).toBe(2);
    expect(processedEvents[0].value).toBe(1);
    expect(processedEvents[1].value).toBe(3);

    // Verify that the error event triggered the error handler
    expect(errorProcessor).toHaveBeenCalledTimes(3);

    // Clean up
    errorPrioritizer.dispose();
  });

  it('should reset metrics when requested', async () => {
    // Add events
    prioritizer.addEvent(createTestEvent('normal-event', 1));
    prioritizer.addEvent(createTestEvent('normal-event', 2));

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get metrics
    const beforeMetrics = prioritizer.getMetrics();
    expect(beforeMetrics.totalEventsReceived).toBe(2);

    // Reset metrics
    prioritizer.resetMetrics();

    // Get metrics again
    const afterMetrics = prioritizer.getMetrics();
    expect(afterMetrics.totalEventsReceived).toBe(0);
  });
});
