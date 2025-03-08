/**
 * D3 Drag Types
 *
 * This module provides type-safe wrappers and utilities for D3 drag behaviors.
 * It ensures proper typing for drag events, subjects, and related operations
 * while maintaining compatibility with D3's drag behavior API.
 */

import * as d3 from 'd3';
import { SimulationNodeDatum } from './D3Types';

/**
 * Type-safe drag event structure that properly extends D3's drag event
 * with generic type parameters for subject, parent data, and container element
 */
export interface TypedDragEvent<
  Datum extends object,
  ParentDatum extends object = object,
  ContainerElement extends Element = Element,
> extends d3.D3DragEvent<ContainerElement, Datum, ParentDatum> {
  // Additional type-safe properties can be added here
}

/**
 * Type-safe drag behavior configuration
 */
export interface DragBehaviorConfig<
  Datum extends object,
  ParentDatum extends object = object,
  ContainerElement extends Element = Element,
> {
  /**
   * Function called when drag starts
   */
  onDragStart?: (event: TypedDragEvent<Datum, ParentDatum, ContainerElement>) => void;

  /**
   * Function called during dragging
   */
  onDrag?: (event: TypedDragEvent<Datum, ParentDatum, ContainerElement>) => void;

  /**
   * Function called when drag ends
   */
  onDragEnd?: (event: TypedDragEvent<Datum, ParentDatum, ContainerElement>) => void;

  /**
   * Container to which the drag behavior should listen for events
   * Defaults to the window if not specified
   */
  container?: ContainerElement | null;

  /**
   * Filter function to determine if a drag should start
   * Return true to allow the drag, false to prevent it
   */
  filter?: (event: Event, datum: Datum) => boolean;

  /**
   * Whether to enable drag events on touchscreen devices
   * Defaults to true
   */
  touchable?: boolean;
}

/**
 * Creates a type-safe D3 drag behavior
 *
 * @param config Configuration for the drag behavior
 * @returns A properly typed D3 drag behavior
 */
export function createTypedDragBehavior<
  Datum extends object,
  ParentDatum extends object = object,
  ContainerElement extends Element = Element,
>(
  config: DragBehaviorConfig<Datum, ParentDatum, ContainerElement> = {}
): d3.DragBehavior<ContainerElement, Datum, ParentDatum> {
  // Create the drag behavior
  const drag = d3.drag<ContainerElement, Datum, ParentDatum>();

  // Configure drag behavior based on provided config
  if (config.onDragStart) {
    drag.on('start', config.onDragStart);
  }

  if (config.onDrag) {
    drag.on('drag', config.onDrag);
  }

  if (config.onDragEnd) {
    drag.on('end', config.onDragEnd);
  }

  if (config.container) {
    drag.container(() => config.container as ContainerElement);
  }

  if (config.filter) {
    drag.filter((event: any, d: Datum) => config.filter!(event, d));
  }

  if (config.touchable !== undefined) {
    drag.touchable(config.touchable);
  }

  return drag;
}

/**
 * Creates a drag behavior specifically for simulation nodes
 * This is particularly useful for flow diagrams or network visualizations
 *
 * @param simulation The D3 force simulation
 * @param config Additional configuration for the drag behavior
 * @returns A properly typed D3 drag behavior for simulation nodes
 */
export function createSimulationDragBehavior<
  NodeDatum extends SimulationNodeDatum,
  ContainerElement extends Element = SVGElement,
>(
  simulation: d3.Simulation<NodeDatum, undefined>,
  config: Partial<DragBehaviorConfig<NodeDatum, object, ContainerElement>> = {}
): d3.DragBehavior<ContainerElement, NodeDatum, object> {
  // Standard drag behavior for force simulations
  const handleDragStart = (event: TypedDragEvent<NodeDatum, object, ContainerElement>) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    // Fix the node position during drag
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;

    // Call custom handler if provided
    if (config.onDragStart) {
      config.onDragStart(event);
    }
  };

  const handleDrag = (event: TypedDragEvent<NodeDatum, object, ContainerElement>) => {
    // Update the fixed position to follow the pointer
    event.subject.fx = event.x;
    event.subject.fy = event.y;

    // Call custom handler if provided
    if (config.onDrag) {
      config.onDrag(event);
    }
  };

  const handleDragEnd = (event: TypedDragEvent<NodeDatum, object, ContainerElement>) => {
    if (!event.active) simulation.alphaTarget(0);
    // Release the fixed position when drag ends (unless configured otherwise)
    event.subject.fx = null;
    event.subject.fy = null;

    // Call custom handler if provided
    if (config.onDragEnd) {
      config.onDragEnd(event);
    }
  };

  // Create the drag behavior with simulation-specific defaults
  return createTypedDragBehavior<NodeDatum, object, ContainerElement>({
    onDragStart: handleDragStart,
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
    ...config,
  });
}

/**
 * Creates a custom drag behavior for visualization elements that need special handling
 *
 * @param options Custom options for specialized drag behavior
 * @returns A properly typed D3 drag behavior
 */
export function createCustomDragBehavior<
  Datum extends object,
  ParentDatum extends object = object,
  ContainerElement extends Element = Element,
>(
  options: {
    /** Maintain position relative to container */
    constrainToContainer?: boolean;
    /** Snap to grid with specified size */
    snapToGrid?: number;
    /** Only allow horizontal movement */
    horizontalOnly?: boolean;
    /** Only allow vertical movement */
    verticalOnly?: boolean;
    /** Minimum allowed position */
    minPosition?: { x?: number; y?: number };
    /** Maximum allowed position */
    maxPosition?: { x?: number; y?: number };
  } & DragBehaviorConfig<Datum, ParentDatum, ContainerElement>
): d3.DragBehavior<ContainerElement, Datum, ParentDatum> {
  // Wrap the standard drag handlers with custom behavior
  const onDrag = (event: TypedDragEvent<Datum, ParentDatum, ContainerElement>) => {
    let x = event.x;
    let y = event.y;

    // Apply custom constraints
    if (options.snapToGrid) {
      const gridSize = options.snapToGrid;
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    if (options.horizontalOnly) {
      y = (event.subject as any).y;
    }

    if (options.verticalOnly) {
      x = (event.subject as any).x;
    }

    if (options.minPosition) {
      if (options.minPosition.x !== undefined) {
        x = Math.max(x, options.minPosition.x);
      }
      if (options.minPosition.y !== undefined) {
        y = Math.max(y, options.minPosition.y);
      }
    }

    if (options.maxPosition) {
      if (options.maxPosition.x !== undefined) {
        x = Math.min(x, options.maxPosition.x);
      }
      if (options.maxPosition.y !== undefined) {
        y = Math.min(y, options.maxPosition.y);
      }
    }

    // Update event coordinates with constrained values
    event.x = x;
    event.y = y;

    // Call the original drag handler if provided
    if (options.onDrag) {
      options.onDrag(event);
    }
  };

  // Create a drag behavior with the wrapped handler
  return createTypedDragBehavior<Datum, ParentDatum, ContainerElement>({
    ...options,
    onDrag: onDrag,
  });
}

/**
 * Helper for applying a typed drag behavior to a D3 selection
 *
 * @param selection The D3 selection to apply the drag behavior to
 * @param dragBehavior The typed drag behavior to apply
 * @returns The selection with drag behavior applied
 */
export function applyDragBehavior<
  GElement extends Element,
  Datum extends object,
  PElement extends Element = Element,
  PDatum extends object = object,
>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  dragBehavior: d3.DragBehavior<Element, Datum, PDatum>
): d3.Selection<GElement, Datum, PElement, PDatum> {
  return selection.call(dragBehavior as any);
}
