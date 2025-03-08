/**
 * D3 Selection Types
 *
 * This module provides type-safe wrappers and utilities for D3 selections.
 * It ensures proper typing for selection operations, data binding, and DOM manipulations
 * while maintaining compatibility with D3's selection API.
 */

import * as d3 from 'd3';

/**
 * Type-safe selection creator for SVG elements
 *
 * @param selector CSS selector string
 * @returns A properly typed D3 selection
 */
export function selectSvg(
  selector: string
): d3.Selection<SVGSVGElement, unknown, HTMLElement, any> {
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
): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
  return d3.select<SVGGElement, unknown>(selector);
}

/**
 * Type-safe selection creator for any SVG element
 *
 * @param selector CSS selector string
 * @param elementType Type of SVG element to select
 * @returns A properly typed D3 selection
 */
export function selectSvgElement<E extends SVGElement>(
  selector: string,
  elementType: new () => E
): d3.Selection<E, unknown, HTMLElement, any> {
  return d3.select<E, unknown>(selector);
}

/**
 * Type-safe selection creator for HTML elements
 *
 * @param selector CSS selector string
 * @param elementType Type of HTML element to select
 * @returns A properly typed D3 selection
 */
export function selectHtmlElement<E extends HTMLElement>(
  selector: string,
  elementType: new () => E
): d3.Selection<E, unknown, HTMLElement, any> {
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
): d3.Selection<SVGSVGElement, unknown, HTMLElement, any> {
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
): d3.Selection<SVGGElement, unknown, HTMLElement, any> {
  return d3.selectAll<SVGGElement, unknown>(selector);
}

/**
 * Type-safe selection creator for any multiple SVG elements
 *
 * @param selector CSS selector string
 * @param elementType Type of SVG element to select
 * @returns A properly typed D3 selection
 */
export function selectAllSvgElements<E extends SVGElement>(
  selector: string,
  elementType: new () => E
): d3.Selection<E, unknown, HTMLElement, any> {
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
  selection: d3.Selection<GElement, PDatum, PElement, any>,
  data: Datum[],
  key?: ((datum: Datum, index: number, groups: Datum[]) => string) | string
): d3.Selection<GElement, Datum, PElement, PDatum> {
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
): d3.Selection<NewElement | GElement, Datum, PElement, PDatum> {
  return selection.join(elementType, enter as any, update, exit) as d3.Selection<
    NewElement | GElement,
    Datum,
    PElement,
    PDatum
  >;
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
  return selection.on(eventType, listener);
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
 * Creates a typed builder for D3 selections to enable fluent chaining of operations
 *
 * @param selection The D3 selection to wrap
 * @returns A builder object with fluent methods
 */
export function createSelectionBuilder<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(selection: d3.Selection<GElement, Datum, PElement, PDatum>) {
  return {
    /**
     * The underlying D3 selection
     */
    selection,

    /**
     * Sets attributes on the selection
     */
    attr(
      key: string,
      value: string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
    ) {
      selection.attr(key, value as any);
      return this;
    },

    /**
     * Sets multiple attributes from an object
     */
    attrs(
      attributes: Record<
        string,
        string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
      >
    ) {
      return setAttributes(selection, attributes), this;
    },

    /**
     * Sets a style property on the selection
     */
    style(
      key: string,
      value: string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
    ) {
      selection.style(key, value as any);
      return this;
    },

    /**
     * Sets multiple style properties from an object
     */
    styles(
      styles: Record<
        string,
        string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
      >
    ) {
      return setStyles(selection, styles), this;
    },

    /**
     * Sets text content on the selection
     */
    text(value: string | ((d: Datum, i: number) => string)) {
      selection.text(value as any);
      return this;
    },

    /**
     * Sets HTML content on the selection
     */
    html(value: string | ((d: Datum, i: number) => string)) {
      selection.html(value as any);
      return this;
    },

    /**
     * Appends a new element to each element in the selection
     */
    append<NewElement extends Element>(elementType: string) {
      const newSelection = appendElement<GElement, Datum, PElement, PDatum, NewElement>(
        selection,
        elementType
      );
      return createSelectionBuilder(newSelection);
    },

    /**
     * Adds an event listener to the selection
     */
    on(eventType: string, listener: (event: Event, d: Datum, i: number, g: GElement[]) => void) {
      selection.on(eventType, listener);
      return this;
    },

    /**
     * Creates a transition on the selection
     */
    transition(name?: string) {
      const transition = createTransition(selection, name);
      return createTransitionBuilder(transition);
    },

    /**
     * Filters the selection
     */
    filter(filterFn: (d: Datum, i: number) => boolean) {
      const filtered = selection.filter(filterFn);
      return createSelectionBuilder(filtered);
    },

    /**
     * Binds new data to the selection
     */
    data<NewDatum>(
      data: NewDatum[],
      key?: ((datum: NewDatum, index: number, groups: NewDatum[]) => string) | string
    ) {
      const newSelection = bindData<GElement, NewDatum, PElement, PDatum>(
        selection as any,
        data,
        key
      );
      return createSelectionBuilder(newSelection);
    },

    /**
     * Joins data with elements
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
      const joined = joinElements<GElement, Datum, PElement, PDatum, NewElement>(
        selection,
        elementType,
        enter,
        update,
        exit
      );
      return createSelectionBuilder(joined);
    },

    /**
     * Calls a function with the selection
     */
    call(fn: (selection: d3.Selection<GElement, Datum, PElement, PDatum>) => void) {
      selection.call(fn);
      return this;
    },
  };
}

/**
 * Creates a typed builder for D3 transitions to enable fluent chaining of operations
 *
 * @param transition The D3 transition to wrap
 * @returns A builder object with fluent methods
 */
export function createTransitionBuilder<
  GElement extends Element,
  Datum,
  PElement extends Element,
  PDatum,
>(transition: d3.Transition<GElement, Datum, PElement, PDatum>) {
  return {
    /**
     * The underlying D3 transition
     */
    transition,

    /**
     * Sets the duration of the transition
     */
    duration(milliseconds: number) {
      transition.duration(milliseconds);
      return this;
    },

    /**
     * Sets the delay of the transition
     */
    delay(milliseconds: number | ((d: Datum, i: number) => number)) {
      transition.delay(milliseconds as any);
      return this;
    },

    /**
     * Sets the easing function of the transition
     */
    ease(easingFn: d3.EasingFn) {
      transition.ease(easingFn);
      return this;
    },

    /**
     * Sets an attribute with a transition
     */
    attr(
      key: string,
      value: string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
    ) {
      transition.attr(key, value as any);
      return this;
    },

    /**
     * Sets a style property with a transition
     */
    style(
      key: string,
      value: string | number | boolean | ((d: Datum, i: number) => string | number | boolean)
    ) {
      transition.style(key, value as any);
      return this;
    },

    /**
     * Adds an event listener for transition events
     */
    on(eventType: 'start' | 'end' | 'interrupt', listener: (event: Event, d: Datum) => void) {
      transition.on(eventType, listener);
      return this;
    },

    /**
     * Calls a function with the transition
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
  parent: string | d3.Selection<HTMLElement, unknown, HTMLElement, any>,
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
export function createDefs(svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>) {
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
  defs: d3.Selection<SVGDefsElement, unknown, HTMLElement, any>,
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
