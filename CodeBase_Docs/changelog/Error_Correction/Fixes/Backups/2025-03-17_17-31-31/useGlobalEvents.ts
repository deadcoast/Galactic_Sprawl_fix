import { useCallback } from 'react';

export interface EventPayload {
  hazardId?: string;
  position?: { x: number; y: number };
  severity?: 'low' | 'medium' | 'high';
  type?: string;
  data?: Record<string, unknown>;
}

type EventCallback = (payload: EventPayload) => void;

// Simple event bus implementation
const eventBus = {
  listeners: new Map<string, Set<EventCallback>>(),

  subscribe(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  },

  emit(event: string, payload: EventPayload) {
    this.listeners.get(event)?.forEach(callback => callback(payload));
  },
};

export function useGlobalEvents() {
  const emitEvent = useCallback((event: string, payload: EventPayload) => {
    eventBus.emit(event, payload);
  }, []);

  const subscribeToEvent = useCallback((event: string, callback: EventCallback) => {
    return eventBus.subscribe(event, callback);
  }, []);

  return {
    emitEvent,
    subscribeToEvent,
  };
}
