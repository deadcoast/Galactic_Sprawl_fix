## Test Infrastructure

### Setup and Utilities

- **src/tests/setup.ts**: Central test setup including WebSocket server management, localStorage mocks, and global test hooks
  - `disableAllWebSocketServers()`: Disables WebSocket servers globally for tests
  - `enableAllWebSocketServers()`: Re-enables WebSocket servers after tests
  - `getTestWebSocketPort(serviceName)`: Gets a unique port for a test WebSocket server
  - `registerTestWebSocketServer(port, closeFunction)`: Registers a WebSocket server for cleanup
  - `createTestWebSocketServer(port?)`: Creates a test WebSocket server with proper cleanup

### Test Factories

- **src/tests/factories/createTestModuleEvents.ts**: Factory for creating isolated ModuleEvents instances for tests
- **src/tests/factories/createTestResourceManager.ts**: Factory for creating isolated ResourceManager instances for tests
- **src/tests/factories/createTestGameProvider.tsx**: Factory for creating isolated GameContext providers for component tests
  - Uses global WebSocket management from setup.ts
  - Provides helper methods for manipulating game state in tests
