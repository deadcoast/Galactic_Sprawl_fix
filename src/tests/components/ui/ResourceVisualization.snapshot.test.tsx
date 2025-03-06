import { render, screen } from '@testing-library/react';
import { Dispatch, ReactNode, useCallback, useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { ResourceVisualization } from '../../../components/ui/ResourceVisualization';
import { GameContext } from '../../../contexts/GameContext';

// Define our own minimal types to avoid conflicts with actual GameContext types
interface ResourceState {
  minerals: number;
  energy: number;
  population: number;
  research: number;
}

interface TestGameState {
  resources: ResourceState;
  resourceRates: ResourceState;
}

type TestGameAction = {
  type: 'UPDATE_RESOURCES';
  resources: Partial<ResourceState>;
};

// Define a type that matches the GameContext value structure but with our test types
interface TestGameContextValue {
  state: TestGameState;
  dispatch: Dispatch<TestGameAction>;
  updateShip: () => void;
  addMission: () => void;
  updateSector: () => void;
}

// Create a simplified test provider that focuses only on what ResourceVisualization needs
function TestGameProvider({
  children,
  initialResources = {
    minerals: 1000,
    energy: 1000,
    population: 100,
    research: 0,
  },
}: {
  children: ReactNode;
  initialResources?: ResourceState;
}) {
  // Create a simplified reducer that only handles resource updates
  const reducer = (state: TestGameState, action: TestGameAction): TestGameState => {
    switch (action.type) {
      case 'UPDATE_RESOURCES':
        return {
          ...state,
          resources: { ...state.resources, ...action.resources },
        };
      default:
        return state;
    }
  };

  // Create a minimal state that only includes what the ResourceVisualization needs
  const [state, dispatch] = useReducer(reducer, {
    resources: initialResources,
    resourceRates: {
      minerals: 0,
      energy: 0,
      population: 0,
      research: 0,
    },
  });

  // Create stub implementations for the other context methods that aren't used by ResourceVisualization
  const updateShip = useCallback(() => {}, []);
  const addMission = useCallback(() => {}, []);
  const updateSector = useCallback(() => {}, []);

  // Create a context value that looks like what GameContext would provide
  // but is actually just a simple object with the minimal properties needed
  const contextValue: TestGameContextValue = {
    state,
    dispatch,
    updateShip,
    addMission,
    updateSector,
  };

  // Use type assertion to bypass type checking - necessary for testing
  return (
    <GameContext.Provider
      value={contextValue as unknown as Parameters<typeof GameContext.Provider>[0]['value']}
    >
      {children}
    </GameContext.Provider>
  );
}

describe('ResourceVisualization Component', () => {
  it('renders with default resource values', () => {
    render(
      <TestGameProvider>
        <ResourceVisualization />
      </TestGameProvider>
    );

    // Check for resource labels
    expect(screen.getByText('minerals')).toBeInTheDocument();
    expect(screen.getByText('energy')).toBeInTheDocument();
    expect(screen.getByText('population')).toBeInTheDocument();
    expect(screen.getByText('research')).toBeInTheDocument();

    // Use getAllByText for values that appear multiple times
    const mineralValues = screen.getAllByText(/1,000/, { exact: false });
    expect(mineralValues.length).toBeGreaterThan(0);

    const populationValue = screen.getByText('100');
    expect(populationValue).toBeInTheDocument();

    const researchValue = screen.getByText('0');
    expect(researchValue).toBeInTheDocument();
  });

  it('renders with low resource warning', () => {
    render(
      <TestGameProvider
        initialResources={{
          minerals: 900, // Just below the low threshold (1000)
          energy: 1000,
          population: 100,
          research: 0,
        }}
      >
        <ResourceVisualization />
      </TestGameProvider>
    );

    // Check for low minerals warning
    expect(screen.getByText('Low minerals levels')).toBeInTheDocument();
  });

  it('renders with critical resource warning', () => {
    render(
      <TestGameProvider
        initialResources={{
          minerals: 400, // Below the critical threshold (500)
          energy: 300, // Below the critical threshold (400)
          population: 100,
          research: 0,
        }}
      >
        <ResourceVisualization />
      </TestGameProvider>
    );

    // Check for critical resource warnings
    expect(screen.getByText('Critical minerals levels')).toBeInTheDocument();
    expect(screen.getByText('Critical energy levels')).toBeInTheDocument();
  });
});
