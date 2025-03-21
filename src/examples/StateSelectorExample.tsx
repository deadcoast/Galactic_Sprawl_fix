/**
 * @context: example.state, component-library
 * 
 * Example demonstrating how to use context selectors for optimized state management
 */
import React, { createContext, useReducer } from 'react';
import { createStandardContextSelectors } from '../utils/state/contextSelectors';

// Define our application state
interface AppState {
  user: {
    id: string;
    name: string;
    email: string;
    preferences: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  } | null;
  resources: {
    [key: string]: {
      id: string;
      amount: number;
      rate: number;
    };
  };
  ui: {
    sidebar: {
      open: boolean;
      width: number;
    };
    modal: {
      open: boolean;
      type: string | null;
    };
  };
  lastUpdated: number;
}

// Define actions for our reducer
type AppAction =
  | { type: 'SET_USER'; payload: AppState['user'] }
  | { type: 'UPDATE_RESOURCE'; payload: { id: string; amount: number } }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'OPEN_MODAL'; payload: string }
  | { type: 'CLOSE_MODAL' };

// Initial state
const initialState: AppState = {
  user: null,
  resources: {
    energy: { id: ResourceType.ENERGY, amount: 100, rate: 10 },
    minerals: { id: ResourceType.MINERALS, amount: 50, rate: 5 }
  },
  ui: {
    sidebar: {
      open: true,
      width: 250,
    },
    modal: {
      open: false,
      type: null,
    },
  },
  lastUpdated: Date.now(),
};

// Create a reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        lastUpdated: Date.now(),
      };

    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: {
          ...state.resources,
          [action.payload.id]: {
            ...state.resources[action.payload.id],
            amount: action.payload.amount,
          },
        },
        lastUpdated: Date.now(),
      };

    case 'SET_THEME':
      return {
        ...state,
        user: state.user
          ? {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                theme: action.payload,
              },
            }
          : null,
        lastUpdated: Date.now(),
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebar: {
            ...state.ui.sidebar,
            open: !state.ui.sidebar.open,
          },
        },
        lastUpdated: Date.now(),
      };

    case 'OPEN_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modal: {
            open: true,
            type: action.payload,
          },
        },
        lastUpdated: Date.now(),
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modal: {
            ...state.ui.modal,
            open: false,
          },
        },
        lastUpdated: Date.now(),
      };

    default:
      return state;
  }
}

// Create context
const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | undefined>(
  undefined
);

// Create the provider component
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Create selectors using our enhanced utility
const {
  useState,
  useDispatch,
  useSelector,
  createPropertySelector,
  createNestedPropertySelector,
  createMultiPropertySelector,
} = createStandardContextSelectors<AppState, AppAction>(AppContext);

// Create specific selectors for common state access patterns
const useUser = createPropertySelector('user');
const useResources = createPropertySelector('resources');
const useUIState = createPropertySelector('ui');
const useSidebarState = createNestedPropertySelector(['ui', 'sidebar']);
const useModalState = createNestedPropertySelector(['ui', 'modal']);
const useTheme = () => {
  const user = useUser();
  return user?.preferences.theme || 'light';
};

// Export everything
export {
  useSelector,
  useDispatch,
  useState,
  useUser,
  useResources,
  useUIState,
  useSidebarState,
  useModalState,
  useTheme,
};

// Example components demonstrating selector usage
export function ResourceDisplay() {
  // Only re-renders when resources change
  const resources = useResources();
  
  return (
    <div>
      <h3>Resources</h3>
      <ul>
        {Object.values(resources).map(resource => (
          <li key={resource.id}>
            {resource.id}: {resource.amount} (+{resource.rate}/min)
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UserInfo() {
  // Only re-renders when user info changes
  const user = useUser();
  const dispatch = useDispatch();
  
  if (!user) {
    return (
      <div>
        <h3>Please Log In</h3>
        <button onClick={() => 
          dispatch({
            type: 'SET_USER',
            payload: {
              id: 'user1',
              name: 'Test User',
              email: 'test@example.com',
              preferences: {
                theme: 'light',
                notifications: true,
              },
            },
          })
        }>
          Log In
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <h3>User Information</h3>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <div>
        <h4>Preferences</h4>
        <p>Theme: {user.preferences.theme}</p>
        <button onClick={() => 
          dispatch({
            type: 'SET_THEME',
            payload: user.preferences.theme === 'light' ? 'dark' : 'light',
          })
        }>
          Toggle Theme
        </button>
      </div>
    </div>
  );
}

export function SidebarControl() {
  // Only re-renders when sidebar state changes
  const sidebar = useSidebarState();
  const dispatch = useDispatch();
  
  return (
    <div>
      <h3>Sidebar Controls</h3>
      <p>Sidebar is {sidebar.open ? 'Open' : 'Closed'}</p>
      <p>Width: {sidebar.width}px</p>
      <button onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}>
        {sidebar.open ? 'Close Sidebar' : 'Open Sidebar'}
      </button>
    </div>
  );
}

export function AppDemo() {
  return (
    <AppProvider>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <UserInfo />
        </div>
        <div>
          <ResourceDisplay />
        </div>
        <div>
          <SidebarControl />
        </div>
      </div>
    </AppProvider>
  );
} 