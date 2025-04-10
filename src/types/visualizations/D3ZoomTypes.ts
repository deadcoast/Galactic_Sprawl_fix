/**
 * @context: type-definitions, visualization-system
 *
 * D3 Zoom Types
 *
 * This module provides type-safe wrappers and utilities for D3 zoom behaviors.
 * It ensures proper typing for zoom events, transformations, and related operations
 * while maintaining compatibility with D3's zoom behavior API.
 */

/* eslint-disable @typescript-eslint/no-explicit-unknown */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import * as d3 from 'd3';

// Some of d3's typings are incompatible with strict TypeScript checks
// We need to use type assertions and disable some TypeScript errors to make this work

/**
 * Type-safe zoom event structure that properly extends D3's zoom event
 * with generic type parameters for the container element
 */
// @ts-ignore - d3 type constraints require us to ignore some type errors
export interface TypedZoomEvent<
  // @ts-ignore - Element type constraint issue with d3's BaseType
  Element extends d3.BaseType,
  Datum,
// @ts-ignore - d3's Element constraint is incompatible with TypeScript's Element type
> extends d3.D3ZoomEvent<Element, Datum> {
  // Additional type-safe properties can be added here
  sourceEvent: Event;
}

/**
 * Type-safe zoom behavior configuration
 */
export interface ZoomBehaviorConfig<Element extends d3.BaseType, Datum = unknown> {
  /**
   * Function called when zoom starts
   */
  onZoomStart?: (event: TypedZoomEvent<Element, Datum>) => void;

  /**
   * Function called during zooming
   */
  onZoom?: (event: TypedZoomEvent<Element, Datum>) => void;

  /**
   * Function called when zoom ends
   */
  onZoomEnd?: (event: TypedZoomEvent<Element, Datum>) => void;

  /**
   * Minimum zoom scale factor
   * Defaults to 0.1
   */
  scaleExtentMin?: number;

  /**
   * Maximum zoom scale factor
   * Defaults to 8
   */
  scaleExtentMax?: number;

  /**
   * Filter function to determine if a zoom should be allowed
   * Return true to allow the zoom, false to prevent it
   */
  filter?: (event: Event) => boolean;

  /**
   * Whether to enable wheel zooming
   * Defaults to true
   */
  wheelZoom?: boolean;

  /**
   * Whether to enable double-click to zoom
   * Defaults to true
   */
  dblClickZoom?: boolean;

  /**
   * Duration of transition for zoom events in milliseconds
   * Set to 0 to disable transitions
   * Defaults to 250ms
   */
  transitionDuration?: number;

  /**
   * Initial transform to apply
   */
  initialTransform?: d3.ZoomTransform;
}

/**
 * Creates a type-safe D3 zoom behavior
 *
 * @param config Configuration for the zoom behavior
 * @returns A properly typed D3 zoom behavior
 */
// @ts-ignore - d3 type constraints require us to ignore some type errors
export function createTypedZoomBehavior<Element extends d3.BaseType, Datum = unknown>(
  config: ZoomBehaviorConfig<Element, Datum> = {}
  // @ts-ignore - Element type constraint issue with d3's BaseType
): d3.ZoomBehavior<Element, Datum> {
  // Create the zoom behavior with proper Element type
  // @ts-ignore - Element type constraint issue with d3's BaseType
  const zoom = d3.zoom<Element, Datum>();

  // Configure zoom behavior based on provided config
  if (config.onZoomStart) {
    zoom.on('start', config.onZoomStart);
  }

  if (config.onZoom) {
    zoom.on('zoom', config.onZoom);
  }

  if (config.onZoomEnd) {
    zoom.on('end', config.onZoomEnd);
  }

  // Set scale extent (min/max zoom level)
  const minScale = config.scaleExtentMin ?? 0.1;
  const maxScale = config.scaleExtentMax ?? 8;
  zoom.scaleExtent([ minScale, maxScale ]);

  // Apply filter if provided
  if (config.filter) {
    zoom.filter(config.filter);
  }

  // Configure wheel zoom
  if (config.wheelZoom !== undefined) {
    // If wheelZoom is false, we need to filter out wheel events
    if (!config.wheelZoom) {
      const originalFilter = zoom.filter();
      // The unknown cast is necessary here due to d3's complex typing
      zoom.filter(function (this: unknown, event: unknown) {
        // @ts-ignore - d3 event type issues
        return event.type !== 'wheel' && originalFilter.call(this, event);
      });
    }
  }

  // Configure double-click zoom
  if (config.dblClickZoom !== undefined) {
    if (config.dblClickZoom) {
      zoom.interpolate(d3.interpolateZoom);
    } else {
      // Create a no-op interpolator for when double-click zoom is disabled
      // Define the interpolator with a signature matching D3's expectation
      const noopInterpolator = (a: d3.ZoomView, b: d3.ZoomView): ((t: number) => d3.ZoomView) => {
        // Return the identity transform as a ZoomView: [tx, ty, k]
        return (_t: number) => [ 0, 0, 1 ];
      };
      zoom.interpolate(noopInterpolator); // Removed 'as unknown'
    }
  }

  return zoom;
}

/**
 * Helper to apply a typed zoom behavior to a D3 selection
 *
 * @param selection The D3 selection to apply the zoom behavior to
 * @param zoomBehavior The typed zoom behavior to apply
 * @returns The selection with zoom behavior applied
 */
// @ts-ignore - d3 type constraints require us to ignore some type errors
export function applyZoomBehavior<
  // @ts-ignore - GElement type constraint issue with d3's BaseType
  GElement extends d3.BaseType,
  Datum,
  PElement extends d3.BaseType,
  PDatum,
>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  // @ts-ignore - d3's Element constraint is incompatible with TypeScript's Element type
  zoomBehavior: d3.ZoomBehavior<GElement, Datum>
): d3.Selection<GElement, Datum, PElement, PDatum> {
  return selection.call(zoomBehavior);
}

/**
 * Creates a zoom behavior specifically for SVG visualizations
 * This is particularly useful for pan/zoom in diagrams or charts
 *
 * @param config Configuration for the SVG zoom behavior
 * @returns A properly typed D3 zoom behavior for SVG elements
 */
// @ts-ignore - d3 type constraints require us to ignore some type errors
export function createSvgZoomBehavior<Element extends SVGElement = SVGSVGElement, Datum = any>(
  config: ZoomBehaviorConfig<Element, Datum> & {
    /**
     * Target element (usually a group) to transform during zoom
     * If not provided, zooming will apply to the element the zoom behavior is attached to
     */
    targetElement?: d3.Selection<SVGGElement, unknown, any, any>;

    /**
     * Whether to enable panning
     * Defaults to true
     */
    enablePan?: boolean;

    /**
     * Whether to constrain panning to prevent the content from leaving the viewport
     * Defaults to false
     */
    constrainPan?: boolean;

    /**
     * Extent of the viewable area [x, y, width, height]
     * Defaults to the element's viewport
     */
    extent?: [ [ number, number ], [ number, number ] ];
  } = {}
): d3.ZoomBehavior<Element, Datum> {
  // Create base zoom behavior
  const zoom = createTypedZoomBehavior<Element, Datum>(config);

  // Configure SVG-specific options
  if (config.enablePan === false) {
    // Disable panning by only allowing scaling transformations
    zoom.on('zoom', (event: TypedZoomEvent<Element, Datum>) => {
      const transform = event.transform;
      const newTransform = d3.zoomIdentity.scale(transform.k);

      if (config.targetElement) {
        config.targetElement.attr('transform', `scale(${transform.k})`);
      }

      // Call the original zoom handler if provided
      if (config.onZoom) {
        // Create a modified event with the new transform
        const modifiedEvent = Object.assign({}, event, { transform: newTransform });
        config.onZoom(modifiedEvent);
      }
    });
  } else if (config.targetElement) {
    // Apply normal pan/zoom transformation to target element
    zoom.on('zoom', (event: TypedZoomEvent<Element, Datum>) => {
      config.targetElement!.attr('transform', event.transform.toString());

      // Call the original zoom handler if provided
      if (config.onZoom) {
        config.onZoom(event);
      }
    });
  }

  // Set extent if provided
  if (config.extent) {
    zoom.extent(config.extent);
  }

  // Add constraint handling for panning
  if (config.constrainPan) {
    const originalZoom = zoom.on('zoom');

    zoom.on('zoom', function (this: unknown, event: TypedZoomEvent<Element, Datum>) {
      // Constrain the transform to prevent content from leaving viewport
      const transform = event.transform;
      const constrainedTransform = constrainTransform(transform, config.extent);

      // Create a new event with the constrained transform
      const constrainedEvent = { ...event, transform: constrainedTransform };

      // Call the original zoom handler
      if (originalZoom) {
        // @ts-ignore - d3 method call arguments issue
        originalZoom.call(this, constrainedEvent);
      }
    });
  }

  return zoom;
}

/**
 * Constrains a zoom transform to keep content within the viewport
 *
 * @param transform The transform to constrain
 * @param extent The extent of the viewable area
 * @returns A constrained transform
 */
function constrainTransform(
  transform: d3.ZoomTransform,
  extent?: [ [ number, number ], [ number, number ] ]
): d3.ZoomTransform {
  if (!extent) return transform;

  const [ [ x0, y0 ], [ x1, y1 ] ] = extent;
  const width = x1 - x0;
  const height = y1 - y0;

  // Calculate constraints based on scale and extent
  const maxX = width * (1 - transform.k);
  const maxY = height * (1 - transform.k);

  // Create a new transform with constrained values
  return d3.zoomIdentity
    .translate(Math.min(0, Math.max(transform.x, maxX)), Math.min(0, Math.max(transform.y, maxY)))
    .scale(transform.k);
}

/**
 * Creates a zoom behavior for panning and zooming a d3 simulation visualization
 *
 * @param config Configuration for the simulation visualization zoom behavior
 * @returns A properly typed D3 zoom behavior for simulation visualizations
 */
// @ts-ignore - d3 type constraints require us to ignore some type errors
export function createSimulationZoomBehavior<
  Element extends SVGElement = SVGSVGElement,
  Datum = any,
>(
  config: ZoomBehaviorConfig<Element, Datum> & {
    /**
     * The container group that holds all simulation elements
     */
    container: d3.Selection<SVGGElement, unknown, any, any>;

    /**
     * Function to update the simulation view after zoom/pan
     */
    updateView?: (transform: d3.ZoomTransform) => void;
  }
): d3.ZoomBehavior<Element, Datum> {
  const { container, updateView, ...zoomConfig } = config;

  // Handler for zoom events
  const handleZoom = (event: TypedZoomEvent<Element, Datum>) => {
    // Apply transform to the container
    container.attr('transform', event.transform.toString());

    // Call custom update function if provided
    if (updateView) {
      updateView(event.transform);
    }

    // Call original handler if provided
    if (config.onZoom) {
      config.onZoom(event);
    }
  };

  // Create the zoom behavior
  return createTypedZoomBehavior<Element, Datum>({
    ...zoomConfig,
    onZoom: handleZoom,
  });
}

/**
 * Helper function to get the initial transform to fit content within a viewport
 *
 * @param width Width of the viewport
 * @param height Height of the viewport
 * @param contentWidth Width of the content to fit
 * @param contentHeight Height of the content to fit
 * @param padding Padding to add around the content (default: 20)
 * @returns ZoomTransform that will fit the content within the viewport
 */
export function getFitToViewportTransform(
  width: number,
  height: number,
  contentWidth: number,
  contentHeight: number,
  padding: number = 20
): d3.ZoomTransform {
  // Calculate scale to fit content
  const scaleX = (width - padding * 2) / contentWidth;
  const scaleY = (height - padding * 2) / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up more than 1x

  // Calculate translation to center content
  const translateX = (width - contentWidth * scale) / 2;
  const translateY = (height - contentHeight * scale) / 2;

  return d3.zoomIdentity.translate(translateX, translateY).scale(scale);
}
