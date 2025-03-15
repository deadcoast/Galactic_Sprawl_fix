import * as React from "react";
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderHook, act as hookAct } from '@testing-library/react-hooks';
import { createDataFetchHook, createStateHook, createLifecycleHook, LifecyclePhase } from '../../../hooks/factory';

// Mock the error logging service
jest.mock('../../../services/ErrorLoggingService', () => ({
  errorLoggingService: {
    logError: jest.fn(),
  },
  ErrorType: {
    NETWORK: 'network',
    RUNTIME: 'runtime',
  },
}));

describe('Hook Factories', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDataFetchHook', () => {
    const mockData = { id: 1, name: 'Test User' };
    const mockFetch = jest.fn().mockResolvedValue(mockData);
    const mockFetchError = jest.fn().mockRejectedValue(new Error('Fetch error'));

    it('should fetch data on mount when fetchOnMount is true', async () => {
      const useTestHook = createDataFetchHook(mockFetch, { fetchOnMount: true });
      const { result, waitForNextUpdate } = renderHook(() => useTestHook());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBe(null);

      await waitForNextUpdate();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });

    it('should not fetch data on mount when fetchOnMount is false', () => {
      const useTestHook = createDataFetchHook(mockFetch, { fetchOnMount: false });
      const { result } = renderHook(() => useTestHook());

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(null);
    });

    it('should handle fetch errors correctly', async () => {
      const useTestHook = createDataFetchHook(mockFetchError, { fetchOnMount: true });
      const { result, waitForNextUpdate } = renderHook(() => useTestHook());

      await waitForNextUpdate();

      expect(mockFetchError).toHaveBeenCalledTimes(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Fetch error');
    });

    it('should refetch data when the fetch function is called manually', async () => {
      const useTestHook = createDataFetchHook(mockFetch, { fetchOnMount: false });
      const { result, waitForNextUpdate } = renderHook(() => useTestHook());

      expect(mockFetch).not.toHaveBeenCalled();

      // Manually trigger fetch
      await hookAct(async () => {
        result.current.fetch();
        await waitForNextUpdate();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockData);
    });

    it('should reset state when reset is called', async () => {
      const useTestHook = createDataFetchHook(mockFetch, { fetchOnMount: true });
      const { result, waitForNextUpdate } = renderHook(() => useTestHook());

      await waitForNextUpdate();

      expect(result.current.data).toEqual(mockData);

      // Reset the state
      hookAct(() => {
        result.current.reset();
      });

      expect(result.current.data).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastFetched).toBe(null);
    });
  });

  describe('createStateHook', () => {
    interface CounterState {
      count: number;
      lastUpdated: number | null;
    }

    const counterActions = {
      increment: (state: CounterState) => ({
        count: state.count + 1,
        lastUpdated: Date.now(),
      }),
      decrement: (state: CounterState) => ({
        count: state.count - 1,
        lastUpdated: Date.now(),
      }),
      add: (state: CounterState, amount: number) => ({
        count: state.count + amount,
        lastUpdated: Date.now(),
      }),
    };

    it('should initialize with the provided state', () => {
      const useTestHook = createStateHook<CounterState, typeof counterActions>(
        { count: 0, lastUpdated: null },
        counterActions
      );

      const { result } = renderHook(() => useTestHook());

      expect(result.current[0]).toEqual({ count: 0, lastUpdated: null });
    });

    it('should update state when actions are called', () => {
      const useTestHook = createStateHook<CounterState, typeof counterActions>(
        { count: 0, lastUpdated: null },
        counterActions
      );

      const { result } = renderHook(() => useTestHook());

      hookAct(() => {
        result.current[1].increment();
      });

      expect(result.current[0].count).toBe(1);
      expect(result.current[0].lastUpdated).not.toBeNull();

      hookAct(() => {
        result.current[1].decrement();
      });

      expect(result.current[0].count).toBe(0);
    });

    it('should accept payload in actions', () => {
      const useTestHook = createStateHook<CounterState, typeof counterActions>(
        { count: 0, lastUpdated: null },
        counterActions
      );

      const { result } = renderHook(() => useTestHook());

      hookAct(() => {
        result.current[1].add(5);
      });

      expect(result.current[0].count).toBe(5);
    });

    it('should reset state when reset is called', () => {
      const useTestHook = createStateHook<CounterState, typeof counterActions>(
        { count: 0, lastUpdated: null },
        counterActions
      );

      const { result } = renderHook(() => useTestHook());

      // Update state
      hookAct(() => {
        result.current[1].increment();
      });

      expect(result.current[0].count).toBe(1);

      // Reset
      hookAct(() => {
        result.current[1].reset();
      });

      expect(result.current[0]).toEqual({ count: 0, lastUpdated: null });
    });

    it('should persist state when persist option is true', () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      const useTestHook = createStateHook<CounterState, typeof counterActions>(
        { count: 0, lastUpdated: null },
        counterActions,
        { persist: true, persistKey: 'test-counter' }
      );

      const { result } = renderHook(() => useTestHook());

      hookAct(() => {
        result.current[1].increment();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-counter',
        expect.any(String)
      );
    });
  });

  describe('createLifecycleHook', () => {
    interface TestProps {
      id: number;
      name: string;
    }

    const onMount = jest.fn();
    const onUpdate = jest.fn();
    const onUnmount = jest.fn();
    const onError = jest.fn();

    it('should call onMount when component mounts', () => {
      const useTestHook = createLifecycleHook<TestProps>({
        onMount,
      });

      const { result } = renderHook(() => useTestHook({ id: 1, name: 'Test' }));

      expect(onMount).toHaveBeenCalledWith({ id: 1, name: 'Test' });
      expect(result.current.phase).toBe(LifecyclePhase.IDLE);
    });

    it('should call onUpdate when dependencies change', () => {
      const useTestHook = createLifecycleHook<TestProps>({
        onUpdate,
        updateDependencies: (props) => [props.id],
      });

      const { rerender } = renderHook(
        (props) => useTestHook(props),
        { initialProps: { id: 1, name: 'Test' } }
      );

      // Update with same id should not trigger onUpdate
      rerender({ id: 1, name: 'Updated' });
      expect(onUpdate).not.toHaveBeenCalled();

      // Update with different id should trigger onUpdate
      rerender({ id: 2, name: 'Updated' });
      expect(onUpdate).toHaveBeenCalledWith(
        { id: 1, name: 'Updated' },
        { id: 2, name: 'Updated' }
      );
    });

    it('should call onUnmount when component unmounts', () => {
      const useTestHook = createLifecycleHook<TestProps>({
        onUnmount,
      });

      const { unmount } = renderHook(() => useTestHook({ id: 1, name: 'Test' }));

      unmount();
      expect(onUnmount).toHaveBeenCalledWith({ id: 1, name: 'Test' });
    });

    it('should handle errors and call onError', async () => {
      const error = new Error('Test error');
      const throwingOnMount = jest.fn().mockImplementation(() => {
        throw error;
      });

      const useTestHook = createLifecycleHook<TestProps>({
        onMount: throwingOnMount,
        onError,
      });

      const { result } = renderHook(() => useTestHook({ id: 1, name: 'Test' }));

      expect(throwingOnMount).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(error, expect.any(String), { id: 1, name: 'Test' });
      expect(result.current.phase).toBe(LifecyclePhase.ERROR);
      expect(result.current.error).toBe(error);
    });

    it('should track performance when trackPerformance is true', () => {
      const useTestHook = createLifecycleHook<TestProps>({
        trackPerformance: true,
      });

      const { result } = renderHook(() => useTestHook({ id: 1, name: 'Test' }));

      expect(result.current.performance.renderCount).toBeGreaterThan(0);
      expect(result.current.performance.mountTime).not.toBeNull();
    });
  });
});