import * as React from 'react';
import { ResourceType, ResourceTypeHelpers } from './../types/resources/ResourceTypes';
import { ThresholdAction, ThresholdState, initialState, thresholdEvents } from './ThresholdTypes';

// Types
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  currentAmount: number;
  maxCapacity: number;
  thresholds: {
    min: number;
    max: number;
  };
  autoMine: boolean;
}

export interface ThresholdPreset {
  id: string;
  name: string;
  description: string;
  thresholds: Record<string, { min: number; max: number }>;
  autoMineStates: Record<string, boolean>;
}

export interface ThresholdHistoryEntry {
  timestamp: number;
  resourceId: string;
  amount: number;
  thresholds: {
    min: number;
    max: number;
  };
  event: 'threshold_change' | 'amount_update' | 'auto_mine_toggle';
}

interface ThresholdContextType {
  state: ThresholdState;
  dispatch: React.Dispatch<ThresholdAction>;
}

// Helper function to get resource name for display
const getResourceName = (resourceType: ResourceType): string => {
  return ResourceTypeHelpers.getDisplayName(resourceType);
};

// Reducer
function thresholdReducer(state: ThresholdState, action: ThresholdAction): ThresholdState {
  switch (action.type) {
    case 'SET_THRESHOLD': {
      const historyEntry = {
        timestamp: Date.now(),
        resourceId: action.payload.resourceId,
        amount: state.resources[action.payload.resourceId]?.currentAmount || 0,
        thresholds: {
          min: action.payload.min,
          max: action.payload.max,
        },
        event: 'threshold_change' as const,
      };

      return {
        ...state,
        resources: {
          ...state.resources,
          [action.payload.resourceId]: {
            ...state.resources[action.payload.resourceId],
            thresholds: {
              min: action.payload.min,
              max: action.payload.max,
            },
          },
        },
        history: [...state.history, historyEntry].slice(-100),
      };
    }

    case 'UPDATE_AMOUNT': {
      const resource = state.resources[action.payload.resourceId];
      if (!resource) {
        return state;
      }

      const updatedResource = {
        ...resource,
        currentAmount: action.payload.amount,
      };

      const historyEntry = {
        timestamp: Date.now(),
        resourceId: action.payload.resourceId,
        amount: action.payload.amount,
        thresholds: resource.thresholds,
        event: 'amount_update' as const,
      };

      // Check for threshold violations
      if (updatedResource.autoMine) {
        if (updatedResource.currentAmount < updatedResource.thresholds.min) {
          thresholdEvents.next({
            type: 'THRESHOLD_VIOLATED',
            resourceId: action.payload.resourceId,
            details: {
              type: 'below_minimum',
              current: updatedResource.currentAmount,
              min: updatedResource.thresholds.min,
            },
          });
        } else if (updatedResource.currentAmount > updatedResource.thresholds.max) {
          thresholdEvents.next({
            type: 'STORAGE_FULL',
            resourceId: action.payload.resourceId,
            details: {
              type: 'above_maximum',
              current: updatedResource.currentAmount,
              max: updatedResource.thresholds.max,
            },
          });
        }
      }

      return {
        ...state,
        resources: {
          ...state.resources,
          [action.payload.resourceId]: updatedResource,
        },
        history: [...state.history, historyEntry].slice(-100),
      };
    }

    case 'TOGGLE_AUTO_MINE': {
      const resource = state.resources[action.payload.resourceId];
      if (!resource) {
        return state;
      }

      const newAutoMine = !resource.autoMine;

      const historyEntry = {
        timestamp: Date.now(),
        resourceId: action.payload.resourceId,
        amount: resource.currentAmount,
        thresholds: resource.thresholds,
        event: 'auto_mine_toggle' as const,
      };

      if (newAutoMine) {
        thresholdEvents.next({
          type: 'AUTO_MINE_TRIGGERED',
          resourceId: action.payload.resourceId,
          details: { type: 'below_minimum', current: resource.currentAmount },
        });
      }

      return {
        ...state,
        resources: {
          ...state.resources,
          [action.payload.resourceId]: {
            ...resource,
            autoMine: newAutoMine,
          },
        },
        history: [...state.history, historyEntry].slice(-100),
      };
    }

    case 'ADD_PRESET':
      return {
        ...state,
        presets: [...state.presets, action.payload],
      };

    case 'REMOVE_PRESET':
      return {
        ...state,
        presets: state.presets.filter(preset => preset.id !== action.payload.presetId),
        activePresetId:
          state.activePresetId === action.payload.presetId ? null : state.activePresetId,
      };

    case 'APPLY_PRESET': {
      const preset = state.presets.find(p => p.id === action.payload.presetId);
      if (!preset) {
        return state;
      }

      const updatedResources = { ...state.resources };
      Object.entries(preset.thresholds).forEach(([resourceId, thresholds]) => {
        if (updatedResources[resourceId]) {
          updatedResources[resourceId] = {
            ...updatedResources[resourceId],
            thresholds,
            autoMine: preset.autoMineStates[resourceId] || false,
          };
        }
      });

      return {
        ...state,
        resources: updatedResources,
        activePresetId: action.payload.presetId,
      };
    }

    case 'SET_GLOBAL_AUTO_MINE': {
      const updatedResources = Object.entries(state.resources).reduce(
        (acc, [id, resource]) => ({
          ...acc,
          [id]: { ...resource, autoMine: action.payload },
        }),
        {}
      );

      return {
        ...state,
        globalAutoMine: action.payload,
        resources: updatedResources,
      };
    }

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case 'CLEAR_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((_, index) => index !== action.payload),
      };

    case 'ADD_RESOURCE':
      return {
        ...state,
        resources: {
          ...state.resources,
          [action.payload.id]: action.payload,
        },
      };

    case 'REMOVE_RESOURCE': {
      const remainingResources = { ...state.resources };
      delete remainingResources[action.payload.resourceId];
      return {
        ...state,
        resources: remainingResources,
      };
    }

    case 'ADD_HISTORY_ENTRY':
      return {
        ...state,
        history: [...state.history, action.payload].slice(-100),
      };

    default:
      return state;
  }
}

// Context
const ThresholdContext = React.createContext<ThresholdContextType | undefined>(undefined);

// Provider
export function ThresholdProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(thresholdReducer, initialState);

  return (
    <ThresholdContext.Provider value={{ state, dispatch }}>{children}</ThresholdContext.Provider>
  );
}

// Hook
export function useThreshold() {
  const context = React.useContext(ThresholdContext);
  if (context === undefined) {
    throw new Error('useThreshold must be used within a ThresholdProvider');
  }
  return context;
}
