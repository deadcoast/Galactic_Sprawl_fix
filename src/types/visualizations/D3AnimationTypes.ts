/**
 * D3 Animation Types
 *
 * This module provides type-safe utilities for D3 animations and transitions.
 * It ensures proper typing for animation configurations, interpolators,
 * transition states, and timing functions while maintaining compatibility
 * with D3's animation and transition APIs.
 */

import * as d3 from 'd3';

/**
 * Type definition for D3's easing functions
 */
export type EasingFn = (normalizedTime: number) => number;

/**
 * Generic animation configuration interface that can be extended for specific visualization needs
 */
export interface AnimationConfig {
  /** Duration of the animation in milliseconds */
  duration: number;
  /** Delay before starting the animation in milliseconds */
  delay?: number;
  /** Easing function to use for the animation */
  easing?: EasingFn;
  /** Whether the animation should loop */
  loop?: boolean;
  /** Delay between each iteration when looping */
  loopDelay?: number;
  /** Number of times to loop (undefined for infinite) */
  loopCount?: number;
}

/**
 * Transition state interface to track and type transition states
 */
export interface TransitionState<T> {
  /** Start value for the transition */
  startValue: T;
  /** End value for the transition */
  endValue: T;
  /** Current value during the transition */
  currentValue: T;
  /** Progress of the transition (0 to 1) */
  progress: number;
  /** Whether the transition is complete */
  isComplete: boolean;
  /** The timestamp when the transition started */
  startTime: number;
  /** The timestamp when the transition completed or is expected to complete */
  endTime: number;
}

/**
 * Typed interpolator function for smooth transitions between values
 */
export type TypedInterpolator<T> = (t: number) => T;

/**
 * Type-safe wrapper for d3.interpolate functions
 */
export const typedInterpolators = {
  /**
   * Creates a typed interpolator for numeric values
   *
   * @param a Start value
   * @param b End value
   * @returns A typed interpolator function
   */
  number: (a: number, b: number): TypedInterpolator<number> => {
    return d3.interpolateNumber(a, b);
  },

  /**
   * Creates a typed interpolator for color values
   *
   * @param a Start color
   * @param b End color
   * @returns A typed interpolator function
   */
  color: (a: string, b: string): TypedInterpolator<string> => {
    return d3.interpolateRgb(a, b);
  },

  /**
   * Creates a typed interpolator for dates
   *
   * @param a Start date
   * @param b End date
   * @returns A typed interpolator function
   */
  date: (a: Date, b: Date): TypedInterpolator<Date> => {
    const interpolator = d3.interpolateNumber(a.getTime(), b.getTime());
    return (t: number) => new Date(interpolator(t));
  },

  /**
   * Creates a typed interpolator for arrays of numbers
   *
   * @param a Start array
   * @param b End array
   * @returns A typed interpolator function
   */
  numberArray: (a: number[], b: number[]): TypedInterpolator<number[]> => {
    // Ensure arrays are of the same length
    if (a.length !== b.length) {
      throw new Error('Arrays must be of the same length for interpolation');
    }

    const interpolators = a.map((value, index) => d3.interpolateNumber(value, b[index]));

    return (t: number) => interpolators.map(interp => interp(t));
  },

  /**
   * Creates a typed interpolator for objects
   *
   * @param a Start object
   * @param b End object
   * @returns A typed interpolator function
   */
  object: <T extends Record<string, number>>(a: T, b: T): TypedInterpolator<T> => {
    const keys = Object.keys(a) as (keyof T)[];
    const interpolators = {} as Record<keyof T, (t: number) => number>;

    keys.forEach(key => {
      if (typeof a[key] === 'number' && typeof b[key] === 'number') {
        interpolators[key] = d3.interpolateNumber(a[key] as number, b[key] as number);
      }
    });

    return (t: number) => {
      const result = { ...a };
      keys.forEach(key => {
        if (interpolators[key]) {
          result[key] = interpolators[key](t) as T[keyof T];
        }
      });
      return result;
    };
  },
};

/**
 * Type-safe wrapper for d3.timer with proper configuration
 */
export interface TimerConfig {
  /** Callback function that runs on each tick */
  callback: (elapsed: number) => void;
  /** Delay before starting the timer in milliseconds */
  delay?: number;
  /** Total duration of the timer in milliseconds */
  duration?: number;
  /** Whether the timer should stop when the callback returns true */
  stopOnCallback?: boolean;
}

/**
 * Creates a type-safe D3 timer
 *
 * @param config Timer configuration
 * @returns A timer object with proper methods
 */
export function createTypedTimer(config: TimerConfig): d3.Timer {
  const { callback, delay = 0, stopOnCallback = true } = config;

  if (config.duration !== undefined) {
    const wrappedCallback = (elapsed: number) => {
      callback(elapsed);
      // Stop the timer when duration is reached
      if (elapsed >= config.duration!) {
        return true;
      }
      return false;
    };

    return d3.timer(wrappedCallback, delay);
  }

  return d3.timer(
    stopOnCallback
      ? callback
      : elapsed => {
          callback(elapsed);
          return false;
        },
    delay
  );
}

/**
 * Transition configuration with type safety
 */
export interface TransitionConfig<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
> {
  /** The selection to apply the transition to */
  selection: d3.Selection<GElement, Datum, PElement, PDatum>;
  /** Duration of the transition in milliseconds */
  duration?: number;
  /** Delay before starting the transition in milliseconds */
  delay?: number | ((d: Datum, i: number, data: GElement[]) => number);
  /** Easing function to use for the transition */
  easing?: EasingFn;
  /** Name for the transition (useful for synchronizing transitions) */
  name?: string;
}

/**
 * Creates a type-safe transition with proper configuration
 *
 * @param config Transition configuration
 * @returns A configured transition
 */
export function createTypedTransition<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(
  config: TransitionConfig<GElement, Datum, PElement, PDatum>
): d3.Transition<GElement, Datum, PElement, PDatum> {
  const { selection, duration = 250, easing = d3.easeCubic, name } = config;

  let transition = name ? selection.transition(name) : selection.transition();

  transition = transition.duration(duration);

  // Apply delay if provided
  if (config.delay !== undefined) {
    if (typeof config.delay === 'number') {
      transition = transition.delay(config.delay);
    } else {
      transition = transition.delay(config.delay as d3.ValueFn<GElement, Datum, number>);
    }
  }

  // Apply easing function
  return transition.ease(easing as unknown as (t: number) => number);
}

/**
 * Animation sequence for coordinating multiple transitions
 */
export interface AnimationSequence<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
> {
  /** Sequence of transition configurations to execute in order */
  transitions: TransitionConfig<GElement, Datum, PElement, PDatum>[];
  /** Delay between transitions in milliseconds */
  sequenceDelay?: number;
  /** Whether the sequence should loop */
  loop?: boolean;
  /** Callback when the sequence completes */
  onComplete?: () => void;
}

/**
 * Manages a sequence of animations with proper type safety
 */
export class TypedAnimationSequence<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
> {
  private config: AnimationSequence<GElement, Datum, PElement, PDatum>;
  private currentIndex = 0;
  private isPlaying = false;

  /**
   * Creates a new animation sequence
   *
   * @param config The animation sequence configuration
   */
  constructor(config: AnimationSequence<GElement, Datum, PElement, PDatum>) {
    this.config = config;
  }

  /**
   * Starts the animation sequence
   */
  public start(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentIndex = 0;
    this.playNext();
  }

  /**
   * Stops the animation sequence
   */
  public stop(): void {
    this.isPlaying = false;
  }

  /**
   * Plays the next transition in the sequence
   */
  private playNext(): void {
    if (!this.isPlaying) return;

    if (this.currentIndex >= this.config.transitions.length) {
      if (this.config.loop) {
        this.currentIndex = 0;
        setTimeout(() => this.playNext(), this.config.sequenceDelay ?? 0);
      } else {
        this.isPlaying = false;
        if (this.config.onComplete) {
          this.config.onComplete();
        }
      }
      return;
    }

    const transitionConfig = this.config.transitions[this.currentIndex];
    const transition = createTypedTransition(transitionConfig);

    transition.on('end', () => {
      this.currentIndex++;
      setTimeout(() => this.playNext(), this.config.sequenceDelay ?? 0);
    });
  }
}
