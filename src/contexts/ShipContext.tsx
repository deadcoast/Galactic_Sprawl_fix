import * as React from 'react';
import { createContext, ReactNode, useContext, useReducer } from 'react';
import { BaseEffect, EffectStack } from '../effects/types_effects/EffectTypes';
import { CommonShipStats } from '../types/ships/CommonShipTypes';
import { WeaponMount, WeaponState } from '../types/weapons/WeaponTypes';

// Ship State Types
// ------------------------------------------------------------

export type ShipStatus =
  | 'idle'
  | 'ready'
  | 'engaging'
  | 'patrolling'
  | 'retreating'
  | 'disabled'
  | 'damaged';

export interface ShipState {
  id: string;
  name: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponMount[];
  stats: CommonShipStats;
  effects: EffectStack;
  lastUpdate: number;
}

// Action Types
// ------------------------------------------------------------

type ShipAction =
  | { type: 'UPDATE_STATUS'; status: ShipStatus }
  | { type: 'UPDATE_HEALTH'; health: number }
  | { type: 'UPDATE_SHIELD'; shield: number }
  | { type: 'UPDATE_STATS'; stats: Partial<CommonShipStats> }
  | { type: 'ADD_EFFECT'; effect: BaseEffect }
  | { type: 'REMOVE_EFFECT'; effectId: string }
  | { type: 'FIRE_WEAPON'; weaponId: string }
  | { type: 'UPDATE_WEAPON'; weaponId: string; updates: Partial<WeaponMount> }
  | { type: 'UPDATE_WEAPON_STATE'; weaponId: string; state: Partial<WeaponState> }
  | { type: 'RESET_STATE' };

// Context Type
// ------------------------------------------------------------

interface ShipContextType {
  state: ShipState;
  dispatch: React.Dispatch<ShipAction>;
}

// Create Context
// ------------------------------------------------------------

const ShipContext = createContext<ShipContextType | undefined>(undefined);

// Reducer
// ------------------------------------------------------------

function shipReducer(state: ShipState, action: ShipAction): ShipState {
  const now = Date.now();

  switch (action.type) {
    case 'UPDATE_STATUS':
      return {
        ...state,
        status: action.status,
        lastUpdate: now,
      };

    case 'UPDATE_HEALTH':
      return {
        ...state,
        health: Math.max(0, Math.min(action.health, state.maxHealth)),
        status: action.health <= 0 ? 'disabled' : state.status,
        lastUpdate: now,
      };

    case 'UPDATE_SHIELD':
      return {
        ...state,
        shield: Math.max(0, Math.min(action.shield, state.maxShield)),
        lastUpdate: now,
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.stats,
        },
        lastUpdate: now,
      };

    case 'ADD_EFFECT':
      return {
        ...state,
        effects: {
          ...state.effects,
          effects: [...state.effects.effects, action.effect],
          history: [
            ...state.effects.history,
            {
              effectId: action.effect.id,
              timestamp: now,
              action: 'applied',
            },
          ],
        },
        lastUpdate: now,
      };

    case 'REMOVE_EFFECT':
      return {
        ...state,
        effects: {
          ...state.effects,
          effects: state.effects.effects.filter(e => e.id !== action.effectId),
          history: [
            ...state.effects.history,
            {
              effectId: action.effectId,
              timestamp: now,
              action: 'removed',
            },
          ],
        },
        lastUpdate: now,
      };

    case 'FIRE_WEAPON': {
      const weaponIndex = state.weapons.findIndex(w => w.id === action.weaponId);
      if (weaponIndex === -1) {
        return state;
      }

      const weapon = state.weapons[weaponIndex];
      if (!weapon.currentWeapon) {
        return state;
      }

      const weapons = [...state.weapons];
      weapons[weaponIndex] = {
        ...weapon,
        currentWeapon: {
          ...weapon.currentWeapon,
          state: {
            ...weapon.currentWeapon.state,
            status: 'cooling',
          },
        },
      };

      return {
        ...state,
        weapons,
        lastUpdate: now,
      };
    }

    case 'UPDATE_WEAPON': {
      const weaponIndex = state.weapons.findIndex(w => w.id === action.weaponId);
      if (weaponIndex === -1) {
        return state;
      }

      const weapons = [...state.weapons];
      weapons[weaponIndex] = {
        ...weapons[weaponIndex],
        ...action.updates,
      };

      return {
        ...state,
        weapons,
        lastUpdate: now,
      };
    }

    case 'UPDATE_WEAPON_STATE': {
      const weaponIndex = state.weapons.findIndex(w => w.id === action.weaponId);
      if (weaponIndex === -1) {
        return state;
      }

      const weapon = state.weapons[weaponIndex];
      if (!weapon.currentWeapon) {
        return state;
      }

      const weapons = [...state.weapons];
      weapons[weaponIndex] = {
        ...weapon,
        currentWeapon: {
          ...weapon.currentWeapon,
          state: {
            ...weapon.currentWeapon.state,
            ...action.state,
          },
        },
      };

      return {
        ...state,
        weapons,
        lastUpdate: now,
      };
    }

    case 'RESET_STATE':
      return {
        ...state,
        status: 'idle',
        health: state.maxHealth,
        shield: state.maxShield,
        effects: {
          targetId: state.id,
          effects: [],
          history: [],
        },
        lastUpdate: now,
      };

    default:
      return state;
  }
}

// Provider Component
// ------------------------------------------------------------

interface ShipProviderProps {
  children: ReactNode;
  initialState: Omit<ShipState, 'effects' | 'lastUpdate'>;
}

export function ShipProvider({ children, initialState }: ShipProviderProps) {
  const [state, dispatch] = useReducer(shipReducer, {
    ...initialState,
    effects: {
      targetId: initialState.id,
      effects: [],
      history: [],
    },
    lastUpdate: Date.now(),
  });

  return <ShipContext.Provider value={{ state, dispatch }}>{children}</ShipContext.Provider>;
}

// Hook
// ------------------------------------------------------------

export function useShipState() {
  const context = useContext(ShipContext);
  if (context === undefined) {
    throw new Error('useShipState must be used within a ShipProvider');
  }
  return context;
}

// Action Creators
// ------------------------------------------------------------

export const shipActions = {
  updateStatus: (status: ShipStatus): ShipAction => ({
    type: 'UPDATE_STATUS',
    status,
  }),

  updateHealth: (health: number): ShipAction => ({
    type: 'UPDATE_HEALTH',
    health,
  }),

  updateShield: (shield: number): ShipAction => ({
    type: 'UPDATE_SHIELD',
    shield,
  }),

  updateStats: (stats: Partial<CommonShipStats>): ShipAction => ({
    type: 'UPDATE_STATS',
    stats,
  }),

  addEffect: (effect: BaseEffect): ShipAction => ({
    type: 'ADD_EFFECT',
    effect,
  }),

  removeEffect: (effectId: string): ShipAction => ({
    type: 'REMOVE_EFFECT',
    effectId,
  }),

  fireWeapon: (weaponId: string): ShipAction => ({
    type: 'FIRE_WEAPON',
    weaponId,
  }),

  updateWeapon: (weaponId: string, updates: Partial<WeaponMount>): ShipAction => ({
    type: 'UPDATE_WEAPON',
    weaponId,
    updates,
  }),

  updateWeaponState: (weaponId: string, state: Partial<WeaponState>): ShipAction => ({
    type: 'UPDATE_WEAPON_STATE',
    weaponId,
    state,
  }),

  resetState: (): ShipAction => ({
    type: 'RESET_STATE',
  }),
};
