import React from "react";
import { render, screen } from '@testing-library/react';
import { createContext, Dispatch, ReactNode, useCallback, useReducer } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ResourceVisualization from '../../../components/ui/ResourceVisualization';
import { ResourceType } from "./../../../types/resources/ResourceTypes";
import { ResourceType } from "./../../../types/resources/ResourceTypes";

// Create a mock GameContext since we can't import it directly
interface GameContextType {
  state: TestGameState;
  dispatch: Dispatch<TestGameAction>;
  updateShip: () => void;
  addMission: () => void;
  updateSector: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

// Define our own minimal types to avoid conflicts with actual GameContext types
interface ResourceState {
  [ResourceType.MINERALS]: number;
  [ResourceType.ENERGY]: number;
  [ResourceType.POPULATION]: number;
  [ResourceType.RESEARCH]: number;
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
    [ResourceType.MINERALS]: 1000,
    [ResourceType.ENERGY]: 1000,
    [ResourceType.POPULATION]: 100,
    [ResourceType.RESEARCH]: 0,
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
      [ResourceType.MINERALS]: 0,
      [ResourceType.ENERGY]: 0,
      [ResourceType.POPULATION]: 0,
      [ResourceType.RESEARCH]: 0,
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
  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
}

// Mock the useGameState hook that ResourceVisualization uses
vi.mock('../../../contexts/GameContext', () => ({
  useGameState: (selector: (state: TestGameState) => unknown) => {
    // This mock implementation assumes the selector is extracting resources or resourceRates
    return {
      [ResourceType.MINERALS]: 1000,
      [ResourceType.ENERGY]: 1000,
      [ResourceType.POPULATION]: 100,
      [ResourceType.RESEARCH]: 0,
    };
  },
}));

describe('ResourceVisualization Component', () => {
  it('renders with default resource values', () => {
    render(
      <TestGameProvider>
        <ResourceVisualization />
      </TestGameProvider>
    );

    // Check for resource labels
    expect(screen.getByText(ensureStringResourceType(ResourceType.MINERALS))).toBeInTheDocument();
    expect(screen.getByText(ensureStringResourceType(ResourceType.ENERGY))).toBeInTheDocument();
    expect(screen.getByText(ensureStringResourceType(ResourceType.POPULATION))).toBeInTheDocument();
    expect(screen.getByText(ensureStringResourceType(ResourceType.RESEARCH))).toBeInTheDocument();

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
          [ResourceType.MINERALS]: 900, // Just below the low threshold (1000)
          [ResourceType.ENERGY]: 1000,
          [ResourceType.POPULATION]: 100,
          [ResourceType.RESEARCH]: 0,
        }}
      >
        <ResourceVisualization />
      </TestGameProvider>
    );

    // Check for low minerals warning
    expect(
      screen.getByText(`Low ${ensureStringResourceType(ResourceType.MINERALS)} levels`)
    ).toBeInTheDocument();
  });

  it('renders with critical resource warning', () => {
    render(
      <TestGameProvider
        initialResources={{
          [ResourceType.MINERALS]: 400, // Below the critical threshold (500)
          [ResourceType.ENERGY]: 300, // Below the critical threshold (400)
          [ResourceType.POPULATION]: 100,
          [ResourceType.RESEARCH]: 0,
        }}
      >
        <ResourceVisualization />
      </TestGameProvider>
    );

    // Check for critical resource warnings
    expect(
      screen.getByText(`Critical ${ensureStringResourceType(ResourceType.MINERALS)} levels`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Critical ${ensureStringResourceType(ResourceType.ENERGY)} levels`)
    ).toBeInTheDocument();
  });
});
