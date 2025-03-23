import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  GlobalAutomationManager,
  GlobalRoutine,
} from '../../../managers/automation/GlobalAutomationManager';
import { AutomationRule } from '../../../managers/game/AutomationManager';
import '../../../styles/automation.css';
import AutomationRuleEditor from './AutomationRuleEditor';

// Define the routine type enum to match what's in GlobalAutomationManager
enum RoutineType {
  RESOURCE_BALANCING = 'RESOURCE_BALANCING',
  PERFORMANCE_OPTIMIZATION = 'PERFORMANCE_OPTIMIZATION',
  EMERGENCY_RESPONSE = 'EMERGENCY_RESPONSE',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
}

// Define SystemId type to match what's expected
type SystemId = string;

interface AutomationVisualizationProps {
  automationManager?: GlobalAutomationManager;
  className?: string;
}

export const AutomationVisualization: React.FC<AutomationVisualizationProps> = ({
  automationManager,
  className = '',
}) => {
  const [routines, setRoutines] = useState<GlobalRoutine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<{
    type: string;
    system: string;
    status: string;
    search: string;
  }>({
    type: 'all',
    system: 'all',
    status: 'all',
    search: '',
  });

  // Add states for rule editor
  const [showRuleEditor, setShowRuleEditor] = useState<boolean>(false);
  const [currentRule, setCurrentRule] = useState<AutomationRule | undefined>(undefined);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');

  // Get all available types and systems for filtering
  const routineTypes = Object.values(RoutineType);
  const systems = [
    ...new Set(
      routines.map(routine =>
        Array.isArray(routine.systems) && routine.systems.length > 0
          ? routine.systems[0]
          : 'unknown'
      )
    ),
  ];

  useEffect(() => {
    if (!automationManager) {
      return;
    }

    // Initial load
    loadRoutines();

    // Subscribe to automation events
    const unsubscribe = subscribeToAutomationEvents();

    return () => {
      unsubscribe();
    };
  }, [automationManager]);

  const loadRoutines = () => {
    if (!automationManager) {
      return;
    }

    setLoading(true);
    try {
      const allRoutines = automationManager.getAllRoutines();
      setRoutines(allRoutines);
    } catch (error) {
      console.error('Failed to load automation routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToAutomationEvents = () => {
    if (!automationManager) {
      return () => {};
    }

    // This would be implemented with the event system
    // For now, we'll just return an empty function
    return () => {};
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    // Validate event and target
    if (!event || !event.target) {
      return;
    }
    
    const { name, value } = event.target;
    setFilter(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleRoutine = (routineId: string) => {
    if (!automationManager) {
      return;
    }

    const routine = routines.find(r => r.id === routineId);
    if (!routine) {
      return;
    }

    try {
      if (routine.enabled) {
        automationManager.disableRoutine(routineId);
      } else {
        automationManager.enableRoutine(routineId);
      }

      // Update local state
      setRoutines(prev => prev.map(r => (r.id === routineId ? { ...r, enabled: !r.enabled } : r)));
    } catch (error) {
      console.error(`Failed to toggle routine ${routineId}:`, error);
    }
  };

  const handleRemoveRoutine = (routineId: string) => {
    if (!automationManager) {
      return;
    }

    try {
      automationManager.unregisterRoutine(routineId);

      // Update local state
      setRoutines(prev => prev.filter(r => r.id !== routineId));
    } catch (error) {
      console.error(`Failed to remove routine ${routineId}:`, error);
    }
  };

  const handleRunRoutine = (routineId: string) => {
    if (!automationManager) {
      return;
    }

    try {
      // Find the routine first
      const routine = routines.find(r => r.id === routineId);
      if (!routine) {
        return;
      }

      // Manually trigger the routine execution
      // Note: Since executeRoutine is private, we'll just update the UI
      // In a real implementation, we would need a public method to execute a routine
      console.warn(`Executing routine: ${routineId}`);

      // Update local state to reflect the routine was run
      const now = new Date().getTime(); // Use number instead of string for lastRun
      setRoutines(prev => prev.map(r => (r.id === routineId ? { ...r, lastRun: now } : r)));
    } catch (error) {
      console.error(`Failed to run routine ${routineId}:`, error);
    }
  };

  // Add function to create a new rule
  const handleCreateRule = () => {
    setCurrentRule(undefined);
    setSelectedModuleId('default-module');
    setShowRuleEditor(true);
  };

  // Add function to edit an existing rule
  const handleEditRule = (ruleId: string) => {
    // Assuming automationManager has a method to get rule by ID
    if (automationManager) {
      const rule = automationManager.getRule(ruleId);
      if (rule) {
        setCurrentRule(rule);
        setSelectedModuleId(rule.moduleId);
        setShowRuleEditor(true);
      }
    }
  };

  // Add function to save a rule
  const handleSaveRule = (rule: AutomationRule) => {
    if (automationManager) {
      // Assuming automationManager has methods to register/update rules
      if (rule.id && automationManager.getRule(rule.id)) {
        automationManager.updateRule(rule.id, rule);
      } else {
        automationManager.registerRule(rule);
      }

      // Refresh routines list
      loadRoutines();

      // Close editor
      setShowRuleEditor(false);
    }
  };

  // Filter routines based on current filter settings
  const filteredRoutines = routines.filter(routine => {
    const matchesType = filter.type === 'all' || routine.type === filter.type;
    const matchesSystem =
      filter.system === 'all' ||
      (Array.isArray(routine.systems) &&
        routine.systems.some(sys => sys === (filter.system as SystemId)));
    const matchesStatus =
      filter.status === 'all' ||
      (filter.status === 'active' && routine.enabled) ||
      (filter.status === 'inactive' && !routine.enabled);
    const matchesSearch =
      !filter.search ||
      routine.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      routine.description.toLowerCase().includes(filter.search.toLowerCase()) ||
      (Array.isArray(routine.tags) &&
        routine.tags.some(tag => tag.toLowerCase().includes(filter.search.toLowerCase())));

    return matchesType && matchesSystem && matchesStatus && matchesSearch;
  });

  // Get routine type icon based on type
  const getRoutineTypeIcon = (type: string) => {
    switch (type) {
      case RoutineType.RESOURCE_BALANCING:
        return '⚖️';
      case RoutineType.PERFORMANCE_OPTIMIZATION:
        return '⚡';
      case RoutineType.EMERGENCY_RESPONSE:
        return '🚨';
      case RoutineType.SYSTEM_MAINTENANCE:
        return '🔧';
      default:
        return '🤖';
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number | undefined) => {
    if (!timestamp) {
      return 'Never';
    }

    const now = new Date().getTime();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) {
      return `${diffSec}s ago`;
    }
    if (diffSec < 3600) {
      return `${Math.floor(diffSec / 60)}m ago`;
    }
    if (diffSec < 86400) {
      return `${Math.floor(diffSec / 3600)}h ago`;
    }
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  // Get priority label and color
  const getPriorityLabel = (priority: number) => {
    if (priority >= 90) {
      return { label: 'Critical', color: '#f44336' };
    }
    if (priority >= 70) {
      return { label: 'High', color: '#ff9800' };
    }
    if (priority >= 40) {
      return { label: 'Medium', color: '#2196f3' };
    }
    if (priority >= 10) {
      return { label: 'Low', color: '#4caf50' };
    }
    return { label: 'Background', color: '#9e9e9e' };
  };

  if (loading) {
    return (
      <div className={`automation-visualization automation-visualization--loading ${className}`}>
        <div className="automation-visualization__loading-spinner">
          {/* Spinner component would go here */}
          <div>Loading...</div>
        </div>
        <div className="automation-visualization__loading-text">Loading automation routines...</div>
      </div>
    );
  }

  if (showRuleEditor) {
    return (
      <div className={`automation-visualization ${className}`}>
        <AutomationRuleEditor
          rule={currentRule}
          moduleId={selectedModuleId}
          onSave={handleSaveRule}
          onCancel={() => setShowRuleEditor(false)}
        />
      </div>
    );
  }

  return (
    <div className={`automation-visualization ${className}`}>
      <div className="automation-visualization__header">
        <h2 className="automation-visualization__title">
          <span style={{ marginRight: '8px' }}>🤖</span>
          Automation Routines
        </h2>
        <div className="automation-visualization__stats">
          <div className="automation-visualization__stat">
            <span className="automation-visualization__stat-label">Total:</span>
            <span className="automation-visualization__stat-value">{routines.length}</span>
          </div>
          <div className="automation-visualization__stat">
            <span className="automation-visualization__stat-label">Active:</span>
            <span className="automation-visualization__stat-value">
              {routines.filter(r => r.enabled).length}
            </span>
          </div>
        </div>
      </div>

      <div className="automation-visualization__filters">
        <div className="automation-visualization__filter">
          <label className="automation-visualization__filter-label">Type:</label>
          <select
            className="automation-visualization__filter-select"
            name="type"
            value={filter.type}
            onChange={handleFilterChange}
          >
            <option value="all">All Types</option>
            {routineTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="automation-visualization__filter">
          <label className="automation-visualization__filter-label">System:</label>
          <select
            className="automation-visualization__filter-select"
            name="system"
            value={filter.system}
            onChange={handleFilterChange}
          >
            <option value="all">All Systems</option>
            {systems.map(system => (
              <option key={system} value={system}>
                {system}
              </option>
            ))}
          </select>
        </div>

        <div className="automation-visualization__filter">
          <label className="automation-visualization__filter-label">Status:</label>
          <select
            className="automation-visualization__filter-select"
            name="status"
            value={filter.status}
            onChange={handleFilterChange}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <input
          type="text"
          className="automation-visualization__search"
          name="search"
          value={filter.search}
          onChange={handleFilterChange}
          placeholder="Search routines..."
        />
      </div>

      <div className="automation-visualization__routines">
        {filteredRoutines.length === 0 ? (
          <div className="automation-visualization__empty">
            <div>No automation routines found</div>
            <div>Try adjusting your filters or create a new routine</div>
          </div>
        ) : (
          <div className="automation-visualization__routines-list">
            {filteredRoutines.map(routine => {
              const priorityInfo = getPriorityLabel(routine.priority);
              const systemName =
                Array.isArray(routine.systems) && routine.systems.length > 0
                  ? routine.systems[0]
                  : 'unknown';

              return (
                <div
                  key={routine.id}
                  className={`automation-visualization__routine ${
                    routine.enabled
                      ? 'automation-visualization__routine--active'
                      : 'automation-visualization__routine--inactive'
                  }`}
                >
                  <div className="automation-visualization__routine-header">
                    <div className="automation-visualization__routine-type">
                      {getRoutineTypeIcon(routine.type)}
                    </div>
                    <div className="automation-visualization__routine-name">{routine.name}</div>
                    <div
                      className="automation-visualization__routine-priority"
                      style={{ backgroundColor: priorityInfo.color }}
                    >
                      {priorityInfo.label}
                    </div>
                  </div>

                  <div className="automation-visualization__routine-description">
                    {routine.description}
                  </div>

                  <div className="automation-visualization__routine-meta">
                    <div className="automation-visualization__routine-systems">
                      System: {systemName}
                    </div>
                    {routine.interval && (
                      <div className="automation-visualization__routine-interval">
                        Interval: {routine.interval}ms
                      </div>
                    )}
                    <div className="automation-visualization__routine-last-run">
                      Last run: {formatRelativeTime(routine.lastRun)}
                    </div>
                  </div>

                  {Array.isArray(routine.tags) && routine.tags.length > 0 && (
                    <div className="automation-visualization__routine-tags">
                      {routine.tags.map((tag, index) => (
                        <div
                          key={`${routine.id}-tag-${index}`}
                          className="automation-visualization__routine-tag"
                        >
                          {tag}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="automation-visualization__routine-controls">
                    <button
                      className="automation-visualization__routine-control automation-visualization__routine-control--run"
                      onClick={() => handleRunRoutine(routine.id)}
                      title="Run now"
                    >
                      ▶️
                    </button>
                    <button
                      className="automation-visualization__routine-control automation-visualization__routine-control--toggle"
                      onClick={() => handleToggleRoutine(routine.id)}
                      title={routine.enabled ? 'Disable' : 'Enable'}
                    >
                      {routine.enabled ? '⏸️' : '▶️'}
                    </button>
                    <button
                      className="automation-visualization__routine-control automation-visualization__routine-control--remove"
                      onClick={() => handleRemoveRoutine(routine.id)}
                      title="Remove"
                    >
                      🗑️
                    </button>
                    <button
                      className="automation-visualization__routine-control automation-visualization__routine-control--edit"
                      onClick={() => handleEditRule(routine.id)}
                      title="Edit Rule"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="automation-visualization__create">
        <button className="automation-visualization__create-button" onClick={handleCreateRule}>
          + Create New Routine
        </button>
      </div>
    </div>
  );
};

export default AutomationVisualization;
