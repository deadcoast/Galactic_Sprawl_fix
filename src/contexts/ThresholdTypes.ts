import { Subject } from 'rxjs';

// Types
export interface Resource {
  id: string;
  name: string;
  type: 'mineral' | 'gas' | 'exotic';
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

export interface ThresholdState {
  resources: Record<string, Resource>;
  globalAutoMine: boolean;
  notifications: string[];
  presets: ThresholdPreset[];
  activePresetId: string | null;
  history: ThresholdHistoryEntry[];
}

export type ThresholdAction =
  | {
      type: 'SET_THRESHOLD';
      payload: { resourceId: string; min: number; max: number };
    }
  | { type: 'UPDATE_AMOUNT'; payload: { resourceId: string; amount: number } }
  | { type: 'TOGGLE_AUTO_MINE'; payload: { resourceId: string } }
  | { type: 'SET_GLOBAL_AUTO_MINE'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATION'; payload: number }
  | { type: 'ADD_RESOURCE'; payload: Resource }
  | { type: 'REMOVE_RESOURCE'; payload: { resourceId: string } }
  | { type: 'ADD_PRESET'; payload: ThresholdPreset }
  | { type: 'REMOVE_PRESET'; payload: { presetId: string } }
  | { type: 'APPLY_PRESET'; payload: { presetId: string } }
  | { type: 'ADD_HISTORY_ENTRY'; payload: ThresholdHistoryEntry };

export interface ThresholdEvent {
  type: 'THRESHOLD_VIOLATED' | 'AUTO_MINE_TRIGGERED' | 'STORAGE_FULL';
  resourceId: string;
  details: {
    type: 'below_minimum' | 'above_maximum';
    current: number;
    min?: number;
    max?: number;
  };
}

// Event streams
export const thresholdEvents = new Subject<ThresholdEvent>();

// Initial state
export const initialState: ThresholdState = {
  resources: {},
  globalAutoMine: false,
  notifications: [],
  presets: [
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Maintains moderate levels of all resources',
      thresholds: {},
      autoMineStates: {},
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      description: 'Maximizes resource extraction with high thresholds',
      thresholds: {},
      autoMineStates: {},
    },
    {
      id: 'conservative',
      name: 'Conservative',
      description: 'Minimizes storage usage with low thresholds',
      thresholds: {},
      autoMineStates: {},
    },
  ],
  activePresetId: null,
  history: [],
};
