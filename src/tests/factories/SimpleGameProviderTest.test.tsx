import { render, screen } from '@testing-library/react';
import * as React from "react";
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameContext, GameProvider } from '../../contexts/GameContext';
import { ResourceType } from "./../../types/resources/ResourceTypes";
import { disableAllWebSocketServers, enableAllWebSocketServers } from '../setup';

// Completely disable WebSocket servers for all tests in this file
beforeAll(() => {
  // Check if the function exists
  if (typeof disableAllWebSocketServers === 'function') {
    disableAllWebSocketServers();
    console.log('WebSocket servers disabled for tests');
  } else {
    console.warn('disableAllWebSocketServers function not found');
  }
});

// Re-enable WebSockets after tests
afterAll(() => {
  if (typeof enableAllWebSocketServers === 'function') {
    enableAllWebSocketServers();
    console.log('WebSocket servers re-enabled');
  }
});

// Simple component that displays resource values
function SimpleResourceDisplay() {
  const gameContext = React.useContext(GameContext);

  if (!gameContext) {
    return <div>No game context found</div>;
  }

  return (
    <div>
      <div data-testid={ResourceType.MINERALS}>
        Minerals: {gameContext.state.resources.minerals}
      </div>
      <div data-testid={ResourceType.ENERGY}>Energy: {gameContext.state.resources.energy}</div>
    </div>
  );
}

describe('Simple Game Provider Test', () => {
  it('should render a component with the actual GameProvider', () => {
    render(
      <GameProvider>
        <SimpleResourceDisplay />
      </GameProvider>
    );

    // Check that minerals and energy are displayed with values from the actual GameProvider
    expect(screen.getByTestId(ResourceType.MINERALS)).toHaveTextContent('Minerals: 1000');
    expect(screen.getByTestId(ResourceType.ENERGY)).toHaveTextContent('Energy: 1000');
  });

  it('should handle undefined context gracefully', () => {
    render(<SimpleResourceDisplay />);
    expect(screen.getByText('No game context found')).toBeInTheDocument();
  });
});
