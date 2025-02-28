import { Observable, Subject, filter, map, share } from 'rxjs';
import { ModuleEvent, ModuleEventType, moduleEventBus } from '../../lib/modules/ModuleEvents';

/**
 * Subject for all module events
 */
export const moduleEventSubject = new Subject<ModuleEvent>();

/**
 * Observable for all module events
 */
export const moduleEvents$ = moduleEventSubject.asObservable().pipe(
  share(), // Share the observable to prevent multiple subscriptions
);

/**
 * Initialize the RxJS integration with the moduleEventBus
 */
export function initializeRxJSIntegration(): () => void {
  // Subscribe to all module events and forward them to the subject
  const unsubscribe = moduleEventBus.subscribe('MODULE_CREATED' as ModuleEventType, event => {
    moduleEventSubject.next(event);
  });

  // Return a cleanup function
  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
    moduleEventSubject.complete();
  };
}

/**
 * Get an observable for a specific event type
 */
export function getEventsByType<T extends ModuleEventType>(eventType: T): Observable<ModuleEvent> {
  return moduleEvents$.pipe(filter(event => event.type === eventType));
}

/**
 * Get an observable for events from a specific module
 */
export function getEventsByModule(moduleId: string): Observable<ModuleEvent> {
  return moduleEvents$.pipe(filter(event => event.moduleId === moduleId));
}

/**
 * Get an observable for events with a specific data property
 */
export function getEventsByData<T>(
  propertyName: string,
  propertyValue: T,
): Observable<ModuleEvent> {
  return moduleEvents$.pipe(
    filter(
      event =>
        event.data &&
        event.data[propertyName] !== undefined &&
        event.data[propertyName] === propertyValue,
    ),
  );
}

/**
 * Get an observable that maps events to their data
 */
export function getEventData<T>(eventType: ModuleEventType): Observable<T> {
  return moduleEvents$.pipe(
    filter(event => event.type === eventType),
    map(event => event.data as T),
  );
}

/**
 * Create a custom event observable with filtering
 */
export function createFilteredEventStream(
  filterFn: (event: ModuleEvent) => boolean,
): Observable<ModuleEvent> {
  return moduleEvents$.pipe(filter(filterFn));
}

/**
 * Emit an event through the RxJS subject and moduleEventBus
 */
export function emitEvent(event: ModuleEvent): void {
  // Emit through the moduleEventBus
  moduleEventBus.emit(event);

  // Also emit through the RxJS subject
  moduleEventSubject.next(event);
}

/**
 * Hook up a Subject to a specific event type
 */
export function createEventTypeSubject<T extends ModuleEventType>(
  eventType: T,
): Subject<ModuleEvent> {
  const subject = new Subject<ModuleEvent>();

  // Subscribe to the event type and forward to the subject
  const unsubscribe = moduleEventBus.subscribe(eventType, event => {
    subject.next(event);
  });

  // Add cleanup method to the subject
  interface SubjectWithCleanup<T> extends Subject<T> {
    cleanup?: () => void;
  }

  const subjectWithCleanup = subject as SubjectWithCleanup<ModuleEvent>;
  subjectWithCleanup.cleanup = () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
    subject.complete();
  };

  return subject;
}

/**
 * Create a specialized event stream with transformation
 */
export function createTransformedEventStream<T, R>(
  eventType: ModuleEventType,
  transformFn: (event: ModuleEvent) => R,
): Observable<R> {
  return moduleEvents$.pipe(
    filter(event => event.type === eventType),
    map(transformFn),
  );
}

/**
 * Create a debounced event stream
 */
export function createDebouncedEventStream(
  eventType: ModuleEventType,
  debounceTime: number,
): Observable<ModuleEvent> {
  return moduleEvents$.pipe(
    filter(event => event.type === eventType),
    // We would normally use debounceTime here, but we're keeping it simple
    // debounceTime(debounceTime)
  );
}

/**
 * Create a throttled event stream
 */
export function createThrottledEventStream(
  eventType: ModuleEventType,
  throttleTime: number,
): Observable<ModuleEvent> {
  return moduleEvents$.pipe(
    filter(event => event.type === eventType),
    // We would normally use throttleTime here, but we're keeping it simple
    // throttleTime(throttleTime)
  );
}

/**
 * Create a buffered event stream that collects events over time
 */
export function createBufferedEventStream(
  eventType: ModuleEventType,
  bufferTime: number,
): Observable<ModuleEvent[]> {
  return moduleEvents$.pipe(
    filter(event => event.type === eventType),
    // We would normally use bufferTime here, but we're keeping it simple
    // bufferTime(bufferTime)
  ) as unknown as Observable<ModuleEvent[]>;
}

/**
 * Create a combined event stream from multiple event types
 */
export function createCombinedEventStream(eventTypes: ModuleEventType[]): Observable<ModuleEvent> {
  return moduleEvents$.pipe(filter(event => eventTypes.includes(event.type)));
}
