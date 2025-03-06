import React, { ReactNode } from 'react';
import { vi } from 'vitest';

/**
 * Centralized mocking utilities for common modules
 * This file provides standardized mocks for frequently used modules
 * and utilities for creating consistent mocks across tests
 */

/**
 * Interface for module event bus mock
 */
export interface ModuleEventBusMock {
  emit: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  unsubscribe: ReturnType<typeof vi.fn>;
  getHistory?: ReturnType<typeof vi.fn>;
  getModuleHistory?: ReturnType<typeof vi.fn>;
  getEventTypeHistory?: ReturnType<typeof vi.fn>;
  clearHistory?: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock for the module event bus
 * @param overrides Optional overrides for specific methods
 * @returns A mock module event bus
 */
export function createModuleEventBusMock(
  overrides: Partial<ModuleEventBusMock> = {}
): ModuleEventBusMock {
  return {
    emit: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
    unsubscribe: vi.fn(),
    getHistory: vi.fn().mockReturnValue([]),
    getModuleHistory: vi.fn().mockReturnValue([]),
    getEventTypeHistory: vi.fn().mockReturnValue([]),
    clearHistory: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock for the ModuleEvents module
 * @param eventBusMock Optional mock for the module event bus
 * @returns A mock ModuleEvents module
 */
export function createModuleEventsMock(eventBusMock?: ModuleEventBusMock) {
  const mockEventBus = eventBusMock || createModuleEventBusMock();

  return {
    moduleEventBus: mockEventBus,
    ModuleEventType: {
      MODULE_CREATED: 'MODULE_CREATED',
      MODULE_UPDATED: 'MODULE_UPDATED',
      MODULE_ATTACHED: 'MODULE_ATTACHED',
      MODULE_DETACHED: 'MODULE_DETACHED',
      MODULE_UPGRADED: 'MODULE_UPGRADED',
      MODULE_ACTIVATED: 'MODULE_ACTIVATED',
      MODULE_DEACTIVATED: 'MODULE_DEACTIVATED',
      RESOURCE_PRODUCED: 'RESOURCE_PRODUCED',
      RESOURCE_CONSUMED: 'RESOURCE_CONSUMED',
      RESOURCE_UPDATED: 'RESOURCE_UPDATED',
    },
  };
}

/**
 * Interface for resource manager mock
 */
export interface ResourceManagerMock {
  getResource: ReturnType<typeof vi.fn>;
  updateResource: ReturnType<typeof vi.fn>;
  addResource: ReturnType<typeof vi.fn>;
  removeResource: ReturnType<typeof vi.fn>;
  getAllResources: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock for the resource manager
 * @param overrides Optional overrides for specific methods
 * @returns A mock resource manager
 */
export function createResourceManagerMock(
  overrides: Partial<ResourceManagerMock> = {}
): ResourceManagerMock {
  return {
    getResource: vi.fn(),
    updateResource: vi.fn(),
    addResource: vi.fn(),
    removeResource: vi.fn(),
    getAllResources: vi.fn().mockReturnValue([]),
    reset: vi.fn(),
    ...overrides,
  };
}

/**
 * Interface for module manager mock
 */
export interface ModuleManagerMock {
  createModule: ReturnType<typeof vi.fn>;
  getModule: ReturnType<typeof vi.fn>;
  updateModule: ReturnType<typeof vi.fn>;
  removeModule: ReturnType<typeof vi.fn>;
  getAllModules: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock for the module manager
 * @param overrides Optional overrides for specific methods
 * @returns A mock module manager
 */
export function createModuleManagerMock(
  overrides: Partial<ModuleManagerMock> = {}
): ModuleManagerMock {
  return {
    createModule: vi.fn(),
    getModule: vi.fn(),
    updateModule: vi.fn(),
    removeModule: vi.fn(),
    getAllModules: vi.fn().mockReturnValue([]),
    reset: vi.fn(),
    ...overrides,
  };
}

/**
 * Interface for automation manager mock
 */
export interface AutomationManagerMock {
  registerRule: ReturnType<typeof vi.fn>;
  updateRule: ReturnType<typeof vi.fn>;
  removeRule: ReturnType<typeof vi.fn>;
  getRule: ReturnType<typeof vi.fn>;
  getRulesForModule: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock for the automation manager
 * @param overrides Optional overrides for specific methods
 * @returns A mock automation manager
 */
export function createAutomationManagerMock(
  overrides: Partial<AutomationManagerMock> = {}
): AutomationManagerMock {
  return {
    registerRule: vi.fn(),
    updateRule: vi.fn(),
    removeRule: vi.fn(),
    getRule: vi.fn(),
    getRulesForModule: vi.fn().mockReturnValue([]),
    reset: vi.fn(),
    ...overrides,
  };
}

/**
 * Helper function to mock ES modules
 * This function helps avoid hoisting issues with vi.mock
 * @param modulePath Path to the module to mock
 * @param mockFactory Factory function that returns the mock
 */
export function mockESModule(modulePath: string, mockFactory: () => unknown): void {
  vi.doMock(modulePath, () => mockFactory());
}

/**
 * Helper function to mock a module with both named and default exports
 * @param modulePath Path to the module to mock
 * @param namedExports Object containing named exports
 * @param defaultExport Optional default export
 */
export function mockModuleWithExports(
  modulePath: string,
  namedExports: Record<string, unknown>,
  defaultExport?: unknown
): void {
  mockESModule(modulePath, () => {
    const mockModule = { ...namedExports };

    if (defaultExport) {
      Object.defineProperty(mockModule, 'default', {
        value: defaultExport,
        enumerable: true,
      });
    }

    return mockModule;
  });
}

/**
 * Helper function to create a mock class
 * @param methods Methods to mock on the class
 * @returns A mock class constructor
 */
export function createMockClass(methods: Record<string, ReturnType<typeof vi.fn>>) {
  return vi.fn().mockImplementation(() => methods);
}

/**
 * Helper function to create a mock React component
 * @param displayName Optional display name for the component
 * @returns A mock React component
 */
export function createMockComponent(displayName = 'MockComponent') {
  const component = vi.fn().mockReturnValue(null) as React.FC;
  component.displayName = displayName;
  return component;
}

/**
 * Helper function to create a mock React hook
 * @param returnValue Value to return from the hook
 * @returns A mock React hook
 */
export function createMockHook<T>(returnValue: T) {
  return vi.fn().mockReturnValue(returnValue);
}

/**
 * Helper function to create a mock context provider
 * @param contextValue Value to provide through the context
 * @returns A mock context provider
 */
export function createMockContextProvider<T>(contextValue: T) {
  const Provider = ({ children }: { children: React.ReactNode }) => children;
  const useContext = vi.fn().mockReturnValue(contextValue);

  return {
    Provider,
    useContext,
  };
}

/**
 * Helper function to restore all mocks
 * This should be called in afterEach or afterAll
 */
export function restoreAllMocks(): void {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.clearAllMocks();
}

/**
 * Interface for motion component props
 */
export interface MotionComponentProps {
  children?: ReactNode;
  className?: string;
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

/**
 * Interface for AnimatePresence component props
 */
export interface AnimatePresenceProps {
  children: ReactNode;
}

/**
 * Creates a mock for framer-motion to avoid matchMedia issues in tests
 *
 * @returns A mock implementation of framer-motion
 *
 * @example
 * ```typescript
 * // In your test file
 * import { createFramerMotionMock } from '../utils/mockUtils';
 *
 * // Mock framer-motion
 * vi.mock('framer-motion', () => createFramerMotionMock());
 * ```
 */
export function createFramerMotionMock() {
  return {
    __esModule: true,
    motion: {
      div: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('div', { 'data-testid': 'motion-div', ...props }, children),
      span: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('span', { 'data-testid': 'motion-span', ...props }, children),
      p: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('p', { 'data-testid': 'motion-p', ...props }, children),
      button: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('button', { 'data-testid': 'motion-button', ...props }, children),
      a: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('a', { 'data-testid': 'motion-a', ...props }, children),
      ul: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('ul', { 'data-testid': 'motion-ul', ...props }, children),
      li: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('li', { 'data-testid': 'motion-li', ...props }, children),
      section: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('section', { 'data-testid': 'motion-section', ...props }, children),
      article: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('article', { 'data-testid': 'motion-article', ...props }, children),
      header: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('header', { 'data-testid': 'motion-header', ...props }, children),
      footer: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('footer', { 'data-testid': 'motion-footer', ...props }, children),
      nav: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('nav', { 'data-testid': 'motion-nav', ...props }, children),
      aside: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('aside', { 'data-testid': 'motion-aside', ...props }, children),
      main: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('main', { 'data-testid': 'motion-main', ...props }, children),
      h1: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('h1', { 'data-testid': 'motion-h1', ...props }, children),
      h2: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('h2', { 'data-testid': 'motion-h2', ...props }, children),
      h3: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('h3', { 'data-testid': 'motion-h3', ...props }, children),
      h4: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('h4', { 'data-testid': 'motion-h4', ...props }, children),
      h5: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('h5', { 'data-testid': 'motion-h5', ...props }, children),
      h6: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('h6', { 'data-testid': 'motion-h6', ...props }, children),
      img: (props: MotionComponentProps) =>
        React.createElement('img', { 'data-testid': 'motion-img', ...props }),
      svg: ({ children, ...props }: MotionComponentProps) =>
        React.createElement('svg', { 'data-testid': 'motion-svg', ...props }, children),
      path: (props: MotionComponentProps) =>
        React.createElement('path', { 'data-testid': 'motion-path', ...props }),
    },
    AnimatePresence: ({ children }: AnimatePresenceProps) =>
      React.createElement(React.Fragment, null, children),
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn(),
    }),
    useCycle: <T>(...args: T[]) => {
      const [current, setCurrent] = React.useState(0);
      const cycle = () => setCurrent(prev => (prev + 1) % args.length);
      return [args[current], cycle] as [T, () => void];
    },
    useMotionValue: <T>(initial: T) => ({
      get: () => initial,
      set: vi.fn(),
      onChange: vi.fn(),
    }),
    useTransform: () => ({
      get: vi.fn(),
      set: vi.fn(),
    }),
    useSpring: () => ({
      get: vi.fn(),
      set: vi.fn(),
    }),
    useInView: () => ({
      inView: false,
      ref: { current: null },
    }),
  };
}
