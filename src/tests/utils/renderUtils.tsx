import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { ReactElement } from 'react';
import { GameProvider } from '../../contexts/GameContext';
import { ServiceProvider } from '../../components/providers/ServiceProvider';
import { ThresholdProvider } from '../../contexts/ThresholdContext';
import { ResourceRatesProvider } from '../../contexts/ResourceRatesContext';
import { DataAnalysisProvider } from '../../contexts/DataAnalysisContext';
import { ClassificationProvider } from '../../contexts/ClassificationContext';

/**
 * Props for provider wrappers
 */
interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Core providers required for testing most components
 */
export const CoreProviders: React.FC<WrapperProps> = ({ children }) => {
  return (
    <GameProvider>
      <ServiceProvider>
        {children}
      </ServiceProvider>
    </GameProvider>
  );
};

/**
 * All providers for testing components that need the full context tree
 */
export const AllProviders: React.FC<WrapperProps> = ({ children }) => {
  return (
    <GameProvider>
      <ServiceProvider>
        <ThresholdProvider>
          <ResourceRatesProvider>
            {children}
          </ResourceRatesProvider>
        </ThresholdProvider>
      </ServiceProvider>
    </GameProvider>
  );
};

/**
 * Exploration-specific providers for testing exploration components
 */
export const ExplorationProviders: React.FC<WrapperProps> = ({ children }) => {
  return (
    <GameProvider>
      <ServiceProvider>
        <DataAnalysisProvider>
          <ClassificationProvider>
            {children}
          </ClassificationProvider>
        </DataAnalysisProvider>
      </ServiceProvider>
    </GameProvider>
  );
};

/**
 * Custom render function with core providers
 * Use this for simple components that only need basic context
 */
export function renderWithCore(
  ui: ReactElement, 
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: CoreProviders, ...options }),
  };
}

/**
 * Custom render function with all main providers
 * Use this as the default render method for most components
 */
export function renderWithProviders(
  ui: ReactElement, 
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

/**
 * Custom render function with exploration-specific providers
 * Use this for exploration, data analysis, and classification components
 */
export function renderWithExplorationProviders(
  ui: ReactElement, 
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: ExplorationProviders, ...options }),
  };
}

/**
 * Custom render function with any custom providers
 * @param ui Component to render
 * @param providers Array of provider components to wrap the component with
 * @param options Additional render options
 */
export function renderWithCustomProviders(
  ui: ReactElement,
  providers: React.FC<WrapperProps>[],
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Create a wrapper that nests all provided providers
  const CustomProviders: React.FC<WrapperProps> = ({ children }) => {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      <>{children}</>
    );
  };

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: CustomProviders, ...options }),
  };
}

/**
 * Helper function to wait for an element to be visible
 * Use this when testing components with async rendering
 */
export async function waitForElementToBeVisible(testId: string) {
  await waitFor(() => {
    expect(screen.getByTestId(testId)).toBeVisible();
  });
}

/**
 * Helper function to wait for loading state to complete
 * Use this when testing components with loading states
 */
export async function waitForLoadingToComplete() {
  await waitFor(() => {
    const loadingElements = screen.queryAllByText(/loading/i);
    expect(loadingElements.length).toBe(0);
  });
}

/**
 * Helper function to find a button by both text and role
 * More reliable than just queryByText for buttons
 */
export function findButtonByText(text: string | RegExp) {
  return screen.getByRole('button', { name: text });
}