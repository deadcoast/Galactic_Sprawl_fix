import * as d3 from 'd3';
import {
  createTypedTimer,
  createTypedTransition,
  TypedAnimationSequence,
  typedInterpolators,
} from '../../types/visualizations/D3AnimationTypes';

describe('D3AnimationTypes', () => {
  describe('typedInterpolators', () => {
    test('number interpolator should correctly interpolate numeric values', () => {
      const interpolator = typedInterpolators.number(0, 100);

      expect(interpolator(0)).toEqual(0);
      expect(interpolator(0.5)).toEqual(50);
      expect(interpolator(1)).toEqual(100);
    });

    test('color interpolator should correctly interpolate color values', () => {
      const interpolator = typedInterpolators.color('#ff0000', '#0000ff');

      // Test interpolated colors (format may vary slightly between D3 versions)
      const midColor = interpolator(0.5);
      expect(midColor).toMatch(/rgb\(127\.5?, 0, 127\.5?\)/);
    });

    test('date interpolator should correctly interpolate date values', () => {
      const startDate = new Date(2023, 0, 1); // Jan 1, 2023
      const endDate = new Date(2023, 0, 2); // Jan 2, 2023

      const interpolator = typedInterpolators.date(startDate, endDate);

      const midDate = interpolator(0.5);
      // Should be halfway between (12 hours later)
      expect(midDate.getTime()).toEqual(
        startDate.getTime() + (endDate.getTime() - startDate.getTime()) * 0.5
      );
    });

    test('numberArray interpolator should correctly interpolate arrays', () => {
      const interpolator = typedInterpolators.numberArray([0, 10, 20], [100, 200, 300]);

      expect(interpolator(0)).toEqual([0, 10, 20]);
      expect(interpolator(0.5)).toEqual([50, 105, 160]); // Allow for tiny floating point differences
      expect(interpolator(1)).toEqual([100, 200, 300]);
    });

    test('numberArray interpolator should throw error for mismatched arrays', () => {
      expect(() => {
        typedInterpolators.numberArray([0, 10], [100, 200, 300]);
      }).toThrow('Arrays must be of the same length');
    });

    test('object interpolator should correctly interpolate object properties', () => {
      const startObj = { x: 0, y: 0, width: 10 };
      const endObj = { x: 100, y: 50, width: 30 };

      const interpolator = typedInterpolators.object(startObj, endObj);

      expect(interpolator(0)).toEqual(startObj);
      expect(interpolator(0.5)).toEqual({ x: 50, y: 25, width: 20 });
      expect(interpolator(1)).toEqual(endObj);
    });
  });

  describe('createTypedTimer', () => {
    test('timer should be created with proper callbacks', () => {
      const mockCallback = jest.fn();
      let timer: d3.Timer;

      // Mock d3.timer
      const originalTimer = d3.timer;
      d3.timer = jest.fn(callback => {
        return {
          stop: jest.fn(),
          restart: jest.fn(),
        } as unknown as d3.Timer;
      });

      // Create timer with our utility
      timer = createTypedTimer({
        callback: mockCallback,
        delay: 100,
      });

      expect(d3.timer).toHaveBeenCalled();
      expect(timer).toBeDefined();

      // Restore original
      d3.timer = originalTimer;
    });

    test('timer should handle duration correctly', () => {
      const mockCallback = jest.fn();
      let timerCallback: (elapsed: number) => boolean;

      // Mock d3.timer to capture the callback
      const originalTimer = d3.timer;
      d3.timer = jest.fn((callback, delay) => {
        timerCallback = callback;
        return {
          stop: jest.fn(),
          restart: jest.fn(),
        } as unknown as d3.Timer;
      });

      // Create timer with duration
      createTypedTimer({
        callback: mockCallback,
        duration: 1000,
      });

      // Test the wrapped callback
      expect(timerCallback!(500)).toBe(false); // Should continue running
      expect(mockCallback).toHaveBeenCalledWith(500);

      expect(timerCallback!(1000)).toBe(true); // Should stop
      expect(mockCallback).toHaveBeenCalledWith(1000);

      // Restore original
      d3.timer = originalTimer;
    });
  });

  describe('createTypedTransition', () => {
    test('transition should be created with proper configuration', () => {
      // Mock selection
      const mockSelection = {
        transition: jest.fn(() => mockTransition),
      } as unknown as d3.Selection<SVGElement, unknown, null, undefined>;

      // Mock transition
      const mockTransition = {
        duration: jest.fn(() => mockTransition),
        delay: jest.fn(() => mockTransition),
        ease: jest.fn(() => mockTransition),
        on: jest.fn(() => mockTransition),
      } as unknown as d3.Transition<SVGElement, unknown, null, undefined>;

      // Create transition
      const transition = createTypedTransition({
        selection: mockSelection,
        duration: 500,
        easing: d3.easeBounce,
      });

      expect(mockSelection.transition).toHaveBeenCalled();
      expect(mockTransition.duration).toHaveBeenCalledWith(500);
      expect(mockTransition.ease).toHaveBeenCalled();
    });

    test('transition should handle numeric delay correctly', () => {
      // Mock selection and transition
      const mockSelection = {
        transition: jest.fn(() => mockTransition),
      } as unknown as d3.Selection<SVGElement, unknown, null, undefined>;

      const mockTransition = {
        duration: jest.fn(() => mockTransition),
        delay: jest.fn(() => mockTransition),
        ease: jest.fn(() => mockTransition),
      } as unknown as d3.Transition<SVGElement, unknown, null, undefined>;

      // Create transition with numeric delay
      createTypedTransition({
        selection: mockSelection,
        delay: 200,
      });

      expect(mockTransition.delay).toHaveBeenCalledWith(200);
    });

    test('transition should handle function delay correctly', () => {
      // Mock selection and transition
      const mockSelection = {
        transition: jest.fn(() => mockTransition),
      } as unknown as d3.Selection<SVGElement, unknown, null, undefined>;

      const mockTransition = {
        duration: jest.fn(() => mockTransition),
        delay: jest.fn(() => mockTransition),
        ease: jest.fn(() => mockTransition),
      } as unknown as d3.Transition<SVGElement, unknown, null, undefined>;

      // Create transition with function delay
      const delayFn = (d: unknown, i: number) => i * 100;
      createTypedTransition({
        selection: mockSelection,
        delay: delayFn,
      });

      expect(mockTransition.delay).toHaveBeenCalled();
    });
  });

  describe('TypedAnimationSequence', () => {
    test('animation sequence should manage transitions correctly', () => {
      // Mock selection
      const mockSelection = {
        transition: jest.fn(() => mockTransition),
      } as unknown as d3.Selection<SVGElement, unknown, null, undefined>;

      // Mock transition
      const mockTransition = {
        duration: jest.fn(() => mockTransition),
        delay: jest.fn(() => mockTransition),
        ease: jest.fn(() => mockTransition),
        on: jest.fn((type, listener) => {
          if (type === 'end') {
            // Immediately call the end listener to simulate transition completion
            listener(null as unknown as Event);
          }
          return mockTransition;
        }),
      } as unknown as d3.Transition<SVGElement, unknown, null, undefined>;

      // Mock setTimeout
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn(callback => {
        callback();
        return 0;
      });

      // Create sequence with two transitions
      const sequence = new TypedAnimationSequence({
        transitions: [{ selection: mockSelection }, { selection: mockSelection }],
        sequenceDelay: 100,
        onComplete: jest.fn(),
      });

      // Start the sequence
      sequence.start();

      // Both transitions should have been created
      expect(mockSelection.transition).toHaveBeenCalledTimes(2);
      expect(mockTransition.on).toHaveBeenCalledTimes(2);

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });

    test('animation sequence should handle looping correctly', () => {
      // Mock selection
      const mockSelection = {
        transition: jest.fn(() => mockTransition),
      } as unknown as d3.Selection<SVGElement, unknown, null, undefined>;

      // Mock transition
      const mockTransition = {
        duration: jest.fn(() => mockTransition),
        delay: jest.fn(() => mockTransition),
        ease: jest.fn(() => mockTransition),
        on: jest.fn((type, listener) => {
          if (type === 'end') {
            // Immediately call the end listener to simulate transition completion
            listener(null as unknown as Event);
          }
          return mockTransition;
        }),
      } as unknown as d3.Transition<SVGElement, unknown, null, undefined>;

      // Create sequence with looping
      const onCompleteMock = jest.fn();
      const sequence = new TypedAnimationSequence({
        transitions: [{ selection: mockSelection }],
        loop: true,
        onComplete: onCompleteMock,
      });

      // Start the sequence
      sequence.start();

      // Should loop and reset the current index
      expect(mockSelection.transition).toHaveBeenCalledTimes(2);

      // onComplete should not be called when looping
      expect(onCompleteMock).not.toHaveBeenCalled();

      // Stop the sequence
      sequence.stop();
    });
  });
});
