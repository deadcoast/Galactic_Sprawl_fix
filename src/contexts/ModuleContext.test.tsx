import { act, render, screen } from '@testing-library/react';
import * as React from 'react';
import { EventBus, EventListener } from '../lib/events/EventBus';
import { BuildingType, ModularBuilding, ModuleType } from '../types/buildings/ModuleTypes';
import { Position } from '../types/core/GameTypes';
import { BaseEvent, EventType } from '../types/events/EventTypes';
import { IModuleManager, ModuleStatus } from '../types/modules/ModuleTypes';
import { validateEventData } from '../utils/events/EventDataTypes';
import { ResourceType } from './../types/resources/ResourceTypes';
import { ModuleProvider, useModule, useModuleActions, useModules } from './ModuleContext';


// Mock ServiceProvider since we don't have direct access to the actual implementation
const ServiceContext = React.createContext<Record<string, unknown>>({});
const ServiceProvider = ServiceContext.Provider;

// Define a full TestModule type that matches the Module interface
interface TestModule {
  id: string;
  name: string;
  type: ModuleType;
  status: 'active' | 'constructing' | 'inactive';
  position: Position;
  level: number;
  isActive: boolean;
  buildingId?: string;
  attachmentPointId?: string;
  progress?: number;
  subModules?: Array<unknown>;
  parentModuleId?: string;
}

// Define a test building type that extends ModularBuilding
interface TestBuilding {
  id: string;
  type: BuildingType;
  name?: string; // Added for testing convenience
  level: number;
  modules: string[]; // Store module IDs rather than actual modules
  status: 'active' | 'constructing' | 'inactive';
  attachmentPoints: Array<{
    id: string;
    position: Position;
    allowedTypes: ModuleType[];
    occupied: boolean;
    currentModule?: string;
  }>;
}

/**
 * Create a test module with default values for required properties
 * @param overrides - Optional properties to override default values
 * @returns A complete TestModule object with all required properties
 */
function createTestModule(overrides: Partial<TestModule> = {}): TestModule {
  return {
    id: `module-${Date.now()}`,
    name: 'Test Module',
    type: 'radar' as ModuleType,
    status: 'active',
    position: { x: 0, y: 0 },
    level: 1,
    isActive: true,
    ...overrides,
  };
}

/**
 * Create a test building with default values
 */
function createTestBuilding(overrides: Partial<TestBuilding> = {}): TestBuilding {
  return {
    id: `building-${Date.now()}`,
    type: 'colony' as BuildingType,
    name: 'Test Building',
    level: 1,
    status: 'active',
    modules: [],
    attachmentPoints: [
      {
        id: `ap-${Date.now()}`,
        position: { x: 0, y: 0 },
        allowedTypes: ['radar', 'hangar'] as ModuleType[],
        occupied: false,
      },
    ],
    ...overrides,
  };
}

/**
 * Type-safe event data mapping for module events.
 * This interface maps each event type to its corresponding data type
 * to avoid using 'any' type assertions in our test code.
 */
interface ModuleEventDataMap {
  [EventType.MODULE_CREATED]: {
    type: EventType.MODULE_CREATED;
    timestamp: number;
    moduleId: string;
    moduleType: ModuleType;
    module: TestModule;
    createdBy: string;
  };
  [EventType.MODULE_UPDATED]: {
    type: EventType.MODULE_UPDATED;
    timestamp: number;
    moduleId: string;
    moduleType: ModuleType;
    updates: Partial<TestModule>;
  };
  [EventType.MODULE_STATUS_CHANGED]: {
    type: EventType.MODULE_STATUS_CHANGED;
    timestamp: number;
    moduleId: string;
    moduleType: ModuleType;
    status: 'active' | 'constructing' | 'inactive';
    previousStatus: 'active' | 'constructing' | 'inactive';
  };
  [EventType.MODULE_ACTIVATED]: {
    type: EventType.MODULE_ACTIVATED;
    timestamp: number;
    moduleId: string;
    moduleType: ModuleType;
    activatedBy: string;
  };
  [EventType.MODULE_DEACTIVATED]: {
    type: EventType.MODULE_DEACTIVATED;
    timestamp: number;
    moduleId: string;
    moduleType: ModuleType;
    deactivatedBy: string;
    reason: string;
  };
  [EventType.MODULE_REMOVED]: {
    type: EventType.MODULE_REMOVED;
    timestamp: number;
    moduleId: string;
    moduleType: ModuleType;
    reason: string;
  };
}

/**
 * Enhanced event validation function that provides better error messages
 * and more comprehensive validation.
 */
function validateModuleEvent<T extends keyof ModuleEventDataMap>(
  eventType: T,
  eventData: ModuleEventDataMap[T]
): boolean {
  // Basic validation - event type matches
  if (eventData.type !== eventType) {
    console.error(`Event type mismatch: expected ${eventType}, got ${eventData.type}`);
    return false;
  }

  // All events need these fields
  if (!eventData.moduleId || typeof eventData.moduleId !== 'string') {
    console.error(`Missing or invalid moduleId in ${eventType} event`);
    return false;
  }

  if (!eventData.moduleType) {
    console.error(`Missing moduleType in ${eventType} event`);
    return false;
  }

  if (!eventData.timestamp || typeof eventData.timestamp !== 'number') {
    console.error(`Missing or invalid timestamp in ${eventType} event`);
    return false;
  }

  // Event-specific validation
  switch (eventType) {
    case EventType.MODULE_CREATED: {
      const createdEvent = eventData as ModuleEventDataMap[EventType.MODULE_CREATED];
      if (!createdEvent.module || !createdEvent.module.id) {
        console.error(`Missing or invalid module in MODULE_CREATED event`);
        return false;
      }
      break;
    }

    case EventType.MODULE_UPDATED: {
      const updatedEvent = eventData as ModuleEventDataMap[EventType.MODULE_UPDATED];
      if (!updatedEvent.updates || typeof updatedEvent.updates !== 'object') {
        console.error(`Missing or invalid updates in MODULE_UPDATED event`);
        return false;
      }
      break;
    }

    case EventType.MODULE_STATUS_CHANGED: {
      const statusEvent = eventData as ModuleEventDataMap[EventType.MODULE_STATUS_CHANGED];
      if (!statusEvent.status) {
        console.error(`Missing status in MODULE_STATUS_CHANGED event`);
        return false;
      }
      // Validate status is one of the allowed values
      if (!['active', 'constructing', 'inactive'].includes(statusEvent.status)) {
        console.error(`Invalid status value in MODULE_STATUS_CHANGED event: ${statusEvent.status}`);
        return false;
      }
      break;
    }
  }

  return true;
}

/**
 * Type-safe validateAndEmitEvent function that uses our type mapping and enhanced validation
 */
function validateAndEmitEvent<T extends keyof ModuleEventDataMap>(
  eventBus: EventBus<BaseEvent>,
  eventType: T,
  eventData: ModuleEventDataMap[T]
): void {
  // Use our enhanced validation
  if (!validateModuleEvent(eventType, eventData)) {
    console.error(`Invalid event data for ${eventType}`, eventData);
    throw new Error(`Invalid event data for ${eventType}`);
  }

  // Also use the general validation as a backup
  if (!validateEventData(eventType, eventData as BaseEvent)) {
    console.warn(
      `Secondary validation failed for ${eventType} - this may indicate a type mismatch with the main app`
    );
  }

  eventBus.emit(eventData as unknown as BaseEvent);
}

// Create a ModuleManagerWrapper for testing that implements IModuleManager
class ModuleManagerWrapper implements IModuleManager {
  private modules: Record<string, TestModule> = {};
  private activeModuleIds: string[] = [];
  private buildings: Record<string, TestBuilding> = {};
  public eventBus: EventBus<BaseEvent>;
  private moduleCategories: string[] = ['radar', 'hangar', 'exploration', ResourceType.RESEARCH];

  constructor(
    initialModules: Record<string, TestModule> = {},
    initialBuildings: Record<string, TestBuilding> = {}
  ) {
    this.modules = { ...initialModules };
    this.buildings = { ...initialBuildings };
    this.eventBus = new EventBus<BaseEvent>();

    // Set all initial modules as active by default
    this.activeModuleIds = Object.keys(initialModules);

    // Associate modules with buildings if buildingId is present
    Object.values(this.modules).forEach(module => {
      if (module.buildingId && this.buildings[module.buildingId]) {
        if (!this.buildings[module.buildingId].modules) {
          this.buildings[module.buildingId].modules = [];
        }
        if (!this.buildings[module.buildingId].modules.includes(module.id)) {
          this.buildings[module.buildingId].modules.push(module.id);
        }
      }
    });
  }

  // Required by IModuleManager
  getModules(): TestModule[] {
    return Object.values(this.modules);
  }

  // For backward compatibility and ModuleProvider initialization
  getAllModules(): TestModule[] {
    return this.getModules();
  }

  getActiveModuleIds() {
    return [...this.activeModuleIds];
  }

  // Required by IModuleManager
  getActiveModules(): TestModule[] {
    return this.getActiveModuleIds()
      .map(id => this.modules[id])
      .filter(Boolean);
  }

  // Required by IModuleManager
  getModule(id: string): TestModule | undefined {
    return this.modules[id];
  }

  // Required by IModuleManager
  getModulesByType(type: ModuleType): TestModule[] {
    return Object.values(this.modules).filter(module => module.type === type);
  }

  // Required by IModuleManager
  getBuildings(): ModularBuilding[] {
    // Type assertion for compatibility with IModuleManager
    return Object.values(this.buildings) as unknown as ModularBuilding[];
  }

  // For testing - returns the actual TestBuilding objects
  getBuildingsForTest(): TestBuilding[] {
    return Object.values(this.buildings);
  }

  // Required by IModuleManager
  getModuleCategories(): string[] {
    return [...this.moduleCategories];
  }

  // Required by IModuleManager
  getModulesByBuildingId(buildingId: string): TestModule[] {
    return Object.values(this.modules).filter(module => module.buildingId === buildingId);
  }

  getBuilding(buildingId: string): TestBuilding | null {
    return this.buildings[buildingId] || null;
  }

  isModuleActive(id: string) {
    return this.activeModuleIds.includes(id);
  }

  // Implementation of upgrade and attachment methods required by IModuleManager
  upgradeModule?(moduleId: string): boolean {
    const module = this.modules[moduleId];
    if (!module) return false;

    module.level = module.level + 1;

    // Emit module updated event
    const eventData: ModuleEventDataMap[EventType.MODULE_UPDATED] = {
      type: EventType.MODULE_UPDATED,
      timestamp: Date.now(),
      moduleId,
      moduleType: module.type,
      updates: { level: module.level },
    };

    validateAndEmitEvent(this.eventBus, EventType.MODULE_UPDATED, eventData);
    return true;
  }

  attachModule?(moduleId: string, buildingId: string, attachmentPointId: string): boolean {
    const module = this.modules[moduleId];
    const building = this.buildings[buildingId];

    if (!module || !building) return false;

    // Find the attachment point
    const attachmentPoint = building.attachmentPoints.find(ap => ap.id === attachmentPointId);
    if (!attachmentPoint) return false;

    // Check if already occupied
    if (attachmentPoint.occupied) return false;

    // Check if module type is allowed
    if (!attachmentPoint.allowedTypes.includes(module.type)) return false;

    // Update module
    module.buildingId = buildingId;
    module.attachmentPointId = attachmentPointId;

    // Update attachment point
    attachmentPoint.occupied = true;
    attachmentPoint.currentModule = moduleId;

    // Update building modules list
    if (!building.modules.includes(moduleId)) {
      building.modules.push(moduleId);
    }

    // Emit module attached event (using updated event as a substitute)
    const eventData: ModuleEventDataMap[EventType.MODULE_UPDATED] = {
      type: EventType.MODULE_UPDATED,
      timestamp: Date.now(),
      moduleId,
      moduleType: module.type,
      updates: {
        buildingId,
        attachmentPointId,
      },
    };

    validateAndEmitEvent(this.eventBus, EventType.MODULE_UPDATED, eventData);
    return true;
  }

  detachModule?(moduleId: string): boolean {
    const module = this.modules[moduleId];
    if (!module || !module.buildingId || !module.attachmentPointId) return false;

    const building = this.buildings[module.buildingId];
    if (!building) return false;

    // Find the attachment point
    const attachmentPoint = building.attachmentPoints.find(
      ap => ap.id === module.attachmentPointId
    );
    if (!attachmentPoint) return false;

    // Update attachment point
    attachmentPoint.occupied = false;
    attachmentPoint.currentModule = undefined;

    // Update building modules list
    building.modules = building.modules.filter(id => id !== moduleId);

    // Store old values to emit with event
    const _oldBuildingId = module.buildingId;
    const _oldAttachPointId = module.attachmentPointId;

    // Update module
    module.buildingId = undefined;
    module.attachmentPointId = undefined;

    // Emit module detached event (using updated event as a substitute)
    const eventData: ModuleEventDataMap[EventType.MODULE_UPDATED] = {
      type: EventType.MODULE_UPDATED,
      timestamp: Date.now(),
      moduleId,
      moduleType: module.type,
      updates: {
        buildingId: undefined,
        attachmentPointId: undefined,
      },
    };

    validateAndEmitEvent(this.eventBus, EventType.MODULE_UPDATED, eventData);
    return true;
  }

  // Additional methods for a more complete implementation
  getAllModulesByCategory(): Record<string, TestModule[]> {
    const result: Record<string, TestModule[]> = {};

    this.moduleCategories.forEach(category => {
      result[category] = this.getModules().filter(module => module.type.includes(category));
    });

    return result;
  }

  // Legacy action dispatch method
  dispatch(_action: { type: string; payload?: Record<string, unknown> }): void {
    // No-op for testing
  }

  // Subscribe to events
  subscribe(eventType: EventType, listener: EventListener<BaseEvent>) {
    return this.eventBus.subscribe(eventType, listener);
  }

  createModule(moduleData: Partial<TestModule> = {}) {
    const module = createTestModule(moduleData);
    const id = module.id;
    this.modules[id] = module;

    // Associate with building if buildingId is present
    if (module.buildingId && this.buildings[module.buildingId]) {
      if (!this.buildings[module.buildingId].modules) {
        this.buildings[module.buildingId].modules = [];
      }
      this.buildings[module.buildingId].modules.push(id);
    }

    // Emit module created event with correct event data structure
    const eventData: ModuleEventDataMap[EventType.MODULE_CREATED] = {
      type: EventType.MODULE_CREATED,
      timestamp: Date.now(),
      moduleId: id,
      moduleType: module.type,
      module: module, // No more 'as any'
      createdBy: 'test',
    };

    validateAndEmitEvent(this.eventBus, EventType.MODULE_CREATED, eventData);
    return module;
  }

  createBuilding(buildingData: Partial<TestBuilding> = {}) {
    const building = createTestBuilding(buildingData);
    const id = building.id;
    this.buildings[id] = building;
    return building;
  }

  updateModule(id: string, updates: Partial<TestModule>) {
    if (!this.modules[id]) {
      return null;
    }

    const updatedModule = { ...this.modules[id], ...updates };
    this.modules[id] = updatedModule;

    // Update building association if buildingId changed
    if (updates.buildingId && updates.buildingId !== updatedModule.buildingId) {
      // Remove from old building
      if (updatedModule.buildingId && this.buildings[updatedModule.buildingId]) {
        this.buildings[updatedModule.buildingId].modules =
          this.buildings[updatedModule.buildingId].modules.filter(moduleId => moduleId !== id) ||
          [];
      }

      // Add to new building
      if (this.buildings[updates.buildingId]) {
        if (!this.buildings[updates.buildingId].modules) {
          this.buildings[updates.buildingId].modules = [];
        }
        this.buildings[updates.buildingId].modules.push(id);
      }
    }

    // Emit module updated event with correct event data structure
    const eventData: ModuleEventDataMap[EventType.MODULE_UPDATED] = {
      type: EventType.MODULE_UPDATED,
      timestamp: Date.now(),
      moduleId: id,
      moduleType: updatedModule.type,
      updates: updates, // No more 'as any'
    };

    validateAndEmitEvent(this.eventBus, EventType.MODULE_UPDATED, eventData);
    return updatedModule;
  }

  removeModule(id: string) {
    if (!this.modules[id]) {
      return false;
    }

    const module = this.modules[id];

    // Remove from building if associated
    if (module.buildingId && this.buildings[module.buildingId]) {
      this.buildings[module.buildingId].modules =
        this.buildings[module.buildingId].modules.filter(moduleId => moduleId !== id) || [];
    }

    delete this.modules[id];

    // Remove from active modules if it's active
    if (this.activeModuleIds.includes(id)) {
      this.activeModuleIds = this.activeModuleIds.filter(moduleId => moduleId !== id);
    }

    // Emit module removed event with correct event data structure
    const eventData: ModuleEventDataMap[EventType.MODULE_REMOVED] = {
      type: EventType.MODULE_REMOVED,
      timestamp: Date.now(),
      moduleId: id,
      moduleType: module.type,
      reason: 'test removal',
    };

    validateAndEmitEvent(this.eventBus, EventType.MODULE_REMOVED, eventData);
    return true;
  }

  // Implement these methods as required by IModuleManager
  activateModule(id: string) {
    if (!this.modules[id] || this.activeModuleIds.includes(id)) {
      return false;
    }

    this.activeModuleIds.push(id);
    this.modules[id].isActive = true;

    // Emit module activated event with correct event data structure
    const eventData: ModuleEventDataMap[EventType.MODULE_ACTIVATED] = {
      type: EventType.MODULE_ACTIVATED,
      timestamp: Date.now(),
      moduleId: id,
      moduleType: this.modules[id].type,
      activatedBy: 'test',
    };

    validateAndEmitEvent(this.eventBus, EventType.MODULE_ACTIVATED, eventData);
    return true;
  }

  deactivateModule(id: string) {
    if (!this.modules[id] || !this.activeModuleIds.includes(id)) {
      return false;
    }

    this.activeModuleIds = this.activeModuleIds.filter(moduleId => moduleId !== id);
    this.modules[id].isActive = false;

    // Emit module deactivated event with correct event data structure
    const eventData: ModuleEventDataMap[EventType.MODULE_DEACTIVATED] = {
      type: EventType.MODULE_DEACTIVATED,
      timestamp: Date.now(),
      moduleId: id,
      moduleType: this.modules[id].type,
      deactivatedBy: 'test',
      reason: 'test deactivation',
    };

    validateAndEmitEvent(this.eventBus, EventType.MODULE_DEACTIVATED, eventData);
    return true;
  }

  updateModuleStatus(id: string, status: ModuleStatus) {
    if (!this.modules[id]) {
      return false;
    }

    const oldStatus = this.modules[id].status;
    // Convert ModuleStatus enum to string for compatibility
    const statusString = moduleStatusToString(status);
    const updatedModule = { ...this.modules[id], status: statusString };
    this.modules[id] = updatedModule;

    // Emit module status changed event with correct event data structure
    const eventData: ModuleEventDataMap[EventType.MODULE_STATUS_CHANGED] = {
      type: EventType.MODULE_STATUS_CHANGED,
      timestamp: Date.now(),
      moduleId: id,
      moduleType: updatedModule.type,
      status: statusString, // No more 'as any'
      previousStatus: oldStatus, // No more 'as any'
    };

    validateAndEmitEvent(this.eventBus, EventType.MODULE_STATUS_CHANGED, eventData);
    return true;
  }

  // Reset method for testing purposes
  reset() {
    this.modules = {};
    this.activeModuleIds = [];
    this.buildings = {};
  }

  // Set modules directly for testing
  setModules(modules: Record<string, TestModule>) {
    this.modules = { ...modules };
    this.activeModuleIds = Object.keys(modules);
  }

  // Set buildings directly for testing
  setBuildings(buildings: Record<string, TestBuilding>) {
    this.buildings = { ...buildings };
  }
}

// Mock service registry for testing
const createMockServiceRegistry = (moduleManager: ModuleManagerWrapper) => ({
  getService: (serviceName: string) => {
    if (serviceName === 'moduleManager') {
      return moduleManager;
    }
    return null;
  },
});

// Test components
const ModuleList = () => {
  // Fix: Pass a selector function to useModules
  const modules = useModules(state => Object.values(state.modules));
  return (
    <div data-testid="module-list">
      {modules.map(module => (
        <div key={module.id} data-testid={`module-${module.id}`}>
          {module.name || module.id}
        </div>
      ))}
    </div>
  );
};

const ActiveModulesList = () => {
  // Fix: Pass selector functions to hooks
  const modules = useModules(state => Object.values(state.modules));
  const activeIds = useModules(state => state.activeModuleIds);

  return (
    <div data-testid="active-modules-list">
      {modules
        .filter(module => activeIds.includes(module.id))
        .map(module => (
          <div key={module.id} data-testid={`active-module-${module.id}`}>
            {module.name || module.id}
          </div>
        ))}
    </div>
  );
};

const ModuleDetail = ({ id }: { id: string }) => {
  // Fix: Use useModule with proper moduleId
  const module = useModule(id);

  if (!module) return <div data-testid="module-not-found">Module not found</div>;

  return (
    <div data-testid={`module-detail-${id}`}>
      <div data-testid="module-name">{module.name || module.id}</div>
      <div data-testid="module-type">{module.type}</div>
      <div data-testid="module-status">{module.status}</div>
    </div>
  );
};

const ModuleActions = ({ id }: { id: string }) => {
  const { activateModule, deactivateModule, updateModule } = useModuleActions();

  const handleUpdateStatus = (status: 'active' | 'inactive') => {
    updateModule(id, { status });
  };

  return (
    <div data-testid={`module-actions-${id}`}>
      <button data-testid="activate-button" onClick={() => activateModule(id)}>
        Activate
      </button>
      <button data-testid="deactivate-button" onClick={() => deactivateModule(id)}>
        Deactivate
      </button>
      <button data-testid="set-active-button" onClick={() => handleUpdateStatus('active')}>
        Set Active
      </button>
      <button data-testid="set-inactive-button" onClick={() => handleUpdateStatus('inactive')}>
        Set Inactive
      </button>
    </div>
  );
};

describe('ModuleContext', () => {
  // Sample modules for testing using the factory function
  const testModules: Record<string, TestModule> = {
    module1: createTestModule({
      id: 'module1',
      name: 'Test Module 1',
      type: 'radar' as ModuleType,
      status: 'active',
      position: { x: 0, y: 0 },
      level: 1,
      isActive: true,
    }),
    module2: createTestModule({
      id: 'module2',
      name: 'Test Module 2',
      type: 'hangar' as ModuleType,
      status: 'inactive',
      position: { x: 10, y: 10 },
      level: 1,
      isActive: false,
    }),
  };

  // Sample buildings for testing
  const testBuildings: Record<string, TestBuilding> = {
    building1: {
      id: 'building1',
      name: 'Colony Building',
      type: 'colony' as BuildingType,
      attachmentPoints: [
        {
          id: 'ap1',
          position: { x: 0, y: 0 },
          allowedTypes: ['radar', 'hangar'] as ModuleType[],
          occupied: false,
        },
        {
          id: 'ap2',
          position: { x: 10, y: 0 },
          allowedTypes: ['radar', 'hangar'] as ModuleType[],
          occupied: false,
        },
      ],
      level: 1,
      status: 'active',
      modules: [],
    },
  };

  let moduleManager: ModuleManagerWrapper;
  let serviceRegistry: Record<string, unknown>;

  beforeEach(() => {
    moduleManager = new ModuleManagerWrapper(testModules, testBuildings);
    serviceRegistry = createMockServiceRegistry(moduleManager);
  });

  afterEach(() => {
    // Clean up after each test
    moduleManager.reset();
  });

  it('provides the initial modules from ModuleManager', () => {
    render(
      <ServiceProvider value={serviceRegistry}>
        <ModuleProvider manager={moduleManager}>
          <ModuleList />
        </ModuleProvider>
      </ServiceProvider>
    );

    expect(screen.getByTestId('module-module1')).toBeInTheDocument();
    expect(screen.getByTestId('module-module2')).toBeInTheDocument();
  });

  it('provides the active module IDs from ModuleManager', () => {
    render(
      <ServiceProvider value={serviceRegistry}>
        <ModuleProvider manager={moduleManager}>
          <ActiveModulesList />
        </ModuleProvider>
      </ServiceProvider>
    );

    expect(screen.getByTestId('active-module-module1')).toBeInTheDocument();
    expect(screen.getByTestId('active-module-module2')).toBeInTheDocument();
  });

  it('allows retrieving a specific module', () => {
    render(
      <ServiceProvider value={serviceRegistry}>
        <ModuleProvider manager={moduleManager}>
          <ModuleDetail id="module1" />
        </ModuleProvider>
      </ServiceProvider>
    );

    expect(screen.getByTestId('module-detail-module1')).toBeInTheDocument();
    expect(screen.getByTestId('module-name')).toHaveTextContent('Test Module 1');
    expect(screen.getByTestId('module-type')).toHaveTextContent('radar');
  });

  it('updates modules when they are modified through the ModuleManager', async () => {
    render(
      <ServiceProvider value={serviceRegistry}>
        <ModuleProvider manager={moduleManager}>
          <ModuleDetail id="module1" />
        </ModuleProvider>
      </ServiceProvider>
    );

    // Initial state
    expect(screen.getByTestId('module-name')).toHaveTextContent('Test Module 1');

    // Update the module through the ModuleManager
    act(() => {
      moduleManager.updateModule('module1', { name: 'Updated Module 1' });
    });

    // Check if the UI was updated
    expect(screen.getByTestId('module-name')).toHaveTextContent('Updated Module 1');
  });

  it('allows activating and deactivating modules', async () => {
    render(
      <ServiceProvider value={serviceRegistry}>
        <ModuleProvider manager={moduleManager}>
          <ModuleActions id="module2" />
          <ActiveModulesList />
        </ModuleProvider>
      </ServiceProvider>
    );

    // Initial state - module2 should be active (as set in the wrapper)
    expect(screen.getByTestId('active-module-module2')).toBeInTheDocument();

    // Deactivate module2
    act(() => {
      screen.getByTestId('deactivate-button').click();
    });

    // Module2 should not be in the active list anymore
    expect(screen.queryByTestId('active-module-module2')).not.toBeInTheDocument();

    // Activate module2 again
    act(() => {
      screen.getByTestId('activate-button').click();
    });

    // Module2 should be back in the active list
    expect(screen.getByTestId('active-module-module2')).toBeInTheDocument();
  });

  it('updates module status', async () => {
    render(
      <ServiceProvider value={serviceRegistry}>
        <ModuleProvider manager={moduleManager}>
          <ModuleActions id="module1" />
          <ModuleDetail id="module1" />
        </ModuleProvider>
      </ServiceProvider>
    );

    // Initial state
    expect(screen.getByTestId('module-status')).toHaveTextContent('active');

    // Set module to inactive
    act(() => {
      screen.getByTestId('set-inactive-button').click();
    });

    // Check if status was updated
    expect(screen.getByTestId('module-status')).toHaveTextContent('inactive');

    // Set module back to active
    act(() => {
      screen.getByTestId('set-active-button').click();
    });

    // Check if status was updated again
    expect(screen.getByTestId('module-status')).toHaveTextContent('active');
  });

  it('handles new modules being created', async () => {
    render(
      <ServiceProvider value={serviceRegistry}>
        <ModuleProvider manager={moduleManager}>
          <ModuleList />
        </ModuleProvider>
      </ServiceProvider>
    );

    // Initial state - only module1 and module2
    expect(screen.getByTestId('module-module1')).toBeInTheDocument();
    expect(screen.getByTestId('module-module2')).toBeInTheDocument();
    expect(screen.queryByTestId('module-module3')).not.toBeInTheDocument();

    // Create a new module using the factory function
    act(() => {
      moduleManager.createModule({
        id: 'module3',
        name: 'Test Module 3',
        type: 'exploration' as ModuleType,
        position: { x: 20, y: 20 },
      });
    });

    // Check if the new module appears in the list
    expect(screen.getByTestId('module-module3')).toBeInTheDocument();
  });

  it('handles modules being removed', async () => {
    render(
      <ServiceProvider value={serviceRegistry}>
        <ModuleProvider manager={moduleManager}>
          <ModuleList />
        </ModuleProvider>
      </ServiceProvider>
    );

    // Initial state - module1 and module2 exist
    expect(screen.getByTestId('module-module1')).toBeInTheDocument();
    expect(screen.getByTestId('module-module2')).toBeInTheDocument();

    // Remove module2
    act(() => {
      moduleManager.removeModule('module2');
    });

    // Check if module2 was removed from the list
    expect(screen.getByTestId('module-module1')).toBeInTheDocument();
    expect(screen.queryByTestId('module-module2')).not.toBeInTheDocument();
  });

  it('loads modules by type correctly', () => {
    moduleManager.createModule({
      id: 'radar1',
      type: 'radar' as ModuleType,
    });

    moduleManager.createModule({
      id: 'radar2',
      type: 'radar' as ModuleType,
    });

    moduleManager.createModule({
      id: 'hangar1',
      type: 'hangar' as ModuleType,
    });

    const radarModules = moduleManager.getModulesByType('radar' as ModuleType);
    const hangarModules = moduleManager.getModulesByType('hangar' as ModuleType);

    expect(radarModules.length).toBe(3); // Including the initial radar module
    expect(hangarModules.length).toBe(2); // Including the initial hangar module
  });

  it('associates modules with buildings correctly', () => {
    // Add a module to a building
    act(() => {
      moduleManager.createModule({
        id: 'building1-module',
        name: 'Building Module',
        type: 'radar' as ModuleType,
        buildingId: 'building1',
        attachmentPointId: 'ap1',
      });
    });

    // Check if module was associated with the building
    const buildingModules = moduleManager.getModulesByBuildingId('building1');
    expect(buildingModules.length).toBe(1);
    expect(buildingModules[0].id).toBe('building1-module');

    // Check if building has the module
    const building = moduleManager.getBuilding('building1');
    expect(building?.modules?.includes('building1-module')).toBe(true);
  });

  it('handles upgrading modules', async () => {
    // Render a component that displays module level
    render(
      <ServiceProvider value={serviceRegistry}>
        <ModuleProvider manager={moduleManager}>
          <ModuleDetail id="module1" />
        </ModuleProvider>
      </ServiceProvider>
    );

    // Check initial level
    expect(screen.getByTestId('module-detail-module1')).toBeInTheDocument();

    // We haven't implemented the level display in the test component, so let's check directly
    expect(moduleManager.getModule('module1')?.level).toBe(1);

    // Upgrade the module
    act(() => {
      moduleManager.upgradeModule?.('module1');
    });

    // Check if the level increased
    expect(moduleManager.getModule('module1')?.level).toBe(2);
  });

  it('handles attaching modules to buildings', async () => {
    render(
      <ServiceProvider value={serviceRegistry}>
        <ModuleProvider manager={moduleManager}>
          <ModuleDetail id="module1" />
        </ModuleProvider>
      </ServiceProvider>
    );

    // Initially, module should not be attached to any building
    expect(moduleManager.getModule('module1')?.buildingId).toBeUndefined();
    expect(moduleManager.getModule('module1')?.attachmentPointId).toBeUndefined();

    // Get the building with attachment points
    const building = moduleManager.getBuilding('building1');
    expect(building).not.toBeNull();

    // Check initial attachment point state
    const attachmentPoint = building!.attachmentPoints[0];
    expect(attachmentPoint.occupied).toBe(false);
    expect(attachmentPoint.currentModule).toBeUndefined();

    // Attach the module
    act(() => {
      moduleManager.attachModule?.('module1', 'building1', attachmentPoint.id);
    });

    // Check that module got attached
    expect(moduleManager.getModule('module1')?.buildingId).toBe('building1');
    expect(moduleManager.getModule('module1')?.attachmentPointId).toBe(attachmentPoint.id);

    // Check that attachment point is now occupied
    const updatedBuilding = moduleManager.getBuilding('building1');
    const updatedAttachmentPoint = updatedBuilding!.attachmentPoints[0];
    expect(updatedAttachmentPoint.occupied).toBe(true);
    expect(updatedAttachmentPoint.currentModule).toBe('module1');

    // Check that module is in the building's modules list
    expect(updatedBuilding!.modules).toContain('module1');
  });

  it('handles detaching modules from buildings', async () => {
    render(
      <ServiceProvider value={serviceRegistry}>
        <ModuleProvider manager={moduleManager}>
          <ModuleDetail id="module1" />
        </ModuleProvider>
      </ServiceProvider>
    );

    // First attach a module to a building
    const building = moduleManager.getBuilding('building1');
    const attachmentPoint = building!.attachmentPoints[0];

    act(() => {
      moduleManager.attachModule?.('module1', 'building1', attachmentPoint.id);
    });

    // Verify module was attached
    expect(moduleManager.getModule('module1')?.buildingId).toBe('building1');

    // Now detach the module
    act(() => {
      moduleManager.detachModule?.('module1');
    });

    // Check that module got detached
    expect(moduleManager.getModule('module1')?.buildingId).toBeUndefined();
    expect(moduleManager.getModule('module1')?.attachmentPointId).toBeUndefined();

    // Check that attachment point is no longer occupied
    const updatedBuilding = moduleManager.getBuilding('building1');
    const updatedAttachmentPoint = updatedBuilding!.attachmentPoints[0];
    expect(updatedAttachmentPoint.occupied).toBe(false);
    expect(updatedAttachmentPoint.currentModule).toBeUndefined();

    // Check that module is no longer in the building's modules list
    expect(updatedBuilding!.modules).not.toContain('module1');
  });

  it('handles edge cases for module attachment', async () => {
    // Test attaching to non-existent building
    expect(moduleManager.attachModule?.('module1', 'non-existent-building', 'ap1')).toBe(false);

    // Test attaching non-existent module
    expect(moduleManager.attachModule?.('non-existent-module', 'building1', 'ap1')).toBe(false);

    // Test attaching to non-existent attachment point
    expect(moduleManager.attachModule?.('module1', 'building1', 'non-existent-ap')).toBe(false);

    // Create a new module with incompatible type
    const incompatibleModule = moduleManager.createModule({
      id: 'incompatible-module',
      type: 'storage' as ModuleType, // Not in the allowed types for ap1
    });

    // Try to attach module with incompatible type
    expect(moduleManager.attachModule?.(incompatibleModule.id, 'building1', 'ap1')).toBe(false);

    // Attach a module to make the attachment point occupied
    moduleManager.attachModule?.('module1', 'building1', 'ap1');

    // Try to attach another module to the same attachment point
    expect(moduleManager.attachModule?.('module2', 'building1', 'ap1')).toBe(false);
  });

  it('handles edge cases for detaching modules', async () => {
    // Test detaching non-existent module
    expect(moduleManager.detachModule?.('non-existent-module')).toBe(false);

    // Test detaching module that's not attached to a building
    expect(moduleManager.detachModule?.('module1')).toBe(false);

    // Test detaching from non-existent building (first attach to a building, then modify the module)
    act(() => {
      moduleManager.attachModule?.('module1', 'building1', 'ap1');
      // Manually change the buildingId to a non-existent one
      moduleManager.updateModule('module1', { buildingId: 'non-existent-building' });
    });

    expect(moduleManager.detachModule?.('module1')).toBe(false);

    // Test detaching with non-existent attachment point
    act(() => {
      // Reset
      moduleManager.reset();
      moduleManager.setModules(testModules);
      moduleManager.setBuildings(testBuildings);

      // Attach properly
      moduleManager.attachModule?.('module1', 'building1', 'ap1');
      // Manually change the attachmentPointId
      moduleManager.updateModule('module1', { attachmentPointId: 'non-existent-ap' });
    });

    expect(moduleManager.detachModule?.('module1')).toBe(false);
  });

  it('handles event validation correctly', async () => {
    // Mock console.error to detect validation errors
    const originalConsoleError = console.error;
    const mockConsoleError = vi.fn();
    console.error = mockConsoleError;

    try {
      // Create an event subscription to check what gets emitted
      let receivedEvent: ModuleEventDataMap[EventType.MODULE_UPDATED] | null = null;
      const unsubscribe = moduleManager.eventBus.subscribe(EventType.MODULE_UPDATED, event => {
        receivedEvent = event as ModuleEventDataMap[EventType.MODULE_UPDATED];
      });

      // First create a valid event
      act(() => {
        moduleManager.updateModule('module1', { name: 'Updated Name' });
      });

      // Check that event was properly validated and emitted
      expect(receivedEvent).not.toBeNull();
      if (receivedEvent) {
        const event = receivedEvent as unknown as ModuleEventDataMap[EventType.MODULE_UPDATED];
        expect(event.type).toBe(EventType.MODULE_UPDATED);
        expect(event.moduleId).toBe('module1');
      }
      expect(mockConsoleError).not.toHaveBeenCalled();

      // Reset for next test
      receivedEvent = null;

      // Create a function to emit an invalid event
      const emitInvalidEvent = () => {
        const eventData = {
          type: EventType.MODULE_UPDATED,
          timestamp: Date.now(),
          // Missing moduleId and moduleType
          updates: { name: 'Invalid Update' },
        } as unknown as ModuleEventDataMap[EventType.MODULE_UPDATED];

        validateAndEmitEvent(moduleManager.eventBus, EventType.MODULE_UPDATED, eventData);
      };

      // This should throw due to validation failure
      expect(emitInvalidEvent).toThrow();
      expect(mockConsoleError).toHaveBeenCalled();
      expect(receivedEvent).toBeNull(); // Event should not have been emitted

      unsubscribe();
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });

  it('tests getAllModulesByCategory functionality', async () => {
    // Add some modules with different categories
    moduleManager.createModule({
      id: 'radar1',
      type: 'radar' as ModuleType,
    });

    moduleManager.createModule({
      id: 'hangar1',
      type: 'hangar' as ModuleType,
    });

    moduleManager.createModule({
      id: 'exploration1',
      type: 'exploration' as ModuleType,
    });

    // Get modules by category
    const modulesByCategory = moduleManager.getAllModulesByCategory();

    // Check that modules are correctly categorized
    expect(modulesByCategory['radar']).toBeDefined();
    expect(modulesByCategory['hangar']).toBeDefined();
    expect(modulesByCategory['exploration']).toBeDefined();

    // Check that modules are in the right categories
    const radarModules = modulesByCategory['radar'];
    const hangarModules = modulesByCategory['hangar'];
    const explorationModules = modulesByCategory['exploration'];

    expect(radarModules.some(m => m.id === 'radar1')).toBe(true);
    expect(hangarModules.some(m => m.id === 'hangar1')).toBe(true);
    expect(explorationModules.some(m => m.id === 'exploration1')).toBe(true);
  });
});

/**
 * Convert ModuleStatus enum to string literal for compatibility
 */
function moduleStatusToString(status: ModuleStatus): 'active' | 'constructing' | 'inactive' {
  switch (status) {
    case ModuleStatus.ACTIVE:
      return 'active';
    case ModuleStatus.CONSTRUCTING:
      return 'constructing';
    case ModuleStatus.INACTIVE:
      return 'inactive';
    default:
      return 'inactive'; // Default fallback
  }
}
