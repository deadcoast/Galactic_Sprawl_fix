import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { EventBus, EventListener } from '../lib/events/EventBus';
import { BuildingType, ModuleType } from '../types/buildings/ModuleTypes';
import { Position } from '../types/core/GameTypes';
import { BaseEvent, EventType } from '../types/events/EventTypes';
import { IModuleManager, ModuleStatus } from '../types/modules/ModuleTypes';
import {
  ModuleActivatedEventData,
  ModuleCreatedEventData,
  ModuleDeactivatedEventData,
  ModuleRemovedEventData,
  ModuleStatusChangedEventData,
  ModuleUpdatedEventData,
  validateEventData,
} from '../utils/events/EventDataTypes';
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
 * Helper function to validate and emit events with proper type checking
 */
function validateAndEmitEvent<T extends EventType>(
  eventBus: EventBus<BaseEvent>,
  eventType: T,
  eventData: BaseEvent
): void {
  if (!validateEventData(eventType, eventData)) {
    console.error(`Invalid event data for ${eventType}`, eventData);
    throw new Error(`Invalid event data for ${eventType}`);
  }

  eventBus.emit(eventData);
}

// Create a ModuleManagerWrapper for testing that implements IModuleManager
class ModuleManagerWrapper implements IModuleManager {
  private modules: Record<string, TestModule> = {};
  private activeModuleIds: string[] = [];
  private buildings: Record<string, TestBuilding> = {};
  public eventBus: EventBus<BaseEvent>;
  private moduleCategories: string[] = ['radar', 'hangar', 'exploration', 'research'];

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
        if (!this.buildings[module.buildingId].modules!.includes(module.id)) {
          this.buildings[module.buildingId].modules!.push(module.id);
        }
      }
    });
  }

  // Required by IModuleManager
  getModules(): TestModule[] {
    return Object.values(this.modules);
  }

  // For backward compatibility
  getAllModules() {
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
  getBuildings(): TestBuilding[] {
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

  createModule(moduleData: Partial<TestModule> = {}) {
    const module = createTestModule(moduleData);
    const id = module.id;
    this.modules[id] = module;

    // Associate with building if buildingId is present
    if (module.buildingId && this.buildings[module.buildingId]) {
      if (!this.buildings[module.buildingId].modules) {
        this.buildings[module.buildingId].modules = [];
      }
      this.buildings[module.buildingId].modules!.push(id);
    }

    // Emit module created event with correct event data structure
    const eventData: ModuleCreatedEventData & BaseEvent = {
      type: EventType.MODULE_CREATED,
      timestamp: Date.now(),
      moduleId: id,
      moduleType: module.type,
      module: module,
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
          this.buildings[updatedModule.buildingId].modules?.filter(moduleId => moduleId !== id) ||
          [];
      }

      // Add to new building
      if (this.buildings[updates.buildingId]) {
        if (!this.buildings[updates.buildingId].modules) {
          this.buildings[updates.buildingId].modules = [];
        }
        this.buildings[updates.buildingId].modules!.push(id);
      }
    }

    // Emit module updated event with correct event data structure
    const eventData: ModuleUpdatedEventData & BaseEvent = {
      type: EventType.MODULE_UPDATED,
      timestamp: Date.now(),
      moduleId: id,
      moduleType: updatedModule.type,
      updates,
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
        this.buildings[module.buildingId].modules?.filter(moduleId => moduleId !== id) || [];
    }

    delete this.modules[id];

    // Remove from active modules if it's active
    if (this.activeModuleIds.includes(id)) {
      this.activeModuleIds = this.activeModuleIds.filter(moduleId => moduleId !== id);
    }

    // Emit module removed event with correct event data structure
    const eventData: ModuleRemovedEventData & BaseEvent = {
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
    const eventData: ModuleActivatedEventData & BaseEvent = {
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
    const eventData: ModuleDeactivatedEventData & BaseEvent = {
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
    const updatedModule = { ...this.modules[id], status };
    this.modules[id] = updatedModule;

    // Emit module status changed event with correct event data structure
    const eventData: ModuleStatusChangedEventData & BaseEvent = {
      type: EventType.MODULE_STATUS_CHANGED,
      timestamp: Date.now(),
      moduleId: id,
      moduleType: updatedModule.type,
      status,
      previousStatus: oldStatus,
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

  // Required by IModuleManager to subscribe to events
  subscribe(eventType: EventType, listener: EventListener<BaseEvent>) {
    return this.eventBus.subscribe(eventType, listener);
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
        <ModuleProvider>
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
        <ModuleProvider>
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
        <ModuleProvider>
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
        <ModuleProvider>
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
        <ModuleProvider>
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
        <ModuleProvider>
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
        <ModuleProvider>
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
        <ModuleProvider>
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
