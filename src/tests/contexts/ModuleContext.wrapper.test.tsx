import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ModuleProvider,
  useActiveModules,
  useModule,
  useModuleActions,
  useModules,
  useSelectedModule,
} from '../../contexts/ModuleContext';
import { EventBus } from '../../lib/events/EventBus';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { Module, ModuleStatus } from '../../types/modules/ModuleTypes';

// Create a mock implementation of ModuleManagerWrapper
const createMockModuleManagerWrapper = () => {
  // Mock modules for testing
  const mockModules: Module[] = [
    {
      id: 'module-1',
      name: 'Test Module 1',
      type: 'hangar' as ModuleType,
      status: ModuleStatus.ACTIVE,
      level: 1,
      isActive: true,
      position: { x: 0, y: 0 },
    },
    {
      id: 'module-2',
      name: 'Test Module 2',
      type: 'radar' as ModuleType,
      status: ModuleStatus.INACTIVE,
      level: 2,
      isActive: false,
      position: { x: 10, y: 10 },
    },
  ];

  // Create a real EventBus for testing
  const eventBus = new EventBus<BaseEvent>();

  return {
    getModules: jest.fn().mockReturnValue(mockModules),
    getModule: jest.fn().mockImplementation((id: string) => mockModules.find(m => m.id === id)),
    getModulesByType: jest
      .fn()
      .mockImplementation((type: ModuleType) => mockModules.filter(m => m.type === type)),
    getActiveModules: jest.fn().mockReturnValue([mockModules[0]]),
    getBuildings: jest
      .fn()
      .mockReturnValue([{ id: 'building-1', type: 'colony', attachmentPoints: [], modules: [] }]),
    getModuleCategories: jest.fn().mockReturnValue(['production', 'utility', 'research']),
    getModulesByBuildingId: jest.fn().mockReturnValue([]),
    activateModule: jest.fn(),
    deactivateModule: jest.fn(),
    eventBus,
    dispatch: jest.fn(),
    // Methods to emit events for testing
    emitModuleCreated: (module: Module) => {
      eventBus.emit({
        type: EventType.MODULE_CREATED,
        moduleId: module.id,
        moduleType: module.type,
        timestamp: Date.now(),
        data: { module },
      });
    },
    emitModuleUpdated: (moduleId: string, updates: Partial<Module>) => {
      eventBus.emit({
        type: EventType.MODULE_UPDATED,
        moduleId,
        moduleType: 'hangar',
        timestamp: Date.now(),
        data: { moduleId, updates },
      });
    },
    emitModuleRemoved: (moduleId: string) => {
      eventBus.emit({
        type: EventType.MODULE_REMOVED,
        moduleId,
        moduleType: 'hangar',
        timestamp: Date.now(),
        data: { moduleId },
      });
    },
    emitModuleStatusChanged: (moduleId: string, status: ModuleStatus) => {
      eventBus.emit({
        type: EventType.MODULE_STATUS_CHANGED,
        moduleId,
        moduleType: 'hangar',
        timestamp: Date.now(),
        data: { moduleId, status },
      });
    },
  };
};

// Component for testing module data display
const ModuleDisplay = ({ moduleId }: { moduleId: string }) => {
  const module = useModule(moduleId);

  if (!module) return <div>Module not found</div>;

  return (
    <div data-testid="module-display">
      <h3 data-testid="module-name">{module.name}</h3>
      <p data-testid="module-type">{module.type}</p>
      <p data-testid="module-status">{module.status}</p>
      <p data-testid="module-level">Level: {module.level}</p>
    </div>
  );
};

// Component for testing active modules
const ActiveModulesDisplay = () => {
  const activeModules = useActiveModules();

  return (
    <div data-testid="active-modules">
      <h3>Active Modules ({activeModules.length})</h3>
      <ul>
        {activeModules.map(module => (
          <li key={module.id} data-testid={`active-module-${module.id}`}>
            {module.name} - {module.type}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Component for testing module actions
const ModuleActionsComponent = () => {
  const { addModule, updateModule, removeModule, selectModule, activateModule, deactivateModule } =
    useModuleActions();

  const selectedModule = useSelectedModule();
  const moduleMap = useModules(state => state.modules);

  const handleAddModule = () => {
    const newModule: Module = {
      id: 'module-3',
      name: 'New Test Module',
      type: 'research' as ModuleType,
      status: ModuleStatus.CONSTRUCTING,
      level: 1,
      isActive: false,
      position: { x: 20, y: 20 },
    };
    addModule(newModule);
  };

  const handleUpdateModule = (moduleId: string) => {
    updateModule(moduleId, {
      name: 'Updated Module Name',
      level: 3,
    });
  };

  const handleRemoveModule = (moduleId: string) => {
    removeModule(moduleId);
  };

  const handleSelectModule = (moduleId: string) => {
    selectModule(moduleId);
  };

  const handleActivateModule = (moduleId: string) => {
    activateModule(moduleId);
  };

  const handleDeactivateModule = (moduleId: string) => {
    deactivateModule(moduleId);
  };

  return (
    <div data-testid="module-actions">
      <button data-testid="add-module-btn" onClick={handleAddModule}>
        Add Module
      </button>

      <div>
        <h3>Module Actions</h3>
        <ul>
          {Object.values(moduleMap).map((module: Module) => (
            <li key={module.id} data-testid={`module-item-${module.id}`}>
              {module.name}
              <button
                data-testid={`update-module-${module.id}`}
                onClick={() => handleUpdateModule(module.id)}
              >
                Update
              </button>
              <button
                data-testid={`remove-module-${module.id}`}
                onClick={() => handleRemoveModule(module.id)}
              >
                Remove
              </button>
              <button
                data-testid={`select-module-${module.id}`}
                onClick={() => handleSelectModule(module.id)}
              >
                Select
              </button>
              <button
                data-testid={`activate-module-${module.id}`}
                onClick={() => handleActivateModule(module.id)}
              >
                Activate
              </button>
              <button
                data-testid={`deactivate-module-${module.id}`}
                onClick={() => handleDeactivateModule(module.id)}
              >
                Deactivate
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Selected Module</h3>
        {selectedModule ? (
          <div data-testid="selected-module">
            {selectedModule.name} - {selectedModule.type}
          </div>
        ) : (
          <div>No module selected</div>
        )}
      </div>
    </div>
  );
};

describe('ModuleContext with ModuleManagerWrapper', () => {
  let mockModuleManagerWrapper: ReturnType<typeof createMockModuleManagerWrapper>;

  beforeEach(() => {
    mockModuleManagerWrapper = createMockModuleManagerWrapper();
  });

  test('should display module details correctly', () => {
    render(
      <ModuleProvider manager={mockModuleManagerWrapper}>
        <ModuleDisplay moduleId="module-1" />
      </ModuleProvider>
    );

    expect(screen.getByTestId('module-name')).toHaveTextContent('Test Module 1');
    expect(screen.getByTestId('module-type')).toHaveTextContent('hangar');
    expect(screen.getByTestId('module-status')).toHaveTextContent('active');
    expect(screen.getByTestId('module-level')).toHaveTextContent('Level: 1');
  });

  test('should display active modules correctly', () => {
    render(
      <ModuleProvider manager={mockModuleManagerWrapper}>
        <ActiveModulesDisplay />
      </ModuleProvider>
    );

    expect(screen.getByTestId('active-modules')).toBeInTheDocument();
    expect(screen.getByTestId('active-module-module-1')).toBeInTheDocument();
    expect(screen.getByTestId('active-module-module-1')).toHaveTextContent(
      'Test Module 1 - hangar'
    );
  });

  test('should handle adding a module', async () => {
    render(
      <ModuleProvider manager={mockModuleManagerWrapper}>
        <ModuleActionsComponent />
      </ModuleProvider>
    );

    // Initial state has 2 modules
    expect(screen.getByTestId('module-item-module-1')).toBeInTheDocument();
    expect(screen.getByTestId('module-item-module-2')).toBeInTheDocument();

    // Add a new module
    fireEvent.click(screen.getByTestId('add-module-btn'));

    // Should now have 3 modules
    await waitFor(() => {
      expect(screen.getByTestId('module-item-module-3')).toBeInTheDocument();
    });
  });

  test('should handle updating a module', async () => {
    render(
      <ModuleProvider manager={mockModuleManagerWrapper}>
        <ModuleActionsComponent />
        <ModuleDisplay moduleId="module-1" />
      </ModuleProvider>
    );

    // Check initial name
    expect(screen.getByTestId('module-name')).toHaveTextContent('Test Module 1');

    // Update the module
    fireEvent.click(screen.getByTestId('update-module-module-1'));

    // Check updated name
    await waitFor(() => {
      expect(screen.getByTestId('module-name')).toHaveTextContent('Updated Module Name');
    });
  });

  test('should handle removing a module', async () => {
    render(
      <ModuleProvider manager={mockModuleManagerWrapper}>
        <ModuleActionsComponent />
      </ModuleProvider>
    );

    // Initial state has 2 modules
    expect(screen.getByTestId('module-item-module-1')).toBeInTheDocument();
    expect(screen.getByTestId('module-item-module-2')).toBeInTheDocument();

    // Remove a module
    fireEvent.click(screen.getByTestId('remove-module-module-1'));

    // Should now have only module-2
    await waitFor(() => {
      expect(screen.queryByTestId('module-item-module-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('module-item-module-2')).toBeInTheDocument();
    });
  });

  test('should handle selecting a module', async () => {
    render(
      <ModuleProvider manager={mockModuleManagerWrapper}>
        <ModuleActionsComponent />
      </ModuleProvider>
    );

    // Initially no module selected
    expect(screen.queryByTestId('selected-module')).not.toBeInTheDocument();

    // Select a module
    fireEvent.click(screen.getByTestId('select-module-module-2'));

    // Module 2 should be selected
    await waitFor(() => {
      expect(screen.getByTestId('selected-module')).toHaveTextContent('Test Module 2 - radar');
    });
  });

  test('should handle activating/deactivating a module', () => {
    render(
      <ModuleProvider manager={mockModuleManagerWrapper}>
        <ModuleActionsComponent />
      </ModuleProvider>
    );

    // Test activating a module
    fireEvent.click(screen.getByTestId('activate-module-module-2'));
    expect(mockModuleManagerWrapper.activateModule).toHaveBeenCalledWith('module-2');

    // Test deactivating a module
    fireEvent.click(screen.getByTestId('deactivate-module-module-1'));
    expect(mockModuleManagerWrapper.deactivateModule).toHaveBeenCalledWith('module-1');
  });

  test('should handle module events from the manager', async () => {
    render(
      <ModuleProvider manager={mockModuleManagerWrapper}>
        <ModuleActionsComponent />
        <ModuleDisplay moduleId="module-1" />
      </ModuleProvider>
    );

    // Simulate a module update event
    act(() => {
      mockModuleManagerWrapper.emitModuleUpdated('module-1', {
        name: 'Event Updated Name',
        level: 10,
      });
    });

    // Check that the update was processed
    await waitFor(() => {
      expect(screen.getByTestId('module-name')).toHaveTextContent('Event Updated Name');
      expect(screen.getByTestId('module-level')).toHaveTextContent('Level: 10');
    });

    // Simulate a module status change event
    act(() => {
      mockModuleManagerWrapper.emitModuleStatusChanged('module-1', ModuleStatus.UPGRADING);
    });

    // Check that the status was updated
    await waitFor(() => {
      expect(screen.getByTestId('module-status')).toHaveTextContent('upgrading');
    });

    // Simulate a module remove event
    act(() => {
      mockModuleManagerWrapper.emitModuleRemoved('module-2');
    });

    // Check that module-2 was removed
    await waitFor(() => {
      expect(screen.queryByTestId('module-item-module-2')).not.toBeInTheDocument();
    });

    // Simulate a new module created event
    const newModule: Module = {
      id: 'module-4',
      name: 'Event Created Module',
      type: 'defense' as ModuleType,
      status: ModuleStatus.ACTIVE,
      level: 1,
      isActive: true,
      position: { x: 30, y: 30 },
    };

    act(() => {
      mockModuleManagerWrapper.emitModuleCreated(newModule);
    });

    // Check that the new module appears
    await waitFor(() => {
      expect(screen.getByTestId('module-item-module-4')).toBeInTheDocument();
      expect(screen.getByTestId('module-item-module-4')).toHaveTextContent('Event Created Module');
    });
  });
});
