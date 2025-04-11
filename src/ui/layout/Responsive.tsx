/**
 * @context: ui-responsive-system, ui-layout-system
 *
 * Responsive layout components that show/hide content based on breakpoints
 */

import * as React from 'react';
import { Breakpoint, useBreakpoint } from '../../hooks/ui/useBreakpoint';
import { mediaQueries, useMediaQuery } from '../../hooks/ui/useMediaQuery';

/**
 * Props for responsive components
 */
interface ResponsiveProps {
  /**
   * Content to render
   */
  children: React.ReactNode;

  /**
   * Whether to render null (true) or render with display: none (false) when hidden
   * @default true
   */
  removeFromDOM?: boolean;
}

/**
 * Props for breakpoint-based responsive components
 */
interface BreakpointProps extends ResponsiveProps {
  /**
   * Breakpoint to match against
   */
  breakpoint: Breakpoint;
}

/**
 * Component that shows content only on mobile devices
 */
export const Mobile: React.FC<ResponsiveProps> = ({ children, removeFromDOM = true }) => {
  const matches = useMediaQuery(mediaQueries.mobile);

  if (!matches && removeFromDOM) {
    return null;
  }

  return <div style={{ display: matches ? 'block' : 'none' }}>{children}</div>;
};

/**
 * Component that shows content only on tablet devices
 */
export const Tablet: React.FC<ResponsiveProps> = ({ children, removeFromDOM = true }) => {
  const matches = useMediaQuery(mediaQueries.tablet);

  if (!matches && removeFromDOM) {
    return null;
  }

  return <div style={{ display: matches ? 'block' : 'none' }}>{children}</div>;
};

/**
 * Component that shows content only on desktop devices
 */
export const Desktop: React.FC<ResponsiveProps> = ({ children, removeFromDOM = true }) => {
  const matches = useMediaQuery(mediaQueries.desktop);

  if (!matches && removeFromDOM) {
    return null;
  }

  return <div style={{ display: matches ? 'block' : 'none' }}>{children}</div>;
};

/**
 * Component that shows content on devices at least at the specified breakpoint
 */
export const ScreenFrom: React.FC<BreakpointProps> = ({
  children,
  breakpoint,
  removeFromDOM = true,
}) => {
  const { isAtLeast } = useBreakpoint();
  const matches = isAtLeast(breakpoint);

  if (!matches && removeFromDOM) {
    return null;
  }

  return <div style={{ display: matches ? 'block' : 'none' }}>{children}</div>;
};

/**
 * Component that shows content on devices at most at the specified breakpoint
 */
export const ScreenTo: React.FC<BreakpointProps> = ({
  children,
  breakpoint,
  removeFromDOM = true,
}) => {
  const { isAtMost } = useBreakpoint();
  const matches = isAtMost(breakpoint);

  if (!matches && removeFromDOM) {
    return null;
  }

  return <div style={{ display: matches ? 'block' : 'none' }}>{children}</div>;
};

/**
 * Component that shows content only on devices at exactly the specified breakpoint
 */
export const ScreenOnly: React.FC<BreakpointProps> = ({
  children,
  breakpoint,
  removeFromDOM = true,
}) => {
  const { is } = useBreakpoint();
  const matches = is(breakpoint);

  if (!matches && removeFromDOM) {
    return null;
  }

  return <div style={{ display: matches ? 'block' : 'none' }}>{children}</div>;
};

/**
 * Component that shows content based on a custom media query
 */
export const MediaQuery: React.FC<ResponsiveProps & { query: string }> = ({
  children,
  query,
  removeFromDOM = true,
}) => {
  const matches = useMediaQuery(query);

  if (!matches && removeFromDOM) {
    return null;
  }

  return <div style={{ display: matches ? 'block' : 'none' }}>{children}</div>;
};

/**
 * Component that shows content only when a device has a hover capability
 */
export const WithHover: React.FC<ResponsiveProps> = ({ children, removeFromDOM = true }) => {
  const matches = useMediaQuery(mediaQueries.canHover);

  if (!matches && removeFromDOM) {
    return null;
  }

  return <div style={{ display: matches ? 'block' : 'none' }}>{children}</div>;
};

/**
 * Component that shows content only when a device has a fine pointer
 */
export const WithPointer: React.FC<ResponsiveProps> = ({ children, removeFromDOM = true }) => {
  const matches = useMediaQuery(mediaQueries.hasPointer);

  if (!matches && removeFromDOM) {
    return null;
  }

  return <div style={{ display: matches ? 'block' : 'none' }}>{children}</div>;
};

/**
 * Component that shows content only in landscape orientation
 */
export const Landscape: React.FC<ResponsiveProps> = ({ children, removeFromDOM = true }) => {
  const matches = useMediaQuery(mediaQueries.landscape);

  if (!matches && removeFromDOM) {
    return null;
  }

  return <div style={{ display: matches ? 'block' : 'none' }}>{children}</div>;
};

/**
 * Component that shows content only in portrait orientation
 */
export const Portrait: React.FC<ResponsiveProps> = ({ children, removeFromDOM = true }) => {
  const matches = useMediaQuery(mediaQueries.portrait);

  if (!matches && removeFromDOM) {
    return null;
  }

  return <div style={{ display: matches ? 'block' : 'none' }}>{children}</div>;
};
