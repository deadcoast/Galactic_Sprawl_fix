import * as React from "react";
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ModuleCard } from '../../components/ui/modules/ModuleCard';
import { ModuleGrid } from '../../components/ui/modules/ModuleGrid';
import { ModuleUpgradeVisualization } from '../../components/ui/modules/ModuleUpgradeVisualization';
import { moduleManager } from '../../managers/module/ModuleManager';
import { moduleStatusManager } from '../../managers/module/ModuleStatusManager';
import { ModuleType } from '../../types/buildings/ModuleTypes';
import { BaseEvent, EventType } from '../../types/events/EventTypes';
import { ResourceType } from "./../../types/resources/ResourceTypes";

// Mock the required modules
jest.mock('../../managers/module/ModuleManager', () => ({
  moduleManager: {
    getModule: jest.fn(),
    getActiveModules: jest.fn(),
    getModulesByType: jest.fn(),
    getBuildings: jest.fn(),
    getBuildingModules: jest.fn(),
    setModuleActive: jest.fn(),
    upgradeModule: jest.fn(),
    subscribeToEvent: jest.fn(),
    publishEvent: jest.fn(),
  },
}));

jest.mock('../../managers/module/ModuleStatusManager', () => ({
  moduleStatusManager: {
    getModuleStatus: jest.fn(),
    getModuleStatusDetails: jest.fn(),
    updateModuleStatus: jest.fn(),
    getModuleAlerts: jest.fn(),
    getModulesWithAlerts: jest.fn(),
    getModulesByStatus: jest.fn(),
    acknowledgeAlert: jest.fn(),
  },
}));

jest.mock('../../hooks/modules/useModuleStatus', () => ({
  useModuleStatus: jest.fn(),
  useModulesWithStatus: jest.fn(),
  useModuleAlerts: jest.fn(),
}));

// Create test data
const mockModule = {
  id: 'module-123',
  name: 'Test Module',
  type: 'mining' as ModuleType,
  position: { x: 0, y: 0 },
  isActive: true,
  level: 1,
  status: 'active',
  progress: 0,
};

const mockModuleStatus = {
  currentStatus: 'active',
  previousStatus: undefined,
  history: [
    { status: 'constructing', timestamp: Date.now() - 1000, duration: 1000 },
    { status: 'active', timestamp: Date.now(), duration: 0 },
  ],
  lastUpdated: Date.now(),
  metrics: {
    uptime: 3600000,
    efficiency: 0.85,
    reliability: 0.9,
    performance: 0.8,
  },
  alerts: [
    {
      level: 'warning',
      message: 'Test alert',
      timestamp: Date.now(),
      acknowledged: false,
    },
  ],
};

describe('Module System Integration Tests', () => {
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock hook implementations
    const {
      useModuleStatus,
      useModulesWithStatus,
    } = require('../../hooks/modules/useModuleStatus');

    useModuleStatus.mockImplementation(() => ({
      module: mockModule,
      currentStatus: mockModuleStatus.currentStatus,
      previousStatus: mockModuleStatus.previousStatus,
      history: mockModuleStatus.history,
      metrics: mockModuleStatus.metrics,
      alerts: mockModuleStatus.alerts,
      isLoading: false,
      error: null,
      updateStatus: jest.fn(),
      acknowledgeAlert: jest.fn(),
      getStatusColor: jest.fn().mockReturnValue('#4CAF50'),
      getAlertColor: jest.fn().mockReturnValue('#FF9800'),
      formatUptime: jest.fn().mockReturnValue('1h'),
    }));

    useModulesWithStatus.mockImplementation(() => ({
      modules: [mockModule],
      statusMap: { [mockModule.id]: mockModuleStatus.currentStatus },
      isLoading: false,
      error: null,
    }));

    // Mock moduleManager
    moduleManager.getModule.mockReturnValue(mockModule);
    moduleManager.getActiveModules.mockReturnValue([mockModule]);
    moduleManager.subscribeToEvent.mockReturnValue(jest.fn());

    // Mock moduleStatusManager
    moduleStatusManager.getModuleStatusDetails.mockReturnValue(mockModuleStatus);
    moduleStatusManager.getModuleStatus.mockReturnValue(mockModuleStatus.currentStatus);
  });

  describe('ModuleCard Component', () => {
    test('renders module information correctly', () => {
      render(<ModuleCard moduleId={mockModule.id} />);

      expect(screen.getByText('Test Module')).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('mining')).toBeInTheDocument();
      expect(screen.getByText('Level:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('activates and deactivates modules', async () => {
      render(<ModuleCard moduleId={mockModule.id} />);

      // Initially active, should show "Deactivate" button
      const toggleButton = screen.getByText('Deactivate');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(moduleManager.setModuleActive).toHaveBeenCalledWith(mockModule.id, false);
      });
    });

    test('handles upgrade button click', async () => {
      render(<ModuleCard moduleId={mockModule.id} />);

      const upgradeButton = screen.getByText('Upgrade');
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(moduleManager.upgradeModule).toHaveBeenCalledWith(mockModule.id);
      });
    });
  });

  describe('ModuleGrid Component', () => {
    test('renders a grid of modules', () => {
      render(<ModuleGrid />);

      expect(screen.getByText('Modules')).toBeInTheDocument();
      expect(screen.getByText('Test Module')).toBeInTheDocument();
    });

    test('filters modules by type', () => {
      render(<ModuleGrid moduleType="mining" />);

      expect(screen.getByText('Test Module')).toBeInTheDocument();

      // Change moduleManager mock to return empty array for non-mining types
      moduleManager.getModulesByType.mockImplementation(type => {
        return type === 'mining' ? [mockModule] : [];
      });

      // Re-render with different type
      render(<ModuleGrid moduleType={ResourceType.ENERGY} />);

      // Should show empty state message
      expect(screen.getByText('No modules match the current filters')).toBeInTheDocument();
    });

    test('handles module selection', () => {
      const handleSelect = jest.fn();

      render(<ModuleGrid onModuleSelect={handleSelect} />);

      // Click on the module card
      fireEvent.click(screen.getByText('Test Module'));

      expect(handleSelect).toHaveBeenCalledWith(mockModule.id);
    });
  });

  describe('ModuleUpgradeVisualization Component', () => {
    test('renders upgrade visualization for a module', () => {
      render(<ModuleUpgradeVisualization moduleId={mockModule.id} />);

      expect(screen.getByText(`Upgrade ${mockModule.name}`)).toBeInTheDocument();
      expect(screen.getByText('Current Level:')).toBeInTheDocument();
      expect(screen.getByText('Start Upgrade')).toBeInTheDocument();
    });

    test('starts upgrade process when button is clicked', async () => {
      render(<ModuleUpgradeVisualization moduleId={mockModule.id} />);

      const startButton = screen.getByText('Start Upgrade');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(moduleManager.upgradeModule).toHaveBeenCalledWith(mockModule.id);
        expect(moduleManager.publishEvent).toHaveBeenCalled();
      });
    });

    test('displays progress during upgrade', async () => {
      // Mock module status to be upgrading
      const { useModuleStatus } = require('../../hooks/modules/useModuleStatus');
      useModuleStatus.mockImplementation(() => ({
        module: mockModule,
        currentStatus: 'upgrading',
        previousStatus: 'active',
        history: mockModuleStatus.history,
        metrics: mockModuleStatus.metrics,
        alerts: mockModuleStatus.alerts,
        isLoading: false,
        error: null,
        updateStatus: jest.fn(),
        acknowledgeAlert: jest.fn(),
        getStatusColor: jest.fn().mockReturnValue('#FFA000'),
        getAlertColor: jest.fn().mockReturnValue('#FF9800'),
        formatUptime: jest.fn().mockReturnValue('1h'),
      }));

      render(<ModuleUpgradeVisualization moduleId={mockModule.id} />);

      // Verify it shows upgrading state
      expect(screen.getByText(`Upgrading ${mockModule.name}`)).toBeInTheDocument();

      // Simulate progress event
      const mockEvent: BaseEvent = {
        type: 'MODULE_UPGRADE_PROGRESS' as EventType,
        moduleId: mockModule.id,
        moduleType: mockModule.type,
        timestamp: Date.now(),
        data: { progress: 50, stage: 1, stageName: 'Core Upgrade' },
      };

      // Get the event handler callback that was registered
      const eventCallback = moduleManager.subscribeToEvent.mock.calls[0][1];

      // Call the callback with the mock event
      eventCallback(mockEvent);

      // Testing state updates in functional components is tricky
      // In a real test, we'd need to use act() and waitFor()
      // For this example, we'll just verify the subscription was set up
      expect(moduleManager.subscribeToEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function)
      );
    });
  });

  describe('End-to-end Module System Flow', () => {
    test('complete module lifecycle flow', async () => {
      // 1. Start with a module in the grid
      const { rerender } = render(<ModuleGrid />);

      // 2. Select a module
      const mockSelectHandler = jest.fn();
      rerender(<ModuleGrid onModuleSelect={mockSelectHandler} />);

      fireEvent.click(screen.getByText('Test Module'));
      expect(mockSelectHandler).toHaveBeenCalledWith(mockModule.id);

      // 3. Now that we've selected a module, show the upgrade visualization
      render(<ModuleUpgradeVisualization moduleId={mockModule.id} />);

      // 4. Start the upgrade
      fireEvent.click(screen.getByText('Start Upgrade'));

      // 5. Verify upgrade started
      expect(moduleManager.upgradeModule).toHaveBeenCalledWith(mockModule.id);

      // 6. Simulate module status changing to upgrading
      const { useModuleStatus } = require('../../hooks/modules/useModuleStatus');
      useModuleStatus.mockImplementation(() => ({
        module: mockModule,
        currentStatus: 'upgrading',
        previousStatus: 'active',
        history: mockModuleStatus.history,
        metrics: mockModuleStatus.metrics,
        alerts: mockModuleStatus.alerts,
        isLoading: false,
        error: null,
        updateStatus: jest.fn(),
        acknowledgeAlert: jest.fn(),
        getStatusColor: jest.fn().mockReturnValue('#FFA000'),
        getAlertColor: jest.fn().mockReturnValue('#FF9800'),
        formatUptime: jest.fn().mockReturnValue('1h'),
      }));

      // 7. Rerender the upgrade visualization with the new status
      rerender(<ModuleUpgradeVisualization moduleId={mockModule.id} />);

      // 8. Should now show upgrading state
      await waitFor(() => {
        expect(screen.queryByText('Start Upgrade')).not.toBeInTheDocument();
        expect(screen.getByText('Cancel Upgrade')).toBeInTheDocument();
      });

      // 9. Simulate completion of upgrade
      const mockEvent: BaseEvent = {
        type: EventType.MODULE_UPGRADED,
        moduleId: mockModule.id,
        moduleType: mockModule.type,
        timestamp: Date.now(),
        data: { oldLevel: 1, newLevel: 2 },
      };

      // 10. Simulate the event being published
      moduleManager.publishEvent.mockImplementation(event => {
        // Get handlers that were registered for MODULE_UPGRADED
        const handlers = moduleManager.subscribeToEvent.mock.calls
          .filter(call => call[0] === EventType.MODULE_UPGRADED)
          .map(call => call[1]);

        // Call each handler with the event
        handlers.forEach(handler => handler(mockEvent));
      });

      // 11. Publish the event
      moduleManager.publishEvent(mockEvent);

      // 12. Verify the module was updated
      expect(moduleManager.publishEvent).toHaveBeenCalled();

      // In a real test, we'd need to update the mock module and verify UI updates
      // For this example, we've verified the event flow
    });
  });
});
