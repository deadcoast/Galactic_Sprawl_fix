/**
 * @context: type-definitions, visualization-system
 * @description: Type-safe D3 selection utilities
 * @file: src/types/visualizations/D3SelectionTypes.ts
 *
 * This module provides type-safe wrappers and utilities for D3 selections.
 * It ensures proper typing for selection operations, data binding, and DOM manipulations
 * while maintaining compatibility with D3's selection API.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// D3's complex typings require using 'any' in some places to bridge the gap
// between D3's native API and our type-safe wrappers

import * as d3 from 'd3';

// Define a local EasingFn type since d3 doesn't export it directly
type EasingFn = (normalizedTime: number) => number;

/**
 * Type definitions for D3 function value parameters
 */
type D3ValueFn<GElement, Datum, Result> = (
  this: GElement,
  datum: Datum,
  index: number,
  groups: GElement[] | d3.ArrayLike<GElement>
) => Result;

// This type is not currently used but kept for future reference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type D3KeyFn<Datum> = (datum: Datum, index: number, groups: Datum[]) => string;

/**
 * Type-safe selection creator for SVG elements
 *
 * @param selector CSS selector string
 * @returns A properly typed D3 selection
 */
export function selectSvg(
  selector: string
): d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown> {
  return d3.select<SVGSVGElement, unknown>(selector);
}

/**
 * Type-safe selection creator for SVG group elements
 *
 * @param selector CSS selector string
 * @returns A properly typed D3 selection
 */
export function selectGroup(
  selector: string
): d3.Selection<SVGGElement, unknown, HTMLElement, unknown> {
  return d3.select<SVGGElement, unknown>(selector);
}

/**
 * Type-safe selection creator for any SVG element
 *
 * @param selector CSS selector string
 * @returns A properly typed D3 selection
 */
export function selectSvgElement<E extends SVGElement>(
  selector: string
): d3.Selection<E, unknown, HTMLElement, unknown> {
  return d3.select<E, unknown>(selector);
}

/**
 * Type-safe selection creator for HTML elements
 *
 * @param selector CSS selector string
 * @returns A properly typed D3 selection
 */
export function selectHtmlElement<E extends HTMLElement>(
  selector: string
): d3.Selection<E, unknown, HTMLElement, unknown> {
  return d3.select<E, unknown>(selector);
}

/**
 * Type-safe selection creator for multiple elements
 *
 * @param selector CSS selector string
 * @returns A properly typed D3 selection
 */
export function selectAllSvg(
  selector: string
): d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown> {
  return d3.selectAll<SVGSVGElement, unknown>(selector);
}

/**
 * Type-safe selection creator for multiple SVG group elements
 *
 * @param selector CSS selector string
 * @returns A properly typed D3 selection
 */
export function selectAllGroups(
  selector: string
): d3.Selection<SVGGElement, unknown, HTMLElement, unknown> {
  return d3.selectAll<SVGGElement, unknown>(selector);
}

/**
 * Type-safe selection creator for any multiple SVG elements
 *
 * @param selector CSS selector string
 * @returns A properly typed D3 selection
 */
export function selectAllSvgElements<E extends SVGElement>(
  selector: string
): d3.Selection<E, unknown, HTMLElement, unknown> {
  return d3.selectAll<E, unknown>(selector);
}

/**
 * Type-safe data binding for selections
 *
 * @param selection The D3 selection to bind data to
 * @param data Array of data items to bind
 * @param key Data join key function or string
 * @returns A properly typed update selection
 */
export function bindData<GElement extends Element, Datum, PElement extends Element, PDatum>(
  selection: d3.Selection<GElement, PDatum, PElement, unknown>,
  data: Datum[],
  key?: ((datum: Datum, index: number, groups: Datum[]) => string) | string
): d3.Selection<GElement, Datum, PElement, PDatum> {
  // D3 has very complex typings that are hard to satisfy without 'any'
  return selection.data(data, key as any);
}

/**
 * Type-safe join operation for selections
 *
 * @param selection The D3 selection to perform join on
 * @param elementType Tag name for new elements
 * @param enter Function to handle enter selection
 * @param update Function to handle update selection
 * @param exit Function to handle exit selection
 * @returns A merged selection
 */
export function joinElements<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
  NewElement extends Element,
>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  elementType: string,
  enter?: (
    selection: d3.Selection<d3.EnterElement, Datum, PElement, PDatum>
  ) => d3.Selection<NewElement, Datum, PElement, PDatum>,
  update?: (
    selection: d3.Selection<GElement, Datum, PElement, PDatum>
  ) => d3.Selection<GElement, Datum, PElement, PDatum>,
  exit?: (selection: d3.Selection<GElement, Datum, PElement, PDatum>) => void
): d3.Selection<Element, Datum, PElement, PDatum> {
  // Use simpler implementation with type assertions where needed
  // D3 join uses complex typings that are difficult to satisfy without 'any'
  const joined = selection.join(elementType) as any;

  if (enter && selection.enter().size()) {
    enter(selection.enter());
  }

  if (update) {
    update(selection);
  }

  if (exit && selection.exit().size()) {
    // D3's exit selection has complex typings that require using any
    exit(selection.exit() as any);
  }

  return joined;
}

/**
 * Type-safe attribute setter for selections
 *
 * @param selection The D3 selection to set attributes on
 * @param attributes Object containing attribute name-value pairs
 * @returns The selection with attributes applied
 */
export function setAttributes<GElement extends Element, Datum, PElement extends Element, PDatum>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  attributes: Record<
    string,
    string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
  >
): d3.Selection<GElement, Datum, PElement, PDatum> {
  Object.entries(attributes).forEach(([key, value]) => {
    if (typeof value === 'function') {
      selection.attr(key, value as (d: Datum, i: number) => string);
    } else {
      selection.attr(key, value as string);
    }
  });

  return selection;
}

/**
 * Type-safe style setter for selections
 *
 * @param selection The D3 selection to set styles on
 * @param styles Object containing style name-value pairs
 * @returns The selection with styles applied
 */
export function setStyles<GElement extends Element, Datum, PElement extends Element, PDatum>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  styles: Record<
    string,
    string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
  >
): d3.Selection<GElement, Datum, PElement, PDatum> {
  Object.entries(styles).forEach(([key, value]) => {
    if (typeof value === 'function') {
      selection.style(key, value as (d: Datum, i: number) => string);
    } else {
      selection.style(key, value as string);
    }
  });

  return selection;
}

/**
 * Type-safe append operation for selections
 *
 * @param selection The D3 selection to append to
 * @param elementType Type of element to append
 * @returns A selection of the newly appended elements
 */
export function appendElement<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
  NewElement extends Element,
>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  elementType: string
): d3.Selection<NewElement, Datum, PElement, PDatum> {
  return selection.append<NewElement>(elementType);
}

/**
 * Type-safe event handler attachment for selections
 *
 * @param selection The D3 selection to attach event handlers to
 * @param eventType Type of event to listen for
 * @param listener Event listener function
 * @returns The selection with event handler attached
 */
export function addEventHandler<GElement extends Element, Datum, PElement extends Element, PDatum>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  eventType: string,
  listener: (event: Event, d: Datum, i: number, g: GElement[]) => void
): d3.Selection<GElement, Datum, PElement, PDatum> {
  // D3 has complex event handler typings that are hard to satisfy with exact types
  // Using any is required to bridge the gap between D3's API and our custom interface
  return selection.on(eventType, function (this: GElement, event: Event, d: Datum) {
    const i = d3.select(this).attr('data-index') ? +d3.select(this).attr('data-index')! : 0;
    const g = [this] as GElement[];
    listener(event, d, i, g);
  } as any);
}

/**
 * Type-safe transition creator for selections
 *
 * @param selection The D3 selection to create a transition on
 * @param name Optional name for the transition
 * @returns A properly typed transition
 */
export function createTransition<GElement extends Element, Datum, PElement extends Element, PDatum>(
  selection: d3.Selection<GElement, Datum, PElement, PDatum>,
  name?: string
): d3.Transition<GElement, Datum, PElement, PDatum> {
  return name ? selection.transition(name) : selection.transition();
}

/**
 * Creates a fluent selection builder for easier method chaining
 *
 * @param selection The D3 selection to wrap
 * @returns A selection builder with fluent interface
 */
export function createSelectionBuilder<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(selection: d3.Selection<GElement, Datum, PElement, PDatum>) {
  return {
    /**
     * Original selection
     */
    selection,

    /**
     * Set an attribute
     */
    attr(
      key: string,
      value: string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
    ) {
      selection.attr(
        key,
        value as unknown as D3ValueFn<GElement, Datum, string | number | boolean | null>
      );
      return this;
    },

    /**
     * Set multiple attributes
     */
    attrs(
      attributes: Record<
        string,
        string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
      >
    ) {
      setAttributes(selection, attributes);
      return this;
    },

    /**
     * Set a style
     */
    style(
      key: string,
      value: string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
    ) {
      selection.style(
        key,
        value as unknown as D3ValueFn<GElement, Datum, string | number | boolean | null>
      );
      return this;
    },

    /**
     * Set multiple styles
     */
    styles(
      styles: Record<
        string,
        string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
      >
    ) {
      setStyles(selection, styles);
      return this;
    },

    /**
     * Set text content
     */
    text(value: string | ((d: Datum, i: number) => string)) {
      selection.text(value as unknown as D3ValueFn<GElement, Datum, string | null>);
      return this;
    },

    /**
     * Set HTML content
     */
    html(value: string | ((d: Datum, i: number) => string)) {
      selection.html(value as unknown as D3ValueFn<GElement, Datum, string | null>);
      return this;
    },

    /**
     * Append a new element
     */
    append<NewElement extends Element>(elementType: string) {
      const newSelection = appendElement<GElement, Datum, PElement, PDatum, NewElement>(
        selection,
        elementType
      );
      return createSelectionBuilder(newSelection);
    },

    /**
     * Add an event handler
     */
    on(eventType: string, listener: (event: Event, d: Datum, i: number, g: GElement[]) => void) {
      // D3 has complex event handler typings that are hard to satisfy with exact types
      // Using any is required to bridge the gap between D3's API and our custom interface
      selection.on(eventType, function (this: GElement, event: Event, d: Datum) {
        const i = d3.select(this).attr('data-index') ? +d3.select(this).attr('data-index')! : 0;
        const g = [this] as GElement[];
        listener(event, d, i, g);
      } as any);
      return this;
    },

    /**
     * Create a transition
     */
    transition(name?: string) {
      const trans = createTransition(selection, name);
      return createTransitionBuilder(trans);
    },

    /**
     * Filter selection
     */
    filter(filterFn: (d: Datum, i: number) => boolean) {
      const filtered = selection.filter(filterFn);
      return createSelectionBuilder(filtered);
    },

    /**
     * Bind data to selection
     */
    data<NewDatum>(
      data: NewDatum[],
      key?: ((datum: NewDatum, index: number, groups: NewDatum[]) => string) | string
    ) {
      const dataSelection = bindData<GElement, NewDatum, PElement, PDatum>(
        selection as unknown as d3.Selection<GElement, PDatum, PElement, unknown>,
        data,
        key
      );
      return createSelectionBuilder(dataSelection);
    },

    /**
     * Select parent element
     */
    parent() {
      // Since we can't directly type parent node selection properly,
      // use a workaround by selecting the parent using DOM API
      const parentElements = Array.from(selection.nodes())
        .map(node => node.parentElement)
        .filter(Boolean) as Element[];

      // Create a new selection from these elements
      if (parentElements.length > 0) {
        const parentSelection = d3.selectAll(parentElements) as unknown as d3.Selection<
          GElement,
          PDatum,
          PElement,
          unknown
        >;
        return createSelectionBuilder(
          parentSelection as unknown as d3.Selection<GElement, Datum, PElement, PDatum>
        );
      }

      // Return empty selection if no parent elements
      return createSelectionBuilder(selection.filter(() => false));
    },

    /**
     * Join elements
     */
    join<NewElement extends Element>(
      elementType: string,
      enter?: (
        selection: d3.Selection<d3.EnterElement, Datum, PElement, PDatum>
      ) => d3.Selection<NewElement, Datum, PElement, PDatum>,
      update?: (
        selection: d3.Selection<GElement, Datum, PElement, PDatum>
      ) => d3.Selection<GElement, Datum, PElement, PDatum>,
      exit?: (selection: d3.Selection<GElement, Datum, PElement, PDatum>) => void
    ) {
      const joinedSelection = joinElements<GElement, Datum, PElement, PDatum, NewElement>(
        selection,
        elementType,
        enter,
        update,
        exit
      );
      return createSelectionBuilder(joinedSelection);
    },

    /**
     * Call a function with the selection
     */
    call(fn: (selection: d3.Selection<GElement, Datum, PElement, PDatum>) => void) {
      selection.call(fn);
      return this;
    },
  };
}

/**
 * Creates a fluent transition builder for easier method chaining
 */
export function createTransitionBuilder<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(transition: d3.Transition<GElement, Datum, PElement, PDatum>) {
  return {
    /**
     * Original transition
     */
    transition,

    /**
     * Set transition duration
     */
    duration(milliseconds: number) {
      transition.duration(milliseconds);
      return this;
    },

    /**
     * Set transition delay
     */
    delay(milliseconds: number | ((d: Datum, i: number) => number)) {
      transition.delay(milliseconds as unknown as D3ValueFn<GElement, Datum, number>);
      return this;
    },

    /**
     * Set transition easing function
     */
    ease(easingFn: EasingFn) {
      transition.ease(easingFn);
      return this;
    },

    /**
     * Set attribute with transition
     */
    attr(
      key: string,
      value: string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
    ) {
      transition.attr(
        key,
        value as unknown as D3ValueFn<GElement, Datum, string | number | boolean | null>
      );
      return this;
    },

    /**
     * Set style with transition
     */
    style(
      key: string,
      value: string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
    ) {
      transition.style(
        key,
        value as unknown as D3ValueFn<GElement, Datum, string | number | boolean | null>
      );
      return this;
    },

    /**
     * Add transition event handler
     */
    on(eventType: 'start' | 'end' | 'interrupt', listener: (event: Event, d: Datum) => void) {
      // Cast to compatible function that D3 expects
      transition.on(eventType, listener as unknown as D3ValueFn<GElement, Datum, void>);
      return this;
    },

    /**
     * Call a function with the transition
     */
    call(fn: (transition: d3.Transition<GElement, Datum, PElement, PDatum>) => void) {
      transition.call(fn);
      return this;
    },
  };
}

/**
 * Creates a type-safe selection for a new SVG element
 *
 * @param parent The parent element to append the SVG to
 * @param width Width of the SVG
 * @param height Height of the SVG
 * @returns A selection builder for the new SVG
 */
export function createSvg(
  parent: string | d3.Selection<HTMLElement, unknown, HTMLElement, unknown>,
  width: number,
  height: number
) {
  const parentSelection =
    typeof parent === 'string' ? d3.select<HTMLElement, unknown>(parent) : parent;

  const svg = parentSelection
    .append<SVGSVGElement>('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  return createSelectionBuilder(svg);
}

/**
 * Creates a defs element for SVG definitions like markers, patterns, etc.
 *
 * @param svg The SVG element to append defs to
 * @returns A selection of the defs element
 */
export function createDefs(svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>) {
  return svg.append<SVGDefsElement>('defs');
}

/**
 * Creates a marker definition for arrow heads etc.
 *
 * @param defs The defs element to append the marker to
 * @param id Unique ID for the marker
 * @param options Configuration options for the marker
 * @returns A selection of the marker element
 */
export function createMarker(
  defs: d3.Selection<SVGDefsElement, unknown, HTMLElement, unknown>,
  id: string,
  options: {
    width?: number;
    height?: number;
    refX?: number;
    refY?: number;
    viewBox?: string;
    orient?: string;
    path?: string;
    color?: string;
  } = {}
) {
  const {
    width = 10,
    height = 10,
    refX = 5,
    refY = 5,
    viewBox = '0 0 10 10',
    orient = 'auto',
    path = 'M0,0L10,5L0,10z',
    color = 'black',
  } = options;

  const marker = defs
    .append<SVGMarkerElement>('marker')
    .attr('id', id)
    .attr('markerWidth', width)
    .attr('markerHeight', height)
    .attr('refX', refX)
    .attr('refY', refY)
    .attr('viewBox', viewBox)
    .attr('orient', orient)
    .attr('markerUnits', 'userSpaceOnUse');

  marker.append<SVGPathElement>('path').attr('d', path).attr('fill', color);

  return marker;
}
