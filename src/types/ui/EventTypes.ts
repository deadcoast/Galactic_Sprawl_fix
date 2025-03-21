/**
 * @context: ui-system, type-definitions, event-system
 * 
 * UI-specific event type definitions
 */

/**
 * UI-specific event types
 */
export enum UIEventType {
  // Theme events
  THEME_CHANGED = 'THEME_CHANGED',
  THEME_MODE_CHANGED = 'THEME_MODE_CHANGED',
  
  // Component events
  COMPONENT_MOUNTED = 'COMPONENT_MOUNTED',
  COMPONENT_UPDATED = 'COMPONENT_UPDATED',
  COMPONENT_UNMOUNTED = 'COMPONENT_UNMOUNTED',
  
  // Modal events
  MODAL_OPENED = 'MODAL_OPENED',
  MODAL_CLOSED = 'MODAL_CLOSED',
  
  // Form events
  FORM_SUBMITTED = 'FORM_SUBMITTED',
  FORM_VALIDATED = 'FORM_VALIDATED',
  FORM_VALIDATION_ERROR = 'FORM_VALIDATION_ERROR',
  FORM_RESET = 'FORM_RESET',

  // Navigation events
  NAVIGATION_STARTED = 'NAVIGATION_STARTED',
  NAVIGATION_COMPLETED = 'NAVIGATION_COMPLETED',
  NAVIGATION_FAILED = 'NAVIGATION_FAILED',
  
  // Animation events
  ANIMATION_STARTED = 'ANIMATION_STARTED',
  ANIMATION_COMPLETED = 'ANIMATION_COMPLETED',
  ANIMATION_CANCELLED = 'ANIMATION_CANCELLED',
  
  // Interaction events
  DRAG_STARTED = 'DRAG_STARTED',
  DRAG_MOVED = 'DRAG_MOVED',
  DRAG_ENDED = 'DRAG_ENDED',
  HOVER_STARTED = 'HOVER_STARTED',
  HOVER_ENDED = 'HOVER_ENDED',
  PRESS_STARTED = 'PRESS_STARTED',
  PRESS_ENDED = 'PRESS_ENDED',
  FOCUS_CHANGED = 'FOCUS_CHANGED',
  
  // UI state events
  UI_STATE_CHANGED = 'UI_STATE_CHANGED',
  UI_VIEW_CHANGED = 'UI_VIEW_CHANGED',
  UI_LAYOUT_CHANGED = 'UI_LAYOUT_CHANGED',
  UI_BREAKPOINT_CHANGED = 'UI_BREAKPOINT_CHANGED',
  
  // Notification events
  NOTIFICATION_SHOWN = 'NOTIFICATION_SHOWN',
  NOTIFICATION_HIDDEN = 'NOTIFICATION_HIDDEN',
  
  // Error events
  UI_ERROR_OCCURRED = 'UI_ERROR_OCCURRED'
}

/**
 * Base interface for all UI events
 */
export interface UIEvent {
  type: UIEventType;
  timestamp: number;
  source?: string;
  data?: Record<string, unknown>;
}

/**
 * Theme changed event data
 */
export interface ThemeChangedEvent extends UIEvent {
  type: UIEventType.THEME_CHANGED;
  data: {
    themeName: string;
    previousThemeName?: string;
  };
}

/**
 * Theme mode changed event data
 */
export interface ThemeModeChangedEvent extends UIEvent {
  type: UIEventType.THEME_MODE_CHANGED;
  data: {
    mode: 'light' | 'dark' | 'system';
    previousMode?: 'light' | 'dark' | 'system';
  };
}

/**
 * Component lifecycle event data
 */
export interface ComponentLifecycleEvent extends UIEvent {
  type: UIEventType.COMPONENT_MOUNTED | UIEventType.COMPONENT_UPDATED | UIEventType.COMPONENT_UNMOUNTED;
  data: {
    componentId: string;
    componentType: string;
    props?: Record<string, unknown>;
  };
}

/**
 * Modal event data
 */
export interface ModalEvent extends UIEvent {
  type: UIEventType.MODAL_OPENED | UIEventType.MODAL_CLOSED;
  data: {
    modalId: string;
    modalType?: string;
    params?: Record<string, unknown>;
  };
}

/**
 * Form event data
 */
export interface FormEvent extends UIEvent {
  type: UIEventType.FORM_SUBMITTED | UIEventType.FORM_VALIDATED | UIEventType.FORM_VALIDATION_ERROR | UIEventType.FORM_RESET;
  data: {
    formId: string;
    formData?: Record<string, unknown>;
    validationErrors?: Record<string, string[]>;
  };
}

/**
 * Navigation event data
 */
export interface NavigationEvent extends UIEvent {
  type: UIEventType.NAVIGATION_STARTED | UIEventType.NAVIGATION_COMPLETED | UIEventType.NAVIGATION_FAILED;
  data: {
    from?: string;
    to: string;
    params?: Record<string, unknown>;
    error?: string;
  };
}

/**
 * Animation event data
 */
export interface AnimationEvent extends UIEvent {
  type: UIEventType.ANIMATION_STARTED | UIEventType.ANIMATION_COMPLETED | UIEventType.ANIMATION_CANCELLED;
  data: {
    animationId: string;
    elementId?: string;
    animationType?: string;
    duration?: number;
  };
}

/**
 * Drag event data
 */
export interface DragEvent extends UIEvent {
  type: UIEventType.DRAG_STARTED | UIEventType.DRAG_MOVED | UIEventType.DRAG_ENDED;
  data: {
    elementId: string;
    position: { x: number; y: number };
    delta?: { x: number; y: number };
    source?: string;
    target?: string;
  };
}

/**
 * Hover event data
 */
export interface HoverEvent extends UIEvent {
  type: UIEventType.HOVER_STARTED | UIEventType.HOVER_ENDED;
  data: {
    elementId: string;
    position?: { x: number; y: number };
  };
}

/**
 * UI state changed event data
 */
export interface UIStateChangedEvent extends UIEvent {
  type: UIEventType.UI_STATE_CHANGED;
  data: {
    stateKey: string;
    oldValue?: unknown;
    newValue: unknown;
  };
}

/**
 * UI error event data
 */
export interface UIErrorEvent extends UIEvent {
  type: UIEventType.UI_ERROR_OCCURRED;
  data: {
    errorCode: string;
    message: string;
    componentId?: string;
    stack?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Notification event data
 */
export interface NotificationEvent extends UIEvent {
  type: UIEventType.NOTIFICATION_SHOWN | UIEventType.NOTIFICATION_HIDDEN;
  data: {
    notificationId: string;
    notificationType: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
  };
}

/**
 * Type guard for checking if an event is a UIEvent
 */
export function isUIEvent(event: unknown): event is UIEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'type' in event &&
    'timestamp' in event &&
    Object.values(UIEventType).includes((event as UIEvent).type)
  );
}

/**
 * Type guard for checking if an event is a theme changed event
 */
export function isThemeChangedEvent(event: UIEvent): event is ThemeChangedEvent {
  return (
    event.type === UIEventType.THEME_CHANGED &&
    event.data !== undefined &&
    typeof event.data === 'object' &&
    'themeName' in event.data
  );
}

/**
 * Type guard for checking if an event is a theme mode changed event
 */
export function isThemeModeChangedEvent(event: UIEvent): event is ThemeModeChangedEvent {
  return (
    event.type === UIEventType.THEME_MODE_CHANGED &&
    event.data !== undefined &&
    typeof event.data === 'object' &&
    'mode' in event.data
  );
}

/**
 * Type guard for checking if an event is a component lifecycle event
 */
export function isComponentLifecycleEvent(event: UIEvent): event is ComponentLifecycleEvent {
  return (
    (event.type === UIEventType.COMPONENT_MOUNTED ||
     event.type === UIEventType.COMPONENT_UPDATED ||
     event.type === UIEventType.COMPONENT_UNMOUNTED) &&
    event.data !== undefined &&
    typeof event.data === 'object' &&
    'componentId' in event.data &&
    'componentType' in event.data
  );
}

/**
 * Type guard for checking if an event is a modal event
 */
export function isModalEvent(event: UIEvent): event is ModalEvent {
  return (
    (event.type === UIEventType.MODAL_OPENED ||
     event.type === UIEventType.MODAL_CLOSED) &&
    event.data !== undefined &&
    typeof event.data === 'object' &&
    'modalId' in event.data
  );
}

/**
 * Type guard for checking if an event is a UI error event
 */
export function isUIErrorEvent(event: UIEvent): event is UIErrorEvent {
  return (
    event.type === UIEventType.UI_ERROR_OCCURRED &&
    event.data !== undefined &&
    typeof event.data === 'object' &&
    'errorCode' in event.data &&
    'message' in event.data
  );
}

/**
 * Creates a UI event with the specified type and data
 */
export function createUIEvent<T extends UIEventType>(
  type: T,
  data?: Record<string, unknown>,
  source?: string
): UIEvent {
  return {
    type,
    timestamp: Date.now(),
    source,
    data
  };
} 