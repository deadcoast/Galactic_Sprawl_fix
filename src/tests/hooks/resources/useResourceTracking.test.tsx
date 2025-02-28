import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useResourceTracking } from '../../../hooks/resources/useResourceTracking';
import { ResourceType } from '../../../types/resources/ResourceTypes';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useResourceTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default resources', () => {
    const { result } = renderHook(() => useResourceTracking());

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Check default resources
    const { resources } = result.current;
    expect(resources.size).toBeGreaterThan(0);

    // Check specific resource
    const energy = resources.get('energy');
    expect(energy).toBeDefined();
    expect(energy?.current).toBe(0);
    expect(energy?.max).toBe(100);
  });

  it('should initialize with custom resource types', () => {
    const customTypes = ['energy', 'minerals'] as ResourceType[];

    const { result } = renderHook(() => useResourceTracking({ types: customTypes }));

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.resources.size).toBe(2);
    expect(result.current.resources.has('energy')).toBe(true);
    expect(result.current.resources.has('minerals')).toBe(true);
    expect(result.current.resources.has('population')).toBe(false);
  });

  it('should update a resource', () => {
    const { result } = renderHook(() => useResourceTracking());

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    // Update energy resource
    act(() => {
      result.current.updateResource('energy', { current: 50, max: 200 });
    });

    const energy = result.current.resources.get('energy');
    expect(energy?.current).toBe(50);
    expect(energy?.max).toBe(200);
  });

  it('should increment a resource', () => {
    const { result } = renderHook(() => useResourceTracking());

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    // Increment energy resource
    act(() => {
      result.current.incrementResource('energy', 30);
    });

    const energy = result.current.resources.get('energy');
    expect(energy?.current).toBe(30);

    // Increment again
    act(() => {
      result.current.incrementResource('energy', 20);
    });

    expect(result.current.resources.get('energy')?.current).toBe(50);

    // Check history
    expect(result.current.history.length).toBe(2);
    expect(result.current.history[0].type).toBe('energy');
    expect(result.current.history[0].amount).toBe(20);
  });

  it('should not increment beyond max capacity', () => {
    const { result } = renderHook(() => useResourceTracking());

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    // Set max capacity
    act(() => {
      result.current.updateResource('energy', { max: 50 });
    });

    // Increment beyond max
    act(() => {
      result.current.incrementResource('energy', 70);
    });

    const energy = result.current.resources.get('energy');
    expect(energy?.current).toBe(50); // Capped at max
  });

  it('should decrement a resource', () => {
    const { result } = renderHook(() => useResourceTracking());

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    // Set initial value
    act(() => {
      result.current.updateResource('energy', { current: 50 });
    });

    // Decrement energy resource
    act(() => {
      result.current.decrementResource('energy', 20);
    });

    const energy = result.current.resources.get('energy');
    expect(energy?.current).toBe(30);

    // Check history
    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].type).toBe('energy');
    expect(result.current.history[0].amount).toBe(20);
  });

  it('should not decrement below min capacity', () => {
    const { result } = renderHook(() => useResourceTracking());

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    // Set initial value and min
    act(() => {
      result.current.updateResource('energy', { current: 30, min: 10 });
    });

    // Decrement beyond min
    act(() => {
      result.current.decrementResource('energy', 25);
    });

    const energy = result.current.resources.get('energy');
    expect(energy?.current).toBe(10); // Capped at min
  });

  it('should transfer resources', () => {
    const { result } = renderHook(() => useResourceTracking());

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    // Set initial value
    act(() => {
      result.current.updateResource('energy', { current: 50 });
    });

    // Transfer resources
    act(() => {
      const success = result.current.transferResource({
        type: 'energy',
        source: 'storage',
        target: 'consumption',
        amount: 20,
        timestamp: Date.now(),
      });

      expect(success).toBe(true);
    });

    const energy = result.current.resources.get('energy');
    expect(energy?.current).toBe(30);

    // Check history
    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].type).toBe('energy');
    expect(result.current.history[0].amount).toBe(20);
  });

  it('should not transfer more than available', () => {
    const { result } = renderHook(() => useResourceTracking());

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    // Set initial value
    act(() => {
      result.current.updateResource('energy', { current: 30 });
    });

    // Try to transfer more than available
    act(() => {
      const success = result.current.transferResource({
        type: 'energy',
        source: 'storage',
        target: 'consumption',
        amount: 50,
        timestamp: Date.now(),
      });

      expect(success).toBe(false);
    });

    const energy = result.current.resources.get('energy');
    expect(energy?.current).toBe(30); // Unchanged

    // Check history (no transfer recorded)
    expect(result.current.history.length).toBe(0);
  });

  it('should set and check thresholds', () => {
    const { result } = renderHook(() =>
      useResourceTracking({
        enableThresholds: true,
        updateInterval: 100,
      })
    );

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    // Set threshold
    act(() => {
      result.current.setThreshold('energy', {
        type: 'energy',
        min: 20,
        max: 80,
        target: 50,
      });
    });

    // Set resource below threshold
    act(() => {
      result.current.updateResource('energy', { current: 10 });
    });

    // Trigger threshold check
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Check alerts
    expect(result.current.alerts.length).toBeGreaterThan(0);
    expect(result.current.alerts[0].type).toBe('energy');
    expect(result.current.alerts[0].severity).toBe('critical');
  });

  it('should persist resources to localStorage', () => {
    const { result } = renderHook(() => useResourceTracking());

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    // Update resource
    act(() => {
      result.current.updateResource('energy', { current: 75, max: 150 });
    });

    // Check localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled();

    // Check the saved data
    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(savedData.energy.current).toBe(75);
    expect(savedData.energy.max).toBe(150);
  });

  it('should load resources from localStorage', () => {
    // Set up localStorage with initial data
    const initialData = {
      energy: {
        current: 60,
        min: 0,
        max: 120,
        production: 5,
        consumption: 2,
      },
    };

    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(initialData));

    const { result } = renderHook(() => useResourceTracking());

    // Wait for initialization to complete
    act(() => {
      vi.runAllTimers();
    });

    // Check loaded data
    const energy = result.current.resources.get('energy');
    expect(energy?.current).toBe(60);
    expect(energy?.max).toBe(120);
    expect(energy?.production).toBe(5);
  });
});
