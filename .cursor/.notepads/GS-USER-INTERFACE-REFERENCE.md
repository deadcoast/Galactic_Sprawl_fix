# GALACTIC SPRAWL (GS) - User Interface Reference

## Overview
This document defines the user interface (UI) system implementation patterns, component hierarchies, and best practices used throughout the Galactic Sprawl codebase. Following these patterns ensures consistent UI behavior, styling, and user experience across the application.

## UI Component Types

### Core UI Components

```typescript
/**
 * Base button component that provides consistent styling and behavior
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * Modal component for displaying content over the current view
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: React.ReactNode;
}

/**
 * Form input component with consistent styling and validation
 */
export interface InputProps {
  type?: 'text' | 'number' | 'password' | 'email';
  value: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  min?: number;
  max?: number;
}
```

### Visualization Components

```typescript
/**
 * Base chart component interface
 */
export interface ChartProps {
  data: ChartData;
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  colors?: string[];
  backgroundColor?: string;
  animated?: boolean;
  responsive?: boolean;
  threshold?: number;
  onClick?: (data: DataPoint) => void;
}

/**
 * Resource flow visualization component
 */
export interface ResourceFlowProps {
  nodes: FlowNode[];
  connections: FlowConnection[];
  width?: number;
  height?: number;
  interactive?: boolean;
  showLabels?: boolean;
  selectedResourceTypes?: ResourceType[];
  onNodeClick?: (node: FlowNode) => void;
  onConnectionClick?: (connection: FlowConnection) => void;
}
```

## UI Component Hierarchies

### Component Organization Pattern

UI components should follow a hierarchical organization pattern:

1. **Atomic Components**
   - Basic UI elements that can't be broken down further
   - Examples: Button, Input, Card, Icon

2. **Molecular Components**
   - Combinations of atomic components that form a functional unit
   - Examples: FormField, SearchBar, ResourceDisplay

3. **Organism Components**
   - Complex UI sections composed of multiple molecular components
   - Examples: NavigationPanel, ResourceManagementPanel, ModuleControlPanel

4. **Template Components**
   - Page-level components that define layout structure
   - Examples: DashboardTemplate, ManagementTemplate, AnalysisTemplate

5. **Page Components**
   - Complete page implementations using templates and filling with organisms
   - Examples: ResourceDashboardPage, ModuleManagementPage

### Component Directory Structure

```
src/
├── components/
│   ├── ui/              # Atomic components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── forms/           # Form-specific components
│   │   ├── FormField.tsx
│   │   ├── FieldGroup.tsx
│   │   └── ...
│   ├── layouts/         # Layout components
│   │   ├── MainLayout.tsx
│   │   ├── SidebarLayout.tsx
│   │   └── ...
│   ├── resources/       # Resource-related components
│   │   ├── ResourceDisplay.tsx
│   │   ├── ResourceList.tsx
│   │   └── ...
│   ├── visualizations/  # Visualization components
│   │   ├── charts/
│   │   ├── graphs/
│   │   └── ...
│   └── ...
├── hooks/
│   ├── ui/              # UI-specific hooks
│   │   ├── useModal.ts
│   │   ├── useToast.ts
│   │   └── ...
│   └── ...
├── styles/              # Global styles and theme definitions
│   ├── theme.ts
│   ├── globalStyles.ts
│   └── ...
└── ...
```

## UI Patterns

### Component Implementation Pattern

```typescript
/**
 * @context: ui-library, component-library
 * 
 * Button component with consistent styling and behavior
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children,
  fullWidth = false,
  icon,
  iconPosition = 'left'
}) => {
  // Compute classes based on props
  const buttonClasses = useMemo(() => {
    return generateButtonClasses({
      variant,
      size,
      disabled,
      fullWidth,
      hasIcon: !!icon
    });
  }, [variant, size, disabled, fullWidth, icon]);
  
  // Event handler with error boundary
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      onClick?.(event);
    } catch (error) {
      console.error('[Button] Error in onClick handler:', error);
      
      // Log error to error service
      errorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorType.UI,
        ErrorSeverity.MEDIUM,
        {
          component: 'Button',
          variant,
          size
        }
      );
    }
  }, [onClick, variant, size]);
  
  return (
    <button
      className={buttonClasses}
      disabled={disabled}
      onClick={handleClick}
      type="button"
    >
      {icon && iconPosition === 'left' && (
        <span className="button-icon button-icon-left">{icon}</span>
      )}
      
      <span className="button-content">{children}</span>
      
      {icon && iconPosition === 'right' && (
        <span className="button-icon button-icon-right">{icon}</span>
      )}
    </button>
  );
};
```

### UI Hook Implementation Pattern

```typescript
/**
 * @context: ui-library, hooks-library
 * 
 * Hook for managing modal state
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  
  // Open modal
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  // Close modal
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  // Toggle modal state
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  return {
    isOpen,
    open,
    close,
    toggle
  };
}
```

### Form Handling Pattern

```typescript
/**
 * @context: ui-library, forms-library
 * 
 * Hook for managing form state with validation
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: ValidationSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update a single field
  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);
  
  // Mark field as touched on blur
  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
    
    // Validate field on blur if schema exists
    if (validationSchema) {
      const fieldSchema = validationSchema[field];
      if (fieldSchema) {
        const error = validateField(values[field], fieldSchema);
        if (error) {
          setErrors(prev => ({
            ...prev,
            [field]: error
          }));
        }
      }
    }
  }, [values, validationSchema]);
  
  // Validate all fields
  const validate = useCallback(() => {
    if (!validationSchema) return true;
    
    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>;
    let isValid = true;
    
    Object.keys(validationSchema).forEach(key => {
      const field = key as keyof T;
      const schema = validationSchema[field];
      if (schema) {
        const error = validateField(values[field], schema);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [values, validationSchema]);
  
  // Form submission
  const handleSubmit = useCallback((onSubmit: (values: T) => void | Promise<void>) => {
    return async (event?: React.FormEvent) => {
      if (event) {
        event.preventDefault();
      }
      
      // Set all fields as touched
      const allTouched: Record<keyof T, boolean> = {} as Record<keyof T, boolean>;
      Object.keys(values).forEach(key => {
        allTouched[key as keyof T] = true;
      });
      setTouched(allTouched);
      
      // Validate all fields
      const isValid = validate();
      if (!isValid) return;
      
      try {
        setIsSubmitting(true);
        await onSubmit(values);
      } catch (error) {
        console.error('[useForm] Error during form submission:', error);
        
        // Log error to service
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorType.FORM,
          ErrorSeverity.MEDIUM,
          {
            formData: values
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, validate]);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    validate
  };
}
```

## UI Integration with Resource System

```typescript
/**
 * @context: ui-library, resource-system
 * 
 * Resource Display component that integrates with the Resource System
 */
export function ResourceDisplay({ resourceType }: { resourceType: ResourceType }) {
  const [resourceState, setResourceState] = useState<ResourceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    try {
      setLoading(true);
      
      // Get resource manager through registry
      const resourceManager = getResourceManager();
      
      // Get resource state
      const state = resourceManager.getResource(resourceType);
      setResourceState(state || null);
      setError(null);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);
      
      // Log error
      errorLoggingService.logError(error, ErrorType.UI, ErrorSeverity.MEDIUM, {
        component: 'ResourceDisplay',
        resourceType
      });
    } finally {
      setLoading(false);
    }
    
    // Subscribe to resource updates
    const unsubscribe = moduleEventBus.subscribe(
      EventType.RESOURCE_UPDATED,
      (event) => {
        if (
          isResourceUpdateEvent(event) &&
          event.data.resourceType === resourceType
        ) {
          try {
            const resourceManager = getResourceManager();
            setResourceState(resourceManager.getResource(resourceType) || null);
            setError(null);
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            setError(error);
          }
        }
      }
    );
    
    return unsubscribe;
  }, [resourceType]);
  
  if (loading) {
    return <LoadingSpinner size="medium" />;
  }
  
  if (error) {
    return <ErrorMessage message={error.message} />;
  }
  
  if (!resourceState) {
    return <EmptyState message={`No data for resource: ${resourceType}`} />;
  }
  
  return (
    <div className="resource-display">
      <h3 className="resource-display-title">{getResourceDisplayName(resourceType)}</h3>
      <div className="resource-display-content">
        <div className="resource-display-amount">
          <span className="resource-display-value">{resourceState.current}</span>
          <span className="resource-display-separator">/</span>
          <span className="resource-display-max">{resourceState.max}</span>
        </div>
        <div className="resource-display-metrics">
          <div className="resource-display-metric">
            <span className="resource-display-metric-label">Production:</span>
            <span className="resource-display-metric-value">{resourceState.production}</span>
          </div>
          <div className="resource-display-metric">
            <span className="resource-display-metric-label">Consumption:</span>
            <span className="resource-display-metric-value">{resourceState.consumption}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## UI Integration with Event System

```typescript
/**
 * @context: ui-library, event-system
 * 
 * Event Monitor component that displays recent events
 */
export function EventMonitor({ maxEvents = 10, filter }: EventMonitorProps) {
  const [events, setEvents] = useState<BaseEvent[]>([]);
  
  useEffect(() => {
    // Subscribe to all events or filtered events
    const eventTypes = filter ? filter : Object.values(EventType);
    
    const unsubscribe = moduleEventBus.subscribeToMany(
      eventTypes,
      (event) => {
        setEvents(prev => {
          // Add new event to the beginning
          const newEvents = [event, ...prev];
          
          // Limit number of events
          if (newEvents.length > maxEvents) {
            return newEvents.slice(0, maxEvents);
          }
          
          return newEvents;
        });
      }
    );
    
    return unsubscribe;
  }, [maxEvents, filter]);
  
  return (
    <div className="event-monitor">
      <h3 className="event-monitor-title">Recent Events</h3>
      {events.length === 0 ? (
        <EmptyState message="No events received yet" />
      ) : (
        <ul className="event-list">
          {events.map((event, index) => (
            <li key={`${event.type}-${event.timestamp}-${index}`} className="event-item">
              <div className="event-header">
                <span className="event-type">{event.type}</span>
                <span className="event-timestamp">{formatTimestamp(event.timestamp)}</span>
              </div>
              <div className="event-details">
                <span className="event-module-id">{event.moduleId}</span>
                <span className="event-module-type">{event.moduleType}</span>
              </div>
              {event.data && (
                <pre className="event-data">{JSON.stringify(event.data, null, 2)}</pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Error Handling in UI Components

```typescript
/**
 * @context: ui-library, error-handling
 * 
 * Error boundary component for UI components
 */
export class UIErrorBoundary extends React.Component<UIErrorBoundaryProps, UIErrorBoundaryState> {
  constructor(props: UIErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): UIErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by UIErrorBoundary:', error, errorInfo);
    
    // Log error to monitoring service
    errorLoggingService.logError(
      error,
      ErrorType.UI,
      ErrorSeverity.HIGH,
      {
        componentStack: errorInfo.componentStack,
      }
    );
    
    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Use fallback if provided, otherwise use default fallback
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(
            this.state.error || new Error('Unknown error'), 
            this.resetError
          );
        }
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div className="ui-error-boundary">
          <h3 className="ui-error-title">Something went wrong</h3>
          <p className="ui-error-message">
            {this.state.error?.message || 'An unknown error occurred'}
          </p>
          <button 
            className="ui-error-button" 
            onClick={this.resetError}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Theming and Styling

```typescript
/**
 * @context: ui-library, styles-library
 * 
 * Theme configuration
 */
export const theme = {
  colors: {
    primary: {
      main: '#4a90e2',
      light: '#7eb5ff',
      dark: '#0063b0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6d42c7',
      light: '#9e70f9',
      dark: '#3b0095',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#7ce07d',
      dark: '#1b7e24',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ff9800',
      light: '#ffc947',
      dark: '#c66900',
      contrastText: '#000000',
    },
    error: {
      main: '#f44336',
      light: '#ff7961',
      dark: '#ba000d',
      contrastText: '#ffffff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
      surface: '#222222',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#606060',
    },
  },
  spacing: {
    unit: 8,
    get: (multiplier: number) => `${multiplier * 8}px`,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    circle: '50%',
  },
  shadows: {
    none: 'none',
    small: '0 2px 4px rgba(0,0,0,0.2)',
    medium: '0 4px 8px rgba(0,0,0,0.2)',
    large: '0 8px 16px rgba(0,0,0,0.2)',
  },
  transitions: {
    short: '150ms',
    medium: '300ms',
    long: '500ms',
  },
  zIndices: {
    tooltip: 1500,
    modal: 1400,
    popover: 1300,
    notification: 1200,
    dropdown: 1100,
    overlay: 1000,
    sticky: 100,
    default: 1,
    below: -1,
  },
};

/**
 * Helper function to generate styles from theme
 */
export function getThemeValue(path: string, fallback?: string): string {
  const parts = path.split('.');
  let value: any = theme;
  
  for (const part of parts) {
    if (value === undefined) break;
    value = value[part];
  }
  
  if (value === undefined) {
    console.warn(`Theme path "${path}" not found, using fallback.`);
    return fallback || '';
  }
  
  return value;
}
```

# GALACTIC SPRAWL (GS) - UI System Updates

This document contains all UI-specific updates for the GS notepad system. These updates should be manually added to the appropriate GS notepad files referenced below.

## 1. Updates for @GS-CONTEXT-COMMANDS

Add the following section to the GS-CONTEXT-COMMANDS notepad:

### UI System Commands

#### @implement-ui-component
Generates code for a UI component following the project's UI patterns.

```
@implement-ui-component [component-type] [parameters]
```

Example:
```
@implement-ui-component button { variant: 'primary', size: 'medium', withIcon: true }
```

#### @add-responsive-behavior
Adds responsive behavior to a UI component using the project's responsive patterns.

```
@add-responsive-behavior [component-name] [breakpoints]
```

Example:
```
@add-responsive-behavior ResourceDisplay ['sm', 'md', 'lg']
```

#### @add-ui-integration
Integrates a component with the UI system and related subsystems.

```
@add-ui-integration [component-name] [systems]
```

Example:
```
@add-ui-integration ResourceMonitor ['resource-system', 'event-system']
```

Also add this UI-specific example:

### UI Component Implementation Flow Example

```typescript
// First, get documentation for the UI system @show-documentation ui-system

// Find similar UI components @find-similar resource display component

// Create a UI component with responsive design @implement-ui-component resource-display { 
  resourceType: ResourceType.ENERGY,
  showIcon: true,
  responsive: true
}

// Add error handling to the component @refactor-to-pattern error-boundary ResourceDisplay

// Integrate with resource system @add-ui-integration ResourceDisplay ['resource-system']
```

## 2. Updates for @GS-REFERENCE-TAGS-SYSTEM

Add the following section to the "Available System References" section:

```markdown
### UI Systems
- `ui-system` - Overall UI system architecture and patterns
- `component-library` - UI component patterns
- `ui-theme-system` - Theming and styling patterns
- `ui-layout-system` - Layout components and patterns
- `ui-form-system` - Form components and validation
- `ui-hook-system` - UI-specific React hooks
- `ui-animation-system` - Animation and transition patterns
- `visualization-system` - Data visualization
- `ui-responsive-system` - Responsive design patterns
- `ui-accessibility` - Accessibility patterns and implementations
- `ui-error-handling` - UI error boundary and fallback patterns
- `shader-system` - WebGL shader management
```

Additionally, add these examples to the "Examples" section:

### UI Component Implementation

```typescript
/**
 * ResourceDisplay.tsx
 * @context: ui-system, component-library, resource-system
 */
export function ResourceDisplay({ resourceType }: ResourceDisplayProps) {
  // @context: ui-hook-system, resource-manager
  const { data, loading, error } = useResourceData(resourceType);
  
  // @context: ui-error-handling
  if (error) {
    return <ErrorMessage message={error.message} />;
  }
  
  // @context: ui-responsive-system
  const { isMobile } = useBreakpoint();
  
  return (
    <div className={`resource-display ${isMobile ? 'mobile' : ''}`}>
      {/* Component rendering */}
    </div>
  );
}
```

### Form Component Implementation

```typescript
/**
 * ResourceForm.tsx
 * @context: ui-form-system, ui-system, resource-system
 */
export function ResourceForm({ onSubmit }: ResourceFormProps) {
  // @context: ui-form-system.validation
  const { values, errors, handleChange, handleSubmit } = useForm<ResourceFormData>({
    initialValues: { type: ResourceType.ENERGY, amount: 0 },
    validationSchema: resourceFormValidationSchema
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## 3. Updates for @GS-EVENT-HANDLING-PATTERN

Add the following section:

### UI Component Event Handling

```typescript
// src/components/ui/ResourceMonitor.tsx

function ResourceMonitor() {
  const [resources, setResources] = useState<Record<ResourceType, number>>({});
  
  // Pattern: Use useEffect for subscription and cleanup
  useEffect(() => {
    // Subscribe to resource events using the custom hook
    const { unsubscribe } = useResourceEvents(
      [EventType.RESOURCE_PRODUCED, EventType.RESOURCE_CONSUMED],
      (event) => {
        if (isResourceEvent(event)) {
          setResources(prev => ({
            ...prev,
            [event.data.resourceType]: (prev[event.data.resourceType] || 0) + event.data.amount
          }));
        }
      }
    );
    
    // Always return cleanup function
    return unsubscribe;
  }, []);
  
  return (
    <div className="resource-monitor">
      {Object.entries(resources).map(([type, amount]) => (
        <ResourceDisplay 
          key={type} 
          resourceType={type as ResourceType} 
          amount={amount} 
        />
      ))}
    </div>
  );
}

// Custom hook pattern for reusable event handling
function useResourceEvents(
  eventTypes: EventType[],
  handler: (event: ModuleEvent) => void
) {
  useEffect(() => {
    const unsubscribe = moduleEventBus.subscribeToMany(eventTypes, handler);
    return unsubscribe;
  }, [eventTypes, handler]);
  
  return {
    unsubscribe: () => {} // This is replaced at runtime with the actual unsubscribe function
  };
}
```

## 4. Updates for @GS-SYSTEM-INTEGRATION-EXAMPLES

Add the following section:

## UI and Resource System Integration

This example shows how UI components integrate with the Resource System.

```typescript
// src/components/resources/ResourcePanel.tsx

export function ResourcePanel() {
  const [resources, setResources] = useState<Record<ResourceType, ResourceState>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Access resource data through manager registry pattern
  useEffect(() => {
    try {
      setLoading(true);
      
      // Get resource manager through registry pattern
      const resourceManager = getResourceManager();
      
      // Get all resource types
      const resourceTypes = Object.values(ResourceType);
      
      // Get state for each resource type
      const resourceStates: Record<ResourceType, ResourceState> = {};
      resourceTypes.forEach(type => {
        const state = resourceManager.getResource(type);
        if (state) {
          resourceStates[type] = state;
        }
      });
      
      setResources(resourceStates);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Subscribe to resource updates using event system
  useEffect(() => {
    const unsubscribe = moduleEventBus.subscribe(
      EventType.RESOURCE_UPDATED,
      (event: BaseEvent) => {
        // Use type guard to validate event data
        if (isResourceUpdateEvent(event)) {
          const { resourceType, newAmount } = event.data;
          
          // Update resources with new data
          setResources(prev => {
            const prevState = prev[resourceType] || { 
              current: 0, 
              max: 1000, 
              min: 0, 
              production: 0, 
              consumption: 0 
            };
            
            return {
              ...prev,
              [resourceType]: {
                ...prevState,
                current: newAmount
              }
            };
          });
        }
      }
    );
    
    // Always return cleanup function
    return unsubscribe;
  }, []);
  
  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Error state
  if (error) {
    return <ErrorMessage message={error.message} />;
  }
  
  // Render resource panel
  return (
    <div className="resource-panel">
      <h2>Resources</h2>
      <div className="resource-grid">
        {Object.entries(resources).map(([type, state]) => (
          <ResourceCard 
            key={type} 
            resourceType={type as ResourceType} 
            resourceState={state} 
          />
        ))}
      </div>
    </div>
  );
}
```

## 5. Updates for @GS-FACTORY-PATTERN-REFERENCE

Add the following section:

## UI Component Factory Pattern

Factories for creating UI components with dynamic configuration.

```typescript
// src/factories/ui/ComponentFactory.ts

export class UIComponentFactory {
  private static instance: UIComponentFactory;
  
  // Private constructor prevents direct instantiation
  private constructor() {
    // Initialization
  }
  
  // Static getter for the singleton instance
  public static getInstance(): UIComponentFactory {
    if (!UIComponentFactory.instance) {
      UIComponentFactory.instance = new UIComponentFactory();
    }
    return UIComponentFactory.instance;
  }
  
  // Create a button with proper configuration
  public createButton(config: Partial<ButtonProps> = {}): React.ReactElement {
    // Default props
    const props: ButtonProps = {
      variant: config.variant || 'primary',
      size: config.size || 'medium',
      disabled: config.disabled || false,
      onClick: config.onClick || (() => {}),
      children: config.children || 'Button',
      fullWidth: config.fullWidth || false,
      leadingIcon: config.leadingIcon,
      trailingIcon: config.trailingIcon,
      className: config.className || '',
    };
    
    // Return the button component
    return <Button {...props} />;
  }
  
  // Create a card with proper configuration
  public createCard(config: Partial<CardProps> = {}): React.ReactElement {
    // Default props
    const props: CardProps = {
      title: config.title,
      subtitle: config.subtitle,
      elevation: config.elevation || 'medium',
      className: config.className || '',
      children: config.children || null,
    };
    
    // Return the card component
    return <Card {...props} />;
  }
  
  // Create a resource display with proper configuration
  public createResourceDisplay(
    resourceType: ResourceType,
    config: Partial<ResourceDisplayProps> = {}
  ): React.ReactElement {
    // Default props
    const props: ResourceDisplayProps = {
      resourceType,
      showIcon: config.showIcon !== undefined ? config.showIcon : true,
      showName: config.showName !== undefined ? config.showName : true,
      size: config.size || 'medium',
      onClick: config.onClick,
      className: config.className || '',
    };
    
    // Return the resource display component
    return <ResourceDisplay {...props} />;
  }
}

// Export the singleton instance
export const uiComponentFactory = UIComponentFactory.getInstance();

// Usage example:
// const button = uiComponentFactory.createButton({ 
//   variant: 'primary', 
//   children: 'Click Me',
//   onClick: () => console.log('Button clicked')
// });
```

## How to Apply These Updates

1. Open each GS notepad file mentioned above
2. Locate the appropriate section in each file
3. Copy and paste the updates from this document to the corresponding section
4. Save the updated notepad files

This ensures that the UI system is properly documented and integrated with the existing GS notepad system, providing comprehensive guidance for UI implementation in the Galactic Sprawl codebase. 

## Best Practices

1. **Component Architecture**
   - Follow the atomic design pattern (atoms → molecules → organisms → templates → pages)
   - Keep components small and focused on a single responsibility
   - Maintain consistency in component APIs and behavior

2. **State Management**
   - Use hooks for component-level state (`useState`, `useReducer`)
   - Use context for shared state across related components
   - Access manager data through proper hooks rather than direct imports

3. **Error Handling**
   - Wrap UI sections in error boundaries
   - Handle async errors in hooks and event handlers
   - Provide meaningful error messages and fallback UIs
   - Log errors to the error logging service

4. **Performance**
   - Memoize expensive calculations with `useMemo`
   - Memoize callback functions with `useCallback`
   - Use virtualization for long lists
   - Implement proper dependency arrays in hooks

5. **Accessibility**
   - Ensure proper keyboard navigation
   - Use semantic HTML elements
   - Include ARIA attributes when needed
   - Maintain appropriate color contrast
   - Support screen readers

6. **Event Handling**
   - Clean up event subscriptions in `useEffect` return function
   - Handle errors in event callbacks
   - Use typed event handlers

7. **Animation**
   - Use CSS transitions for simple animations
   - Use React Spring or Framer Motion for complex animations
   - Clean up animations to prevent memory leaks

## Related Systems

- See @GS-TYPE-DEFINITIONS for type definitions used in UI components
- See @GS-EVENT-SYSTEM for event handling used in UI components
- See @GS-RESOURCE-SYSTEM for resource management APIs used in UI components
- See @GS-ERROR-HANDLING-SYSTEM for error handling in UI components
- See @GS-CORE-ARCHITECTURE for overall system architecture

