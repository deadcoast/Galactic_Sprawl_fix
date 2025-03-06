import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MiningWindow } from '../../../components/buildings/modules/MiningHub/MiningWindow';
import { renderWithProviders } from '../../utils/testUtils';

// Simplified testing approach - focusing on basic functionality without complex interactions

describe('MiningWindow Component', () => {
  // Basic rendering tests
  it('should render the mining window component', () => {
    renderWithProviders(<MiningWindow />);
    expect(screen.getByText('Mineral Processing')).toBeInTheDocument();
  });

  it('should display the search input', () => {
    renderWithProviders(<MiningWindow />);
    expect(screen.getByPlaceholderText(/search resources/i)).toBeInTheDocument();
  });

  it('should display the filter dropdown', () => {
    renderWithProviders(<MiningWindow />);
    expect(screen.getByLabelText(/filter/i)).toBeInTheDocument();
    expect(screen.getByText('All Resources')).toBeInTheDocument();
    expect(screen.getByText('Minerals')).toBeInTheDocument();
    expect(screen.getByText('Gas')).toBeInTheDocument();
    expect(screen.getByText('Exotic')).toBeInTheDocument();
  });

  it('should display the view mode button', () => {
    renderWithProviders(<MiningWindow />);
    expect(screen.getByText('Grid View')).toBeInTheDocument();
  });

  it('should display the settings button', () => {
    renderWithProviders(<MiningWindow />);
    expect(screen.getByTitle('Mining Settings')).toBeInTheDocument();
  });

  // Test for the presence of UI structure elements
  it('should have a proper layout structure', () => {
    renderWithProviders(<MiningWindow />);

    // Check for the main container
    const mainContainer = screen
      .getByRole('heading', { name: 'Mineral Processing' })
      .closest('div.h-full');
    expect(mainContainer).toBeInTheDocument();

    // Check for the search input container
    const searchContainer = screen
      .getByPlaceholderText(/search resources/i)
      .closest('div.relative');
    expect(searchContainer).toBeInTheDocument();
  });

  // Test for the presence of help button
  it('should display the help button', () => {
    renderWithProviders(<MiningWindow />);

    // Look for the help button with the help-circle icon
    // Use a more specific selector to find the help button
    const helpButtons = screen.getAllByRole('button');

    // Find the button that contains the help-circle icon
    const helpButton = Array.from(helpButtons).find(button =>
      button.querySelector('.lucide-help-circle')
    );

    expect(helpButton).toBeTruthy();
    expect(helpButton?.querySelector('.lucide-help-circle')).toBeTruthy();
  });

  // Test for the presence of efficiency and production text
  it('should display mining-related text', () => {
    renderWithProviders(<MiningWindow />);

    // Check for common mining-related text that should be present
    // Using getAllByText since there might be multiple elements with these texts
    const efficiencyElements = screen.queryAllByText(/efficiency/i);
    const productionElements = screen.queryAllByText(/production/i);

    // At least one of these should be present in a mining interface
    expect(efficiencyElements.length > 0 || productionElements.length > 0).toBeTruthy();
  });
});
