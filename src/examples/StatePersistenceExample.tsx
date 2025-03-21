/**
 * @context: example.state-persistence, component-library
 * 
 * Example demonstrating how to use state persistence and migration utilities
 */
import React, { useEffect, useState } from 'react';
import { createPersistedState } from '../utils/state/statePersistence';
import { createMigrationBuilder } from '../utils/state/stateMigration';

// ----- VERSION 1 STATE -----
interface UserPreferencesV1 {
  theme: 'light' | 'dark';
  fontSize: number;
}

interface AppStateV1 {
  version: 1;
  username: string;
  preferences: UserPreferencesV1;
  lastUpdated: number;
}

// ----- VERSION 2 STATE -----
interface UserPreferencesV2 {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  colorBlindMode: boolean;
}

interface AppStateV2 {
  version: 2;
  username: string;
  email: string; // Added in V2
  preferences: UserPreferencesV2;
  lastLogin: number; // Renamed from lastUpdated
}

// ----- VERSION 3 STATE (CURRENT) -----
interface UserPreferencesV3 {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  colorBlindMode: boolean;
  notifications: {
    enabled: boolean;
    types: string[];
  };
}

interface UserProfileV3 {
  username: string;
  email: string;
  displayName: string; // Added in V3
}

interface AppStateV3 {
  version: 3;
  profile: UserProfileV3; // Restructured in V3
  preferences: UserPreferencesV3;
  lastLogin: number;
  devices: string[]; // Added in V3
}

// Current version and type
const CURRENT_VERSION = 3;
type CurrentAppState = AppStateV3;

// Initial state for new users
const initialState: CurrentAppState = {
  version: CURRENT_VERSION,
  profile: {
    username: '',
    email: '',
    displayName: '',
  },
  preferences: {
    theme: 'system',
    fontSize: 16,
    colorBlindMode: false,
    notifications: {
      enabled: true,
      types: ['direct-message', 'mention'],
    },
  },
  lastLogin: Date.now(),
  devices: [],
};

// Define migrations
const migrationManager = createMigrationBuilder<CurrentAppState>(CURRENT_VERSION)
  // V1 to V2 migration
  .addMigration(
    2,
    (oldState: unknown) => {
      const v1State = oldState as AppStateV1;
      
      // Create V2 state from V1
      const v2State: AppStateV2 = {
        version: 2,
        username: v1State.username,
        email: `${v1State.username}@example.com`, // Generate default email
        preferences: {
          ...v1State.preferences,
          theme: v1State.preferences.theme === 'light' ? 'light' : 'dark', // No system theme in v1
          colorBlindMode: false, // New field with default
        },
        lastLogin: v1State.lastUpdated, // Rename field
      };
      
      return v2State as unknown as CurrentAppState;
    },
    'Migrate from v1 to v2: Add email and colorBlindMode'
  )
  // V2 to V3 migration
  .addMigration(
    3,
    (oldState: unknown) => {
      const v2State = oldState as AppStateV2;
      
      // Create V3 state from V2
      const v3State: AppStateV3 = {
        version: 3,
        profile: {
          username: v2State.username,
          email: v2State.email,
          displayName: v2State.username, // Default display name to username
        },
        preferences: {
          ...v2State.preferences,
          notifications: {
            enabled: true, // Default to enabled
            types: ['direct-message'], // Default notification types
          },
        },
        lastLogin: v2State.lastLogin,
        devices: [], // Initialize empty devices array
      };
      
      return v3State;
    },
    'Migrate from v2 to v3: Restructure user data and add notifications'
  )
  .build({
    debug: true,
    performanceMonitoring: true,
    schemaValidator: (state: unknown) => {
      // Basic schema validation
      const typedState = state as Partial<CurrentAppState>;
      return (
        typeof typedState.version === 'number' &&
        typedState.version === CURRENT_VERSION &&
        typedState.profile !== undefined &&
        typeof typedState.profile === 'object' &&
        typedState.preferences !== undefined &&
        typeof typedState.preferences === 'object'
      );
    },
  });

// Create persisted state hook with migration support
const useAppState = createPersistedState<CurrentAppState>(initialState, {
  key: 'app-state',
  version: CURRENT_VERSION,
  migrate: (state: unknown, fromVersion: number) => {
    return migrationManager.migrateState(state, fromVersion);
  },
  debug: true,
  debounceTime: 500,
});

// Example App using persisted state
export function StatePersistenceDemo() {
  const [appState, setAppState] = useAppState();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Update handlers
  const updateProfile = (updates: Partial<UserProfileV3>) => {
    setAppState({
      ...appState,
      profile: {
        ...appState.profile,
        ...updates,
      },
    });
  };
  
  const updatePreferences = (updates: Partial<UserPreferencesV3>) => {
    setAppState({
      ...appState,
      preferences: {
        ...appState.preferences,
        ...updates,
      },
    });
  };
  
  const addDevice = (device: string) => {
    setAppState({
      ...appState,
      devices: [...appState.devices, device],
      lastLogin: Date.now(),
    });
  };
  
  if (loading) {
    return <div>Loading state...</div>;
  }
  
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>State Persistence Example</h1>
      <p>This example demonstrates persisted state with schema migration</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>User Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
          <label>Username:</label>
          <input
            value={appState.profile.username}
            onChange={(e) => updateProfile({ username: e.target.value })}
          />
          
          <label>Email:</label>
          <input
            value={appState.profile.email}
            onChange={(e) => updateProfile({ email: e.target.value })}
          />
          
          <label>Display Name:</label>
          <input
            value={appState.profile.displayName}
            onChange={(e) => updateProfile({ displayName: e.target.value })}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Preferences</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
          <label>Theme:</label>
          <select
            value={appState.preferences.theme}
            onChange={(e) => updatePreferences({ 
              theme: e.target.value as 'light' | 'dark' | 'system' 
            })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          
          <label>Font Size:</label>
          <input
            type="range"
            min="12"
            max="24"
            value={appState.preferences.fontSize}
            onChange={(e) => updatePreferences({ 
              fontSize: parseInt(e.target.value, 10) 
            })}
          />
          <div></div>
          <div>{appState.preferences.fontSize}px</div>
          
          <label>Color Blind Mode:</label>
          <input
            type="checkbox"
            checked={appState.preferences.colorBlindMode}
            onChange={(e) => updatePreferences({ 
              colorBlindMode: e.target.checked 
            })}
          />
          
          <label>Notifications:</label>
          <input
            type="checkbox"
            checked={appState.preferences.notifications.enabled}
            onChange={(e) => updatePreferences({
              notifications: {
                ...appState.preferences.notifications,
                enabled: e.target.checked,
              },
            })}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Devices</h2>
        <div>
          <ul>
            {appState.devices.length === 0 ? (
              <li>No devices registered</li>
            ) : (
              appState.devices.map((device, index) => (
                <li key={index}>{device}</li>
              ))
            )}
          </ul>
          <button
            onClick={() => 
              addDevice(`Device ${appState.devices.length + 1} - ${new Date().toLocaleString()}`)
            }
          >
            Register New Device
          </button>
        </div>
      </div>
      
      <div>
        <h2>Debug Information</h2>
        <div style={{ background: '#f0f0f0', padding: '12px', borderRadius: '4px' }}>
          <p>State Version: {appState.version}</p>
          <p>Last Login: {new Date(appState.lastLogin).toLocaleString()}</p>
          <details>
            <summary>Full State</summary>
            <pre>{JSON.stringify(appState, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div>
  );
} 